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
  }

  /**
   * Render the initial list structure with loading placeholders for each selected destination
   * @param {string} departure - Origin airport code
   * @param {Array<Object>} destinations - Array of airport objects { code, name, country, location, region }
   * @param {string} departureDate - Departure date string (YYYY-MM-DD)
   */
  renderInitialList(departure, destinations, departureDate) {
    const containerCompareList = this.domElements.get('containerCompareList');
    if (!containerCompareList) return;

    this.itemsData.clear();
    containerCompareList.innerHTML = '';

    const returnDateObj = new Date(departureDate);
    returnDateObj.setDate(returnDateObj.getDate() + 5);
    const returnDateStr = returnDateObj.toISOString().split('T')[0];

    destinations.forEach(dest => {
      this.itemsData.set(dest.code, {
        dest,
        departure,
        departureDate,
        returnDateStr,
        status: 'loading',
        price: null,
        flightDetailsHtml: ''
      });

      const row = document.createElement('div');
      row.id = `compare-item-${dest.code}`;
      row.className = 'compare-item-card bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-200';
      row.setAttribute('data-airport-code', dest.code);
      row.setAttribute('data-price', '999999'); // Default high price for sorting

      row.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="bg-primary text-gray-900 font-bold px-3 py-1 rounded text-sm whitespace-nowrap">
            ${departure} ✈️ ${dest.code}
          </div>
          <div>
            <div class="text-white font-semibold text-base sm:text-lg leading-snug">${dest.name}</div>
            <div class="text-xs text-gray-400">${dest.location}</div>
          </div>
        </div>

        <div class="flex items-center gap-4 text-xs sm:text-sm text-gray-300">
          <div class="bg-gray-800/80 px-3 py-1.5 rounded border border-gray-700">
            🗓️ <span class="font-semibold text-white">${departureDate}</span>
            <span class="text-xs text-gray-400"> (Return: ${returnDateStr}, 5 days)</span>
          </div>
        </div>

        <div id="status-container-${dest.code}" class="status-container flex items-center gap-3 self-end md:self-auto">
          <div class="flex items-center gap-2 text-primary font-medium text-sm">
            <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Searching fares...</span>
          </div>
        </div>
      `;

      containerCompareList.appendChild(row);
    });
  }

  /**
   * Update a specific destination item row when API returns data
   * @param {string} airportCode - Destination airport code
   * @param {Object} data - Flight data API response or error
   * @param {string} flightDetailsHtml - Optional HTML for flight numbers
   */
  updateItemResult(airportCode, data, flightDetailsHtml = '') {
    const row = document.getElementById(`compare-item-${airportCode}`);
    const itemInfo = this.itemsData.get(airportCode);

    if (!row || !itemInfo) return;

    const statusContainer = document.getElementById(`status-container-${airportCode}`) || row.querySelector('.status-container') || row;

    if (data.error) {
      itemInfo.status = 'error';
      row.setAttribute('data-price', '999999');
      statusContainer.innerHTML = `
        <div class="text-red-400 text-sm font-medium bg-red-950/40 border border-red-800 px-3 py-1.5 rounded">
          ❌ Query Failed (${data.error})
        </div>
      `;
      return;
    }

    const calendars = data?.data?.calendars || [];
    const targetCalendar = calendars.find(c => c.departureDate === itemInfo.departureDate) || calendars[0];

    if (!targetCalendar || targetCalendar.status !== 'available' || !targetCalendar.price?.amount) {
      itemInfo.status = 'unavailable';
      row.setAttribute('data-price', '999999');
      statusContainer.innerHTML = `
        <div class="text-gray-500 italic text-sm bg-gray-800/50 px-3 py-1.5 rounded border border-gray-700">
          Unavailable
        </div>
      `;
      return;
    }

    const price = targetCalendar.price.amount;
    const currency = targetCalendar.price.currencyCode || 'TWD';
    itemInfo.status = 'success';
    itemInfo.price = price;
    itemInfo.flightDetailsHtml = flightDetailsHtml;

    row.setAttribute('data-price', price);

    const [dYear, dMonth, dDay] = itemInfo.departureDate.split('-');
    const [rYear, rMonth, rDay] = itemInfo.returnDateStr.split('-');

    const bookingHref = `${this.bookingUrl}?ondCityCode[0].origin=${itemInfo.departure}&ondCityCode[0].destination=${airportCode}&ondCityCode[0].day=${dDay}&ondCityCode[0].month=${dMonth}/${dYear}&numAdults=1&numChildren=0&numInfant=0&cabinClassCode=Y&tripType=R&ondCityCode[1].month=${rMonth}/${rYear}&ondCityCode[1].day=${rDay}`;

    statusContainer.innerHTML = `
      <div class="flex items-center gap-3 sm:gap-4">
        <div class="flex flex-col items-end">
          <div class="text-xl sm:text-2xl font-bold text-green-400">
            $${price.toLocaleString()} <span class="text-xs font-normal text-gray-400">${currency}</span>
          </div>
          ${flightDetailsHtml ? `<div class="text-xs text-blue-400 flex items-center gap-1 mt-0.5">${flightDetailsHtml}</div>` : ''}
        </div>
        <a href="${bookingHref}" target="_blank" 
           class="bg-primary text-gray-900 hover:bg-yellow-400 font-bold px-4 py-2 rounded text-xs sm:text-sm transition-colors whitespace-nowrap shadow">
          Book Now
        </a>
      </div>
    `;

    this.reevaluateLowestPrices();
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

    if (loadedPrices.length === 0) return;

    this.itemsData.forEach((info, code) => {
      const row = document.getElementById(`compare-item-${code}`);
      if (!row) return;

      const badgeContainer = row.querySelector('.flex.items-center.gap-3');
      const existingBadge = row.querySelector('.lowest-price-badge');

      if (info.status === 'success' && info.price === minPrice) {
        row.classList.add('border-primary', 'ring-1', 'ring-primary', 'bg-gray-800');
        row.classList.remove('border-gray-700', 'bg-gray-900');

        if (!existingBadge && badgeContainer) {
          const badge = document.createElement('span');
          badge.className = 'lowest-price-badge bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-bounce whitespace-nowrap shadow';
          badge.textContent = '🔥 Lowest Fare';
          badgeContainer.appendChild(badge);
        }
      } else {
        row.classList.remove('border-primary', 'ring-1', 'ring-primary', 'bg-gray-800');
        row.classList.add('border-gray-700', 'bg-gray-900');
        if (existingBadge) {
          existingBadge.remove();
        }
      }
    });
  }

  /**
   * Sort the rendered list items by price or code
   * @param {string} sortBy - 'price-asc', 'price-desc', 'code'
   */
  sortList(sortBy = 'price-asc') {
    const containerCompareList = this.domElements.get('containerCompareList');
    if (!containerCompareList) return;

    const rows = Array.from(containerCompareList.children);

    rows.sort((a, b) => {
      const codeA = a.getAttribute('data-airport-code');
      const codeB = b.getAttribute('data-airport-code');
      const priceA = parseInt(a.getAttribute('data-price') || '999999', 10);
      const priceB = parseInt(b.getAttribute('data-price') || '999999', 10);

      if (sortBy === 'price-asc') {
        return priceA - priceB || codeA.localeCompare(codeB);
      } else if (sortBy === 'price-desc') {
        return priceB - priceA || codeA.localeCompare(codeB);
      } else if (sortBy === 'code') {
        return codeA.localeCompare(codeB);
      }
      return 0;
    });

    rows.forEach(row => containerCompareList.appendChild(row));
  }
}
