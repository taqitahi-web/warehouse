/**
 * EPFBD WMS — Firebase Realtime Database Module
 * Include this in every page BEFORE the page's own <script>
 * Usage: window.WmsDb.getAll(node, cb), WmsDb.set(node, key, data), WmsDb.del(node, key)
 */
(function(){
  const FB_CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';
  let _app=null, _db=null, _ready=false, _queue=[];

  /* ── Load config from localStorage ── */
  function getCfg(){
    try{ return JSON.parse(localStorage.getItem('wms_fb_config')||'null'); }
    catch(e){ return null; }
  }

  /* ── Lazy-load Firebase SDK then init ── */
  async function boot(){
    const cfg = getCfg();
    if(!cfg||!cfg.databaseURL){
      console.warn('[WmsDb] No Firebase config — using localStorage fallback');
      _ready='local';
      _queue.forEach(fn=>fn()); _queue=[];
      return;
    }
    try{
      const [{ initializeApp },{ getDatabase, ref, set, get, remove, onValue, push }] =
        await Promise.all([
          import(FB_CDN+'firebase-app.js'),
          import(FB_CDN+'firebase-database.js')
        ]);
      _app = initializeApp(cfg, 'wms-'+Date.now());
      _db  = getDatabase(_app);
      window._fbRef=ref; window._fbSet=set; window._fbGet=get;
      window._fbRemove=remove; window._fbOnValue=onValue; window._fbPush=push;
      _ready='firebase';
      console.log('[WmsDb] Firebase connected ✓');
    } catch(e){
      console.warn('[WmsDb] Firebase failed, localStorage fallback:', e.message);
      _ready='local';
    }
    _queue.forEach(fn=>fn()); _queue=[];
  }

  /* ── Wait until ready ── */
  function whenReady(fn){
    if(_ready) fn(); else _queue.push(fn);
  }

  /* ══════════════════════════════════════════
     PUBLIC API
     node  = e.g. 'epf_manpower'
     key   = record key string
     data  = plain JS object
  ══════════════════════════════════════════ */
  const WmsDb = {

    /* Listen to all records under /wms/{node}/ — calls cb(data_array) on every change */
    listen(node, cb){
      whenReady(()=>{
        if(_ready==='firebase'){
          const r = window._fbRef(_db, 'wms/'+node);
          window._fbOnValue(r, snap=>{
            const val = snap.val()||{};
            cb(Object.entries(val).map(([k,v])=>Object.assign({_fbKey:k},v)));
          });
        } else {
          cb(_localGet(node));
          // Poll every 5s for tab-cross updates
          setInterval(()=>cb(_localGet(node)), 5000);
        }
      });
    },

    /* Get once */
    getOnce(node, cb){
      whenReady(async ()=>{
        if(_ready==='firebase'){
          const snap = await window._fbGet(window._fbRef(_db,'wms/'+node));
          const val = snap.val()||{};
          cb(Object.entries(val).map(([k,v])=>Object.assign({_fbKey:k},v)));
        } else {
          cb(_localGet(node));
        }
      });
    },

    /* Push new record → returns promise resolving to key */
    push(node, data){
      return new Promise(resolve=>{
        whenReady(async ()=>{
          if(_ready==='firebase'){
            const r = window._fbPush(window._fbRef(_db,'wms/'+node), data);
            resolve(r.key);
          } else {
            const arr = _localGet(node);
            const key = 'local_'+Date.now();
            arr.push(Object.assign({_fbKey:key},data));
            _localSet(node, arr);
            resolve(key);
          }
        });
      });
    },

    /* Update/set a record by its _fbKey */
    update(node, fbKey, data){
      return new Promise(resolve=>{
        whenReady(async ()=>{
          if(_ready==='firebase'){
            await window._fbSet(window._fbRef(_db,'wms/'+node+'/'+fbKey), data);
            resolve();
          } else {
            const arr = _localGet(node);
            const idx = arr.findIndex(r=>r._fbKey===fbKey);
            if(idx>=0) arr[idx]=Object.assign({},data,{_fbKey:fbKey});
            _localSet(node, arr);
            resolve();
          }
        });
      });
    },

    /* Delete a record by its _fbKey */
    remove(node, fbKey){
      return new Promise(resolve=>{
        whenReady(async ()=>{
          if(_ready==='firebase'){
            await window._fbRemove(window._fbRef(_db,'wms/'+node+'/'+fbKey));
            resolve();
          } else {
            let arr = _localGet(node);
            arr = arr.filter(r=>r._fbKey!==fbKey);
            _localSet(node, arr);
            resolve();
          }
        });
      });
    },

    /* Bulk set BASE overrides (edits to base/locked records) */
    setOverride(node, idx, data){
      return new Promise(resolve=>{
        whenReady(async ()=>{
          const oKey = 'wms/'+node+'_overrides/'+idx;
          if(_ready==='firebase'){
            await window._fbSet(window._fbRef(_db, oKey), data);
            resolve();
          } else {
            const ov = JSON.parse(localStorage.getItem(node+'_ov')||'{}');
            ov[idx] = data;
            localStorage.setItem(node+'_ov', JSON.stringify(ov));
            resolve();
          }
        });
      });
    },

    /* Listen to overrides */
    listenOverrides(node, cb){
      whenReady(()=>{
        if(_ready==='firebase'){
          const r = window._fbRef(_db, 'wms/'+node+'_overrides');
          window._fbOnValue(r, snap=>{
            cb(snap.val()||{});
          });
        } else {
          const ov = JSON.parse(localStorage.getItem(node+'_ov')||'{}');
          cb(ov);
        }
      });
    },

    /* Connection status */
    getMode(){ return _ready; },
    isCloud(){ return _ready==='firebase'; },
  };

  /* ── localStorage helpers ── */
  function _localGet(node){
    try{ return JSON.parse(localStorage.getItem('wms_'+node)||'[]'); }
    catch(e){ return []; }
  }
  function _localSet(node, arr){
    localStorage.setItem('wms_'+node, JSON.stringify(arr));
  }

  window.WmsDb = WmsDb;
  boot();
})();
