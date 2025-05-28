const inputMonth = document.getElementById('inputMonth');
const selectAirportFrom = document.getElementById('selectAirportFrom');
const selectAirportTo = document.getElementById('selectAirportTo');
const btnReverse = document.getElementById('btnReverse');
const btnSearch = document.getElementById('btnSearch');
const btnMonthPrev = document.getElementById('btnMonthPrev');
const btnMonthNext = document.getElementById('btnMonthNext');
const spanMonth = document.getElementById('spanMonth');
const containerResult = document.getElementById('containerResult');
const containerMonthPrice = document.getElementById('containerMonthPrice');
const containerStatistics = document.getElementById('containerStatistics');
const loaderContainer = document.getElementById('loaderContainer');
const containerClass = document.getElementById('containerClass');
const containerBankDiscount = document.getElementById('containerBankDiscount');
const modalCORS = document.getElementById('modalCORS');
const versionDisplay = document.getElementById('version-display');

const options = airports.map(airport => {
  const regionStyle = regionStyles[airport.region];
  const flag = regionStyle?.flag || '🏳️'; // Default flag if region or style not found
  return {
    value: airport.code,
    label: airport.name,
    sublabel: `${flag} ${airport.location}, ${airport.region}`, // Updated sublabel
    badge: `${airport.code}`,
    disabled: airport.disabled
  };
});

function updateAirportSelectorStyle(selectorElement, airportCode) {
  const button = selectorElement.querySelector('button');
  if (!button) {
    console.error('updateAirportSelectorStyle: Button element not found in selector:', selectorElement);
    return;
  }

  const allBorderClassesToRemove = Object.values(regionStyles).map(s => s.borderColorClass).concat(['border-primary']);
  button.classList.remove(...allBorderClassesToRemove);

  if (!airportCode) {
    // console.warn('updateAirportSelectorStyle: airportCode is undefined. Resetting to default border.');
    button.classList.add('border-primary'); // Default border
    return;
  }

  const airport = airports.find(a => a.code === airportCode);
  if (!airport) {
    console.error(`updateAirportSelectorStyle: Airport with code ${airportCode} not found.`);
    button.classList.add('border-primary'); // Fallback to default
    return;
  }

  const style = regionStyles[airport.region];
  if (!style || !style.borderColorClass) {
    console.error(`updateAirportSelectorStyle: Style or borderColorClass for region ${airport.region} not found.`);
    button.classList.add('border-primary'); // Fallback to default
    return;
  }

  button.classList.add(style.borderColorClass);
}

function appendAirport(){
  const defaultFromCode = 'TPE';
  const defaultToCode = 'KMJ';

  TailwindHeadless.appendDropdown(selectAirportFrom, {
    options: options,
    darkMode: true,
    multiple: false,
    enableSearch: true,
    preselected: [defaultFromCode],
    onChange: (value) => { // value is the airport code (string)
      console.log('Selected FROM value:', value);
      updateAirportSelectorStyle(selectAirportFrom, value);
    }
  });
  updateAirportSelectorStyle(selectAirportFrom, defaultFromCode); // Initial style

  TailwindHeadless.appendDropdown(selectAirportTo, {
    options: options,
    darkMode: true,
    multiple: false,
    enableSearch: true,
    preselected: [defaultToCode],
    onChange: (value) => { // value is the airport code (string)
      console.log('Selected TO value:', value);
      updateAirportSelectorStyle(selectAirportTo, value);
    }
  });
  updateAirportSelectorStyle(selectAirportTo, defaultToCode); // Initial style
}

containerClass.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    containerClass.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-gray-800');
      btn.classList.add('bg-gray-600', 'text-white');
    });
    button.classList.remove('bg-gray-600', 'text-white');
    button.classList.add('bg-primary', 'text-gray-800');
    
    containerClass.setAttribute('data-selected-value', button.attributes['data-value'].value);
  });
});

