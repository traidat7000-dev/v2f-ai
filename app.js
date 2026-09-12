(function(){
'use strict';

/* ============================================================
   SCROLL TEXT — VĂN BẢN TỰ TRÔI TỪ DƯỚI LÊN TRÊN (TELEPROMPTER)
   ============================================================ */
var twEl = document.getElementById('typewriter');
var TEXT = '';
var scrollTimer = null;
var SPEED = 0.5;
var WAIT_AT_END = 3000;

function showMsg(html){
  if(!twEl) return;
  twEl.innerHTML = '<div style="text-align:center;padding:30px">' + html + '</div>';
}

function setTypewriterHeight(){
  if(!twEl) return;
  var maxH = Math.floor(window.innerHeight * 0.66);
  twEl.style.maxHeight = maxH + 'px';
  twEl.style.overflow = 'hidden';
  twEl.style.position = 'relative';
}

function startScrolling(){
  if(!twEl || !TEXT) return;
  stopScrolling();

  twEl.innerHTML = '';
  var content = document.createElement('div');
  content.className = 'scroll-content';
  content.style.whiteSpace = 'pre-wrap';
  content.style.padding = '0 16px';
  content.style.textAlign = 'center';
  content.textContent = TEXT;
  twEl.appendChild(content);

  var maxH = Math.floor(window.innerHeight * 0.66);
  var startY = maxH;
  content.style.transform = 'translateY(' + startY + 'px)';
  content.style.willChange = 'transform';

  var y = startY;
  var contentH = content.scrollHeight;
  var endY = -contentH;

  function step(){
    y -= SPEED;
    content.style.transform = 'translateY(' + y + 'px)';
    if(y <= endY){
      scrollTimer = setTimeout(function(){
        y = startY;
        content.style.transform = 'translateY(' + y + 'px)';
        step();
      }, WAIT_AT_END);
      return;
    }
    scrollTimer = requestAnimationFrame(step);
  }
  step();
}

function stopScrolling(){
  if(scrollTimer){
    cancelAnimationFrame(scrollTimer);
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
}

window.addEventListener('resize', function(){
  setTypewriterHeight();
  startScrolling();
});

setTypewriterHeight();

/* ============================================================
   TẢI FILE v2f-content.txt
   ============================================================ */
function loadContent(){
  fetch('./v2f-content.txt?v=' + Date.now())
    .then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function(txt){
      var clean = (txt || '').replace(/\r\n/g, '\n').trim();
      if(clean.length < 30) throw new Error('File quá ngắn (' + clean.length + ' ký tự)');
      TEXT = clean;
      console.log('[V2F] Đã tải v2f-content.txt:', clean.length, 'ký tự');
      startScrolling();
    })
    .catch(function(err){
      console.error('[V2F] Lỗi tải file:', err);
      setTimeout(function(){
        fetch('./v2f-content.txt?retry=' + Date.now())
          .then(function(r){ return r.ok ? r.text() : null; })
          .then(function(txt){
            if(txt && txt.trim().length > 30){
              TEXT = txt.replace(/\r\n/g, '\n').trim();
              startScrolling();
            } else {
              showMsg('<div style="color:#f87171;font-size:14px">⚠️ Không tải được v2f-content.txt</div>' +
                '<div style="font-size:12px;color:#9db1c8;margin-top:12px">Vui lòng kiểm tra file đã upload lên GitHub:</div>' +
                '<a href="https://traidat7000-dev.github.io/v2f-ai/v2f-content.txt" target="_blank" style="color:#65d9ff;font-size:12px">🔗 Kiểm tra file</a>');
            }
          })
          .catch(function(){
            showMsg('<div style="color:#f87171;font-size:14px">⚠️ Không tải được file nội dung</div>');
          });
      }, 3000);
    });
}

loadContent();

/* ============================================================
   AI SETUP — HỖ TRỢ ĐA PROVIDER, ĐA CẤP ĐỘ
   ============================================================ */

/* --- LOCAL MODELS (WebLLM) theo cấp độ --- */
var LOCAL_MODELS = {
  light: {
    "Llama-3.2-1B": "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    "Qwen2.5-0.5B": "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    "Gemma-2-2B":   "gemma-2-2b-it-q4f16_1-MLC"
  },
  strong: {
    "Phi-3.5-mini": "Phi-3.5-mini-instruct-q4f16_1-MLC",
    "Qwen2.5-1.5B": "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    "Llama-3.2-3B": "Llama-3.2-3B-Instruct-q4f16_1-MLC"
  }
};

/* --- CLOUD PROVIDERS — tự nhận diện theo key --- */
var CLOUD_PROVIDERS = {
  gemini: {
    name: "Gemini",
    build: function(key, model, text){
      var url = "https://generativelanguage.googleapis.com/v1beta/models/"
              + (model || "gemini-1.5-flash") + ":generateContent?key=" + key;
      return fetch(url, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({contents:[{parts:[{text:text}]}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.candidates[0].content.parts[0].text;
      });
    }
  },
  openai: {
    name: "OpenAI",
    build: function(key, model, text){
      return fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body: JSON.stringify({model: model||"gpt-4o-mini", messages:[{role:"user",content:text}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.choices[0].message.content;
      });
    }
  },
  deepseek: {
    name: "DeepSeek",
    build: function(key, model, text){
      return fetch("https://api.deepseek.com/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body: JSON.stringify({model: model||"deepseek-chat", messages:[{role:"user",content:text}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.choices[0].message.content;
      });
    }
  },
  claude: {
    name: "Claude",
    build: function(key, model, text){
      return fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": key,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body: JSON.stringify({model: model||"claude-3-5-sonnet-20241022", max_tokens:1024, messages:[{role:"user",content:text}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.content[0].text;
      });
    }
  },
  grok: {
    name: "Grok",
    build: function(key, model, text){
      return fetch("https://api.x.ai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body: JSON.stringify({model: model||"grok-beta", messages:[{role:"user",content:text}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.choices[0].message.content;
      });
    }
  },
  mistral: {
    name: "Mistral",
    build: function(key, model, text){
      return fetch("https://api.mistral.ai/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body: JSON.stringify({model: model||"mistral-large-latest", messages:[{role:"user",content:text}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.choices[0].message.content;
      });
    }
  },
  custom: {
    name: "Tùy chỉnh (OpenAI-compatible)",
    build: function(key, model, text){
      var urlEl = document.getElementById("customUrl");
      var url = (urlEl && urlEl.value.trim()) || "";
      if(!url) throw new Error("Chưa nhập URL endpoint tùy chỉnh");
      return fetch(url, {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
        body: JSON.stringify({model: model||"gpt-3.5-turbo", messages:[{role:"user",content:text}]})
      }).then(function(r){ return r.json(); }).then(function(d){
        if(d.error) throw new Error(d.error.message);
        return d.choices && d.choices[0] ? d.choices[0].message.content : JSON.stringify(d);
      });
    }
  }
};

