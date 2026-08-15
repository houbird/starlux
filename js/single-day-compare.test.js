/**
 * Tests for Single Day Multi-Destination Comparison Feature
 */
import { SingleDayCompareRenderer } from './modules/single-day-compare-renderer.js';
import { DateUtils } from './modules/date-utils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Mock DOM elements
class MockElement {
  constructor(id, tagName = 'DIV') {
    this.id = id;
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.classList = {
      _set: new Set(),
      add: (...classes) => classes.forEach(c => this.classList._set.add(c)),
      remove: (...classes) => classes.forEach(c => this.classList._set.delete(c)),
      contains: (c) => this.classList._set.has(c)
    };
    this.innerHTML = '';
    this.value = '';
    this.listeners = {};
  }

  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  appendChild(child) {
    if (this.children.includes(child)) {
      this.children.splice(this.children.indexOf(child), 1);
    }
    child.parent = this;
    this.children.push(child);
  }
  querySelector(sel) {
    if (sel.startsWith('.')) {
      const cls = sel.substring(1);
      return this.findChild(c => c.classList.contains(cls));
    }
    return null;
  }
  querySelectorAll(sel) {
    return [];
  }
  findChild(fn) {
    for (const c of this.children) {
      if (fn(c)) return c;
      if (c.children) {
        const found = c.findChild(fn);
        if (found) return found;
      }
    }
    return null;
  }
  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }
  remove() {
    if (this.parent) {
      this.parent.children = this.parent.children.filter(c => c !== this);
    }
  }
}