containerBankDiscount.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    containerBankDiscount.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-gray-800');
      btn.classList.add('bg-gray-600', 'text-white');
    });
    button.classList.remove('bg-gray-600', 'text-white');
    button.classList.add('bg-primary', 'text-gray-800');

    containerBankDiscount.setAttribute('data-selected-value', button.attributes['data-value'].value);
  });
});

btnReverse.addEventListener('click', () => {
  // 取得目前選中的值
  const fromValue = selectAirportFrom.getAttribute('data-selected-value');
  const toValue = selectAirportTo.getAttribute('data-selected-value');

  // 重新渲染下拉選單
  selectAirportFrom.innerHTML = ''; // Clear previous instance
  TailwindHeadless.appendDropdown(selectAirportFrom, {
    options: options,
    darkMode: true,
    multiple: false,
    enableSearch: true,
    preselected: [toValue], // Swapped value
    onChange: (value) => {
      console.log('Selected FROM value (after reverse):', value);
      updateAirportSelectorStyle(selectAirportFrom, value);
    }
  });
  updateAirportSelectorStyle(selectAirportFrom, toValue); // Style for the new 'from'

  selectAirportTo.innerHTML = ''; // Clear previous instance
  TailwindHeadless.appendDropdown(selectAirportTo, {
    options: options,
    darkMode: true,
    multiple: false,
    enableSearch: true,
    preselected: [fromValue], // Swapped value
    onChange: (value) => {
      console.log('Selected TO value (after reverse):', value);
      updateAirportSelectorStyle(selectAirportTo, value);
    }
  });
  updateAirportSelectorStyle(selectAirportTo, fromValue); // Style for the new 'to'
});

btnSearch.addEventListener('click', () => {
  const inputMonthValue = inputMonth.value;
  const departure = selectAirportFrom.getAttribute('data-selected-value');
  const arrival = selectAirportTo.getAttribute('data-selected-value');
  const departureDate = formatMonthDate(inputMonthValue); // 轉換為 yyyy-MM-dd 格式

  spanMonth.textContent = inputMonthValue;

  // 呼叫 searchFlight 函式，並傳入 departure, arrival, departureDate 參數
  searchFlight(departure, arrival, departureDate);
});

function updateInputMonthValue(offset) {
  const inputMonthValue = inputMonth.value;
  const departure = selectAirportFrom.getAttribute('data-selected-value');
  const arrival = selectAirportTo.getAttribute('data-selected-value');
  const [year, month] = inputMonthValue.split('-');
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + offset);
  const paddedMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  inputMonth.value = `${date.getFullYear()}-${paddedMonth}`.padEnd(7, '-');

  spanMonth.textContent = inputMonth.value;

  searchFlight(departure, arrival, formatMonthDate(inputMonth.value));
}

btnMonthPrev.addEventListener('click', () => {
  updateInputMonthValue(-1);
});

btnMonthNext.addEventListener('click', () => {
  updateInputMonthValue(1);
});

modalCORS.addEventListener('click', () => {
  modalCORS.classList.add('hidden');
});

function formatMonthDate(monthValue) {
  // 使用 Date 物件來處理日期
  const [year, month] = monthValue.split('-').map(Number);
  // 取得現在的日期
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // getMonth() 取得的月份是 0-11，所以需要 +1
  const currentDay = now.getDate();

  // 判斷是否為現在的月份
  let day;
  if (year === currentYear && month === currentMonth) {
    day = currentDay;
  } else {
    day = 1;
  }
  const date = new Date(year, month - 1, day); // 將日期設為下個月的第一天
  date.setDate(date.getDate() + 1); // 將日期減去一天，獲得當月的最後一天
  return date.toISOString().split('T')[0]; // 返回 yyyy-MM-dd 格式
}

// 顯示 loading 動畫
function showLoader() {
  loaderContainer.classList.remove('hidden');
}

// 隱藏 loading 動畫
function hideLoader() {
  loaderContainer.classList.add('hidden');
}

