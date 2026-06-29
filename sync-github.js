// sync-github.js - localStorage 跨设备同步（离线友好版）
(function(){
  'use strict';
  var OWNER = 'as51587571', REPO = 'lsy';
  var selfName = '', jsonName = '';

  try{
    var p = document.location.pathname;
    selfName = p.substring(p.lastIndexOf('/')+1);
    jsonName = selfName.replace(/\.\w+$/, '') + '_data.json';
  }catch(e){ return; }

  function getToken(){ return localStorage.getItem('_gh_token'); }

  // ========== 状态指示器 ==========
  var _statusEl = null;
  function showStatus(text, color){
    if(!_statusEl){
      _statusEl = document.createElement('div');
      _statusEl.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99998;padding:6px 14px;border-radius:6px;font-size:12px;font-family:sans-serif;color:#fff;pointer-events:none;transition:opacity 0.3s';
      document.body.appendChild(_statusEl);
    }
    _statusEl.textContent = text;
    _statusEl.style.background = color;
    _statusEl.style.opacity = '1';
    clearTimeout(_statusEl._timer);
    _statusEl._timer = setTimeout(function(){ _statusEl.style.opacity='0'; }, 2500);
  }

  // ========== 读取（走 Pages，无需代理） ==========
  function loadRemote(){
    return fetch(jsonName).then(function(r){
      if(!r.ok) return null;
      return r.json();
    }).then(function(remote){
      if(!remote) return;
      // 有未同步的本地修改时，跳过远程覆盖，防止丢失本地数据
      if(getPendingCount() > 0){
        showStatus('有未同步修改，跳过远程覆盖', '#f39c12');
        return false;
      }
      var changed = false;
      for(var k in remote){
        if(!remote.hasOwnProperty(k)) continue;
        if(remote[k] !== localStorage.getItem(k)){
          localStorage.setItem(k, remote[k]);
          changed = true;
        }
      }
      return changed;
    }).catch(function(){ return null; });
  }

  // ========== 写入（需代理，失败静默标记） ==========
  function getPendingCount(){
    try{ return parseInt(localStorage.getItem('_sync_pending')) || 0; }catch(e){ return 0; }
  }
  function incPending(){ localStorage.setItem('_sync_pending', String(getPendingCount()+1)); }
  function clearPending(){ localStorage.setItem('_sync_pending', '0'); }

  // ========== 冷却控制：至少间隔 30 秒 ==========
  var _lastSaveTime = 0;
  function saveRemote(callback, useKeepalive){
    var now = Date.now();
    if(now - _lastSaveTime < 30000){
      // 冷却中静默跳过，不标记为未同步
      if(callback) callback(false, 'cooldown');
      return;
    }
    _lastSaveTime = now;
    var token = getToken();
    if(!token){
      incPending();
      if(callback) callback(false, 'no_token');
      return;
    }
    var data = {};
    for(var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      if(k === '_gh_token' || k === '_sync_ts' || k === '_sync_pending') continue;
      data[k] = localStorage.getItem(k);
    }
    var content = JSON.stringify(data, null, 2);
    var apiUrl = 'https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+jsonName;

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
        headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: !!useKeepalive
      });
    })
    .then(function(r){ return r.json(); })
    .then(function(result){
      if(result && result.content){
        clearPending();
        localStorage.setItem('_sync_ts', Date.now().toString());
        showStatus('已同步', '#27ae60');
      } else {
        incPending();
        showStatus('同步失败', '#e74c3c');
      }
      if(callback) callback(!!result.content, null);
    })
    .catch(function(e){
      incPending();
      showStatus('同步失败（需开代理）', '#e74c3c');
      if(callback) callback(false, e.message);
    });
  }

  // ========== 自动保存（延迟 3 秒） ==========
  var saveTimer = null;
  function scheduleSave(){
    if(saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){ saveRemote(); }, 3000);
  }
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
    if(saveTimer) clearTimeout(saveTimer);
    saveRemote(null, true);
  });

  // ========== 重试按钮 ==========
  function addRetryButton(){
    var btn = document.createElement('button');
    btn.textContent = getPendingCount() > 0 ? '重试同步 ('+getPendingCount()+')' : '重试同步';
    btn.id = '_sync_retry_btn';
    btn.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:99998;padding:6px 14px;background:'+(getPendingCount()>0?'#e74c3c':'#3498db')+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-family:sans-serif';
    btn.onclick = function(){
      btn.textContent = '同步中...';
      btn.disabled = true;
      saveRemote(function(ok){
        btn.disabled = false;
        btn.textContent = getPendingCount() > 0 ? '重试同步 ('+getPendingCount()+')' : '重试同步';
        btn.style.background = getPendingCount() > 0 ? '#e74c3c' : '#3498db';
      });
    };
    document.body.appendChild(btn);
  }

  // ========== 清除 Token 按钮 ==========
  function addClearTokenButton(){
    var btn = document.createElement('button');
    btn.id = '_cleartoken_btn';
    btn.textContent = '清除Token';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;padding:6px 12px;background:#e74c3c;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-family:sans-serif';
    btn.onclick = function(){
      localStorage.removeItem('_gh_token');
      localStorage.removeItem('_sync_ts');
      clearPending();
      location.reload();
    };
    document.body.appendChild(btn);
  }

  // ========== Token 设置 UI ==========
  function showTokenUI(){
    var div = document.createElement('div');
    div.id = '_gh_token_ui';
    div.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center">'
      +'<div style="background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:24px;max-width:400px;color:#e0e0e0;font-family:sans-serif">'
      +'<h3 style="color:#4ecdc4;margin:0 0 8px">配置 GitHub Token</h3>'
      +'<p style="font-size:13px;color:#999;margin:0 0 4px">用于跨设备同步数据</p>'
      +'<p style="font-size:11px;color:#666;margin:0 0 12px">创建地址：<a href="https://github.com/settings/tokens?type=beta" target="_blank" style="color:#4ecdc4">GitHub Settings</a>，权限选 <b>Contents: Read and write</b>，仓库选 <b>as51587571/lsy</b></p>'
      +'<input id="_gh_token_input" type="password" placeholder="粘贴 Token...（需开代理）" style="width:100%;padding:10px;border:1px solid #2a2a4a;border-radius:6px;background:#0f0f1a;color:#e0e0e0;font-size:14px;box-sizing:border-box;margin-bottom:12px">'
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
        if(!ok) alert('保存失败，请确保代理已开启');
      });
    };
  }

  // ========== 初始化 ==========
  var token = getToken();
  if(token){
    loadRemote().then(function(changed){
      if(changed) showStatus('数据已更新', '#3498db');
    });
  } else {
    setTimeout(function(){
      if(!getToken()) showTokenUI();
    }, 600);
  }

  // 按钮（用 MutationObserver 确保 body 存在）
  function addButtons(){
    if(document.body){
      if(getToken()) addClearTokenButton();
      addRetryButton();
    } else {
      setTimeout(addButtons, 100);
    }
  }
  setTimeout(addButtons, 800);

  // ========== 公开 API ==========
  window.__syncNow = function(){
    showStatus('拉取中...', '#3498db');
    loadRemote().then(function(changed){
      showStatus(changed ? '数据已更新' : '数据已是最新', '#27ae60');
    });
  };
  window.__syncPush = function(){
    showStatus('推送中...', '#3498db');
    saveRemote(function(ok){
      showStatus(ok ? '已推送' : '推送失败（需开代理）', ok ? '#27ae60' : '#e74c3c');
    }, false);
  };
})();