function runTests() {
  console.log('=== Running Single Day Compare Unit Tests ===');

  const elementsMap = {};
  const mockDomElements = {
    get: (id) => {
      if (!elementsMap[id]) {
        elementsMap[id] = new MockElement(id);
      }
      return elementsMap[id];
    }
  };

  function findById(root, id) {
    if (root.id === id) return root;
    for (const child of root.children || []) {
      const found = findById(child, id);
      if (found) return found;
    }
    return null;
  }

  globalThis.document = {
    createElement: (tag) => new MockElement('', tag),
    getElementById: (id) => {
      if (elementsMap[id]) return elementsMap[id];
      for (const rootId in elementsMap) {
        const found = findById(elementsMap[rootId], id);
        if (found) return found;
      }
      return null;
    }
  };

  // Test 1: SingleDayCompareRenderer instantiation & initial list render
  const renderer = new SingleDayCompareRenderer(mockDomElements);
  assert(renderer !== null, 'Renderer should be instantiated');

  const destinations = [
    { code: 'NRT', name: 'Narita', location: 'Tokyo, Japan', country: 'Japan' },
    { code: 'KIX', name: 'Kansai', location: 'Osaka, Japan', country: 'Japan' }
  ];

  renderer.renderInitialList('TPE', destinations, '2024-10-10');

  const containerList = mockDomElements.get('containerCompareList');
  assert(containerList.children.length === 2, 'Initial list should render 2 destination cards');
  console.log('✓ Initial list render test PASSED');

  // Test 2: Update item result with price
  const sampleApiData = {
    data: {
      calendars: [
        {
          departureDate: '2024-10-10',
          price: { amount: 12500, currencyCode: 'TWD' },
          status: 'available'
        }
      ]
    }
  };

  renderer.updateItemResult('NRT', sampleApiData, 'JX800');
  const nrtItemInfo = renderer.itemsData.get('NRT');
  assert(nrtItemInfo.price === 12500, 'Price for NRT should be 12500');
  assert(nrtItemInfo.status === 'success', 'Status for NRT should be success');
  console.log('✓ Update item result test PASSED');

  // Test 3: Re-evaluate lowest price
  renderer.updateItemResult('KIX', {
    data: {
      calendars: [
        {
          departureDate: '2024-10-10',
          price: { amount: 11000, currencyCode: 'TWD' },
          status: 'available'
        }
      ]
    }
  });

  const kixInfo = renderer.itemsData.get('KIX');
  assert(kixInfo.price === 11000, 'Price for KIX should be 11000');
  console.log('✓ Lowest price evaluation test PASSED');

  // Test 4: Sort list
  renderer.sortList('price-asc');
  assert(containerList.children[0].id === 'compare-item-KIX', 'First sorted item should be KIX (cheapest 11000)');
  assert(containerList.children[1].id === 'compare-item-NRT', 'Second sorted item should be NRT (12500)');
  console.log('✓ Price ascending sort test PASSED');

  renderer.sortList('price-desc');
  assert(containerList.children[0].id === 'compare-item-NRT', 'First sorted item should be NRT (most expensive 12500)');
  assert(containerList.children[1].id === 'compare-item-KIX', 'Second sorted item should be KIX (11000)');
  console.log('✓ Price descending sort test PASSED');

  // Test 5: Handle CORS error result
  renderer.updateItemResult('NRT', { error: 'CORS_ERROR' });
  const nrtCorsInfo = renderer.itemsData.get('NRT');
  assert(nrtCorsInfo.status === 'error', 'Status for NRT should be error after CORS error');
  const nrtRow = document.getElementById('compare-item-NRT');
  assert(nrtRow.innerHTML.includes('CORS Required'), 'Row HTML should contain CORS Required button');
  assert(nrtRow.innerHTML.includes('btn-cors-trigger'), 'Row HTML should have btn-cors-trigger class');
  console.log('✓ CORS error rendering test PASSED');

  // Test 6: Handle generic error result
  renderer.updateItemResult('KIX', { error: 'Network timeout' });
  const kixErrorInfo = renderer.itemsData.get('KIX');
  assert(kixErrorInfo.status === 'error', 'Status for KIX should be error');
  const kixRow = document.getElementById('compare-item-KIX');
  assert(kixRow.innerHTML.includes('Query Failed'), 'Row HTML should contain Query Failed for generic errors');
  console.log('✓ Generic error rendering test PASSED');

  // Test 7: DateUtils.addDays
  const addedDays1 = DateUtils.addDays('2024-10-10', 5);
  assert(addedDays1 === '2024-10-15', `Expected 2024-10-15, got ${addedDays1}`);

  const monthRollover = DateUtils.addDays('2024-10-28', 5);
  assert(monthRollover === '2024-11-02', `Expected 2024-11-02, got ${monthRollover}`);

  const yearRollover = DateUtils.addDays('2024-12-30', 5);
  assert(yearRollover === '2025-01-04', `Expected 2025-01-04, got ${yearRollover}`);
  console.log('✓ DateUtils.addDays tests PASSED');

  // Test 8: DateUtils.getReturnDateOptions
  const returnOptions = DateUtils.getReturnDateOptions('2024-10-10', 30);
  assert(returnOptions.length === 30, 'Should generate 30 options');
  assert(returnOptions[0].days === 1, 'First option should be 1 day');
  assert(returnOptions[0].isoDate === '2024-10-11', 'First option isoDate should be 2024-10-11');
  assert(returnOptions[0].displayText === '2024/10/11 (1 day)', `Expected '2024/10/11 (1 day)', got '${returnOptions[0].displayText}'`);
  assert(returnOptions[4].days === 5, 'Fifth option should be 5 days');
  assert(returnOptions[4].displayText === '2024/10/15 (5 days)', `Expected '2024/10/15 (5 days)', got '${returnOptions[4].displayText}'`);
  assert(returnOptions[29].days === 30, 'Thirtieth option should be 30 days');
  assert(returnOptions[29].displayText === '2024/11/09 (30 days)', `Expected '2024/11/09 (30 days)', got '${returnOptions[29].displayText}'`);
  console.log('✓ DateUtils.getReturnDateOptions tests PASSED');

  // Test 9: SingleDayCompareRenderer with custom return date
  const customReturnRenderer = new SingleDayCompareRenderer(mockDomElements);
  customReturnRenderer.renderInitialList('TPE', [{ code: 'FUK', name: 'Fukuoka', country: 'Japan' }], '2024-10-10', '2024-10-17');
  const fukInfo = customReturnRenderer.itemsData.get('FUK');
  assert(fukInfo.returnDateStr === '2024-10-17', 'Should store custom returnDateStr');

  customReturnRenderer.updateItemResult('FUK', {
    data: {
      calendars: [
        {
          departureDate: '2024-10-10',
          price: { amount: 9800, currencyCode: 'TWD' },
          status: 'available'
        }
      ]
    }
  });

  const fukRow = document.getElementById('compare-item-FUK');
  assert(fukRow.innerHTML.includes('ondCityCode[1].month=10/2024&amp;ondCityCode[1].day=17') || fukRow.innerHTML.includes('ondCityCode[1].month=10/2024&ondCityCode[1].day=17'), 'Booking URL should have return day=17 and month=10/2024');
  console.log('✓ Custom return date rendering and booking link test PASSED');

  console.log('=== All Single Day Compare Tests PASSED ===');
}

runTests();
