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
let mockContainerClass;
let mockContainerBankDiscount;
let mockSelectAirportFrom;
let mockSelectAirportTo;
let mockInputMonth;
let mockSpanMonth;
let mockContainerMonthPrice;
let mockContainerResult;
let mockLoaderContainer;
let mockModalCORS;

// Variables to capture calls to mocked functions
let capturedSearchFlightArgs = {};
let pushedState = null;
let lastFetchUrl = null;
let lastFetchOptions = null;
let lastSetAttributeBankDiscount = null;

// Mock elements
const createMockElement = (id) => {
  const listeners = {};
  const attributes = {};
  let _value = '';
  let _innerHTML = '';
  const _classList = new Set();
  const children = [];

  return {
    id: id,
    attributes: attributes, // Store attributes like 'data-value'
    get value() { return _value; },
    set value(val) { _value = val; },
    get innerHTML() { return _innerHTML; },
    set innerHTML(val) { _innerHTML = val; children.length = 0; }, // Clear children if innerHTML is set directly
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
      // Simplified removal
      listeners[type] = listeners[type] ? listeners[type].filter(l => l !== listener) : [];
    },
    dispatchEvent: (event) => {
      if (listeners[event.type]) {
        listeners[event.type].forEach(listener => listener(event));
      }
    },
    click: function() { // Make sure click is a function
        if (listeners['click']) {
            listeners['click'].forEach(listener => listener.call(this)); // Call with this context
        }
    },
    setAttribute: (name, value) => {
      attributes[name] = value;
      if (id === 'containerBankDiscount' && name === 'data-selected-value') {
        lastSetAttributeBankDiscount = value;
      }
    },
    getAttribute: (name) => attributes[name],
    querySelector: (selector) => {
        // Simplified: assumes selector is a data-value attribute for these tests
        if (selector.startsWith('button[data-value="')) {
            const value = selector.match(/button\[data-value="([^"]+)"\]/)[1];
            return children.find(child => child.getAttribute('data-value') === value && child.tagName === 'BUTTON');
        }
        return children.find(child => child.id === selector || child.classList.contains(selector.substring(1)));
    },
    querySelectorAll: (selector) => {
        // Simplified: assumes selector is 'button' for these tests
        if (selector === 'button') {
            return children.filter(child => child.tagName === 'BUTTON');
        }
        return [];
    },
    appendChild: (child) => {
      children.push(child);
      // Naive innerHTML update for testing link generation
      if (child.innerHTML) _innerHTML += child.innerHTML;
    },
    // Mock specific properties if needed
    children: children, // So we can inspect appended children
    appendChild: function(child) {
        this.children.push(child);
        // A very basic way to update innerHTML for testing purposes
        // This does not correctly serialize, but helps capture what's added
        this.innerHTML += child.outerHTML || child.innerHTML || '';
    },
    // Add outerHTML for better simulation if needed for appendChild
    outerHTML: '',
    tagName: 'DIV' // Default tag name
  };
};

