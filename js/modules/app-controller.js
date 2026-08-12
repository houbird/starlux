/**
 * Application Controller Module
 * Main application orchestrator that coordinates all modules
 */
import { DEFAULT_AIRPORTS, DEFAULT_SEARCH, EXTERNAL_URLS } from '../settings.module.js';
import { SingleDayCompareRenderer } from './single-day-compare-renderer.js';

export class AppController {
  constructor(
    domElements,
    airportManager,
    flightSearch,
    flightRenderer,
    holidayService,
    uiStateManager,
    urlParamsHandler,
    versionDisplay,
    dateUtils,
    flightNumberService = null,
    singleDayCompareRenderer = null
  ) {
    this.domElements = domElements;
    this.airportManager = airportManager;
    this.flightSearch = flightSearch;
    this.flightRenderer = flightRenderer;
    this.holidayService = holidayService;
    this.uiStateManager = uiStateManager;
    this.urlParamsHandler = urlParamsHandler;
    this.versionDisplay = versionDisplay;
    this.dateUtils = dateUtils;
    this.flightNumberService = flightNumberService;
    this.singleDayCompareRenderer = singleDayCompareRenderer || new SingleDayCompareRenderer(domElements);
    this.selectedCompareDestinations = new Set(['NRT', 'KIX', 'FUK', 'CTS', 'OKA']); // Default selections
    this.currentMode = 'month';
  }

  initialize() {
    this.setupAirportDropdowns();
    this.setupButtonGroups();
    this.setupEventListeners();
    this.setupInitialState();
    this.setupCompareModeUI();
    this.handleUrlParameters();
    this.versionDisplay.displayVersion();
  }

  setupAirportDropdowns() {
    const selectAirportFrom = this.domElements.get('selectAirportFrom');
    const selectAirportTo = this.domElements.get('selectAirportTo');

    this.airportManager.appendAirportDropdown(selectAirportFrom, {
      preselected: [DEFAULT_AIRPORTS.FROM],
      dropdownId: 'airportFromDropdownList',
      onChange: (value) => {
        console.log('Selected FROM value:', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportFrom, value);
        this.updateFlightCount();
        this.renderCompareAirportChips();
      }
    });

    this.airportManager.appendAirportDropdown(selectAirportTo, {
      preselected: [DEFAULT_AIRPORTS.TO],
      dropdownId: 'airportToDropdownList',
      onChange: (value) => {
        console.log('Selected TO value:', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportTo, value);
        this.updateFlightCount();
      }
    });

    this.setupDropdownInteractions();
    // Initial flight count update
    this.updateFlightCount();
  }

  setupDropdownInteractions() {
    const fromButton = this.domElements.get('selectAirportFrom').querySelector('button');
    const toButton = this.domElements.get('selectAirportTo').querySelector('button');

    if (fromButton) {
      fromButton.addEventListener('click', () => {
        this.uiStateManager.closeDropdown('airportToDropdownList');
        this.displayAirportSuggestions();
      });
    }

    if (toButton) {
      toButton.addEventListener('click', () => {
        this.uiStateManager.closeDropdown('airportFromDropdownList');
      });
    }
  }

  setupButtonGroups() {
    this.uiStateManager.initializeButtonGroup(
      this.domElements.get('containerClass'),
      'cabin'
    );
    
    this.uiStateManager.initializeButtonGroup(
      this.domElements.get('containerBankDiscount'),
      'bankDiscount'
    );
  }

