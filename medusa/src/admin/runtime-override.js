/**
 * NUCLEAR RUNTIME OVERRIDE FOR LOCALHOST API CALLS - ENHANCED VERSION
 * Senior DevOps Solution: Comprehensive localhost interception for Medusa v2 Admin
 */

(function() {
  'use strict';
  
  const PRODUCTION_URL = 'https://medusa-backend-production-3655.up.railway.app';
  const LOCALHOST_PATTERNS = [
    /https?:\/\/localhost:9000/g,
    /https?:\/\/localhost/g,
    /http:\/\/127\.0\.0\.1:9000/g,
    /https:\/\/127\.0\.0\.1:9000/g
  ];
  
  console.log('[ADMIN OVERRIDE] 🚀 NUCLEAR localhost interceptor v2.0 initializing...');
  console.log('[ADMIN OVERRIDE] Target URL:', PRODUCTION_URL);
  
  // 1. FETCH API OVERRIDE - Most comprehensive
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    let finalUrl = url;
    let wasRedirected = false;
    
    if (typeof url === 'string') {
      LOCALHOST_PATTERNS.forEach(pattern => {
        if (pattern.test(url)) {
          finalUrl = url.replace(pattern, PRODUCTION_URL);
          wasRedirected = true;
        }
      });
    } else if (url instanceof Request) {
      LOCALHOST_PATTERNS.forEach(pattern => {
        if (pattern.test(url.url)) {
          finalUrl = url.url.replace(pattern, PRODUCTION_URL);
          wasRedirected = true;
        }
      });
    }
    
    if (wasRedirected) {
      console.log('[ADMIN OVERRIDE] ✅ FETCH INTERCEPTED:', url, '->', finalUrl);
      
      // Add CORS headers for cross-origin requests
      const enhancedOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      };
      
      return originalFetch(finalUrl, enhancedOptions);
    }
    return originalFetch(url, options);
  };
  
  // 2. XMLHttpRequest OVERRIDE - Legacy support
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    let finalUrl = url;
    let wasRedirected = false;
    
    if (typeof url === 'string') {
      LOCALHOST_PATTERNS.forEach(pattern => {
        if (pattern.test(url)) {
          finalUrl = url.replace(pattern, PRODUCTION_URL);
          wasRedirected = true;
        }
      });
    }
    
    if (wasRedirected) {
      console.log('[ADMIN OVERRIDE] ✅ XHR INTERCEPTED:', url, '->', finalUrl);
    }
    
    return originalXHROpen.call(this, method, finalUrl, ...args);
  };
  
  // 3. WEBSOCKET OVERRIDE - For real-time features
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    let finalUrl = url;
    let wasRedirected = false;
    
    if (typeof url === 'string') {
      LOCALHOST_PATTERNS.forEach(pattern => {
        if (pattern.test(url)) {
          finalUrl = url.replace(pattern, PRODUCTION_URL).replace(/^https?/, 'wss');
          wasRedirected = true;
        }
      });
    }
    
    if (wasRedirected) {
      console.log('[ADMIN OVERRIDE] ✅ WEBSOCKET INTERCEPTED:', url, '->', finalUrl);
    }
    
    return new originalWebSocket(finalUrl, protocols);
  };
  
  // 4. GLOBAL VARIABLE OVERRIDE - Immediate and delayed
  function overrideGlobals() {
    const globalKeys = [
      '__BACKEND_URL__',
      'MEDUSA_BACKEND_URL', 
      'MEDUSA_ADMIN_BACKEND_URL',
      'BACKEND_URL',
      'API_BASE_URL',
      'BASE_URL'
    ];
    
    globalKeys.forEach(key => {
      if (window[key] && typeof window[key] === 'string' && 
          LOCALHOST_PATTERNS.some(pattern => pattern.test(window[key]))) {
        const oldValue = window[key];
        window[key] = PRODUCTION_URL;
        console.log(`[ADMIN OVERRIDE] ✅ GLOBAL ${key}:`, oldValue, '->', window[key]);
      }
    });
  }
  
  // Override immediately
  overrideGlobals();
  
  // Override after DOM load and periodically
  [100, 500, 1000, 2000].forEach(delay => {
    setTimeout(overrideGlobals, delay);
  });
  
  // 5. MEDUSA-SPECIFIC CONFIGURATION OVERRIDE
  setTimeout(() => {
    // Override Medusa SDK configuration if available
    if (window.medusaClient && window.medusaClient.config) {
      if (window.medusaClient.config.baseUrl && 
          LOCALHOST_PATTERNS.some(pattern => pattern.test(window.medusaClient.config.baseUrl))) {
        const oldUrl = window.medusaClient.config.baseUrl;
        window.medusaClient.config.baseUrl = PRODUCTION_URL;
        console.log('[ADMIN OVERRIDE] ✅ MEDUSA CLIENT CONFIG:', oldUrl, '->', PRODUCTION_URL);
      }
    }
    
    // Override any React Router or SPA base URLs
    if (window.__RUNTIME_CONFIG__) {
      Object.keys(window.__RUNTIME_CONFIG__).forEach(key => {
        if (typeof window.__RUNTIME_CONFIG__[key] === 'string' && 
            LOCALHOST_PATTERNS.some(pattern => pattern.test(window.__RUNTIME_CONFIG__[key]))) {
          const oldValue = window.__RUNTIME_CONFIG__[key];
          window.__RUNTIME_CONFIG__[key] = PRODUCTION_URL;
          console.log(`[ADMIN OVERRIDE] ✅ RUNTIME CONFIG ${key}:`, oldValue, '->', PRODUCTION_URL);
        }
      });
    }
  }, 1500);
  
  // 6. MUTATION OBSERVER - Watch for dynamic content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for any elements with localhost URLs
            const elementsWithUrls = node.querySelectorAll('[href*="localhost"], [src*="localhost"], [action*="localhost"]');
            elementsWithUrls.forEach(elem => {
              ['href', 'src', 'action'].forEach(attr => {
                if (elem.getAttribute(attr) && 
                    LOCALHOST_PATTERNS.some(pattern => pattern.test(elem.getAttribute(attr)))) {
                  const oldValue = elem.getAttribute(attr);
                  const newValue = oldValue.replace(/https?:\/\/localhost:9000/g, PRODUCTION_URL);
                  elem.setAttribute(attr, newValue);
                  console.log(`[ADMIN OVERRIDE] ✅ DOM ${attr.toUpperCase()}:`, oldValue, '->', newValue);
                }
              });
            });
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 7. BEFOREUNLOAD - Final check
  window.addEventListener('beforeunload', () => {
    console.log('[ADMIN OVERRIDE] 🏁 Final localhost override check completed');
  });
  
  console.log('[ADMIN OVERRIDE] 🎯 Nuclear localhost override v2.0 FULLY ACTIVATED');
  console.log('[ADMIN OVERRIDE] 🛡️ All localhost API calls will be redirected to:', PRODUCTION_URL);
})();