function setupGlobalMocks() {
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
      json: () => Promise.resolve({ data: { calendars: [] } }) // Default mock response
    });
  };

  mockTailwindHeadless = {
    appendDropdown: () => {} // No-op for now
  };
  
  mockDocument = {
    getElementById: (id) => {
      switch (id) {
        case 'inputMonth': return mockInputMonth;
        case 'selectAirportFrom': return mockSelectAirportFrom;
        case 'selectAirportTo': return mockSelectAirportTo;
        case 'spanMonth': return mockSpanMonth;
        case 'containerResult': return mockContainerResult;
        case 'containerMonthPrice': return mockContainerMonthPrice;
        case 'containerStatistics': return {}; // Mock as needed
        case 'loaderContainer': return mockLoaderContainer;
        case 'containerClass': return mockContainerClass;
        case 'containerBankDiscount': return mockContainerBankDiscount;
        case 'modalCORS': return mockModalCORS;
        default: return createMockElement(id); // Fallback to generic mock element
      }
    },
    // Add querySelector for general cases if main.js uses it on document directly
    querySelector: (selector) => {
        // This is a very basic mock, extend if document.querySelector is used more broadly
        return null;
    },
    querySelectorAll: (selector) => {
        return [];
    }
  };

  globalThis.window = { // Use globalThis for broader compatibility (node vs browser)
    location: mockLocation,
    history: mockHistory,
    URLSearchParams: URLSearchParams, // Use actual URLSearchParams
    fetch: mockFetch,
    // Assuming airports.js is loaded and provides 'airports' global
    airports: typeof airports !== 'undefined' ? airports : [{ code: 'TPE', name: 'Taipei', location: 'Taiwan', region: 'Asia', disabled: false }], 
  };
  globalThis.document = mockDocument;
  globalThis.TailwindHeadless = mockTailwindHeadless;

  // Mock elements that are accessed directly by ID
  mockInputMonth = createMockElement('inputMonth');
  mockInputMonth.value = '2024-01'; // Default value

  mockSelectAirportFrom = createMockElement('selectAirportFrom');
  mockSelectAirportFrom.setAttribute('data-selected-value', 'TPE');

  mockSelectAirportTo = createMockElement('selectAirportTo');
  mockSelectAirportTo.setAttribute('data-selected-value', 'KMJ');
  
  mockSpanMonth = createMockElement('spanMonth');
  mockContainerResult = createMockElement('containerResult');
  mockContainerMonthPrice = createMockElement('containerMonthPrice');
  mockLoaderContainer = createMockElement('loaderContainer');
  mockModalCORS = createMockElement('modalCORS');
  
  mockContainerClass = createMockElement('containerClass');
  mockContainerClass.setAttribute('data-selected-value', 'Y'); // Default cabin class
  
  mockContainerBankDiscount = createMockElement('containerBankDiscount');
  mockContainerBankDiscount.setAttribute('data-selected-value', ''); // Default no discount

  // Setup buttons for containerBankDiscount
  const btnNoDiscount = createMockElement('btnNoDiscount');
  btnNoDiscount.setAttribute('data-value', '');
  btnNoDiscount.tagName = 'BUTTON';
  const btnBankA = createMockElement('btnBankA');
  btnBankA.setAttribute('data-value', 'BANKA');
  btnBankA.tagName = 'BUTTON';
  const btnBankB = createMockElement('btnBankB');
  btnBankB.setAttribute('data-value', 'BANKB');
  btnBankB.tagName = 'BUTTON';
  
  mockContainerBankDiscount.children.push(btnNoDiscount, btnBankA, btnBankB);
  
  // Mock for searchFlight, assuming it's global after main.js loads
  globalThis.searchFlight = (departure, arrival, departureDate) => {
    capturedSearchFlightArgs = {
      departure,
      arrival,
      departureDate,
      // The actual searchFlight takes corporateCode from the DOM
      corporateCode: mockContainerBankDiscount.getAttribute('data-selected-value')
    };
  };

  // Mock for renderFlightInfo, assuming it's global
  // We'll call it directly with test data
  globalThis.renderFlightInfo = typeof renderFlightInfo !== 'undefined' ? renderFlightInfo : () => {};


  // Reset captured values
  capturedSearchFlightArgs = {};
  pushedState = null;
  lastFetchUrl = null;
  lastFetchOptions = null;
  lastSetAttributeBankDiscount = null;
}

console.log("Mocking infrastructure setup.");

