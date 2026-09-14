/**
 * Tests for FlightRenderer Module (TotalPrices Amount Display)
 */
import { FlightRenderer } from './modules/flight-renderer.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

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
    child.parent = this;
    this.children.push(child);
  }
}

function runTests() {
  console.log('=== Running FlightRenderer Unit Tests ===');

  const elementsMap = {
    selectAirportFrom: new MockElement('selectAirportFrom'),
    selectAirportTo: new MockElement('selectAirportTo'),
    containerMonthPrice: new MockElement('containerMonthPrice'),
    containerStatistics: new MockElement('containerStatistics')
  };

  elementsMap.selectAirportFrom.setAttribute('data-selected-value', 'TPE');
  elementsMap.selectAirportTo.setAttribute('data-selected-value', 'KMJ');

  const mockDomElements = {
    get: (id) => elementsMap[id] || new MockElement(id)
  };

  globalThis.document = {
    createElement: (tag) => new MockElement('', tag)
  };

  const renderer = new FlightRenderer(mockDomElements);

  // Test 1: getPriceAmount prioritizing totalPrices.total.amount
  const sampleCalendarItem = {
    departureDate: '2026-10-01',
    returnDate: '2026-10-06',
    price: { amount: 8203, currencyCode: 'TWD' },
    totalPrices: { total: { amount: 13599, currencyCode: 'TWD' } },
    status: 'available'
  };

  assert(renderer.getPriceAmount(sampleCalendarItem) === 13599, 'Should prioritize totalPrices.total.amount over price.amount');
  assert(renderer.getCurrencyCode(sampleCalendarItem) === 'TWD', 'Should return totalPrices currencyCode');
  console.log('✓ getPriceAmount prioritizing totalPrices PASSED');

  // Test 2: getPriceAmount fallback to price.amount when totalPrices is absent
  const legacyCalendarItem = {
    departureDate: '2026-10-02',
    price: { amount: 8203, currencyCode: 'USD' },
    status: 'available'
  };
  assert(renderer.getPriceAmount(legacyCalendarItem) === 8203, 'Should fallback to price.amount');
  assert(renderer.getCurrencyCode(legacyCalendarItem) === 'USD', 'Should fallback to price.currencyCode');
  console.log('✓ getPriceAmount fallback PASSED');

  // Test 3: renderFlightInfo renders totalPrices.total.amount in calendar days and statistics
  const testData = {
    data: {
      calendars: [
        {
          departureDate: '2026-10-01',
          returnDate: '2026-10-06',
          price: { amount: 8203, currencyCode: 'TWD' },
          totalPrices: { total: { amount: 13599, currencyCode: 'TWD' } },
          status: 'available'
        },
        {
          departureDate: '2026-10-02',
          returnDate: '2026-10-06',
          price: { amount: 8203, currencyCode: 'TWD' },
          totalPrices: { total: { amount: 13599, currencyCode: 'TWD' } },
          status: 'available'
        },
        {
          departureDate: '2026-10-03',
          returnDate: '2026-10-06',
          price: { amount: 13872, currencyCode: 'TWD' },
          totalPrices: { total: { amount: 19268, currencyCode: 'TWD' } },
          status: 'available'
        },
        {
          departureDate: '2026-10-05',
          returnDate: '2026-10-06',
          price: { amount: 5141, currencyCode: 'TWD' },
          totalPrices: { total: { amount: 10537, currencyCode: 'TWD' } },
          status: 'available'
        }
      ]
    }
  };

  renderer.renderFlightInfo(testData);

  const containerMonth = elementsMap.containerMonthPrice;
  const availableDivs = containerMonth.children.filter(div => !div.classList.contains('invisible'));
  assert(availableDivs.length === 4, `Expected 4 available day tiles, got ${availableDivs.length}`);

  // Verify the lowest price tile has amount 10537 (from totalPrices) and has fire/border-primary
  const lowestDay = availableDivs.find(div => div.innerHTML.includes('10537'));
  assert(!!lowestDay, 'Calendar should render 10537 as the lowest totalPrices amount');
  assert(lowestDay.classList.contains('fire'), 'Lowest price tile should have fire class');
  assert(lowestDay.classList.contains('border-primary'), 'Lowest price tile should have border-primary class');

  // Verify that day 1 displays 13599, NOT 8203
  const day1 = availableDivs.find(div => div.innerHTML.includes('>1<'));
  assert(!!day1, 'Should find tile for day 1');
  assert(day1.innerHTML.includes('13599'), 'Day 1 tile should display totalPrices amount 13599');
  assert(!day1.innerHTML.includes('8203'), 'Day 1 tile should NOT display base price amount 8203');

  // Verify returnDate in booking link
  assert(day1.innerHTML.includes('ondCityCode[1].month=10/2026'), 'Booking link should contain correct return month');
  assert(day1.innerHTML.includes('ondCityCode[1].day=06'), 'Booking link should contain correct return day 06 from returnDate');

  // Verify Overview statistics
  const statsHtml = elementsMap.containerStatistics.innerHTML;
  assert(statsHtml.includes('10537'), 'Min price in stats should be 10537 (min of totalPrices)');
  assert(statsHtml.includes('19268'), 'Max price in stats should be 19268 (max of totalPrices)');
  console.log('✓ renderFlightInfo with totalPrices PASSED');

  console.log('=== All FlightRenderer Tests PASSED ===');
}

runTests();
