/**
 * Application Controller Module
 * Main application orchestrator that coordinates all modules
 */
import { DEFAULT_AIRPORTS, DEFAULT_SEARCH, EXTERNAL_URLS } from '../settings.module.js?v=1.2.2';
import { SingleDayCompareRenderer } from './single-day-compare-renderer.js?v=1.2.2';

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

    // Modal controls
    const modalCORS = this.domElements.get('modalCORS');
    const modalCORSBackdrop = this.domElements.get('modalCORSBackdrop');
    const btnModalCORSClose = this.domElements.get('btnModalCORSClose');
    const btnModalCORSOk = this.domElements.get('btnModalCORSOk');

    const closeModal = () => this.domElements.hideModal('modalCORS');

    modalCORSBackdrop?.addEventListener('click', closeModal);
    btnModalCORSClose?.addEventListener('click', closeModal);
    btnModalCORSOk?.addEventListener('click', closeModal);

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalCORS && !modalCORS.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Departure date change in Compare Mode
    const inputSingleDateEl = this.domElements.get('inputSingleDate');
    inputSingleDateEl?.addEventListener('change', () => {
      this.updateCompareReturnDateDropdown();
    });
    inputSingleDateEl?.addEventListener('input', () => {
      this.updateCompareReturnDateDropdown();
    });

    // Delegate clicks on CORS retry / help badges inside the comparison list
    this.domElements.get('containerCompareList')?.addEventListener('click', (e) => {
      if (e.target.closest('.btn-cors-trigger')) {
        this.domElements.showModal('modalCORS');
      }
    });
  }

  setupInitialState() {
    const inputMonth = this.domElements.get('inputMonth');
    if (inputMonth) {
      inputMonth.value = this.dateUtils.getCurrentMonth();
    }

    const inputSingleDate = this.domElements.get('inputSingleDate');
    if (inputSingleDate) {
      // Default to today + 1 month
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      inputSingleDate.value = defaultDate.toISOString().split('T')[0];
      this.populateCompareReturnDateDropdown(inputSingleDate.value, 5);
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

    const activeClasses = ['bg-primary', 'text-gray-800', 'shadow'];
    const inactiveClasses = ['text-white', 'hover:bg-gray-500'];

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
      this.updateCompareReturnDateDropdown();
    }
  }

  setupCompareModeUI() {
    this.updateCompareReturnDateDropdown();
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

      const isAllSelected = countryAirports.every(a => this.selectedCompareDestinations.has(a.code));
      const isSomeSelected = countryAirports.some(a => this.selectedCompareDestinations.has(a.code));

      const baseClasses = 'country-group-btn text-xs px-2.5 py-1 rounded-full cursor-pointer transition-all flex items-center gap-1';

      if (isAllSelected) {
        btn.className = `${baseClasses} bg-primary text-gray-800 font-semibold shadow-sm`;
      } else if (isSomeSelected) {
        btn.className = `${baseClasses} border border-primary/60 bg-gray-700 text-primary font-medium`;
      } else {
        btn.className = `${baseClasses} bg-gray-600 text-white hover:bg-gray-500`;
      }

      btn.innerHTML = `<span class="text-xs">${country}</span> <span class="text-[10px] opacity-75">(${countryAirports.length})</span>`;

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

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = isSelected
        ? 'px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer bg-primary text-gray-800 whitespace-nowrap shadow-sm'
        : 'px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer bg-gray-600 text-white hover:bg-gray-500 whitespace-nowrap';

      chip.textContent = `${airport.code} ${airport.name}`;
      chip.title = `${airport.code} - ${airport.name} (${airport.country})`;

      chip.addEventListener('click', () => {
        if (this.selectedCompareDestinations.has(airport.code)) {
          this.selectedCompareDestinations.delete(airport.code);
        } else {
          this.selectedCompareDestinations.add(airport.code);
        }
        this.renderCompareCountryGroups();
        this.renderCompareAirportChips();
      });

      container.appendChild(chip);
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

  /**
   * Populate the Return Date dropdown options with yyyy/MM/dd (? day/days)
   * @param {string} departureDateStr - Departure date string in YYYY-MM-DD format
   * @param {number} selectedDays - Duration days to keep selected (default 5)
   */
  populateCompareReturnDateDropdown(departureDateStr, selectedDays = 5) {
    const selectReturnDate = this.domElements.get('selectCompareReturnDate');
    if (!selectReturnDate || !departureDateStr) return;

    const options = this.dateUtils.getReturnDateOptions(departureDateStr, 30);
    selectReturnDate.innerHTML = '';

    const targetDays = Number(selectedDays) || 5;

    options.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = String(opt.days);
      optionEl.setAttribute('data-iso-date', opt.isoDate);
      optionEl.textContent = opt.displayText;
      if (opt.days === targetDays) {
        optionEl.selected = true;
      }
      selectReturnDate.appendChild(optionEl);
    });
  }

  /**
   * Recalculate and update the Return Date dropdown when departure date changes
   */
  updateCompareReturnDateDropdown() {
    const inputSingleDate = this.domElements.get('inputSingleDate');
    const selectReturnDate = this.domElements.get('selectCompareReturnDate');
    if (!selectReturnDate) return;

    let departureDate = inputSingleDate?.value;
    if (!departureDate) {
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 1);
      departureDate = defaultDate.toISOString().split('T')[0];
      if (inputSingleDate) {
        inputSingleDate.value = departureDate;
      }
    }

    const currentSelectedDays = Number(selectReturnDate.value) || 5;
    this.populateCompareReturnDateDropdown(departureDate, currentSelectedDays);
  }

  async handleSingleDayCompareSearch() {
    const departure = this.domElements.get('selectAirportFrom')?.getAttribute('data-selected-value') || 'TPE';
    const departureDate = this.domElements.get('inputSingleDate')?.value || '2024-10-10';
    const selectReturnDate = this.domElements.get('selectCompareReturnDate');
    const returnOffset = Number(selectReturnDate?.value) || 5;
    const returnDateStr = this.dateUtils.addDays(departureDate, returnOffset);
    const dayLabel = returnOffset === 1 ? 'day' : 'days';

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
      spanCompareSummary.textContent = `${departure} Departure | ${departureDate} ~ ${returnDateStr} (${returnOffset} ${dayLabel}) | ${selectedDestinations.length} destination${selectedDestinations.length > 1 ? 's' : ''}`;
    }

    // Render initial list with loading spinners and custom return date
    this.singleDayCompareRenderer.renderInitialList(departure, selectedDestinations, departureDate, returnDateStr);

    let corsModalShown = false;

    // Concurrently fetch prices for each destination
    selectedDestinations.forEach(async (dest) => {
      try {
        // Use compact flight numbers display, NOT full card HTML
        const flightNumbersPromise = this.flightNumberService
          ? this.flightNumberService.getFlightNumbersDisplay(departure, dest.code)
          : Promise.resolve('');

        const [flightData, flightNumbers] = await Promise.all([
          this.flightSearch.searchFlight(departure, dest.code, departureDate, cabin, corporateCode, returnDateStr),
          flightNumbersPromise
        ]);

        this.singleDayCompareRenderer.updateItemResult(dest.code, flightData, flightNumbers);
      } catch (error) {
        console.error(`Single day search failed for ${dest.code}:`, error);
        const isCors = error.message === 'CORS_ERROR' ||
          error.message.includes('403') ||
          error.message.includes('CORS') ||
          error.message.includes('Forbidden') ||
          error.message.includes('corsdemo') ||
          error.message.includes('Failed to fetch') ||
          error.name === 'TypeError';

        if (isCors) {
          if (!corsModalShown) {
            corsModalShown = true;
            this.domElements.showModal('modalCORS');
          }
          this.singleDayCompareRenderer.updateItemResult(dest.code, { error: 'CORS_ERROR' });
        } else {
          this.singleDayCompareRenderer.updateItemResult(dest.code, { error: error.message || 'Network Error' });
        }
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
      
      const isCors = error.message === 'CORS_ERROR' ||
        error.message.includes('403') ||
        error.message.includes('CORS') ||
        error.message.includes('Forbidden') ||
        error.message.includes('corsdemo') ||
        error.message.includes('Failed to fetch') ||
        error.name === 'TypeError';

      if (isCors) {
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