  setupEventListeners() {
    // Mode switcher tabs
    this.domElements.get('tabSearchMonth')?.addEventListener('click', () => {
      this.switchMode('month');
    });

    this.domElements.get('tabCompareSingleDay')?.addEventListener('click', () => {
      this.switchMode('compare');
    });

    // Reverse button
    this.domElements.get('btnReverse')?.addEventListener('click', () => {
      this.handleReverseAirports();
    });

    // Search button (Monthly mode)
    this.domElements.get('btnSearch')?.addEventListener('click', () => {
      this.handleFlightSearch();
    });

    // Single day compare search button
    this.domElements.get('btnCompareSearch')?.addEventListener('click', () => {
      this.handleSingleDayCompareSearch();
    });

    // Compare sort dropdown
    this.domElements.get('selectCompareSort')?.addEventListener('change', (e) => {
      this.singleDayCompareRenderer.sortList(e.target.value);
    });

    // Compare multi-select buttons
    this.domElements.get('btnSelectAllAirports')?.addEventListener('click', () => {
      this.selectAllCompareAirports();
    });

    this.domElements.get('btnClearAllAirports')?.addEventListener('click', () => {
      this.clearAllCompareAirports();
    });

    // Month navigation
    this.domElements.get('btnMonthPrev')?.addEventListener('click', () => {
      this.updateInputMonthValue(-1);
    });

    this.domElements.get('btnMonthNext')?.addEventListener('click', () => {
      this.updateInputMonthValue(1);
    });

    // Modal close
    this.domElements.get('modalCORS')?.addEventListener('click', () => {
      this.domElements.hideModal('modalCORS');
    });
  }

  setupInitialState() {
    const inputMonth = this.domElements.get('inputMonth');
    if (inputMonth) {
      inputMonth.value = this.dateUtils.getCurrentMonth();
    }

    const inputSingleDate = this.domElements.get('inputSingleDate');
    if (inputSingleDate) {
      inputSingleDate.value = '2024-10-10';
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    const tabMonth = this.domElements.get('tabSearchMonth');
    const tabCompare = this.domElements.get('tabCompareSingleDay');
    const sectionMonth = this.domElements.get('sectionMonthSearch');
    const sectionCompare = this.domElements.get('sectionCompareSearch');
    const containerResult = this.domElements.get('containerResult');
    const containerCompareResult = this.domElements.get('containerCompareResult');

    const activeClasses = ['bg-primary', 'text-gray-900', 'font-bold', 'shadow'];
    const inactiveClasses = ['text-gray-400', 'hover:text-white', 'hover:bg-gray-800'];

    if (mode === 'month') {
      tabMonth?.classList.add(...activeClasses);
      tabMonth?.classList.remove(...inactiveClasses);

      tabCompare?.classList.remove(...activeClasses);
      tabCompare?.classList.add(...inactiveClasses);

      sectionMonth?.classList.remove('hidden');
      sectionCompare?.classList.add('hidden');

      containerCompareResult?.classList.add('hidden');
    } else {
      tabCompare?.classList.add(...activeClasses);
      tabCompare?.classList.remove(...inactiveClasses);

      tabMonth?.classList.remove(...activeClasses);
      tabMonth?.classList.add(...inactiveClasses);

      sectionCompare?.classList.remove('hidden');
      sectionMonth?.classList.add('hidden');

      containerResult?.classList.add('hidden');
    }
  }

  setupCompareModeUI() {
    this.renderCompareCountryGroups();
    this.renderCompareAirportChips();
  }

  getAvailableCompareAirports() {
    const fromCode = this.domElements.get('selectAirportFrom')?.getAttribute('data-selected-value') || 'TPE';
    return this.airportManager.airports.filter(a => !a.disabled && a.code !== fromCode);
  }

  renderCompareCountryGroups() {
    const container = this.domElements.get('containerCountryGroups');
    if (!container) return;

    container.innerHTML = '';
    const airports = this.getAvailableCompareAirports();

    // Group airports by country
    const countryMap = new Map();
    airports.forEach(airport => {
      const country = airport.country || 'Other';
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      countryMap.get(country).push(airport);
    });

    countryMap.forEach((countryAirports, country) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'country-group-btn text-xs px-3 py-1 rounded-full border border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1';
      btn.innerHTML = `<span>${country}</span> <span class="text-[10px] opacity-60">(${countryAirports.length})</span>`;

      btn.addEventListener('click', () => {
        const allSelected = countryAirports.every(a => this.selectedCompareDestinations.has(a.code));
        if (allSelected) {
          countryAirports.forEach(a => this.selectedCompareDestinations.delete(a.code));
        } else {
          countryAirports.forEach(a => this.selectedCompareDestinations.add(a.code));
        }
        this.renderCompareCountryGroups();
        this.renderCompareAirportChips();
      });

      // Highlight if all selected
      const isAllSelected = countryAirports.every(a => this.selectedCompareDestinations.has(a.code));
      const isSomeSelected = countryAirports.some(a => this.selectedCompareDestinations.has(a.code));

      if (isAllSelected) {
        btn.className = 'country-group-btn text-xs px-3 py-1 rounded-full border border-primary bg-primary text-gray-900 font-bold transition-colors flex items-center gap-1 shadow-sm';
      } else if (isSomeSelected) {
        btn.className = 'country-group-btn text-xs px-3 py-1 rounded-full border border-primary/60 bg-gray-800 text-primary transition-colors flex items-center gap-1';
      }

      container.appendChild(btn);
    });
  }

