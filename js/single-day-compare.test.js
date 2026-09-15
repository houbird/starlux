/**
 * Tests for Single Day Multi-Destination Comparison Feature
 */
import { SingleDayCompareRenderer } from './modules/single-day-compare-renderer.js';
import { DateUtils } from './modules/date-utils.js';
import { FlightSearch } from './modules/flight-search.js';

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
    this._innerHTML = '';
    this.value = '';
    this.listeners = {};
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
    }
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

async function runTests() {
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

  // Test 10: Dynamic sorting as search results arrive progressively
  const multiDestRenderer = new SingleDayCompareRenderer(mockDomElements);
  const multiDestList = [
    { code: 'CTS', name: 'Chitose', country: 'Japan' },
    { code: 'FUK', name: 'Fukuoka', country: 'Japan' },
    { code: 'HKD', name: 'Hakodate', country: 'Japan' },
    { code: 'NRT', name: 'Narita', country: 'Japan' },
    { code: 'SHI', name: 'Shimojishima', country: 'Japan' }
  ];
  multiDestRenderer.renderInitialList('TPE', multiDestList, '2026-10-11');
  const multiContainer = mockDomElements.get('containerCompareList');

  // Initially all 5 are loading and sorted by airport code A-Z
  assert(multiContainer.children[0].id === 'compare-item-CTS', 'Initial 1st: CTS');
  assert(multiContainer.children[4].id === 'compare-item-SHI', 'Initial 5th: SHI');

  // CTS resolves first with $11,030
  multiDestRenderer.updateItemResult('CTS', {
    data: { calendars: [{ departureDate: '2026-10-11', price: { amount: 11030, currencyCode: 'TWD' }, status: 'available' }] }
  });
  // CTS has price so it moves to top; remaining 4 still loading
  assert(multiContainer.children[0].id === 'compare-item-CTS', 'CTS with price should be at top');

  // HKD resolves as unavailable
  multiDestRenderer.updateItemResult('HKD', {
    data: { calendars: [{ departureDate: '2026-10-11', status: 'unavailable' }] }
  });

  // NRT resolves with $7,046 (cheaper than CTS)
  multiDestRenderer.updateItemResult('NRT', {
    data: { calendars: [{ departureDate: '2026-10-11', price: { amount: 7046, currencyCode: 'TWD' }, status: 'available' }] }
  });
  // NRT should now be above CTS!
  assert(multiContainer.children[0].id === 'compare-item-NRT', 'NRT ($7,046) should be above CTS ($11,030)');
  assert(multiContainer.children[1].id === 'compare-item-CTS', 'CTS ($11,030) should be 2nd');

  // SHI resolves with $5,366 (cheapest!)
  multiDestRenderer.updateItemResult('SHI', {
    data: { calendars: [{ departureDate: '2026-10-11', price: { amount: 5366, currencyCode: 'TWD' }, status: 'available' }] }
  });
  assert(multiContainer.children[0].id === 'compare-item-SHI', 'SHI ($5,366) should now be 1st');

  // FUK resolves with $7,190
  multiDestRenderer.updateItemResult('FUK', {
    data: { calendars: [{ departureDate: '2026-10-11', price: { amount: 7190, currencyCode: 'TWD' }, status: 'available' }] }
  });

  // Final price-asc check: SHI ($5,366) < NRT ($7,046) < FUK ($7,190) < CTS ($11,030) < HKD (Unavailable)
  assert(multiContainer.children[0].id === 'compare-item-SHI', 'Final 1st: SHI ($5,366)');
  assert(multiContainer.children[1].id === 'compare-item-NRT', 'Final 2nd: NRT ($7,046)');
  assert(multiContainer.children[2].id === 'compare-item-FUK', 'Final 3rd: FUK ($7,190)');
  assert(multiContainer.children[3].id === 'compare-item-CTS', 'Final 4th: CTS ($11,030)');
  assert(multiContainer.children[4].id === 'compare-item-HKD', 'Final 5th: HKD (Unavailable at bottom)');
  console.log('✓ Dynamic progressive price sorting during search test PASSED');

  // Test 11: Price descending sort with unavailable items
  multiDestRenderer.sortList('price-desc');
  // price-desc: CTS ($11,030) > FUK ($7,190) > NRT ($7,046) > SHI ($5,366) > HKD (Unavailable at bottom)
  assert(multiContainer.children[0].id === 'compare-item-CTS', 'Desc 1st: CTS ($11,030)');
  assert(multiContainer.children[1].id === 'compare-item-FUK', 'Desc 2nd: FUK ($7,190)');
  assert(multiContainer.children[2].id === 'compare-item-NRT', 'Desc 3rd: NRT ($7,046)');
  assert(multiContainer.children[3].id === 'compare-item-SHI', 'Desc 4th: SHI ($5,366)');
  assert(multiContainer.children[4].id === 'compare-item-HKD', 'Desc 5th: HKD (Unavailable still at bottom)');
  console.log('✓ Price descending sort with unavailable items test PASSED');

  // Test 12: Code sorting A-Z
  multiDestRenderer.sortList('code');
  assert(multiContainer.children[0].id === 'compare-item-CTS', 'Code 1st: CTS');
  assert(multiContainer.children[1].id === 'compare-item-FUK', 'Code 2nd: FUK');
  assert(multiContainer.children[2].id === 'compare-item-HKD', 'Code 3rd: HKD');
  assert(multiContainer.children[3].id === 'compare-item-NRT', 'Code 4th: NRT');
  assert(multiContainer.children[4].id === 'compare-item-SHI', 'Code 5th: SHI');
  // Test 13: Prioritizing totalPrices over price
  const totalPricesApiData = {
    data: {
      calendars: [
        {
          departureDate: '2024-10-10',
          price: { amount: 8203, currencyCode: 'TWD' },
          totalPrices: { total: { amount: 13599, currencyCode: 'TWD' } },
          status: 'available'
        }
      ]
    }
  };
  renderer.updateItemResult('NRT', totalPricesApiData, 'JX800');
  const nrtTotalInfo = renderer.itemsData.get('NRT');
  assert(nrtTotalInfo.price === 13599, 'Price for NRT should prioritize totalPrices 13599 over 8203');
  // Test 14: flights/search API format with totalPrices amount 16662
  const flightSearchApiData = {
    success: true,
    data: {
      flightInfo: { departure: 'TPE', arrival: 'KMJ' },
      flights: [
        {
          isDirect: true,
          flightNo: ['JX846'],
          priceInfo: [
            {
              cabin: 'eco',
              from: { amount: 8203, currencyCode: 'TWD' },
              totalPrices: { total: { amount: 16662, currencyCode: 'TWD' } }
            },
            {
              cabin: 'business',
              from: { amount: 18475, currencyCode: 'TWD' },
              totalPrices: { total: { amount: 26934, currencyCode: 'TWD' } }
            }
          ]
        }
      ]
    }
  };

  const searchTestRenderer = new SingleDayCompareRenderer(mockDomElements);
  searchTestRenderer.renderInitialList('TPE', [{ code: 'KMJ', name: 'Kumamoto', country: 'Japan' }], '2026-10-08');
  searchTestRenderer.updateItemResult('KMJ', flightSearchApiData);

  const kmjFlightSearchInfo = searchTestRenderer.itemsData.get('KMJ');
  assert(kmjFlightSearchInfo.price === 16662, 'Price for KMJ should be 16662 from totalPrices amount');
  assert(kmjFlightSearchInfo.flightNumbers === 'JX846', 'Flight number should be extracted from flightNo');
  assert(kmjFlightSearchInfo.status === 'success', 'Status should be success');

  const kmjSearchRow = findById(mockDomElements.get('containerCompareList'), 'compare-item-KMJ');
  assert(kmjSearchRow !== null, 'compare-item-KMJ row should exist');
  assert(kmjSearchRow.innerHTML.includes('$16,662'), 'Row HTML should include formatted price $16,662');
  assert(kmjSearchRow.innerHTML.includes('JX846'), 'Row HTML should include flight badge JX846');
  // Test 15: flights/search API format with totalPrices amount 18822
  const flightSearch18822Data = {
    success: true,
    data: {
      flightInfo: { departure: 'TPE', arrival: 'KMJ' },
      flights: [
        {
          isDirect: true,
          flightNo: ['JX846'],
          priceInfo: [
            {
              cabin: 'eco',
              from: { amount: 10363, currencyCode: 'TWD' },
              totalPrices: { total: { amount: 18822, currencyCode: 'TWD' } }
            },
            {
              cabin: 'business',
              from: { amount: 18475, currencyCode: 'TWD' },
              totalPrices: { total: { amount: 26934, currencyCode: 'TWD' } }
            }
          ]
        }
      ]
    }
  };

  searchTestRenderer.updateItemResult('KMJ', flightSearch18822Data);
  assert(kmjFlightSearchInfo.price === 18822, 'Price for KMJ should be updated to 18822');
  assert(kmjSearchRow.innerHTML.includes('$18,822'), 'Row HTML should include formatted price $18,822');
  // Test 16: FlightSearch.searchSingleDayFlight sends correct URL, headers, and body
  const flightSearch = new FlightSearch();
  let capturedUrl = '';
  let capturedOptions = {};
  globalThis.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      json: async () => ({ success: true, data: { flights: [] } })
    };
  };

  await flightSearch.searchSingleDayFlight('TPE', 'KMJ', '2026-10-08', 'eco', null, '2026-10-10');
  assert(capturedUrl === 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/search', 'URL should be v2/flights/search');
  assert(capturedOptions.headers['jx-deeplink-from'] === 'everymundo', 'Headers should include jx-deeplink-from');
  assert(capturedOptions.headers['jx-lang'] === 'zh-TW', 'Headers should include jx-lang');
  const parsedBody = JSON.parse(capturedOptions.body);
  assert(parsedBody.cabin === 'eco', 'Body cabin should be eco');
  assert(parsedBody.itineraries.length === 2, 'Body should have 2 itineraries');
  assert(parsedBody.itineraries[0].departure === 'TPE' && parsedBody.itineraries[0].arrival === 'KMJ', 'Outbound leg correct');
  assert(parsedBody.itineraries[0].departureDate === '2026-10-08', 'Outbound departureDate correct');
  assert(parsedBody.itineraries[1].departure === 'KMJ' && parsedBody.itineraries[1].arrival === 'TPE', 'Inbound leg correct');
  assert(parsedBody.itineraries[1].departureDate === '2026-10-10', 'Inbound departureDate correct');
  assert(parsedBody.travelers.adt === 1, 'Travelers adt should be 1');

  // Test 17: searchFlight with customReturnDate delegates to searchSingleDayFlight
  capturedUrl = '';
  await flightSearch.searchFlight('TPE', 'KMJ', '2026-10-08', 'eco', null, '2026-10-10');
  assert(capturedUrl === 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/search', 'searchFlight with return date should call searchSingleDayFlight');
  console.log('✓ FlightSearch.searchSingleDayFlight API request format & delegation test PASSED');

  console.log('=== All Single Day Compare Tests PASSED ===');
}

runTests();
