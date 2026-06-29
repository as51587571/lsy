// sync-github.js - localStorage 通过 GitHub API 同步数据
(function(){
  'use strict';
  var OWNER = 'as51587571', REPO = 'lsy';
  var SYNC_DELAY = 3000, timer = null;
  var selfName = '', jsonName = '';

  try{
    var p = document.location.pathname;
    selfName = p.substring(p.lastIndexOf('/')+1);
    jsonName = selfName.replace(/\.\w+$/,'') + '_data.json';
  }catch(e){ return; }

  function getToken(){ return localStorage.getItem('_gh_token'); }

  // 从当前 origin 读取 JSON（GitHub Pages 同源）
  function loadRemote(){
    return fetch(jsonName).then(function(r){
      if(!r.ok) return null;
      return r.json();
    }).then(function(data){
      if(!data) return;
      for(var k in data){
        if(data.hasOwnProperty(k)) localStorage.setItem(k, data[k]);
      }
      return true;
    }).catch(function(){ return null; });
  }

  // 通过 GitHub API 写入 JSON
  function saveRemote(callback){
    var token = getToken();
    if(!token){
      if(callback) callback(false, 'no_token');
      return;
    }

    var data = {};
    for(var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      if(k === '_gh_token') continue;
      data[k] = localStorage.getItem(k);
    }
    var content = JSON.stringify(data, null, 2);
    var apiUrl = 'https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+jsonName;

    // 先获取当前 SHA
    fetch(apiUrl, { headers: { 'Authorization': 'Bearer '+token } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(info){
      var body = {
        message: 'update ' + jsonName,
        content: btoa(unescape(encodeURIComponent(content)))
      };
      if(info && info.sha) body.sha = info.sha;

      return fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer '+token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
    })
    .then(function(r){ return r.json(); })
    .then(function(result){
      if(callback) callback(!!result.content, null);
    })
    .catch(function(e){
      if(callback) callback(false, e.message);
    });
  }

  function scheduleSave(){
    if(timer) clearTimeout(timer);
    timer = setTimeout(function(){ saveRemote(); }, SYNC_DELAY);
  }

  // Hook localStorage 修改
  function hook(fn, ctx, name){
    var orig = ctx[name];
    ctx[name] = function(){
      var r = orig.apply(this, arguments);
      try{ fn(); }catch(e){}
      return r;
    };
  }
  hook(scheduleSave, Storage.prototype, 'setItem');
  hook(scheduleSave, Storage.prototype, 'removeItem');
  hook(scheduleSave, Storage.prototype, 'clear');

  window.addEventListener('beforeunload', function(){
    if(timer) clearTimeout(timer);
    saveRemote();
  });

  // Token 设置 UI
  function showTokenUI(){
    var div = document.createElement('div');
    div.id = '_gh_token_ui';
    div.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center">'
      +'<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:24px;max-width:400px;color:#e0e0e0;font-family:sans-serif">'
      +'<h3 style="color:#4ecdc4;margin:0 0 8px">配置 GitHub Token</h3>'
      +'<p style="font-size:13px;color:#999;margin:0 0 4px">用于跨设备同步数据</p>'
      +'<p style="font-size:11px;color:#666;margin:0 0 12px">创建地址：<a href="https://github.com/settings/tokens?type=beta" target="_blank" style="color:#4ecdc4">GitHub Settings</a>，权限选 <b>Contents: Read and write</b>，仓库选 <b>as51587571/lsy</b></p>'
      +'<input id="_gh_token_input" type="password" placeholder="粘贴 Token..." style="width:100%;padding:10px;border:1px solid #2a2a4a;border-radius:6px;background:#0f0f1a;color:#e0e0e0;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
      +'<div style="display:flex;gap:8px">'
      +'<button onclick="document.getElementById(\'_gh_token_ui\').remove()" style="flex:1;padding:10px;border:1px solid #2a2a4a;border-radius:6px;background:transparent;color:#999;cursor:pointer">跳过</button>'
      +'<button id="_gh_token_save" style="flex:2;padding:10px;border:none;border-radius:6px;background:#4ecdc4;color:#000;font-weight:600;cursor:pointer">保存并同步</button>'
      +'</div></div></div>';
    document.body.appendChild(div);

    document.getElementById('_gh_token_save').onclick = function(){
      var v = document.getElementById('_gh_token_input').value.trim();
      if(!v) return;
      localStorage.setItem('_gh_token', v);
      document.getElementById('_gh_token_ui').remove();
      saveRemote(function(ok){
        if(!ok) alert('保存失败，请检查 Token 权限');
      });
    };
  }

  // 初始化
  var token = getToken();
  if(token){
    loadRemote().then(function(){
      saveRemote(); // 也同步一次本地数据上去
    });
  } else {
    // 延迟显示 UI
    setTimeout(function(){
      if(!getToken()) showTokenUI();
    }, 500);
  }

  window.__syncNow = function(){ saveRemote(function(ok){ alert(ok?'同步成功':'同步失败，请检查 Token'); }); };
})();