  renderCompareAirportChips() {
    const container = this.domElements.get('containerAirportChips');
    if (!container) return;

    container.innerHTML = '';
    const airports = this.getAvailableCompareAirports();

    airports.forEach(airport => {
      const isSelected = this.selectedCompareDestinations.has(airport.code);

      const label = document.createElement('label');
      label.className = `flex items-center gap-2 p-2 rounded cursor-pointer border text-xs transition-all ${
        isSelected
          ? 'bg-gray-800 border-primary text-white font-medium shadow-sm ring-1 ring-primary/40'
          : 'bg-gray-900/60 border-gray-700/80 text-gray-400 hover:border-gray-600 hover:text-gray-200'
      }`;

      label.innerHTML = `
        <input type="checkbox" value="${airport.code}" ${isSelected ? 'checked' : ''} class="accent-primary rounded cursor-pointer">
        <div class="flex flex-col truncate">
          <span class="truncate text-white font-medium">${airport.code} - ${airport.name}</span>
          <span class="text-[10px] text-gray-400">${airport.country}</span>
        </div>
      `;

      const checkbox = label.querySelector('input');
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.selectedCompareDestinations.add(airport.code);
        } else {
          this.selectedCompareDestinations.delete(airport.code);
        }
        this.renderCompareCountryGroups();
        this.renderCompareAirportChips();
      });