// --- Test Suite for renderFlightInfo ---
function testRenderFlightInfoDateCalculations() {
  console.log("Running testRenderFlightInfoDateCalculations...");
  setupGlobalMocks();

  // Ensure renderFlightInfo is available (it should be if main.js is loaded)
  if (typeof renderFlightInfo !== 'function') {
    console.error("renderFlightInfo is not defined. Make sure main.js is loaded before tests.");
    return;
  }
  if (typeof airports === 'undefined') globalThis.airports = [{code: 'TPE', name: 'Taipei Taoyuan', location: 'Taoyuan', region: 'Taiwan', disabled: false}];


  mockSelectAirportFrom.setAttribute('data-selected-value', 'TPE');
  mockSelectAirportTo.setAttribute('data-selected-value', 'LAX');

  // Test 1: Cross-month
  let testData1 = {
    data: {
      calendars: [
        { departureDate: '2024-01-28', status: 'available', price: { amount: 100, currencyCode: 'USD' } }
      ]
    }
  };
  mockContainerMonthPrice.innerHTML = ''; // Clear before render
  mockContainerMonthPrice.children.length = 0;
  renderFlightInfo(testData1);
  let link1 = mockContainerMonthPrice.innerHTML;
  assert(link1.includes('ondCityCode[1].month=02/2024&ondCityCode[1].day=02'), "Test 1 Failed: Jan 28 -> Feb 02. Link: " + link1);
  console.log("Test 1 (Jan 28 -> Feb 02) Passed.");

  // Test 2: Cross-year
  let testData2 = {
    data: {
      calendars: [
        { departureDate: '2023-12-30', status: 'available', price: { amount: 200, currencyCode: 'USD' } }
      ]
    }
  };
  mockContainerMonthPrice.innerHTML = ''; // Clear before render
  mockContainerMonthPrice.children.length = 0;
  renderFlightInfo(testData2);
  let link2 = mockContainerMonthPrice.innerHTML;
  assert(link2.includes('ondCityCode[1].month=01/2024&ondCityCode[1].day=04'), "Test 2 Failed: Dec 30 -> Jan 04. Link: " + link2);
  console.log("Test 2 (Dec 30 -> Jan 04) Passed.");

  console.log("testRenderFlightInfoDateCalculations COMPLETED.");
}


// --- Test Suite for urlParamsHandler ---
function testUrlParamsHandlerDiscountLogic() {
  console.log("Running testUrlParamsHandlerDiscountLogic...");

  if (typeof urlParamsHandler !== 'function') {
    console.error("urlParamsHandler is not defined. Make sure main.js is loaded before tests.");
    return;
  }
   if (typeof airports === 'undefined') globalThis.airports = [{code: 'TPE', name: 'Taipei Taoyuan', location: 'Taoyuan', region: 'Taiwan', disabled: false}];


  // Test 1: bankDiscount only
  setupGlobalMocks();
  mockLocation.search = '?departure=TPE&arrival=LAX&departureDate=2024-08-01&bankDiscount=BANKA';
  urlParamsHandler();
  assert(capturedSearchFlightArgs.corporateCode === 'BANKA', "Test 1 Failed: bankDiscount only. Actual: " + capturedSearchFlightArgs.corporateCode);
  assert(mockContainerBankDiscount.getAttribute('data-selected-value') === 'BANKA', "Test 1 Failed: Button for BANKA not clicked");
  console.log("Test 1 (bankDiscount only) Passed.");

  // Test 2: corporateCode only
  setupGlobalMocks();
  mockLocation.search = '?departure=TPE&arrival=LAX&departureDate=2024-08-01&corporateCode=BANKB';
  urlParamsHandler();
  assert(capturedSearchFlightArgs.corporateCode === 'BANKB', "Test 2 Failed: corporateCode only. Actual: " + capturedSearchFlightArgs.corporateCode);
  assert(mockContainerBankDiscount.getAttribute('data-selected-value') === 'BANKB', "Test 2 Failed: Button for BANKB not clicked");
  console.log("Test 2 (corporateCode only) Passed.");

  // Test 3: Both bankDiscount and corporateCode (bankDiscount should have priority)
  setupGlobalMocks();
  mockLocation.search = '?departure=TPE&arrival=LAX&departureDate=2024-08-01&bankDiscount=BANKA&corporateCode=BANKB';
  urlParamsHandler();
  assert(capturedSearchFlightArgs.corporateCode === 'BANKA', "Test 3 Failed: Both params, bankDiscount priority. Actual: " + capturedSearchFlightArgs.corporateCode);
  assert(mockContainerBankDiscount.getAttribute('data-selected-value') === 'BANKA', "Test 3 Failed: Button for BANKA not clicked (priority test)");
  console.log("Test 3 (Both, bankDiscount priority) Passed.");

  // Test 4: Neither bankDiscount nor corporateCode
  setupGlobalMocks();
  mockContainerBankDiscount.setAttribute('data-selected-value', ''); // Ensure it's initially empty
  mockLocation.search = '?departure=TPE&arrival=LAX&departureDate=2024-08-01';
  urlParamsHandler();
  // If no code, the button for "" value should be "clicked" (remain as is if default)
  // or the searchFlight should be called with an empty string or null.
  // The current mock for searchFlight gets corporateCode from the DOM element,
  // so we check if the element's data-selected-value is still the default (empty).
  assert(capturedSearchFlightArgs.corporateCode === '', "Test 4 Failed: Neither param. Expected empty. Actual: " + capturedSearchFlightArgs.corporateCode);
  assert(mockContainerBankDiscount.getAttribute('data-selected-value') === '', "Test 4 Failed: Button for '' not active or changed. Actual: " + mockContainerBankDiscount.getAttribute('data-selected-value'));
  console.log("Test 4 (Neither param) Passed.");

  console.log("testUrlParamsHandlerDiscountLogic COMPLETED.");
}

