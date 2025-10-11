/**
 * Flight Renderer Module
 * Renders flight calendar and statistics
 */
import { DAY_NAMES, EXTERNAL_URLS } from '../settings.module.js';

export class FlightRenderer {
  constructor(domElements) {
    this.domElements = domElements;
  }

  renderFlightInfo(data, holidays = {}) {
    const calendars = data.data.calendars;
    const departure = this.domElements.get('selectAirportFrom').getAttribute('data-selected-value');
    const arrival = this.domElements.get('selectAirportTo').getAttribute('data-selected-value');

    const daysArray = Array(35).fill(null);
    let prices = [];

    calendars.forEach(calendar => {
      const date = new Date(calendar.departureDate);
      const dayOfMonth = date.getDate();
      
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const offset = firstDayOfMonth.getDay();
      const index = offset + dayOfMonth - 1;

      daysArray[index] = calendar;
      if(calendar?.price?.amount) prices.push(calendar.price.amount);
    });

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(0);

    this.renderCalendar(daysArray, holidays, minPrice, maxPrice, departure, arrival);
    this.renderStatistics(minPrice, maxPrice, avgPrice);
  }

  renderCalendar(daysArray, holidays, minPrice, maxPrice, departure, arrival) {
    const containerMonthPrice = this.domElements.get('containerMonthPrice');
    
    containerMonthPrice.innerHTML = `
      <div class="text-center font-bold text-white opacity-50 hidden lg:block">Sun</div>
      <div class="text-center font-bold text-white hidden lg:block">Mon</div>
      <div class="text-center font-bold text-white hidden lg:block">Tue</div>
      <div class="text-center font-bold text-white hidden lg:block">Wed</div>
      <div class="text-center font-bold text-white hidden lg:block">Thu</div>
      <div class="text-center font-bold text-white hidden lg:block">Fri</div>
      <div class="text-center font-bold text-white opacity-50 hidden lg:block">Sat</div>
    `;

    daysArray.forEach((calendar, index) => {
      const div = document.createElement('div');
      div.classList.add('border', 'border-gray-600', 'p-2', 'min-h-24', 'relative', 'flex', 'flex-col', 'justify-center', 'items-center', 'bg-gray-900', 'text-white', 'shadow', 'rounded');

      if (calendar) {
        this.renderCalendarDay(div, calendar, holidays, minPrice, maxPrice, departure, arrival);
      } else {
        div.classList.add('invisible', 'hidden', 'lg:block');
      }

      containerMonthPrice.appendChild(div);
    });
  }

  renderCalendarDay(div, calendar, holidays, minPrice, maxPrice, departure, arrival) {
    const date = new Date(calendar.departureDate);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const lowPrice = calendar?.price?.amount <= minPrice;
    const available = calendar.status === 'available';
    const priceColor = lowPrice ? 'text-green-500 font-bold ' : calendar?.price?.amount >= maxPrice ? 'text-red-400' : 'text-gray-300';
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(dayOfMonth).padStart(2, '0');
    const holiday = holidays[calendar.departureDate];
    const holidayBadge = holiday ? `<div class="absolute top-0 left-0 bg-red-600 text-white text-[10px] px-1 rounded-br" title="${holiday.name || holiday.holidaycategory}">${(holiday.name || holiday.holidaycategory).slice(0,4)}</div>` : '';

    const returnDateObj = new Date(date);
    returnDateObj.setDate(returnDateObj.getDate() + 5);
    const returnDay = String(returnDateObj.getDate()).padStart(2, '0');
    const returnMonth = String(returnDateObj.getMonth() + 1).padStart(2, '0');
    const returnYear = returnDateObj.getFullYear();

    if (lowPrice) {
      div.classList.remove('border-gray-600');
      div.classList.add('fire', 'border-primary', 'border-2', 'border-l-8');
    }
    
    if (!available) {
      div.classList.add('opacity-30', 'cursor-not-allowed', 'select-none');
    }

    div.innerHTML = `
      ${holidayBadge}
      <div class="absolute top-0 right-0 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-primary ${lowPrice ? 'block' : 'hidden'}">
          <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
        </svg>
      </div>
      <div class="text-3xl text-gray-200 ${isWeekend ? 'opacity-50' : ''}">${dayOfMonth}</div>
      <div class="block lg:hidden text-sm text-gray-400">(${dayNames[dayOfWeek]})</div>
      <div class="flex items-end">
        ${available ? 
          `<div class="text-lg leading-6 ${priceColor}">
            ${calendar?.price?.amount}
          </div>
          <div class="text-sm text-gray-500">${calendar?.price?.currencyCode}</div>`
          :
          `<div class="text-base leading-6 italic text-gray-500">Unavailable</div>`
        }
      </div>
      ${available ? `
      <div>
        <a href="https://www.starlux-airlines.com/zh-TW/booking/everymundo?ondCityCode[0].origin=${departure}&ondCityCode[0].destination=${arrival}&ondCityCode[0].day=${day}&ondCityCode[0].month=${month}/${date.getFullYear()}&numAdults=1&numChildren=0&numInfant=0&cabinClassCode=Y&tripType=R&ondCityCode[1].month=${returnMonth}/${returnYear}&ondCityCode[1].day=${returnDay}" target="_blank" class="text-sm text-gray-400 underline">Book Now</a>
      </div>` : ''}
    `;
  }

  renderStatistics(minPrice, maxPrice, avgPrice) {
    const containerStatistics = this.domElements.get('containerStatistics');
    containerStatistics.innerHTML = `
    <div class="p-4 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-4 text-white">Overview</h2>
      <div class="flex">
        <div class="w-full flex flex-col items-center">
          <div class="text-gray-400">Min Price</div>
          <div class="text-green-400 font-semibold text-3xl">${minPrice}</div>
        </div>
        <div class="w-full flex flex-col items-center">
          <div class="text-gray-400">Max Price</div>
          <div class="text-red-400 font-semibold text-3xl">${maxPrice}</div>
        </div>
        <div class="w-full flex flex-col items-center">
          <div class="text-gray-400">Avg Price</div>
          <div class="text-gray-400 font-semibold text-3xl">${avgPrice}</div>
        </div>
      </div>
    </div>
    `;
  }
}