/**
 * Application Controller Module
 * Main application orchestrator that coordinates all modules
 */
import { DEFAULT_AIRPORTS, DEFAULT_SEARCH, EXTERNAL_URLS } from '../settings.module.js';

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
    dateUtils
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
  }

  initialize() {
    this.setupAirportDropdowns();
    this.setupButtonGroups();
    this.setupEventListeners();
    this.setupInitialState();
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
      }
    });

    this.airportManager.appendAirportDropdown(selectAirportTo, {
      preselected: [DEFAULT_AIRPORTS.TO],
      dropdownId: 'airportToDropdownList',
      onChange: (value) => {
        console.log('Selected TO value:', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportTo, value);
      }
    });

    this.setupDropdownInteractions();
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
    // Reverse button
    this.domElements.get('btnReverse')?.addEventListener('click', () => {
      this.handleReverseAirports();
    });

    // Search button
    this.domElements.get('btnSearch')?.addEventListener('click', () => {
      this.handleFlightSearch();
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
      }
    });

    selectAirportTo.innerHTML = '';
    this.airportManager.appendAirportDropdown(selectAirportTo, {
      preselected: [fromValue],
      dropdownId: 'airportToDropdownList',
      onChange: (value) => {
        console.log('Selected TO value (after reverse):', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportTo, value);
      }
    });

    this.setupDropdownInteractions();
    this.displayAirportSuggestions();
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

      // Fetch flight data and holidays concurrently
      const [year, month] = inputMonth.value.split('-');
      const [flightData, holidays] = await Promise.all([
        this.flightSearch.searchFlight(departure, arrival, departureDate, cabin, corporateCode),
        this.holidayService.fetchHolidaysForMonth(year, month)
      ]);

      console.log('Flight data:', flightData);
      this.flightRenderer.renderFlightInfo(flightData, holidays);
      
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
    }
  }
}