      container.appendChild(label);
    });
  }

  selectAllCompareAirports() {
    const airports = this.getAvailableCompareAirports();
    airports.forEach(a => this.selectedCompareDestinations.add(a.code));
    this.renderCompareCountryGroups();
    this.renderCompareAirportChips();
  }

  clearAllCompareAirports() {
    this.selectedCompareDestinations.clear();
    this.renderCompareCountryGroups();
    this.renderCompareAirportChips();
  }

  async handleSingleDayCompareSearch() {
    const departure = this.domElements.get('selectAirportFrom')?.getAttribute('data-selected-value') || 'TPE';
    const departureDate = this.domElements.get('inputSingleDate')?.value || '2024-10-10';
    const containerClass = this.domElements.get('containerClass');
    const containerBankDiscount = this.domElements.get('containerBankDiscount');
    const containerCompareResult = this.domElements.get('containerCompareResult');
    const spanCompareSummary = this.domElements.get('spanCompareSummary');

    const cabin = containerClass?.getAttribute('data-selected-value') || 'eco';
    const corporateCode = containerBankDiscount?.getAttribute('data-selected-value') || 'COBRAND01';

    const selectedCodes = Array.from(this.selectedCompareDestinations);
    if (selectedCodes.length === 0) {
      alert('Please select at least one destination airport to compare!');
      return;
    }

    const selectedDestinations = this.airportManager.airports.filter(a => selectedCodes.includes(a.code));

    containerCompareResult?.classList.remove('hidden');
    if (spanCompareSummary) {
      spanCompareSummary.textContent = `${departure} Departure | ${departureDate} | ${selectedDestinations.length} destination${selectedDestinations.length > 1 ? 's' : ''}`;
    }

    // Render initial list with loading spinners
    this.singleDayCompareRenderer.renderInitialList(departure, selectedDestinations, departureDate);

    // Concurrently fetch prices for each destination
    selectedDestinations.forEach(async (dest) => {
      try {
        const flightDetailsPromise = this.flightNumberService
          ? this.flightNumberService.getFlightDetailsHtml(departure, dest.code)
          : Promise.resolve('');

        const [flightData, flightDetailsHtml] = await Promise.all([
          this.flightSearch.searchFlight(departure, dest.code, departureDate, cabin, corporateCode),
          flightDetailsPromise
        ]);

        this.singleDayCompareRenderer.updateItemResult(dest.code, flightData, flightDetailsHtml);
      } catch (error) {
        console.error(`Single day search failed for ${dest.code}:`, error);
        if (error.message === 'CORS_ERROR') {
          this.domElements.showModal('modalCORS');
        }
        this.singleDayCompareRenderer.updateItemResult(dest.code, { error: error.message || 'CORS or Network Error' });
      }
    });

    // Initial sort
    const sortVal = this.domElements.get('selectCompareSort')?.value || 'price-asc';
    setTimeout(() => {
      this.singleDayCompareRenderer.sortList(sortVal);
    }, 100);
  }

  handleUrlParameters() {
    this.urlParamsHandler.handleUrlParams((departure, arrival, departureDate) => {
      this.performFlightSearch(departure, arrival, departureDate);
    });
  }

  handleReverseAirports() {
    const selectAirportFrom = this.domElements.get('selectAirportFrom');
    const selectAirportTo = this.domElements.get('selectAirportTo');
    
    const fromValue = selectAirportFrom.getAttribute('data-selected-value');
    const toValue = selectAirportTo.getAttribute('data-selected-value');

    // Recreate dropdowns with swapped values
    selectAirportFrom.innerHTML = '';
    this.airportManager.appendAirportDropdown(selectAirportFrom, {
      preselected: [toValue],
      dropdownId: 'airportFromDropdownList',
      onChange: (value) => {
        console.log('Selected FROM value (after reverse):', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportFrom, value);
        this.updateFlightCount();
        this.renderCompareAirportChips();
      }
    });

    selectAirportTo.innerHTML = '';
    this.airportManager.appendAirportDropdown(selectAirportTo, {
      preselected: [fromValue],
      dropdownId: 'airportToDropdownList',
      onChange: (value) => {
        console.log('Selected TO value (after reverse):', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportTo, value);
        this.updateFlightCount();
      }
    });

    this.setupDropdownInteractions();
    this.displayAirportSuggestions();
    this.updateFlightCount();
  }

  handleFlightSearch() {
    const inputMonth = this.domElements.get('inputMonth');
    const selectAirportFrom = this.domElements.get('selectAirportFrom');
    const selectAirportTo = this.domElements.get('selectAirportTo');
    const spanMonth = this.domElements.get('spanMonth');

    const inputMonthValue = inputMonth.value;
    const departure = selectAirportFrom.getAttribute('data-selected-value');
    const arrival = selectAirportTo.getAttribute('data-selected-value');
    const departureDate = this.dateUtils.formatMonthDate(inputMonthValue);

    spanMonth.textContent = inputMonthValue;
    this.performFlightSearch(departure, arrival, departureDate);
  }

  updateInputMonthValue(offset) {
    const inputMonth = this.domElements.get('inputMonth');
    const spanMonth = this.domElements.get('spanMonth');
    const selectAirportFrom = this.domElements.get('selectAirportFrom');
    const selectAirportTo = this.domElements.get('selectAirportTo');

    const newValue = this.dateUtils.updateInputMonthValue(inputMonth, offset);
    inputMonth.value = newValue;
    spanMonth.textContent = newValue;

    const departure = selectAirportFrom.getAttribute('data-selected-value');
    const arrival = selectAirportTo.getAttribute('data-selected-value');
    const departureDate = this.dateUtils.formatMonthDate(newValue);

    this.performFlightSearch(departure, arrival, departureDate);
  }

  async performFlightSearch(departure, arrival, departureDate) {
    const containerClass = this.domElements.get('containerClass');
    const containerBankDiscount = this.domElements.get('containerBankDiscount');
    const containerResult = this.domElements.get('containerResult');
    const inputMonth = this.domElements.get('inputMonth');

    const cabin = containerClass.getAttribute('data-selected-value');
    const corporateCode = containerBankDiscount.getAttribute('data-selected-value');

    try {
      this.domElements.showLoader();
      containerResult.classList.remove('hidden');

      // Update URL
      const returnDateObj = new Date(departureDate);
      returnDateObj.setDate(returnDateObj.getDate() + 5);
      const returnDate = returnDateObj.toISOString().split('T')[0];
      
      this.flightSearch.updateUrlParams(
        departure, arrival, departureDate, returnDate, cabin, corporateCode
      );

      // Fetch flight data, holidays, and flight details concurrently
      const [year, month] = inputMonth.value.split('-');
      const requests = [
        this.flightSearch.searchFlight(departure, arrival, departureDate, cabin, corporateCode),
        this.holidayService.fetchHolidaysForMonth(year, month)
      ];

      // Add flight details request if service is available
      if (this.flightNumberService) {
        requests.push(this.flightNumberService.getFlightDetailsHtml(departure, arrival));
      }

      const results = await Promise.all(requests);
      const [flightData, holidays, flightDetailsHtml = ''] = results;

      console.log('Flight data:', flightData);
      this.flightRenderer.renderFlightInfo(flightData, holidays, flightDetailsHtml);
      
    } catch (error) {
      console.error('Flight search failed:', error);
      
      if (error.message === 'CORS_ERROR') {
        console.error(`請到 ${EXTERNAL_URLS.CORS_DEMO} 啟用 CORS`);
        this.domElements.showModal('modalCORS');
      }
    } finally {
      this.domElements.hideLoader();
    }
  }

  displayAirportSuggestions() {
    const airportSuggestionsContainer = this.domElements.get('airportSuggestionsContainer');
    if (!airportSuggestionsContainer) return;

    const fromAirportCode = this.domElements.get('selectAirportFrom').getAttribute('data-selected-value');
    const toAirportCode = this.domElements.get('selectAirportTo').getAttribute('data-selected-value');

    const suggestions = this.airportManager.generateAirportSuggestions(
      fromAirportCode, 
      toAirportCode, 
      DEFAULT_SEARCH.MAX_SUGGESTIONS
    );
    
    airportSuggestionsContainer.innerHTML = '';

    suggestions.forEach(airport => {
      const button = document.createElement('button');
      button.textContent = `${airport.name} (${airport.code})`;
      button.dataset.airportCode = airport.code;
      button.className = 'px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors';
      
      button.addEventListener('click', () => {
        this.selectSuggestedAirport(airport.code);
      });
      
      airportSuggestionsContainer.appendChild(button);
    });
  }

  selectSuggestedAirport(airportCode) {
    const selectAirportTo = this.domElements.get('selectAirportTo');
    const selectedAirportOption = this.airportManager.options.find(opt => opt.value === airportCode);

    if (selectedAirportOption) {
      selectAirportTo.setAttribute('data-selected-value', airportCode);
      
      const toButtonElement = selectAirportTo.querySelector('button');
      if (toButtonElement) {
        TailwindHeadless.updateButtonContent(toButtonElement, selectedAirportOption, true);
      }
      
      this.airportManager.updateAirportSelectorStyle(selectAirportTo, airportCode);
      
      // Clear suggestions after selection
      const airportSuggestionsContainer = this.domElements.get('airportSuggestionsContainer');
      if (airportSuggestionsContainer) {
        airportSuggestionsContainer.innerHTML = '';
      }
      
      // Update flight count after selection
      this.updateFlightCount();
    }
  }

  async updateFlightCount() {
    if (!this.flightNumberService) return;
    
    const selectAirportFrom = this.domElements.get('selectAirportFrom');
    const selectAirportTo = this.domElements.get('selectAirportTo');
    
    const departure = selectAirportFrom?.getAttribute('data-selected-value');
    const arrival = selectAirportTo?.getAttribute('data-selected-value');
    
    if (!departure || !arrival) {
      this.domElements.updateFlightCountBadge(0);
      return;
    }
    
    try {
      const count = await this.flightNumberService.getFlightCount(departure, arrival);
      this.domElements.updateFlightCountBadge(count);
    } catch (error) {
      console.error('Failed to update flight count:', error);
      this.domElements.updateFlightCountBadge(0);
    }
  }
}