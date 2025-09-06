/**
 * NUCLEAR RUNTIME OVERRIDE FOR LOCALHOST API CALLS
 * This script intercepts all localhost API calls and redirects them to production
 */

(function() {
  'use strict';
  
  const PRODUCTION_URL = 'https://medusa-production-e02c.up.railway.app';
  
  console.log('[ADMIN OVERRIDE] Initializing localhost API call interceptor');
  
  // Override fetch API
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes('localhost:9000')) {
      const newUrl = url.replace(/https?:\/\/localhost:9000/g, PRODUCTION_URL);
      console.log('[ADMIN OVERRIDE] Redirected:', url, '->', newUrl);
      return originalFetch(newUrl, options);
    }
    return originalFetch(url, options);
  };
  
  // Override XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    if (typeof url === 'string' && url.includes('localhost:9000')) {
      const newUrl = url.replace(/https?:\/\/localhost:9000/g, PRODUCTION_URL);
      console.log('[ADMIN OVERRIDE] XHR Redirected:', url, '->', newUrl);
      return originalXHROpen.call(this, method, newUrl, ...args);
    }
    return originalXHROpen.call(this, method, url, ...args);
  };
  
  // Override any global medusa backend URL constants
  setTimeout(() => {
    if (window.__BACKEND_URL__ && window.__BACKEND_URL__.includes('localhost')) {
      console.log('[ADMIN OVERRIDE] Overriding global __BACKEND_URL__:', window.__BACKEND_URL__, '->', PRODUCTION_URL);
      window.__BACKEND_URL__ = PRODUCTION_URL;
    }
    
    if (window.MEDUSA_BACKEND_URL && window.MEDUSA_BACKEND_URL.includes('localhost')) {
      console.log('[ADMIN OVERRIDE] Overriding global MEDUSA_BACKEND_URL__:', window.MEDUSA_BACKEND_URL, '->', PRODUCTION_URL);
      window.MEDUSA_BACKEND_URL = PRODUCTION_URL;
    }
  }, 100);
  
  console.log('[ADMIN OVERRIDE] Runtime override initialized successfully');
})();