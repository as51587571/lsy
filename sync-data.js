// sync-data.js - localStorage 自动同步到 JSON 文件
(function(){
  'use strict';
  var SYNC_DELAY = 3000;
  var dir = '', selfName = '';

  try{
    var p = decodeURIComponent(document.location.href).replace(/^file:\/\/\//,'').replace(/\//g,'\\');
    selfName = p.substring(p.lastIndexOf('\\')+1);
    dir = p.substring(0, p.lastIndexOf('\\'));
    if(!dir.endsWith('\\')) dir += '\\';
  }catch(e){ return; }

  var jsonName = selfName.replace(/\.\w+$/,'') + '_data.json';
  var timer = null;

  function loadFromFile(){
    try{
      var xhr = new XMLHttpRequest();
      xhr.open('GET', jsonName, false);
      xhr.send();
      if(xhr.status===200 || xhr.status===0){
        var data = JSON.parse(xhr.responseText);
        for(var k in data){
          if(data.hasOwnProperty(k)){
            localStorage.setItem(k, data[k]);
          }
        }
        return true;
      }
    }catch(e){}
    return false;
  }

  function saveToFile(){
    var data = {};
    for(var i=0; i<localStorage.length; i++){
      var k = localStorage.key(i);
      data[k] = localStorage.getItem(k);
    }
    var encoded = encodeURIComponent(JSON.stringify(data));
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = 'syncrun:save:'+jsonName+':'+encoded;
    document.body.appendChild(iframe);
    setTimeout(function(){ document.body.removeChild(iframe); }, 3000);
  }

  function scheduleSave(){
    if(timer) clearTimeout(timer);
    timer = setTimeout(saveToFile, SYNC_DELAY);
  }

  var _setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(k, v){
    _setItem.call(this, k, v);
    scheduleSave();
  };
  var _removeItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function(k){
    _removeItem.call(this, k);
    scheduleSave();
  };
  var _clear = Storage.prototype.clear;
  Storage.prototype.clear = function(){
    _clear.call(this);
    scheduleSave();
  };

  window.addEventListener('beforeunload', function(){
    if(timer) clearTimeout(timer);
    saveToFile();
  });

  loadFromFile();

  window.__syncNow = saveToFile;
  window.__syncLoad = loadFromFile;
})();
