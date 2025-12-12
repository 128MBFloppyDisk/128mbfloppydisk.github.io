// DOM Protection Script - Add this to your website
(function() {
  'use strict';
  
  // Store original DOM state
  const domSnapshot = new Map();
  
  // Elements to protect (customize selectors as needed)
  const protectedSelectors = [
    'header',
    'h2',
    'div:not(#splash):not(#splash *)', // Protect all divs except splash and its children
    'footer',
    'p:not(#splash *)' // Protect all p elements except those inside splash
  ];
  
  // Initialize protection
  function initProtection() {
    protectedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el) {
          // Store original HTML and attributes
          domSnapshot.set(el, {
            html: el.outerHTML,
            parent: el.parentNode,
            nextSibling: el.nextSibling
          });
        }
      });
    });
    
    console.log(`DOM Protection initialized for ${domSnapshot.size} elements`);
  }
  
  // Restore deleted or modified elements
  function restoreElement(original, current) {
    const snapshot = domSnapshot.get(original);
    if (!snapshot) return;
    
    // Check if element was deleted
    if (!document.contains(current)) {
      console.warn('Protected element removed - restoring...');
      const temp = document.createElement('div');
      temp.innerHTML = snapshot.html;
      const restored = temp.firstElementChild;
      
      if (snapshot.nextSibling) {
        snapshot.parent.insertBefore(restored, snapshot.nextSibling);
      } else {
        snapshot.parent.appendChild(restored);
      }
      
      // Update reference
      domSnapshot.set(restored, snapshot);
      return restored;
    }
    
    // Check if element was modified
    if (current.outerHTML !== snapshot.html) {
      console.warn('Protected element modified - restoring...');
      const temp = document.createElement('div');
      temp.innerHTML = snapshot.html;
      const restored = temp.firstElementChild;
      
      current.parentNode.replaceChild(restored, current);
      
      // Update reference
      domSnapshot.set(restored, snapshot);
      return restored;
    }
    
    return current;
  }
  
  // Monitor DOM changes
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      // Check all protected elements
      const elementsToCheck = Array.from(domSnapshot.keys());
      elementsToCheck.forEach(el => {
        const current = el;
        const restored = restoreElement(el, current);
        
        // If element was restored, update the map
        if (restored !== el) {
          domSnapshot.delete(el);
        }
      });
    });
  });
  
  // Start observing after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initProtection();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
    });
  } else {
    initProtection();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });
  }
  
  // Periodic check as backup (every 2 seconds)
  setInterval(() => {
    const elementsToCheck = Array.from(domSnapshot.keys());
    elementsToCheck.forEach(el => {
      const restored = restoreElement(el, el);
      if (restored !== el) {
        domSnapshot.delete(el);
      }
    });
  }, 2000);
  
  // Prevent common tampering methods
  const originalRemove = Element.prototype.remove;
  Element.prototype.remove = function() {
    if (domSnapshot.has(this)) {
      console.warn('Attempted to remove protected element - blocked');
      return;
    }
    return originalRemove.call(this);
  };
  
})();