/* --- Tự nhận diện provider từ API key --- */
function detectProvider(key){
  key = (key||"").trim();
  if(!key) return null;

  // Ưu tiên prefix đặc trưng
  if(/^sk-ant-/.test(key)) return "claude";
  if(/^xai-/.test(key))    return "grok";
  if(/^AIza/.test(key))    return "gemini";

  // sk-... có thể là OpenAI hoặc DeepSeek
  if(/^sk-/.test(key)){
    var manual = (document.getElementById("providerSelect")||{}).value;
    if(manual === "deepseek") return "deepseek";
    if(manual === "openai")   return "openai";
    return "openai"; // mặc định
  }

  // 32 ký tự chữ + số → Mistral
  if(/^[A-Za-z0-9]{32}$/.test(key)) return "mistral";

  // Có URL tùy chỉnh → custom
  var urlEl = document.getElementById("customUrl");
  if(urlEl && urlEl.value.trim()) return "custom";

  return "custom";
}

var group = "local";
var ai    = "Llama-3.2-1B";
var engine = null, loading = false, lastResp = "";
var gpuOk = false, gpuStrong = false;

/* --- Helpers --- */
function $(id){ return document.getElementById(id); }

function addMsg(type, text, meta){
  var w = $("chatWindow");
  if(!w) return null;
  var d = document.createElement("div");
  d.className = "msg " + type;
  d.textContent = text;
  if(meta){
    var m = document.createElement("span");
    m.className = "meta";
    m.textContent = meta;
    d.appendChild(m);
  }
  w.appendChild(d);
  w.scrollTop = w.scrollHeight;
  return d;
}

function notice(html, warn){
  var n = $("notice");
  if(!n) return;
  n.innerHTML = html;
  n.className = "notice show" + (warn ? " warn" : "");
}