// Run tests (assuming this file is loaded in an environment where main.js is also loaded)
// In a real test runner, these would be auto-discovered and run.
// For now, explicitly call them.
// Need to ensure main.js functions (renderFlightInfo, urlParamsHandler) are in global scope.

// A delay to simulate main.js loading or a manual trigger might be needed
// if this script runs before main.js populates globals.
// For this tool, we assume main.js is pre-loaded.

// Check if the functions are available before running tests
if (typeof renderFlightInfo === 'function' && typeof urlParamsHandler === 'function' && typeof airports !== 'undefined') {
  console.log("renderFlightInfo and urlParamsHandler are defined. Running tests...");
  testRenderFlightInfoDateCalculations();
  testUrlParamsHandlerDiscountLogic();
  console.log("All tests executed.");
} else {
  console.error("Main functions (renderFlightInfo, urlParamsHandler) or 'airports' data not found in global scope. Tests will not run. Ensure js/main.js and js/settings.js (for airports) are loaded before this test script.");
}

// To make this testable standalone (e.g. with Node.js and JSDOM for DOM features):
// 1. js/main.js would need to export its functions.
// 2. Or, load main.js content and eval it (less ideal).
// 3. JSDOM would be needed to provide `document`, `window`, etc.
// For now, this file assumes it's run in an environment where main.js has already executed.

/*
Example of how you might load main.js in a Node.js + JSDOM setup (conceptual):

if (typeof window === 'undefined') { // Check if not in browser-like env
    const fs = require('fs');
    const { JSDOM } = require('jsdom');
    const mainScript = fs.readFileSync('./js/main.js', 'utf8');
    const settingsScript = fs.readFileSync('./js/settings.js', 'utf8'); // for 'airports'

    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
        runScripts: "dangerously", // Allows script execution
        url: "http://localhost"
    });
    global.window = dom.window;
    global.document = dom.window.document;
    global.URLSearchParams = dom.window.URLSearchParams;
    global.fetch = mockFetch; // Use our mock fetch
    global.TailwindHeadless = { appendDropdown: () => {} };


    // Execute settings.js first to define airports
    dom.window.eval(settingsScript);
    // Then execute main.js
    dom.window.eval(mainScript);

    // Now renderFlightInfo and urlParamsHandler should be on dom.window
    // And can be aliased to global for the tests if needed
    global.renderFlightInfo = dom.window.renderFlightInfo;
    global.urlParamsHandler = dom.window.urlParamsHandler;
    global.airports = dom.window.airports; // Make airports global for tests
    // ... other globals from main.js if any
}
*/

// End of js/main.test.js
