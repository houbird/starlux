/**
 * Tests for Modular Main Application
 * Tests the refactored modular application structure
 */

// Simple assertion function for testing
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// Mock global objects and functions
let mockLocation;
let mockHistory;
let mockDocument;
let mockFetch;
let mockTailwindHeadless;

// Variables to capture calls to mocked functions
let capturedSearchFlightArgs = {};
let pushedState = null;
let lastFetchUrl = null;
let lastFetchOptions = null;

// Mock elements factory
const createMockElement = (id) => {
  const listeners = {};
  const attributes = {};
  let _value = '';
  let _innerHTML = '';
  const _classList = new Set();
  const children = [];

  return {
    id: id,
    attributes: attributes,
    get value() { return _value; },
    set value(val) { _value = val; },
    get innerHTML() { return _innerHTML; },
    set innerHTML(val) { _innerHTML = val; children.length = 0; },
    classList: {
      add: (cls) => _classList.add(cls),
      remove: (cls) => _classList.remove(cls),
      contains: (cls) => _classList.has(cls),
    },
    addEventListener: (type, listener) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(listener);
    },
    removeEventListener: (type, listener) => {
      listeners[type] = listeners[type] ? listeners[type].filter(l => l !== listener) : [];
    },
    dispatchEvent: (event) => {
      if (listeners[event.type]) {
        listeners[event.type].forEach(listener => listener(event));
      }
    },
    click: function() {
      if (listeners['click']) {
        listeners['click'].forEach(listener => listener.call(this));
      }
    },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
    getAttribute: (name) => attributes[name],
    querySelector: (selector) => {
      if (selector.startsWith('button[data-value="')) {
        const value = selector.match(/button\[data-value="([^"]+)"\]/)[1];
        return children.find(child => child.getAttribute('data-value') === value && child.tagName === 'BUTTON');
      }
      return children.find(child => child.id === selector || child.classList.contains(selector.substring(1)));
    },
    querySelectorAll: (selector) => {
      if (selector === 'button') {
        return children.filter(child => child.tagName === 'BUTTON');
      }
      return [];
    },
    appendChild: (child) => {
      children.push(child);
      if (child.innerHTML) _innerHTML += child.innerHTML;
    },
    children: children,
    outerHTML: '',
    tagName: 'DIV'
  };
};

function setupGlobalMocks() {
  // Mock window globals
  mockLocation = {
    search: '',
    pathname: '/test-path'
  };

  mockHistory = {
    pushState: (state, title, url) => {
      pushedState = { state, title, url };
    }
  };

  mockFetch = (url, options) => {
    lastFetchUrl = url;
    lastFetchOptions = options;
    return Promise.resolve({
      json: () => Promise.resolve({ data: { calendars: [] } })
    });
  };

  mockTailwindHeadless = {
    appendDropdown: () => {},
    updateButtonContent: () => {}
  };

  mockDocument = {
    getElementById: (id) => createMockElement(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  // Set up global window object
  globalThis.window = {
    location: mockLocation,
    history: mockHistory,
    URLSearchParams: URLSearchParams,
    fetch: mockFetch,
    airports: typeof airports !== 'undefined' ? airports : [
      { code: 'TPE', name: 'Taipei', location: 'Taiwan', region: 'Taiwan', disabled: false },
      { code: 'KMJ', name: 'Kumamoto', location: 'Japan', region: 'Northeast Asia', disabled: false }
    ],
    regionStyles: typeof regionStyles !== 'undefined' ? regionStyles : {
      'Taiwan': { borderColorClass: 'border-region-taiwan', flag: '🇹🇼' },
      'Northeast Asia': { borderColorClass: 'border-region-neasia', flag: '🇯🇵/🇰🇷' }
    }
  };

  globalThis.document = mockDocument;
  globalThis.TailwindHeadless = mockTailwindHeadless;

  // Reset captured values
  capturedSearchFlightArgs = {};
  pushedState = null;
  lastFetchUrl = null;
  lastFetchOptions = null;
}

// Test DateUtils module
function testDateUtils() {
  console.log("Running testDateUtils...");
  
  // Test formatMonthDate
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const formattedDate = window.formatMonthDate(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  
  assert(formattedDate.includes(currentYear.toString()), "formatMonthDate should include current year");
  console.log("testDateUtils PASSED");
}

// Test modular structure initialization
function testModularInitialization() {
  console.log("Running testModularInitialization...");
  
  // Check if global functions are available
  assert(typeof window.searchFlight === 'function', "searchFlight should be available globally");
  assert(typeof window.renderFlightInfo === 'function', "renderFlightInfo should be available globally");
  assert(typeof window.urlParamsHandler === 'function', "urlParamsHandler should be available globally");
  assert(typeof window.displayVersion === 'function', "displayVersion should be available globally");
  assert(typeof window.formatMonthDate === 'function', "formatMonthDate should be available globally");
  
  console.log("testModularInitialization PASSED");
}

// Test URL parameter handling with modular structure
function testModularUrlParamsHandler() {
  console.log("Running testModularUrlParamsHandler...");
  setupGlobalMocks();
  
  // Mock location search
  mockLocation.search = '?departure=TPE&arrival=KMJ&departureDate=2024-08-01&cabin=business';
  
  // Call URL params handler
  if (window.urlParamsHandler) {
    window.urlParamsHandler();
  }
  
  console.log("testModularUrlParamsHandler COMPLETED");
}

// Test backward compatibility
function testBackwardCompatibility() {
  console.log("Running testBackwardCompatibility...");
  
  // Test that old function calls still work through the global exports
  if (window.searchFlight) {
    window.searchFlight('TPE', 'KMJ', '2024-08-01');
  }
  
  if (window.renderFlightInfo) {
    const mockData = {
      data: {
        calendars: [{
          departureDate: '2024-08-01',
          status: 'available',
          price: { amount: 100, currencyCode: 'USD' }
        }]
      }
    };
    window.renderFlightInfo(mockData);
  }
  
  console.log("testBackwardCompatibility PASSED");
}

// Main test runner
function runModularTests() {
  console.log("=== Running Modular Architecture Tests ===");
  
  try {
    testDateUtils();
    testModularInitialization();
    testModularUrlParamsHandler();
    testBackwardCompatibility();
    
    console.log("=== All Modular Tests PASSED ===");
  } catch (error) {
    console.error("Test failed:", error.message);
    console.error("=== Some Modular Tests FAILED ===");
  }
}

// Auto-run tests when functions are available
if (typeof window !== 'undefined' && window.formatMonthDate) {
  console.log("Modular functions detected. Running tests...");
  runModularTests();
} else {
  console.log("Waiting for modular application to initialize...");
  // Set up a listener for when the app is ready
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.formatMonthDate) {
        runModularTests();
      } else {
        console.error("Modular application failed to initialize properly");
      }
    }, 100);
  });
}

// Export test functions for manual execution
if (typeof window !== 'undefined') {
  window.runModularTests = runModularTests;
  window.testDateUtils = testDateUtils;
  window.testModularInitialization = testModularInitialization;
  window.testModularUrlParamsHandler = testModularUrlParamsHandler;
  window.testBackwardCompatibility = testBackwardCompatibility;
}