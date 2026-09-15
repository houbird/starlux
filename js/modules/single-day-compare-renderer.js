/**
 * Single Day Compare Renderer Module
 * Handles rendering the single-day multi-destination price comparison list,
 * per-item loading states, results display, and sorting.
 */
import { EXTERNAL_URLS } from '../settings.module.js';

export class SingleDayCompareRenderer {
  constructor(domElements) {
    this.domElements = domElements;
    this.bookingUrl = EXTERNAL_URLS.STARLUX_BOOKING;
    this.itemsData = new Map(); // Store results for sorting
    this.currentSortBy = 'price-asc';
  }

  /**
   * Get the current sort criteria from the DOM select element or instance state
   * @returns {string}
   */
  getCurrentSort() {
    const select = this.domElements?.get ? this.domElements.get('selectCompareSort') : null;
    return (select && select.value) ? select.value : (this.currentSortBy || 'price-asc');
  }

  /**
   * Render the initial list structure with loading placeholders for each selected destination
   * @param {string} departure - Origin airport code
   * @param {Array<Object>} destinations - Array of airport objects { code, name, country, location, region }
   * @param {string} departureDate - Departure date string (YYYY-MM-DD)
   * @param {string|null} customReturnDateStr - Optional custom return date string (YYYY-MM-DD)
   * @param {string} cabin - Cabin class (e.g. 'eco', 'business')
   */
  renderInitialList(departure, destinations, departureDate, customReturnDateStr = null, cabin = 'eco') {
    const containerCompareList = this.domElements.get('containerCompareList');
    if (!containerCompareList) return;

    containerCompareList.innerHTML = '';
    this.itemsData.clear();
    this.currentSortBy = this.getCurrentSort();

    let returnDateStr = customReturnDateStr;
    if (!returnDateStr) {
      const [year, month, day] = departureDate.split('-').map(Number);
      const returnDateObj = new Date(year, month - 1, day);
      returnDateObj.setDate(returnDateObj.getDate() + 5);
      const y = returnDateObj.getFullYear();
      const m = String(returnDateObj.getMonth() + 1).padStart(2, '0');
      const d = String(returnDateObj.getDate()).padStart(2, '0');
      returnDateStr = `${y}-${m}-${d}`;
    }

    destinations.forEach(dest => {
      this.itemsData.set(dest.code, {
        dest,
        departure,
        departureDate,
        returnDateStr,
        cabin: cabin || 'eco',
        status: 'loading',
        price: null,
        flightNumbers: ''
      });

      const row = document.createElement('div');
      row.id = `compare-item-${dest.code}`;
      row.className = 'relative bg-gray-900 border border-gray-700 rounded-lg p-3 flex items-center justify-between gap-3 transition-all duration-200';
      row.setAttribute('data-airport-code', dest.code);
      row.setAttribute('data-price', '999999');

      // Table-like row layout with clear typography and non-shifting structure
      row.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="shrink-0 bg-gray-800 border border-gray-600 font-bold px-2.5 py-1 rounded text-xs text-white whitespace-nowrap" style="min-width:90px;text-align:center;">
            ${departure} → ${dest.code}
          </div>
          <div class="min-w-0 truncate">
            <span class="text-sm font-semibold text-white truncate">${dest.name}</span>
            <span class="text-xs text-gray-400 ml-1 truncate">(${dest.country})</span>
          </div>
        </div>
        <div id="status-${dest.code}" class="status-container shrink-0 flex items-center gap-2 text-sm justify-end">
          <svg class="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs text-gray-400">Searching...</span>
        </div>
      `;

      containerCompareList.appendChild(row);
    });

    this.sortList(this.currentSortBy);
  }

  /**
   * Extract price, currency, and flight numbers from flights/search API or legacy calendars API
   */
  extractFlightData(data, itemInfo) {
    // 1. Check for flights/search response structure (data.data.flights)
    const flights = data?.data?.flights;
    if (Array.isArray(flights)) {
      if (flights.length === 0) {
        return null;
      }

      let bestAmount = Infinity;
      let currency = 'TWD';
      const flightNoSet = new Set();
      const preferredCabin = itemInfo?.cabin || 'eco';

      for (const flight of flights) {
        if (Array.isArray(flight.flightNo)) {
          flight.flightNo.forEach(fn => { if (fn) flightNoSet.add(fn); });
        }

        let priceFoundForFlight = false;

        // Check priceInfo first
        if (Array.isArray(flight.priceInfo)) {
          // Look for preferred cabin first
          const cabinEntry = flight.priceInfo.find(p => p.cabin === preferredCabin);
          if (cabinEntry) {
            const amount = cabinEntry.totalPrices?.total?.amount ?? cabinEntry.totalPrices?.amount ?? cabinEntry.from?.amount;
            if (amount && amount < bestAmount) {
              bestAmount = amount;
              currency = cabinEntry.totalPrices?.total?.currencyCode ?? cabinEntry.totalPrices?.currencyCode ?? cabinEntry.from?.currencyCode ?? currency;
            }
            if (amount) priceFoundForFlight = true;
          }

          // If preferred cabin wasn't found in priceInfo, check any cabin
          if (!priceFoundForFlight) {
            flight.priceInfo.forEach(p => {
              const amount = p.totalPrices?.total?.amount ?? p.totalPrices?.amount ?? p.from?.amount;
              if (amount && amount < bestAmount) {
                bestAmount = amount;
                currency = p.totalPrices?.total?.currencyCode ?? p.totalPrices?.currencyCode ?? p.from?.currencyCode ?? currency;
                priceFoundForFlight = true;
              }
            });
          }
        }

        // If not found in priceInfo, check airOffers
        if (!priceFoundForFlight && Array.isArray(flight.airOffers)) {
          const availableOffers = flight.airOffers.filter(o => !o.isSoldOut);
          const cabinOffers = availableOffers.filter(o => o.cabin === preferredCabin);
          const candidateOffers = cabinOffers.length > 0 ? cabinOffers : availableOffers;

          candidateOffers.forEach(o => {
            const amount = o.totalPrices?.total?.amount ?? o.totalPrices?.amount ?? o.price?.total?.amount;
            if (amount && amount < bestAmount) {
              bestAmount = amount;
              currency = o.totalPrices?.total?.currencyCode ?? o.totalPrices?.currencyCode ?? o.price?.total?.currencyCode ?? currency;
            }
          });
        }
      }

      if (bestAmount !== Infinity) {
        return {
          price: bestAmount,
          currency,
          flightNumbers: Array.from(flightNoSet).join(', ')
        };
      }

      return null;
    }

    // 2. Fallback to calendars structure (calendars/monthly or mock tests)
    const calendars = data?.data?.calendars;
    if (Array.isArray(calendars)) {
      const targetCalendar = calendars.find(c => c.departureDate === itemInfo?.departureDate) || calendars[0];
      const priceAmount = targetCalendar?.totalPrices?.total?.amount ?? targetCalendar?.totalPrices?.amount ?? targetCalendar?.price?.amount;

      if (targetCalendar && targetCalendar.status === 'available' && priceAmount) {
        const currency = targetCalendar?.totalPrices?.total?.currencyCode ?? targetCalendar?.totalPrices?.currencyCode ?? targetCalendar.price?.currencyCode ?? 'TWD';
        return {
          price: priceAmount,
          currency,
          flightNumbers: ''
        };
      }
    }

    return null;
  }

  /**
   * Update a specific destination item row when API returns data
   * @param {string} airportCode - Destination airport code
   * @param {Object} data - Flight data API response or error
   * @param {string} flightNumbers - Compact flight numbers string (e.g. "JX820, JX822")
   */
  updateItemResult(airportCode, data, flightNumbers = '') {
    const row = document.getElementById(`compare-item-${airportCode}`);
    const itemInfo = this.itemsData.get(airportCode);

    if (!row || !itemInfo) return;

    const statusContainer = document.getElementById(`status-${airportCode}`) || row.querySelector('.status-container') || row;

    if (data.error) {
      itemInfo.status = 'error';
      itemInfo.price = null;
      row.setAttribute('data-price', '999999');
      const isCorsError = data.error === 'CORS_ERROR' || (typeof data.error === 'string' && data.error.includes('CORS'));
      if (isCorsError) {
        statusContainer.innerHTML = `
          <button type="button" class="btn-cors-trigger text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 px-2 py-1 rounded cursor-pointer transition-colors" title="Click to view CORS activation instructions">
            <span>⚠️</span>
            <span>CORS Required</span>
          </button>
        `;
      } else {
        statusContainer.innerHTML = `
          <span class="text-xs text-red-400">❌ Query Failed</span>
        `;
      }
      this.reevaluateLowestPrices();
      this.sortList();
      return;
    }

    const flightData = this.extractFlightData(data, itemInfo);

    if (!flightData || !flightData.price) {
      itemInfo.status = 'unavailable';
      itemInfo.price = null;
      row.setAttribute('data-price', '999999');
      statusContainer.innerHTML = `
        <span class="text-xs text-gray-400 italic">Unavailable</span>
      `;
      this.reevaluateLowestPrices();
      this.sortList();
      return;
    }

    const price = flightData.price;
    const currency = flightData.currency || 'TWD';
    let finalFlightNumbers = flightNumbers;
    if ((!finalFlightNumbers || finalFlightNumbers === 'No direct flights') && flightData.flightNumbers) {
      finalFlightNumbers = flightData.flightNumbers;
    }

    itemInfo.status = 'success';
    itemInfo.price = price;
    itemInfo.flightNumbers = finalFlightNumbers;

    row.setAttribute('data-price', price);

    const [dYear, dMonth, dDay] = itemInfo.departureDate.split('-');
    const [rYear, rMonth, rDay] = itemInfo.returnDateStr.split('-');

    const bookingHref = `${this.bookingUrl}?ondCityCode[0].origin=${itemInfo.departure}&ondCityCode[0].destination=${airportCode}&ondCityCode[0].day=${dDay}&ondCityCode[0].month=${dMonth}/${dYear}&numAdults=1&numChildren=0&numInfant=0&cabinClassCode=Y&tripType=R&ondCityCode[1].month=${rMonth}/${rYear}&ondCityCode[1].day=${rDay}`;

    // Compact flight number badges
    const flightBadges = finalFlightNumbers && finalFlightNumbers !== 'No direct flights'
      ? finalFlightNumbers.split(',').map(fn => `<span class="text-[10px] bg-gray-800 text-blue-300 border border-gray-700 px-1.5 py-0.5 rounded font-mono">${fn.trim()}</span>`).join(' ')
      : '';

    statusContainer.innerHTML = `
      <div class="flex items-center gap-3">
        ${flightBadges ? `<div class="hidden sm:flex items-center gap-1">${flightBadges}</div>` : ''}
        <div class="flex items-baseline gap-1">
          <span class="text-lg sm:text-xl font-bold text-green-400 whitespace-nowrap">$${price.toLocaleString()}</span>
          <span class="text-[10px] text-gray-400">${currency}</span>
        </div>
        <a href="${bookingHref}" target="_blank" class="shrink-0 px-3 py-1 rounded text-xs font-bold transition-all bg-primary text-gray-800 hover:opacity-90 shadow whitespace-nowrap">
          Book
        </a>
      </div>
    `;

    this.reevaluateLowestPrices();
    this.sortList();
  }

  /**
   * Find and highlight the lowest price item among all loaded items
   */
  reevaluateLowestPrices() {
    let minPrice = Infinity;
    const loadedPrices = [];

    this.itemsData.forEach((info) => {
      if (info.status === 'success' && info.price !== null) {
        loadedPrices.push(info.price);
        if (info.price < minPrice) {
          minPrice = info.price;
        }
      }
    });

    if (loadedPrices.length === 0) {
      this.itemsData.forEach((info, code) => {
        const row = document.getElementById(`compare-item-${code}`);
        if (!row) return;
        row.classList.remove('border-primary', 'shadow-md');
        row.classList.add('border-gray-700');
        const existingBadge = row.querySelector('.lowest-price-badge');
        if (existingBadge) {
          existingBadge.remove();
        }
      });
      return;
    }

    this.itemsData.forEach((info, code) => {
      const row = document.getElementById(`compare-item-${code}`);
      if (!row) return;

      const existingBadge = row.querySelector('.lowest-price-badge');

      if (info.status === 'success' && info.price === minPrice) {
        row.classList.add('border-primary', 'shadow-md');
        row.classList.remove('border-gray-700');

        if (!existingBadge) {
          const badge = document.createElement('span');
          badge.className = 'lowest-price-badge absolute -top-2.5 right-4 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md z-10 flex items-center gap-1';
          badge.textContent = '🔥 Lowest Fare';
          row.appendChild(badge);
        }
      } else {
        row.classList.remove('border-primary', 'shadow-md');
        row.classList.add('border-gray-700');
        if (existingBadge) {
          existingBadge.remove();
        }
      }
    });
  }

  /**
   * Sort the rendered list items by price or code
   * @param {string|null} sortBy - 'price-asc', 'price-desc', 'code', or null to use current sort
   */
  sortList(sortBy = null) {
    const sort = sortBy || this.getCurrentSort();
    this.currentSortBy = sort;

    const containerCompareList = this.domElements?.get ? this.domElements.get('containerCompareList') : null;
    if (!containerCompareList) return;

    const rows = Array.from(containerCompareList.children || []);

    rows.sort((a, b) => {
      const codeA = a.getAttribute('data-airport-code') || '';
      const codeB = b.getAttribute('data-airport-code') || '';

      const itemA = this.itemsData.get(codeA);
      const itemB = this.itemsData.get(codeB);

      const priceAttrA = parseInt(a.getAttribute('data-price') || '999999', 10);
      const priceAttrB = parseInt(b.getAttribute('data-price') || '999999', 10);

      const priceA = (itemA && itemA.status === 'success' && itemA.price !== null)
        ? itemA.price
        : (priceAttrA < 999999 ? priceAttrA : null);
      const priceB = (itemB && itemB.status === 'success' && itemB.price !== null)
        ? itemB.price
        : (priceAttrB < 999999 ? priceAttrB : null);

      const hasPriceA = priceA !== null && !isNaN(priceA);
      const hasPriceB = priceB !== null && !isNaN(priceB);

      if (sort === 'price-asc') {
        if (hasPriceA && !hasPriceB) return -1;
        if (!hasPriceA && hasPriceB) return 1;
        if (hasPriceA && hasPriceB && priceA !== priceB) {
          return priceA - priceB;
        }
        return codeA.localeCompare(codeB);
      } else if (sort === 'price-desc') {
        if (hasPriceA && !hasPriceB) return -1;
        if (!hasPriceA && hasPriceB) return 1;
        if (hasPriceA && hasPriceB && priceA !== priceB) {
          return priceB - priceA;
        }
        return codeA.localeCompare(codeB);
      } else if (sort === 'code') {
        return codeA.localeCompare(codeB);
      }
      return 0;
    });

    rows.forEach(row => containerCompareList.appendChild(row));
  }
}
