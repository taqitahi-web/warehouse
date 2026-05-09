/* ═══════════════════════════════════════════════════════
   EPFBD WMS — Role-Based Access Control (RBAC) v1.0
   
   Roles:
   - admin   → Full access: view + add + edit + delete + settings
   - manager → Own factory only: view + add + edit (NO delete, NO settings)
   - viewer  → Read-only: view only (NO add/edit/delete)
   
   Users stored in localStorage: wms_users
   Current session: wms_session
   ═══════════════════════════════════════════════════════ */

(function(){
  'use strict';

  /* ── Default users (change passwords in Settings) ── */
  var DEFAULT_USERS = [
    {id:'u1', name:'Masud',    username:'masud',   password:'masud123',  role:'admin',   factory:'ALL',  avatar:'MD', active:true},
    {id:'u2', name:'Rabbani',  username:'rabbani', password:'epf456',    role:'manager', factory:'EPF',  avatar:'GR', active:true},
    {id:'u3', name:'Anarul',   username:'anarul',  password:'epf789',    role:'manager', factory:'EPF',  avatar:'AN', active:true},
    {id:'u4', name:'TGL Mgr',  username:'tgl',     password:'tgl123',    role:'manager', factory:'TGL',  avatar:'TM', active:true},
    {id:'u5', name:'Viewer',   username:'viewer',  password:'view001',   role:'viewer',  factory:'ALL',  avatar:'VW', active:true},
  ];

  /* ── Storage helpers ── */
  function getUsers(){
    try{ return JSON.parse(localStorage.getItem('wms_users')||'null') || DEFAULT_USERS; }
    catch(e){ return DEFAULT_USERS; }
  }
  function saveUsers(u){ localStorage.setItem('wms_users',JSON.stringify(u)); }
  function getSession(){
    try{ return JSON.parse(sessionStorage.getItem('wms_session')||'null'); }
    catch(e){ return null; }
  }
  function saveSession(s){ sessionStorage.setItem('wms_session',JSON.stringify(s)); }
  function clearSession(){ sessionStorage.removeItem('wms_session'); }

  /* ── Public API ── */
  window.WmsAuth = {

    /* Check if logged in */
    isLoggedIn: function(){ return !!getSession(); },

    /* Get current user */
    currentUser: function(){ return getSession(); },

    /* Login */
    login: function(username, password){
      var users = getUsers();
      var user = users.find(function(u){
        return u.username === username.trim().toLowerCase()
            && u.password === password
            && u.active !== false;
      });
      if(!user) return {ok:false, msg:'ভুল username বা password'};
      var session = {
        id:user.id, name:user.name, username:user.username,
        role:user.role, factory:user.factory, avatar:user.avatar,
        loginAt: new Date().toISOString()
      };
      saveSession(session);
      return {ok:true, user:session};
    },

    /* Logout */
    logout: function(){
      clearSession();
      window.location.href = _getRootPath() + 'login.html';
    },

    /* Permission checks */
    can: function(action){
      var u = getSession();
      if(!u) return false;
      var perms = {
        admin:   {view:true, add:true, edit:true, delete:true, settings:true, allFactory:true},
        manager: {view:true, add:true, edit:true, delete:false,settings:false,allFactory:false},
        viewer:  {view:true, add:false,edit:false,delete:false,settings:false,allFactory:false},
      };
      return !!(perms[u.role] && perms[u.role][action]);
    },

    /* Factory access check */
    canAccessFactory: function(factory){
      var u = getSession();
      if(!u) return false;
      if(u.factory === 'ALL') return true;
      return u.factory === factory;
    },

    /* Get all users (admin only) */
    getUsers: function(){
      if(!this.can('settings')) return [];
      return getUsers();
    },

    /* Save users (admin only) */
    saveUsers: function(users){
      if(!this.can('settings')) return false;
      saveUsers(users);
      return true;
    },

    /* Update password */
    updatePassword: function(userId, newPass){
      var users = getUsers();
      var idx = users.findIndex(function(u){ return u.id===userId; });
      if(idx<0) return false;
      users[idx].password = newPass;
      saveUsers(users);
      return true;
    },
  };

  /* ── Helper: detect root path from current URL ── */
  function _getRootPath(){
    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);
    // Remove filename
    if(parts.length && parts[parts.length-1].indexOf('.')>=0) parts.pop();
    // Count depth under wms_project
    var depth = 0;
    for(var i=parts.length-1;i>=0;i--){
      if(parts[i]==='wms_project') break;
      depth++;
    }
    return depth===0 ? './' : Array(depth).fill('..').join('/') + '/';
  }

  /* ══════════════════════════════════════════════
     RBAC Enforcer — runs on every page load
     ══════════════════════════════════════════════ */
  function enforce(){
    var session = getSession();
    var loginPage = window.location.pathname.indexOf('login.html') >= 0;
    var settingsPage = window.location.pathname.indexOf('settings') >= 0;

    // Not logged in → redirect to login
    if(!session && !loginPage){
      window.location.href = _getRootPath() + 'login.html';
      return;
    }
    if(loginPage && session){
      window.location.href = _getRootPath() + 'index.html';
      return;
    }
    if(loginPage) return; // let login page handle itself

    // Settings page — manager/viewer blocked
    if(settingsPage && session.role !== 'admin'){
      window.location.href = _getRootPath() + 'index.html';
      return;
    }

    // Apply UI restrictions
    document.addEventListener('DOMContentLoaded', function(){
      _applyUI(session);
    });
    // Also apply if DOM already ready
    if(document.readyState !== 'loading'){
      _applyUI(session);
    }
  }

  function _applyUI(session){
    var role = session.role;

    /* Update header user display */
    var uname = document.querySelector('.hdr-uname');
    if(uname) uname.textContent = session.name;
    var uav = document.querySelector('.hdr-uav');
    if(uav){ uav.textContent = session.avatar || session.name.slice(0,2).toUpperCase(); }
    var sbUname = document.querySelector('.sb-uname');
    if(sbUname) sbUname.textContent = session.name;
    var sbUrole = document.querySelector('.sb-urole');
    if(sbUrole) sbUrole.textContent = _roleLabel(role) + (session.factory!=='ALL'?' · '+session.factory:'');

    /* Add role badge to header */
    var hdr = document.querySelector('.hdr');
    if(hdr && !document.getElementById('wms-role-badge')){
      var badge = document.createElement('span');
      badge.id = 'wms-role-badge';
      badge.style.cssText = 'font-size:10px;font-weight:700;padding:3px 9px;border-radius:99px;margin-right:4px;';
      badge.style.background = role==='admin'?'rgba(62,207,142,.15)':role==='manager'?'rgba(251,191,36,.15)':'rgba(96,165,250,.15)';
      badge.style.color = role==='admin'?'#3ecf8e':role==='manager'?'#fbbf24':'#60a5fa';
      badge.textContent = _roleLabel(role).toUpperCase();
      // Insert before user div
      var hdrUser = document.querySelector('.hdr-user');
      if(hdrUser) hdr.insertBefore(badge, hdrUser);
    }

    /* Viewer & Manager: hide delete buttons */
    if(role !== 'admin'){
      var style = document.createElement('style');
      style.id = 'rbac-style';
      style.textContent = role === 'viewer'
        ? '.abtn.a-d,.abtn.a-e,.btn.btn-p,.btn-p,.a-add,.badd{display:none!important}'
        : '.abtn.a-d,.a-d{display:none!important}'; // manager: hide delete only
      document.head.appendChild(style);
    }

    /* Settings link — hide for non-admin */
    if(role !== 'admin'){
      document.querySelectorAll('a[href*="settings"]').forEach(function(a){
        a.style.display = 'none';
      });
    }

    /* Factory filter — auto-apply for manager */
    if(session.factory !== 'ALL'){
      _autoFilterFactory(session.factory);
    }

    /* Logout button */
    _injectLogoutBtn();
  }

  function _autoFilterFactory(factory){
    // Wait for page to init, then apply factory filter
    setTimeout(function(){
      var factorySelects = ['fFty','ffac','fFac','fFactory'];
      factorySelects.forEach(function(id){
        var el = document.getElementById(id);
        if(el){
          el.value = factory;
          el.dispatchEvent(new Event('change'));
          el.disabled = true; // manager can't change factory filter
          el.title = 'আপনার factory: ' + factory;
        }
      });
    }, 500);
  }

  function _injectLogoutBtn(){
    if(document.getElementById('wms-logout-btn')) return;
    var hdrUser = document.querySelector('.hdr-user');
    if(!hdrUser) return;
    hdrUser.style.cursor = 'pointer';
    hdrUser.title = 'Click to logout';
    hdrUser.onclick = function(){
      if(confirm('Logout করবেন?')){
        WmsAuth.logout();
      }
    };
  }

  function _roleLabel(role){
    return role==='admin'?'Admin':role==='manager'?'Manager':'Viewer';
  }

  /* ── Run enforcement ── */
  enforce();

  /* ── Init default users if none ── */
  if(!localStorage.getItem('wms_users')){
    saveUsers(DEFAULT_USERS);
  }

})();