function checkGPU(){
  if(!navigator.gpu){
    gpuOk = false; gpuStrong = false;
    return Promise.resolve({ok:false, strong:false, reason:"no-api"});
  }
  return navigator.gpu.requestAdapter().then(function(a){
    if(!a){
      gpuOk = false; gpuStrong = false;
      return {ok:false, strong:false, reason:"no-adapter"};
    }
    gpuOk = true;
    var lim = a.limits ? a.limits.maxComputeWorkgroupStorageSize : 0;
    gpuStrong = lim >= 32768;
    return {ok:true, strong:gpuStrong, limit:lim};
  }).catch(function(e){
    gpuOk = false; gpuStrong = false;
    return {ok:false, strong:false, reason:e.message};
  });
}

function setGroup(g, el){
  group = g;
  var gs = document.querySelectorAll(".ai-group");
  for(var i=0;i<gs.length;i++) gs[i].classList.remove("active");
  if(el) el.classList.add("active");

  var ts = document.querySelectorAll(".ai-tab");
  for(var j=0;j<ts.length;j++){
    ts[j].style.display = (ts[j].getAttribute("data-group") === g) ? "inline-flex" : "none";
  }
  var akb = $("apiKeyBox");
  if(akb) akb.classList.toggle("hidden", g !== "cloud");

  var ft = document.querySelector('.ai-tab[data-group="'+g+'"]');
  if(ft) ft.click();
}

function setAI(name, el){
  ai = name;
  var ts = document.querySelectorAll(".ai-tab");
  for(var i=0;i<ts.length;i++) ts[i].classList.remove("active");
  if(el) el.classList.add("active");

  if(group === "local"){
    if(gpuOk && gpuStrong){
      addMsg("system", "Đã chọn " + name + " — miễn phí");
      loadLLM(name);
    } else if(gpuOk && !gpuStrong){
      addMsg("system", "⚠️ GPU máy bạn quá yếu. Vui lòng chọn AI Đám Mây.");
    } else {
      addMsg("system", "Máy chưa hỗ trợ WebGPU — vui lòng chọn AI Đám Mây.");
    }
  } else {
    addMsg("system", "Đã chọn " + name + " (dán API Key vào ô bên trên)");
  }
}

/* --- Tải model local (tự chọn theo GPU) --- */
function loadLLM(name){
  if(loading || !gpuStrong) return;

  var id = null;
  for(var k in LOCAL_MODELS.light)  if(k === name) id = LOCAL_MODELS.light[k];
  for(var k2 in LOCAL_MODELS.strong) if(k2 === name) id = LOCAL_MODELS.strong[k2];

  if(!id){
    id = gpuStrong ? LOCAL_MODELS.strong["Phi-3.5-mini"] : LOCAL_MODELS.light["Llama-3.2-1B"];
    name = gpuStrong ? "Phi-3.5-mini" : "Llama-3.2-1B";
  }

  loading = true;
  var statusEl = $("modelStatus");
  if(statusEl) statusEl.classList.add("show");
  if($("modelStatusText")) $("modelStatusText").textContent = "Đang tải " + name + "...";
  if($("progressFill"))    $("progressFill").style.width = "0%";

  function doLoad(mod){
    return mod.CreateMLCEngine(id, {
      initProgressCallback: function(r){
        var p = Math.round((r.progress||0)*100);
        if($("progressFill"))    $("progressFill").style.width = p + "%";
        if($("modelStatusText")) $("modelStatusText").textContent = "Đang tải " + name + " — " + p + "%";
      }
    });
  }
  function ok(eng){
    engine = eng;
    if($("modelStatusText")) $("modelStatusText").textContent = "✅ " + name + " sẵn sàng!";
    if($("progressFill"))    $("progressFill").style.width = "100%";
    setTimeout(function(){ if(statusEl) statusEl.classList.remove("show"); }, 2500);
    addMsg("system", "✅ " + name + " đã sẵn sàng!");
    loading = false;
  }
  function err(e){
    if($("modelStatusText")) $("modelStatusText").textContent = "❌ Lỗi: " + e.message;
    loading = false;
    // Strong lỗi → thử lại light
    if(id === LOCAL_MODELS.strong["Phi-3.5-mini"]){
      console.warn("[V2F] Model strong lỗi, fallback light:", e.message);
      loadLLM("Llama-3.2-1B");
    }
  }

  if(window.__webllm){
    doLoad(window.__webllm).then(ok).catch(err);
  } else {
    window.addEventListener("webllm-ready", function(){
      doLoad(window.__webllm).then(ok).catch(err);
    }, {once:true});
    setTimeout(function(){
      if(!window.__webllm) err(new Error("Không tải được WebLLM sau 20s"));
    }, 20000);
  }
}

