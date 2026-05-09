/**
 * EPFBD WMS — Role Based Access Control (RBAC) v1.0
 * Admin → everything
 * Manager → own factory, no delete
 * Viewer → read only
 */
(function(){
'use strict';

/* ── Default users (stored in localStorage, editable from Settings) ── */
var DEFAULT_USERS=[
  {id:'admin01',name:'Masud',role:'admin',factory:'ALL',pin:'1234',avatar:'MD'},
  {id:'mgr_epf',name:'EPF Incharge',role:'manager',factory:'EPF',pin:'2222',avatar:'EP'},
  {id:'mgr_tgl',name:'TGL Incharge',role:'manager',factory:'TGL',pin:'3333',avatar:'TG'},
  {id:'mgr_bgl',name:'BGL Incharge',role:'manager',factory:'BGL',pin:'4444',avatar:'BG'},
  {id:'view01',name:'Viewer',role:'viewer',factory:'ALL',pin:'5555',avatar:'VW'},
];

/* ── Role capabilities ── */
var CAPS={
  admin:  {add:true,  edit:true,  del:true,  allFactory:true,  settings:true},
  manager:{add:true,  edit:true,  del:false, allFactory:false, settings:false},
  viewer: {add:false, edit:false, del:false, allFactory:false, settings:false},
};

/* ── Storage helpers ── */
function getUsers(){
  try{return JSON.parse(localStorage.getItem('wms_users')||'null')||DEFAULT_USERS;}
  catch(e){return DEFAULT_USERS;}
}
function saveUsers(u){localStorage.setItem('wms_users',JSON.stringify(u));}
function getSession(){
  try{return JSON.parse(sessionStorage.getItem('wms_session')||'null');}
  catch(e){return null;}
}
function setSession(u){sessionStorage.setItem('wms_session',JSON.stringify(u));}
function clearSession(){sessionStorage.removeItem('wms_session');}

/* ── Public API ── */
var WmsAuth={

  /* Current user */
  user: null,
  caps: null,

  /* Login by PIN */
  login:function(pin){
    var users=getUsers();
    var found=null;
    for(var i=0;i<users.length;i++){
      if(users[i].pin===String(pin)){found=users[i];break;}
    }
    if(!found)return false;
    WmsAuth.user=found;
    WmsAuth.caps=CAPS[found.role]||CAPS.viewer;
    setSession(found);
    return true;
  },

  /* Restore session */
  restore:function(){
    var s=getSession();
    if(s){
      WmsAuth.user=s;
      WmsAuth.caps=CAPS[s.role]||CAPS.viewer;
      return true;
    }
    return false;
  },

  logout:function(){
    clearSession();
    WmsAuth.user=null;
    WmsAuth.caps=null;
    window.location.href=WmsAuth._loginPage();
  },

  _loginPage:function(){
    var depth=window.location.pathname.split('/').length-2;
    var prefix='';
    for(var i=0;i<depth;i++)prefix+='../';
    return prefix+'login.html';
  },

  /* Check if current page needs auth */
  guard:function(){
    if(window.location.pathname.indexOf('login.html')>=0)return;
    if(!WmsAuth.restore()){
      window.location.href=WmsAuth._loginPage();
      return;
    }
    // Check section lock after auth
    setTimeout(function(){ WmsAuth.checkSection(); }, 0);
  },


  /* Check if current page is locked by section settings */
  checkSection: function(){
    var sections = null;
    try{ sections = JSON.parse(localStorage.getItem('wms_sections')||'null'); }
    catch(e){}
    if(!sections) return; // no custom sections = no lock

    var currentPath = window.location.pathname;
    var currentFile = currentPath.split('/').pop() || 'index.html';
    
    // Match current page against locked sections
    for(var i=0; i<sections.length; i++){
      var s = sections[i];
      if(!s.locked) continue;
      
      // Check if this section URL matches current page
      var sUrl = s.url || '';
      var sFile = sUrl.split('/').pop() || '';
      
      if(sFile && currentFile === sFile){
        // Page is locked — check if admin (admin bypasses section lock)
        if(WmsAuth.user && WmsAuth.user.role === 'admin') return;
        // Non-admin: redirect to dashboard
        var depth = window.location.pathname.split('/').length - 2;
        var prefix = '';
        for(var d=0; d<depth; d++) prefix += '../';
        window.location.replace((prefix||'./') + 'index.html?locked=1');
        return;
      }
    }
  },

  /* Can current user do action? */
  can:function(action){
    if(!WmsAuth.caps)return false;
    return !!WmsAuth.caps[action];
  },

  /* Can user see this factory's data? */
  allowFactory:function(factory){
    if(!WmsAuth.user)return false;
    if(WmsAuth.caps.allFactory)return true;
    return WmsAuth.user.factory===factory||!factory;
  },

  /* Apply UI restrictions based on role */
  applyUI:function(){
    var u=WmsAuth.user;
    if(!u)return;

    /* Update header user display */
    var av=document.getElementById('hdr-av');
    var nm=document.getElementById('hdr-name');
    var rl=document.getElementById('hdr-role');
    var sbAv=document.getElementById('sb-av');
    var sbNm=document.getElementById('sb-uname');
    var sbRl=document.getElementById('sb-urole');
    if(av)av.textContent=u.avatar;
    if(nm)nm.textContent=u.name;
    if(rl)rl.textContent=u.role.charAt(0).toUpperCase()+u.role.slice(1)+' · '+(u.factory==='ALL'?'All Factories':u.factory);
    if(sbAv)sbAv.textContent=u.avatar;
    if(sbNm)sbNm.textContent=u.name;
    if(sbRl)sbRl.textContent=u.role.charAt(0).toUpperCase()+u.role.slice(1)+' · '+(u.factory==='ALL'?'All':u.factory);

    /* Hide Add buttons for viewers */
    if(!WmsAuth.can('add')){
      document.querySelectorAll('.btn-p,.a-add,[onclick*="openAdd"],[onclick*="openModal"]').forEach(function(el){
        el.style.display='none';
      });
    }

    /* Hide Edit buttons for viewers */
    if(!WmsAuth.can('edit')){
      document.querySelectorAll('.abtn.a-e,[onclick*="editRec"],[onclick*="openEdit"]').forEach(function(el){
        el.style.display='none';
      });
    }

    /* Hide Delete buttons for managers and viewers */
    if(!WmsAuth.can('del')){
      document.querySelectorAll('.abtn.a-d,[onclick*="delRec"],[onclick*="askDel"],[onclick*="confirmDel"]').forEach(function(el){
        el.style.display='none';
      });
    }

    /* Hide Settings link for non-admins */
    if(!WmsAuth.can('settings')){
      document.querySelectorAll('a[href*="settings/index"]').forEach(function(el){
        el.style.display='none';
      });
    }

    /* Role badge in header */
    var badge=document.getElementById('role-badge');
    if(badge){
      var colors={admin:'#3ecf8e',manager:'#60a5fa',viewer:'#fbbf24'};
      badge.textContent=u.role.toUpperCase();
      badge.style.background=colors[u.role]||'#888';
    }
  },

  /* Filter table rows by factory */
  filterByFactory:function(rows,factoryField){
    if(WmsAuth.caps&&WmsAuth.caps.allFactory)return rows;
    var f=WmsAuth.user?WmsAuth.user.factory:'';
    return rows.filter(function(r){return !r[factoryField]||r[factoryField]===f;});
  },

  /* User management (admin only) */
  getUsers:getUsers,
  saveUsers:saveUsers,
  addUser:function(u){var users=getUsers();users.push(u);saveUsers(users);},
  updateUser:function(id,data){
    var users=getUsers();
    for(var i=0;i<users.length;i++){if(users[i].id===id){Object.assign(users[i],data);break;}}
    saveUsers(users);
  },
  deleteUser:function(id){
    var users=getUsers().filter(function(u){return u.id!==id;});
    saveUsers(users);
  },
};

window.WmsAuth=WmsAuth;
})();