function searchFlight(departure, arrival, departureDate) {
  const url = 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/calendars/monthly';

  // returnDate = departureDate + 5 days
  const returnDateObj = new Date(departureDate);
  returnDateObj.setDate(returnDateObj.getDate() + 5);
  const returnDate = returnDateObj.toISOString().split('T')[0];

  const data = {
    cabin: containerClass.attributes['data-selected-value'].value,
    itineraries: [
      {
        departure,
        arrival,
        departureDate
      },
      {
        departureDate: returnDate,
        departure: arrival,
        arrival: departure
      }
    ],
    travelers: {
      adt: 1,
      chd: 0,
      inf: 0
    },
    goFareFamilyCode: null,
    corporateCode: containerBankDiscount.attributes['data-selected-value'].value
  };

  console.log('url', url);
  console.log('data', data);

  // 更新網址參數
  const searchParams = new URLSearchParams({
    departure,
    arrival,
    departureDate,
    returnDate,
    cabin: data.cabin,
    corporateCode: data.corporateCode,
  });

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.pushState({ path: newUrl }, '', newUrl);

  // 清空行事曆並顯示 loading 動畫
  // containerMonthPrice.innerHTML = '';
  // containerStatistics.innerHTML = '';
  showLoader();
  containerResult.classList.remove('hidden');

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'jx-lang': 'zh-TW',
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      // 在這裡使用 data 進行後續操作
      renderFlightInfo(data);
      hideLoader();
    })
    .catch(error => {
      console.error('無法取得航班資訊:', error);
      console.log(error);

      // 若是 https://cors-anywhere.herokuapp.com/corsdemo 錯誤，提示需要到 https://cors-anywhere.herokuapp.com/corsdemo 啟用
      if (error.message.includes('See /cors')) {
        logError('請到 https://cors-anywhere.herokuapp.com/corsdemo 啟用 CORS');
        modalCORS.classList.remove('hidden');
      }
      hideLoader();
    });
}