/* --- Gọi cloud — tự nhận diện provider + tự chọn model theo cấp độ --- */
function callCloud(text, key){
  var providerId = detectProvider(key);
  if(!providerId) return Promise.reject(new Error("API Key trống hoặc không hợp lệ"));

  var provider = CLOUD_PROVIDERS[providerId];
  if(!provider) return Promise.reject(new Error("Không nhận diện được nhà cung cấp"));

  var levelEl = document.getElementById("levelSelect");
  var level = (levelEl && levelEl.value) || "standard";

  var modelMap = {
    gemini:   { light:"gemini-1.5-flash-8b",       standard:"gemini-1.5-flash",           pro:"gemini-1.5-pro" },
    openai:   { light:"gpt-4o-mini",                standard:"gpt-4o-mini",                pro:"gpt-4o" },
    deepseek: { light:"deepseek-chat",              standard:"deepseek-chat",              pro:"deepseek-reasoner" },
    claude:   { light:"claude-3-5-haiku-20241022",  standard:"claude-3-5-sonnet-20241022", pro:"claude-3-opus-20240229" },
    grok:     { light:"grok-beta",                  standard:"grok-beta",                  pro:"grok-beta" },
    mistral:  { light:"mistral-small-latest",       standard:"mistral-large-latest",       pro:"mistral-large-latest" },
    custom:   { light:"gpt-3.5-turbo",              standard:"gpt-3.5-turbo",              pro:"gpt-4o-mini" }
  };

  var model = (modelMap[providerId] && modelMap[providerId][level]) || null;
  console.log("[V2F] Cloud call →", provider.name, "| level:", level, "| model:", model);

  return provider.build(key, model, text).catch(function(err){
    // Pro lỗi → thử standard
    if(level === "pro" && modelMap[providerId] && modelMap[providerId].standard){
      console.warn("[V2F] Model pro lỗi, fallback standard:", err.message);
      return provider.build(key, modelMap[providerId].standard, text);
    }
    throw err;
  });
}

/* --- Lưu API Key --- */
function saveApiKey(){
  var keyEl = $("apiKey");
  if(!keyEl) return;
  var key = keyEl.value.trim();
  if(!key){
    addMsg("system", "⚠️ Chưa có API Key để lưu");
    return;
  }
  try{
    localStorage.setItem("v2f_api_key", key);
    addMsg("system", "✅ Đã lưu API Key thành công!");
  }catch(e){
    addMsg("system", "❌ Không thể lưu API Key: " + e.message);
  }
}

/* --- Gửi tin nhắn --- */
function send(){
  var p = $("prompt");
  var text = p.value.trim();
  if(!text) return;
  addMsg("user", text);
  p.value = "";

  var th = addMsg("ai", "Đang suy nghĩ...");

  function done(txt){
    th.remove();
    addMsg("ai", txt, ai + " · " + new Date().toLocaleTimeString());
    lastResp = txt;
  }
  function fail(err){
    th.remove();
    addMsg("ai", "Lỗi: " + err.message);
  }

  if(group === "local"){
    if(!gpuOk || !gpuStrong){
      th.remove();
      addMsg("ai", "⚠️ Máy chưa hỗ trợ WebGPU đủ mạnh. Đã tự chuyển sang AI Đám Mây — vui lòng dán API Key.");
      setGroup("cloud", $("groupCloud"));
      return;
    }
    if(!engine){
      th.remove();
      addMsg("ai", "⏳ Mô hình đang tải, vui lòng đợi vài giây rồi gửi lại.");
      return;
    }
    engine.chat.completions.create({
      messages:[{role:"user",content:text}],
      temperature:0.7,
      max_tokens:1024
    })
    .then(function(r){ return r.choices[0].message.content; })
    .then(done)
    .catch(function(e){
      // Local lỗi → fallback cloud nếu có key
      var key = ($("apiKey") && $("apiKey").value.trim()) || "";
      if(key){
        console.warn("[V2F] Local lỗi, fallback cloud:", e.message);
        callCloud(text, key).then(done).catch(fail);
      } else {
        fail(e);
      }
    });
  } else {
    var key = ($("apiKey") && $("apiKey").value.trim()) || "";
    if(!key){
      th.remove();
      addMsg("ai", "🔑 Vui lòng dán API Key vào ô bên trên.\n\n💡 Lấy miễn phí tại: https://aistudio.google.com/app/apikey");
      return;
    }
    try{ localStorage.setItem("v2f_api_key", key); }catch(e){}
    callCloud(text, key).then(done).catch(fail);
  }
}

