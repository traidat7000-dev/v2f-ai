(function(){
'use strict';

/* ============================================================
   TYPEWRITER — CHẠY LIÊN TỤC, TỰ ĐẨY LÊN KHI CHẠM 2/3 KHUNG
   ============================================================ */

var twEl = document.getElementById('typewriter');
var twWrap = document.querySelector('.typewriter-wrap');
var cursor = document.createElement('span');
cursor.className = 'cursor';

var TEXT = '';
var idx = 0;
var typing = false;

function showMsg(html){
  if(!twEl) return;
  twEl.innerHTML = '<div style="text-align:center;padding:30px">' + html + '</div>';
}

/* Tự động đẩy chữ cũ lên khi chữ mới chạm ngưỡng 2/3 khung */
function autoPush(){
  if(!twEl || !twWrap) return;
  // Dùng requestAnimationFrame để đảm bảo DOM đã cập nhật
  requestAnimationFrame(function(){
    var wrapH = twWrap.clientHeight;        // chiều cao khung tranh
    var contentH = twEl.scrollHeight;        // chiều cao nội dung chữ
    var threshold = wrapH * 0.66;            // 2/3 khung

    // Nếu nội dung vượt 2/3 khung → cuộn xuống để chữ mới nhất nằm ở 2/3
    if(contentH > threshold){
      // Vị trí cuộn = tổng chiều cao - 2/3 khung (để chữ mới luôn ở 2/3)
      twEl.scrollTop = contentH - threshold;
    } else {
      // Chưa vượt → giữ ở đầu
      twEl.scrollTop = 0;
    }
  });
}

function startTyping(){
  idx = 0;
  typing = true;
  if(twEl){
    twEl.textContent = '';
    twEl.scrollTop = 0;
  }
  typeNext();
}

function typeNext(){
  if(!twEl || !typing) return;
  if(idx < TEXT.length){
    twEl.textContent = TEXT.substring(0, idx + 1);
    twEl.appendChild(cursor);
    idx++;
    autoPush();
    var ch = TEXT.charAt(idx - 1);
    var delay;
    if(ch === '\n') delay = 220;
    else if(ch === '.' || ch === '!' || ch === '?') delay = 140;
    else if(ch === '━' || ch === '✧' || ch === '✦' || ch === '═') delay = 20;
    else delay = 45;
    setTimeout(typeNext, delay);
  } else {
    setTimeout(function(){
      idx = 0;
      twEl.textContent = '';
      twEl.scrollTop = 0;
      typeNext();
    }, 8000);
  }
}

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
      if(clean.length < 30){
        throw new Error('File quá ngắn (' + clean.length + ' ký tự)');
      }
      TEXT = clean;
      console.log('[V2F] Đã tải v2f-content.txt:', clean.length, 'ký tự');
      startTyping();
    })
    .catch(function(err){
      console.error('[V2F] Lỗi tải file:', err);
      setTimeout(function(){
        fetch('./v2f-content.txt?retry=' + Date.now())
          .then(function(r){return r.ok ? r.text() : null;})
          .then(function(txt){
            if(txt && txt.trim().length > 30){
              TEXT = txt.replace(/\r\n/g, '\n').trim();
              startTyping();
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
   AI SETUP
   ============================================================ */
var MODEL_MAP={
  "Llama-3.2-1B":"Llama-3.2-1B-Instruct-q4f16_1-MLC",
  "Qwen2.5-0.5B":"Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
  "Phi-3.5-mini":"Phi-3.5-mini-instruct-q4f16_1-MLC",
  "Gemma-2-2B":"gemma-2-2b-it-q4f16_1-MLC"
};
var CLOUD={
  "Gemini":{url:"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",type:"gemini"},
  "ChatGPT":{url:"https://api.openai.com/v1/chat/completions",type:"openai",model:"gpt-4o-mini"},
  "DeepSeek":{url:"https://api.deepseek.com/chat/completions",type:"openai",model:"deepseek-chat"},
  "Claude":{url:"https://api.anthropic.com/v1/messages",type:"anthropic",model:"claude-3-5-sonnet-20241022"},
  "Grok":{url:"https://api.x.ai/v1/chat/completions",type:"openai",model:"grok-beta"},
  "Mistral":{url:"https://api.mistral.ai/v1/chat/completions",type:"openai",model:"mistral-large-latest"}
};

var group="local",ai="Llama-3.2-1B";
var engine=null,loading=false,lastResp="",gpuOk=false,gpuStrong=false;

function $(id){return document.getElementById(id)}

function addMsg(type,text,meta){
  var w=$("chatWindow");
  if(!w) return null;
  var d=document.createElement("div");
  d.className="msg "+type;
  d.textContent=text;
  if(meta){
    var m=document.createElement("span");
    m.className="meta";m.textContent=meta;
    d.appendChild(m);
  }
  w.appendChild(d);
  w.scrollTop=w.scrollHeight;
  return d;
}

function notice(html,warn){
  var n=$("notice");
  if(!n) return;
  n.innerHTML=html;
  n.className="notice show"+(warn?" warn":"");
}

/* Hiện "đã lưu" khi key thay đổi */
function showSaveHint(){
  var box = $("apiKeyBox");
  if(!box) return;
  var hint = box.querySelector(".save-hint");
  if(hint){
    var old = hint.textContent;
    hint.textContent = "✅ Đã lưu";
    hint.style.color = "#34d399";
    setTimeout(function(){
      hint.textContent = old;
      hint.style.color = "";
    }, 1500);
  }
}

function checkGPU(){
  if(!navigator.gpu){
    gpuOk=false;gpuStrong=false;
    return Promise.resolve({ok:false,strong:false,reason:"no-api"});
  }
  return navigator.gpu.requestAdapter().then(function(a){
    if(!a){
      gpuOk=false;gpuStrong=false;
      return {ok:false,strong:false,reason:"no-adapter"};
    }
    gpuOk=true;
    var lim = a.limits ? a.limits.maxComputeWorkgroupStorageSize : 0;
    gpuStrong = lim >= 32768;
    return {ok:true,strong:gpuStrong,limit:lim};
  }).catch(function(e){
    gpuOk=false;gpuStrong=false;
    return {ok:false,strong:false,reason:e.message};
  });
}

function setGroup(g,el){
  group=g;
  var gs=document.querySelectorAll(".ai-group");
  for(var i=0;i<gs.length;i++)gs[i].classList.remove("active");
  if(el)el.classList.add("active");
  var ts=document.querySelectorAll(".ai-tab");
  for(var j=0;j<ts.length;j++)ts[j].style.display=ts[j].getAttribute("data-group")===g?"inline-flex":"none";
  $("apiKeyBox").classList.toggle("hidden",g!=="cloud");
  var ft=document.querySelector('.ai-tab[data-group="'+g+'"]');
  if(ft)ft.click();
}

function setAI(name,el){
  ai=name;
  var ts=document.querySelectorAll(".ai-tab");
  for(var i=0;i<ts.length;i++)ts[i].classList.remove("active");
  if(el)el.classList.add("active");
  if(group==="local"){
    if(gpuOk && gpuStrong){
      addMsg("system","Đã chọn "+name+" — miễn phí");
      loadLLM(name);
    }else if(gpuOk && !gpuStrong){
      addMsg("system","⚠️ GPU máy bạn quá yếu. Vui lòng chọn AI Đám Mây.");
    }else{
      addMsg("system","Máy chưa hỗ trợ WebGPU — vui lòng chọn AI Đám Mây.");
    }
  }else{
    addMsg("system","Đã chọn "+name+" (dán API Key vào ô bên trên)");
  }
}

function loadLLM(name){
  if(loading||!gpuStrong)return;
  var id=MODEL_MAP[name];if(!id)return;
  loading=true;
  $("modelStatus").classList.add("show");
  $("modelStatusText").textContent="Đang tải "+name+"...";
  $("progressFill").style.width="0%";
  
  function doLoad(mod){
    return mod.CreateMLCEngine(id,{
      initProgressCallback:function(r){
        var p=Math.round((r.progress||0)*100);
        $("progressFill").style.width=p+"%";
        $("modelStatusText").textContent="Đang tải "+name+" — "+p+"%";
      }
    });
  }
  function ok(eng){
    engine=eng;
    $("modelStatusText").textContent="✅ "+name+" sẵn sàng!";
    $("progressFill").style.width="100%";
    setTimeout(function(){$("modelStatus").classList.remove("show")},2500);
    addMsg("system","✅ "+name+" đã sẵn sàng!");
    loading=false;
  }
  function err(e){
    $("modelStatusText").textContent="❌ Lỗi: "+e.message;
    loading=false;
  }
  
  if(window.__webllm){doLoad(window.__webllm).then(ok).catch(err);}
  else{
    window.addEventListener("webllm-ready",function(){doLoad(window.__webllm).then(ok).catch(err);},{once:true});
    setTimeout(function(){if(!window.__webllm)err(new Error("Không tải được WebLLM sau 20s"))},20000);
  }
}

function callCloud(text,key){
  var c=CLOUD[ai];if(!c)return Promise.reject(new Error("Unknown AI"));
  if(c.type==="gemini"){
    return fetch(c.url+"?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:text}]}]})})
      .then(function(r){return r.json()})
      .then(function(d){if(d.error)throw new Error(d.error.message);return d.candidates[0].content.parts[0].text});
  }
  if(c.type==="openai"){
    return fetch(c.url,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify({model:c.model,messages:[{role:"user",content:text}]})})
      .then(function(r){return r.json()})
      .then(function(d){if(d.error)throw new Error(d.error.message);return d.choices[0].message.content});
  }
  if(c.type==="anthropic"){
    return fetch(c.url,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:c.model,max_tokens:1024,messages:[{role:"user",content:text}]})})
      .then(function(r){return r.json()})
      .then(function(d){if(d.error)throw new Error(d.error.message);return d.content[0].text});
  }
  return Promise.reject(new Error("Unsupported"));
}

function send(){
  var p=$("prompt"),text=p.value.trim();
  if(!text)return;
  addMsg("user",text);p.value="";
  var th=addMsg("ai","Đang suy nghĩ...");
  var pr;
  
  if(group==="local"){
    if(!gpuOk){
      th.remove();
      addMsg("ai","⚠️ Máy chưa hỗ trợ WebGPU. Vui lòng chuyển sang tab '☁️ AI Đám Mây' + dán API Key miễn phí tại https://aistudio.google.com/app/apikey");
      return;
    }
    if(!gpuStrong){
      th.remove();
      addMsg("ai","⚠️ GPU máy bạn quá yếu. Vui lòng chuyển sang tab '☁️ AI Đám Mây' + dán API Key miễn phí tại https://aistudio.google.com/app/apikey");
      return;
    }
    if(!engine){
      th.remove();
      addMsg("ai","⏳ Mô hình đang tải, vui lòng đợi.");
      return;
    }
    pr=engine.chat.completions.create({messages:[{role:"user",content:text}],temperature:0.7,max_tokens:1024})
      .then(function(r){return r.choices[0].message.content});
  }else{
    var key=$("apiKey").value.trim();
    if(!key){
      th.remove();
      addMsg("ai","🔑 Vui lòng dán API Key vào ô bên trên.\n\n💡 Lấy miễn phí tại: https://aistudio.google.com/app/apikey");
      return;
    }
    // Lưu key
    try{
      localStorage.setItem("v2f_api_key",key);
      showSaveHint();
    }catch(e){}
    pr=callCloud(text,key);
  }
  
  pr.then(function(txt){
    th.remove();
    addMsg("ai",txt,ai+" · "+new Date().toLocaleTimeString());
    lastResp=txt;
  }).catch(function(e){
    th.remove();
    addMsg("ai","Lỗi: "+e.message);
  });
}

function setup(){
  // KHÔI PHỤC API KEY ĐÃ LƯU
  try{
    var saved=localStorage.getItem("v2f_api_key");
    if(saved && $("apiKey")){
      $("apiKey").value=saved;
      console.log("[V2F] Đã khôi phục API Key từ bộ nhớ");
    }
  }catch(e){}
  
  // TỰ ĐỘNG LƯU API KEY KHI GÕ
  var apiInput = $("apiKey");
  if(apiInput){
    apiInput.addEventListener("input", function(){
      try{
        var v = this.value.trim();
        if(v.length > 10){
          localStorage.setItem("v2f_api_key", v);
        }
      }catch(e){}
    });
    apiInput.addEventListener("change", function(){
      try{
        var v = this.value.trim();
        if(v.length > 10){
          localStorage.setItem("v2f_api_key", v);
          showSaveHint();
        }
      }catch(e){}
    });
  }
  
  var lb=document.querySelectorAll(".lang-btn");
  for(var i=0;i<lb.length;i++){lb[i].onclick=function(){
    var b=document.querySelectorAll(".lang-btn");
    for(var k=0;k<b.length;k++)b[k].classList.remove("active");
    this.classList.add("active");
  }}
  
  var gs=document.querySelectorAll(".ai-group");
  for(var i=0;i<gs.length;i++){gs[i].onclick=function(){setGroup(this.getAttribute("data-group"),this)}}
  
  var ts=document.querySelectorAll(".ai-tab");
  for(var i=0;i<ts.length;i++){ts[i].onclick=function(){setAI(this.getAttribute("data-ai"),this)}}
  
  $("sendBtn").onclick=send;
  $("prompt").addEventListener("keydown",function(e){
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}
  });
  
  $("clearBtn").onclick=function(){
    $("chatWindow").innerHTML="";
    addMsg("ai","Xin chào! Tôi là V2F AI.");
    lastResp="";
  };
  
  $("speakBtn").onclick=function(){
    if(!lastResp||!("speechSynthesis"in window))return;
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(lastResp);
    u.lang="vi-VN";
    speechSynthesis.speak(u);
  };
  
  var R=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(R){
    var rec=new R();
    rec.lang="vi-VN";
    rec.continuous=false;
    rec.interimResults=false;
    rec.onstart=function(){$("micBtn").classList.add("recording")};
    rec.onend=function(){$("micBtn").classList.remove("recording")};
    rec.onresult=function(e){
      var p=$("prompt");
      p.value+=(p.value?" ":"")+e.results[0][0].transcript;
    };
    rec.onerror=function(){$("micBtn").classList.remove("recording")};
    $("micBtn").onclick=function(){
      if(this.classList.contains("recording"))rec.stop();
      else rec.start();
    };
  }else{
    $("micBtn").disabled=true;
  }
  
  checkGPU().then(function(res){
    if(!res.ok){
      notice("⚠️ Máy bạn <strong>chưa hỗ trợ WebGPU</strong>. Vẫn chat được bằng <strong>AI Đám Mây</strong> — dán API Key Gemini miễn phí tại <a href='https://aistudio.google.com/app/apikey' target='_blank'>aistudio.google.com/app/apikey</a>.",true);
      addMsg("system","💡 Máy chưa hỗ trợ WebGPU. Dán API Key Gemini miễn phí vào ô 🔑 bên trên để chat.");
      setGroup("cloud",$("groupCloud"));
      return;
    }
    if(!res.strong){
      notice("⚠️ GPU máy bạn <strong>quá yếu</strong> để chạy AI Siêu Nhẹ. Vẫn chat được bằng <strong>AI Đám Mây</strong> — dán API Key Gemini miễn phí tại <a href='https://aistudio.google.com/app/apikey' target='_blank'>aistudio.google.com/app/apikey</a>.",true);
      addMsg("system","💡 GPU máy bạn quá yếu cho AI Siêu Nhẹ. Dán API Key Gemini miễn phí vào ô 🔑 bên trên để chat (30 giây).");
      setGroup("cloud",$("groupCloud"));
      return;
    }
    notice("✅ Máy bạn <strong>hỗ trợ WebGPU</strong>! AI Siêu Nhẹ đang tải — miễn phí.",false);
    loadLLM("Llama-3.2-1B");
  });
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);
else setup();
})();
