/**
 * EPFBD WMS — Global Search Engine v1.0
 * Searches across: Manpower, WH List, Equipment, Maintenance
 */
(function(){
'use strict';

/* ── Search index built from localStorage ── */
var INDEX = [];
var INDEX_BUILT = false;

function buildIndex(){
  INDEX = [];

  /* ── Manpower (from EPF/TGL/BGL base data) ── */
  var MP_KEYS = [
    {ls:'epfbd_epf_extra', base:'epf_base', label:'EPF Manpower', icon:'👤', url:'manpower/EPF_manpower.html'},
    {ls:'epfbd_tgl_extra', base:'tgl_base', label:'TGL Manpower', icon:'👤', url:'manpower/TGL_manpower.html'},
    {ls:'epfbd_bgl_extra', base:'bgl_base', label:'BGL Manpower', icon:'👤', url:'manpower/BGL_manpower.html'},
    {ls:'epfbd_all_extra', base:'all_base', label:'All Manpower', icon:'👥', url:'manpower/all_manpower.html'},
  ];

  /* Build from window.BASE_DATA if available (injected by pages) */
  if(window.WMS_SEARCH_DATA){
    var sd = window.WMS_SEARCH_DATA;
    
    // Manpower
    (sd.manpower||[]).forEach(function(r){
      INDEX.push({
        type:'manpower', icon:'👤', label:'Manpower',
        title: r.name||'',
        sub: [(r.id||''),(r.desig||''),(r.type||''),(r.dept||''),(r.wh||''),(r.factory||'')].filter(Boolean).join(' · '),
        keywords: [r.name,r.id,r.desig,r.type,r.dept,r.wh,r.factory,r.building,r.mobile].filter(Boolean).join(' ').toLowerCase(),
        url: 'manpower/all_manpower.html',
        data: r
      });
    });

    // Warehouse
    (sd.warehouses||[]).forEach(function(r){
      INDEX.push({
        type:'warehouse', icon:'🏭', label:'Warehouse',
        title: (r.wh_code||r.code||r.name||''),
        sub: [(r.location||''),(r.factory||''),(r.type||'')].filter(Boolean).join(' · '),
        keywords: [r.wh_code,r.code,r.name,r.location,r.factory,r.type,r.responsible].filter(Boolean).join(' ').toLowerCase(),
        url: 'warehouse/wh_list.html',
        data: r
      });
    });

    // Equipment / PDA
    (sd.equipment||[]).forEach(function(r){
      INDEX.push({
        type:'equipment', icon:'📱', label:'PDA/Device',
        title: r.name||'',
        sub: [(r.devid||''),(r.imei||''),(r.dept||''),(r.fty||r.factory||''),(r.person||'')].filter(Boolean).join(' · '),
        keywords: [r.name,r.devid,r.imei,r.dept,r.fty,r.factory,r.person,r.cat].filter(Boolean).join(' ').toLowerCase(),
        url: 'equipment/pda_devices.html',
        data: r
      });
    });

    // Maintenance spare parts
    (sd.parts||[]).forEach(function(r){
      INDEX.push({
        type:'parts', icon:'🔧', label:'Spare Part',
        title: r.material||'',
        sub: [(r.forklift||''),(r.driver||''),(r.date||'')].filter(Boolean).join(' · '),
        keywords: [r.material,r.forklift,r.driver,r.driver_id,r.unit].filter(Boolean).join(' ').toLowerCase(),
        url: 'equipment/maintenance_log.html',
        data: r
      });
    });

    // Fuel records
    (sd.fuel||[]).forEach(function(r){
      INDEX.push({
        type:'fuel', icon:'⛽', label:'Fuel Log',
        title: (r.forklift||'') + ' — ' + (r.date||''),
        sub: [(r.driver||''),(r.fuel_qty?r.fuel_qty+'L':'')].filter(Boolean).join(' · '),
        keywords: [r.forklift,r.driver,r.driver_id,r.date].filter(Boolean).join(' ').toLowerCase(),
        url: 'equipment/maintenance_log.html',
        data: r
      });
    });
  }

  // Also try localStorage data
  try{
    var ls_parts = localStorage.getItem('wms_fl_parts');
    var ls_fuel  = localStorage.getItem('wms_fl_fuel');
    if(ls_parts && !(window.WMS_SEARCH_DATA&&window.WMS_SEARCH_DATA.parts)){
      JSON.parse(ls_parts).forEach(function(r){
        INDEX.push({type:'parts',icon:'🔧',label:'Spare Part',
          title:r.material||'',sub:(r.forklift||'')+'·'+(r.date||''),
          keywords:[r.material,r.forklift,r.driver,r.driver_id].filter(Boolean).join(' ').toLowerCase(),
          url:'equipment/maintenance_log.html',data:r});
      });
    }
    if(ls_fuel && !(window.WMS_SEARCH_DATA&&window.WMS_SEARCH_DATA.fuel)){
      JSON.parse(ls_fuel).forEach(function(r){
        INDEX.push({type:'fuel',icon:'⛽',label:'Fuel Log',
          title:(r.forklift||'')+' — '+(r.date||''),sub:(r.driver||'')+'·'+(r.fuel_qty||'')+'L',
          keywords:[r.forklift,r.driver,r.driver_id,r.date].filter(Boolean).join(' ').toLowerCase(),
          url:'equipment/maintenance_log.html',data:r});
      });
    }
  }catch(e){}

  INDEX_BUILT = true;
  
  // Async load manpower if not yet in index
  if(INDEX.filter(function(x){return x.type==='manpower';}).length===0){
    fetch('manpower/search_data.json')
      .then(function(r){return r.json();})
      .then(function(d){
        (d.manpower||[]).forEach(function(r){
          INDEX.push({
            type:'manpower',icon:'\u{1F464}',label:'Manpower',
            title:r.name||'',
            sub:[(r.id||''),(r.desig||''),(r.wh||''),(r.factory||'')].filter(Boolean).join(' · '),
            keywords:[r.name,r.id,r.desig,r.type,r.dept,r.wh,r.factory,r.building,r.mobile].filter(Boolean).join(' ').toLowerCase(),
            url:'manpower/all_manpower.html',data:r
          });
        });
      }).catch(function(){});
  }
  
  return INDEX;
}

/* ── Search function ── */
function search(query, limit){
  limit = limit || 30;
  if(!INDEX_BUILT) buildIndex();
  if(!query || query.trim().length < 2) return [];
  
  var q = query.toLowerCase().trim();
  var words = q.split(/\s+/).filter(function(w){return w.length>0;});
  
  var results = [];
  var seen = {};
  
  INDEX.forEach(function(item){
    // Skip duplicates (same title+type)
    var key = item.type + '::' + item.title;
    if(seen[key]) return;
    
    var score = 0;
    var kw = item.keywords;
    var title = (item.title||'').toLowerCase();
    
    // Exact title match = highest score
    if(title === q) score += 100;
    else if(title.indexOf(q) === 0) score += 80;
    else if(title.indexOf(q) >= 0) score += 60;
    
    // All words match
    var allMatch = words.every(function(w){ return kw.indexOf(w)>=0; });
    if(allMatch) score += 40;
    
    // Any word matches
    words.forEach(function(w){
      if(kw.indexOf(w) >= 0) score += 10;
      if(title.indexOf(w) >= 0) score += 5;
    });
    
    if(score > 0){
      results.push({item:item, score:score});
      seen[key] = true;
    }
  });
  
  // Sort by score desc
  results.sort(function(a,b){return b.score - a.score;});
  return results.slice(0, limit).map(function(r){return r.item;});
}

/* ── Public API ── */
window.WmsSearch = {
  build: buildIndex,
  search: search,
  getIndex: function(){ return INDEX; },
  getCount: function(){ return INDEX.length; }
};

})();