/* --- Setup --- */
function setup(){
  // Load key đã lưu
  try{
    var saved = localStorage.getItem("v2f_api_key");
    if(saved && $("apiKey")) $("apiKey").value = saved;
  }catch(e){}

  // Nút lưu key
  if($("saveKeyBtn")) $("saveKeyBtn").onclick = saveApiKey;

  // Tự nhận diện provider khi gõ key
  if($("apiKey")){
    $("apiKey").addEventListener("input", function(){
      var key = this.value.trim();
      var prov = detectProvider(key);
      var lbl = $("providerLabel");
      if(lbl){
        if(prov && CLOUD_PROVIDERS[prov]){
          lbl.textContent = "🔎 Nhận diện: " + CLOUD_PROVIDERS[prov].name;
          lbl.style.color = "#4ade80";
        } else {
          lbl.textContent = key ? "❓ Sẽ thử provider tùy chỉnh" : "";
          lbl.style.color = "#fbbf24";
        }
      }
    });
  }

  // Cấp độ
  if($("levelSelect")){
    $("levelSelect").addEventListener("change", function(){
      addMsg("system", "Đã đổi cấp độ AI: " + this.value);
    });
  }

  // Lang buttons
  var lb = document.querySelectorAll(".lang-btn");
  for(var i=0;i<lb.length;i++){
    lb[i].onclick = function(){
      var b = document.querySelectorAll(".lang-btn");
      for(var k=0;k<b.length;k++) b[k].classList.remove("active");
      this.classList.add("active");
    };
  }

  // Group buttons
  var gs = document.querySelectorAll(".ai-group");
  for(var j=0;j<gs.length;j++){
    gs[j].onclick = function(){ setGroup(this.getAttribute("data-group"), this); };
  }

  // AI tabs
  var ts = document.querySelectorAll(".ai-tab");
  for(var m=0;m<ts.length;m++){
    ts[m].onclick = function(){ setAI(this.getAttribute("data-ai"), this); };
  }

  if($("sendBtn")) $("sendBtn").onclick = send;
  if($("prompt")){
    $("prompt").addEventListener("keydown", function(e){
      if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); send(); }
    });
  }

  if($("clearBtn")){
    $("clearBtn").onclick = function(){
      $("chatWindow").innerHTML = "";
      addMsg("ai", "Xin chào! Tôi là V2F AI.");
      lastResp = "";
    };
  }

  if($("speakBtn")){
    $("speakBtn").onclick = function(){
      if(!lastResp || !("speechSynthesis" in window)) return;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(lastResp);
      u.lang = "vi-VN";
      speechSynthesis.speak(u);
    };
  }

  // Mic
  var R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(R && $("micBtn")){
    var rec = new R();
    rec.lang = "vi-VN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = function(){ $("micBtn").classList.add("recording"); };
    rec.onend   = function(){ $("micBtn").classList.remove("recording"); };
    rec.onresult = function(e){
      var p = $("prompt");
      p.value += (p.value ? " " : "") + e.results[0][0].transcript;
    };
    rec.onerror = function(){ $("micBtn").classList.remove("recording"); };
    $("micBtn").onclick = function(){
      if(this.classList.contains("recording")) rec.stop(); else rec.start();
    };
  } else if($("micBtn")){
    $("micBtn").disabled = true;
  }

  // Kiểm tra GPU — luôn cho phép cloud
  checkGPU().then(function(res){
    if(!res.ok || !res.strong){
      notice("⚠️ Máy bạn " + (res.ok ? "GPU yếu" : "chưa hỗ trợ WebGPU") +
        ". Đã tự chuyển sang <strong>AI Đám Mây</strong> — dán API Key (Gemini/OpenAI/Claude/DeepSeek...) vào ô 🔑.", true);
      addMsg("system", "💡 Dán API Key bất kỳ (Gemini, OpenAI, Claude, DeepSeek, Grok, Mistral...) — hệ thống tự nhận diện.");
      setGroup("cloud", $("groupCloud"));
      return;
    }
    notice("✅ Máy bạn <strong>hỗ trợ WebGPU</strong>! AI Siêu Nhẹ đang tải — miễn phí.", false);
    loadLLM("Llama-3.2-1B");
  });
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
else setup();

})();