function renderFlightInfo(data) {
  const calendars = data.data.calendars;
  const departure = selectAirportFrom.getAttribute('data-selected-value');
  const arrival = selectAirportTo.getAttribute('data-selected-value');

  // 生成空的日期格子
  let daysArray = Array(35).fill(null);  // 6週 * 7天 = 42個格子
  let prices = [];

  calendars.forEach(calendar => {
    const date = new Date(calendar.departureDate);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    
    // 計算這一天是當月的第幾天
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const offset = firstDayOfMonth.getDay();
    const index = offset + dayOfMonth - 1;

    daysArray[index] = calendar;
    if(calendar?.price?.amount) prices.push(calendar.price.amount);
  });

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(0);

  // 清空並重新生成行事曆
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
      const date = new Date(calendar.departureDate);
      const dayOfMonth = date.getDate();
      const dayOfWeek = date.getDay();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const lowPrice = calendar?.price?.amount <= minPrice;
      const available = calendar.status === 'available';
      const priceColor = lowPrice ? 'text-green-500 font-bold ' : calendar?.price?.amount >= maxPrice ? 'text-red-400' : 'text-gray-300';
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Check if it's Saturday or Sunday
      const month = String(date.getMonth() + 1).padStart(2, '0'); // 將月份格式化為兩位數
      const day = String(dayOfMonth).padStart(2, '0'); // 將月份格式化為兩位數

      // Calculate return date parts
      const returnDateObj = new Date(date);
      returnDateObj.setDate(returnDateObj.getDate() + 5);
      const returnDay = String(returnDateObj.getDate()).padStart(2, '0');
      const returnMonth = String(returnDateObj.getMonth() + 1).padStart(2, '0');
      const returnYear = returnDateObj.getFullYear();

      (lowPrice) && div.classList.remove('border-gray-600');
      (lowPrice) && div.classList.add('fire', 'border-primary', 'border-2', 'border-l-8');
      (!available) && div.classList.add('opacity-30', 'cursor-not-allowed', 'select-none');
      div.innerHTML = `
        <div class="absolute top-0 right-0 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-6 h-6 fill-primary ${lowPrice ? 'block' : 'hidden'}">
            <path d="M7.493 18.5c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75A.75.75 0 0 1 15 2a2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.727a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507C2.28 19.482 3.105 20 3.994 20H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
          </svg>
        </div>
        <div class="text-3xl text-gray-200 ${isWeekend ? 'opacity-50' : ''}">${dayOfMonth}</div>
        <div class="block lg:hidden text-sm text-gray-400">(${dayNames[dayOfWeek]})</div>
        <div class="flex items-end">
          ${
            (available) ? 
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
    } else {
      div.classList.add('invisible', 'hidden', 'lg:block');
    }

    containerMonthPrice.appendChild(div);
  });

  // 更新統計資訊
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

function urlParamsHandler() {
  // 檢查 URL 參數
  const urlParams = new URLSearchParams(window.location.search);
  const departure = urlParams.get('departure');
  const arrival = urlParams.get('arrival');
  const departureDate = urlParams.get('departureDate');
  const cabin = urlParams.get('cabin');
  const corporateCodeParam = urlParams.get('corporateCode');
  const bankDiscountParam = urlParams.get('bankDiscount');

  // Determine the effective corporate code, prioritizing bankDiscount
  let effectiveCorporateCode = null;
  if (bankDiscountParam) {
    effectiveCorporateCode = bankDiscountParam;
  } else if (corporateCodeParam) {
    effectiveCorporateCode = corporateCodeParam;
  }

  if (departure && arrival && departureDate) {
    // 設定機場下拉選單
    // 重新渲染下拉選單
    selectAirportFrom.innerHTML = ''; // Clear previous instance
    TailwindHeadless.appendDropdown(selectAirportFrom, {
      options: options,
      darkMode: true,
      multiple: false,
      enableSearch: true,
      preselected: [departure],
      onChange: (value) => {
        console.log('Selected FROM value (URL params):', value);
        updateAirportSelectorStyle(selectAirportFrom, value);
      }
    });
    updateAirportSelectorStyle(selectAirportFrom, departure); // Style for 'from'

    selectAirportTo.innerHTML = ''; // Clear previous instance
    TailwindHeadless.appendDropdown(selectAirportTo, {
      options: options,
      darkMode: true,
      multiple: false,
      enableSearch: true,
      preselected: [arrival],
      onChange: (value) => {
        console.log('Selected TO value (URL params):', value);
        updateAirportSelectorStyle(selectAirportTo, value);
      }
    });
    updateAirportSelectorStyle(selectAirportTo, arrival); // Style for 'to'

    // 設定艙等（如果有）
    if (cabin) {
      const cabinButton = containerClass.querySelector(`button[data-value="${cabin}"]`);
      if (cabinButton) {
        cabinButton.click();
      }
    }

    // 設定企業代碼折扣（如果有）
    if (effectiveCorporateCode) {
      const discountButton = containerBankDiscount.querySelector(`button[data-value="${effectiveCorporateCode}"]`);
      if (discountButton) {
        discountButton.click(); // This will set containerBankDiscount's data-selected-value
      }
    }

    // 更新 inputMonth 的值
    inputMonth.value = departureDate.slice(0, 7);
    spanMonth.textContent = inputMonth.value;

    // 自動呼叫 searchFlight 函式
    searchFlight(departure, arrival, departureDate);
  }
}

// 添加事件監聽器
document.addEventListener("DOMContentLoaded", function() {
  appendAirport();
  // update inputMonth for now
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 2).padStart(2, '0');
  inputMonth.value = `${year}-${month}`;
  // renderFlightInfo(monthly); // for testing

  urlParamsHandler();
  displayVersion(); // Call the new function here
});

async function displayVersion() {
  if (!versionDisplay) return; // Do nothing if the element doesn't exist

  try {
    const response = await fetch('version.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.version) {
      versionDisplay.textContent = `v${data.version}`;
    } else {
      versionDisplay.textContent = 'vN/A';
      console.error('Version data is not in the expected format:', data);
    }
  } catch (error) {
    console.error('Could not fetch version:', error);
    versionDisplay.textContent = 'vError';
  }
}