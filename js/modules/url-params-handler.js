/**
 * URL Parameters Handler Module
 * Manages URL parameter parsing and state restoration
 */
export class UrlParamsHandler {
  constructor(domElements, airportManager, uiStateManager) {
    this.domElements = domElements;
    this.airportManager = airportManager;
    this.uiStateManager = uiStateManager;
  }

  parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      departure: urlParams.get('departure'),
      arrival: urlParams.get('arrival'),
      departureDate: urlParams.get('departureDate'),
      cabin: urlParams.get('cabin'),
      corporateCode: urlParams.get('corporateCode'),
      bankDiscount: urlParams.get('bankDiscount')
    };
  }

  getEffectiveCorporateCode(params) {
    // bankDiscount has priority over corporateCode
    if (params.bankDiscount) {
      return params.bankDiscount;
    } else if (params.corporateCode) {
      return params.corporateCode;
    }
    return null;
  }

  restoreAirportSelections(departure, arrival) {
    const selectAirportFrom = this.domElements.get('selectAirportFrom');
    const selectAirportTo = this.domElements.get('selectAirportTo');

    // Clear and recreate from dropdown
    selectAirportFrom.innerHTML = '';
    this.airportManager.appendAirportDropdown(selectAirportFrom, {
      preselected: [departure],
      dropdownId: 'airportFromDropdownList',
      onChange: (value) => {
        console.log('Selected FROM value (URL params):', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportFrom, value);
      }
    });

    // Clear and recreate to dropdown
    selectAirportTo.innerHTML = '';
    this.airportManager.appendAirportDropdown(selectAirportTo, {
      preselected: [arrival],
      dropdownId: 'airportToDropdownList',
      onChange: (value) => {
        console.log('Selected TO value (URL params):', value);
        this.airportManager.updateAirportSelectorStyle(selectAirportTo, value);
      }
    });

    this.reattachDropdownEventListeners();
  }

  reattachDropdownEventListeners() {
    const fromButton = this.domElements.get('selectAirportFrom').querySelector('button');
    const toButton = this.domElements.get('selectAirportTo').querySelector('button');

    if (fromButton) {
      fromButton.addEventListener('click', () => {
        this.uiStateManager.closeDropdown('airportToDropdownList');
      });
    }

    if (toButton) {
      toButton.addEventListener('click', () => {
        this.uiStateManager.closeDropdown('airportFromDropdownList');
      });
    }
  }

  restoreFormState(params) {
    const effectiveCorporateCode = this.getEffectiveCorporateCode(params);

    // Set cabin class if provided
    if (params.cabin) {
      this.uiStateManager.setSelectedValue(
        this.domElements.get('containerClass'),
        'cabin',
        params.cabin
      );
    }

    // Set corporate discount if provided
    if (effectiveCorporateCode) {
      this.uiStateManager.setSelectedValue(
        this.domElements.get('containerBankDiscount'),
        'bankDiscount',
        effectiveCorporateCode
      );
    }

    // Update input month value
    if (params.departureDate) {
      const inputMonth = this.domElements.get('inputMonth');
      const spanMonth = this.domElements.get('spanMonth');
      inputMonth.value = params.departureDate.slice(0, 7);
      spanMonth.textContent = inputMonth.value;
    }
  }

  handleUrlParams(onFlightSearch) {
    const params = this.parseUrlParams();
    
    if (params.departure && params.arrival && params.departureDate) {
      this.restoreAirportSelections(params.departure, params.arrival);
      this.restoreFormState(params);
      
      // Trigger flight search with restored state
      if (onFlightSearch) {
        onFlightSearch(params.departure, params.arrival, params.departureDate);
      }
    }
  }
}