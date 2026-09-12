(function(){
'use strict';

/* ===== TYPEWRITER BÊN PHẢI ===== */
var TEXT =
'🎨 TRANH Ý NIỆM TƯƠNG TÁC ĐẦU TIÊN TRÊN THẾ GIỚI\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'✧ THUNG LŨNG HAY VỰC SÂU ✧\n' +
'Tranh ý niệm tương tác tư duy\n' +
'Bản đồ tư duy trước khi hành động\n\n' +
'Tác giả: HỌA SĨ LÊ TRƯƠNG\n' +
'(Truongology)\n' +
'Năm sáng tác: 2026\n' +
'Chất liệu: Bút lông dầu trên giấy A3\n' +
'Độc bản duy nhất\n' +
'Bản quyền 11375/2025\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'"Có những tác phẩm nghệ thuật chỉ\n' +
'để ngắm nhìn. Và có những tác phẩm\n' +
'sinh ra để đánh thức — đánh thức\n' +
'những câu hỏi đã ngủ quên trong\n' +
'sâu thẳm tâm hồn mỗi con người."\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'🌟 BA CÂU HỎI NỀN TẢNG 🌟\n\n' +
'❶ Chúng ta đang ở đâu?\n' +
'   Where are we?\n\n' +
'❷ Thế giới đó vận hành thế nào?\n' +
'   How does that world operate?\n\n' +
'❸ Chúng ta muốn để lại tương lai gì?\n' +
'   What future do we want to leave\n' +
'   behind?\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'🏆 BA LẦN ĐẦU TIÊN TRONG 1000 NĂM\n\n' +
'✦ Tranh ý niệm tương tác đầu tiên\n' +
'  trên thế giới\n\n' +
'✦ Hệ sinh thái Tranh - Sách - Phần mềm\n' +
'  đầu tiên trên thế giới\n\n' +
'✦ Họa sĩ đầu tiên đăng ký bản quyền\n' +
'  Video To Future\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'📖 SÁCH: "VALLEY OR ABYSS"\n' +
'Phát hành 5 ngôn ngữ trên Amazon:\n' +
'English · 日本語 · 中文 · हिन्दी · Tiếng Việt\n\n' +
'💻 PHẦN MỀM VIDEO TO FUTURE\n' +
'Gửi khoảnh khắc đẹp vượt qua ranh\n' +
'giới thời gian đến với tương lai.\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'🌏 TẦM NHÌN TOÀN CẦU\n' +
'193 quốc gia thành viên Liên Hợp Quốc\n\n' +
'"Nghệ thuật không chỉ dành cho\n' +
'những người có điều kiện, mà phải\n' +
'là món quà tinh thần cho mọi tâm hồn."\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'✍️ HỌA SĨ LÊ TRƯƠNG\n' +
'Kiến trúc sư của Nhân cách\n' +
'Nghệ sĩ Bản đồ Tư duy\n' +
'Nhà thơ của Tương lai\n\n' +
'📞 Zalo: 0865 660 958\n' +
'📧 video2future.givevalue@gmail.com\n' +
'🌐 videotofuture.blogspot.com\n' +
'📚 amazon.com/dp/B0GRVVJS2W\n' +
'📍 B1 Hoàng Anh Gold House, TP.HCM\n\n' +
'━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
'💫 "Chia sẻ yêu thương, cùng xây di sản" 💫\n\n' +
'🎨 Video To Future · Truongology 🎨';

var twEl = document.getElementById('typewriter');
var idx = 0;
var cursor = document.createElement('span');
cursor.className = 'cursor';

function typeNext(){
  if(idx < TEXT.length){
    twEl.textContent = TEXT.substring(0, idx + 1);
    twEl.appendChild(cursor);
    idx++;
    var ch = TEXT.charAt(idx - 1);
    var d = ch === '\n' ? 90 : (ch === '━' ? 6 : 28);
    setTimeout(typeNext, d);
  } else {
    setTimeout(function(){
      idx = 0;
      twEl.textContent = '';
      typeNext();
    }, 5000);
  }
}
typeNext();

/* ===== AI CONFIG ===== */
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
var engine=null,loading=false,lastResp="",gpu=false;

function $(id){return document.getElementById(id)}

function addMsg(type,text,meta){
  var w=$("chatWindow");
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
  n.innerHTML=html;
  n.className="notice show"+(warn?" warn":"");
}

function checkGPU(){
  if(!navigator.gpu){gpu=false;return Promise.resolve(false);}
  return navigator.gpu.requestAdapter().then(function(a){
    gpu=!!a;return gpu;
  }).catch(function(){gpu=false;return false;});
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
    if(gpu){addMsg("system","Đã chọn "+name+" — miễn phí");loadLLM(name);}
    else{addMsg("system","Máy chưa hỗ trợ WebGPU — vui lòng chọn AI Đám Mây hoặc bật WebGPU.");}
  }else{
    addMsg("system","Đã chọn "+name+" (dán API Key vào ô bên trên)");
  }
}

function loadLLM(name){
  if(loading||!gpu)return;
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
    addMsg("system","✅ "+name+" đã sẵn sàng! Chat ngay — miễn phí.");
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
    if(!gpu){
      th.remove();
      addMsg("ai","⚠️ Máy chưa hỗ trợ WebGPU. Bật: chrome://flags → WebGPU → Enabled → Restart. Hoặc chuyển sang AI Đám Mây + dán API Key miễn phí tại aistudio.google.com/app/apikey");
      return;
    }
    if(!engine){
      th.remove();
      addMsg("ai","⏳ Mô hình đang tải, vui lòng đợi. Hoặc chọn mô hình nhỏ hơn (Qwen2.5 0.5B).");
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
    try{localStorage.setItem("v2f_api_key",key);}catch(e){}
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
  try{
    var saved=localStorage.getItem("v2f_api_key");
    if(saved)$("apiKey").value=saved;
  }catch(e){}
  
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
  
  checkGPU().then(function(ok){
    if(ok){
      notice("✅ Máy bạn <strong>hỗ trợ WebGPU</strong>! AI Siêu Nhẹ đang tải — miễn phí.",false);
      loadLLM("Llama-3.2-1B");
    }else{
      notice("⚠️ Máy <strong>chưa hỗ trợ WebGPU</strong>. Vẫn chat được bằng <strong>AI Đám Mây</strong> (dán API Key Gemini miễn phí tại <a href='https://aistudio.google.com/app/apikey' target='_blank'>aistudio.google.com/app/apikey</a>) — hoặc bật WebGPU: <code>chrome://flags</code> → 'WebGPU' → Enabled → Restart.",true);
      addMsg("system","💡 Máy chưa hỗ trợ WebGPU. Bạn vẫn chat được — chỉ cần dán API Key Gemini miễn phí vào ô 🔑 bên trên.");
      setGroup("cloud",$("groupCloud"));
    }
  });
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);
else setup();
})();
