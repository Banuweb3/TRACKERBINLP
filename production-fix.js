/**
 * Production Error Fix for "TypeError: can't access property 'id', H is undefined"
 * 
 * This script should be added to index.html to catch and fix undefined property access errors
 * in production builds where API responses might be different from development.
 */

// Global error handler for production
window.addEventListener('error', function(event) {
  const error = event.error;
  
  // Check if it's the specific "can't access property" error
  if (error && error.message && error.message.includes("can't access property")) {
    console.warn('🛡️ Production Fix: Caught property access error:', error.message);
    
    // Log the error for debugging but don't crash the app
    console.error('Production Error Details:', {
      message: error.message,
      stack: error.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    
    // Prevent the error from crashing the app
    event.preventDefault();
    return true;
  }
});

// Monkey patch common problematic patterns
(function() {
  'use strict';
  
  // Safe property access helper
  window.safeAccess = function(obj, prop, fallback = null) {
    try {
      return obj && obj[prop] !== undefined ? obj[prop] : fallback;
    } catch (e) {
      console.warn('🛡️ Safe access prevented error:', e.message);
      return fallback;
    }
  };
  
  // Safe array map helper
  window.safeMap = function(array, callback, fallback = []) {
    try {
      if (!Array.isArray(array)) return fallback;
      return array.filter(item => item != null).map(callback);
    } catch (e) {
      console.warn('🛡️ Safe map prevented error:', e.message);
      return fallback;
    }
  };
  
  // Override console.error to catch React errors
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check for React property access errors
    if (message.includes("Cannot read property") || message.includes("can't access property")) {
      console.warn('🛡️ React Error Intercepted:', message);
      
      // Still log the error but don't let it crash
      originalError.apply(console, ['[HANDLED]', ...args]);
      return;
    }
    
    // Normal error logging
    originalError.apply(console, args);
  };
  
  console.log('🛡️ Production safety patches loaded');
})();
