/**
 * DOM Elements Module
 * Manages DOM element references and basic element operations
 */
export class DomElements {
  constructor() {
    this.elements = {};
    this.initializeElements();
  }

  initializeElements() {
    const elementIds = [
      'inputMonth',
      'selectAirportFrom',
      'selectAirportTo',
      'btnReverse',
      'btnSearch',
      'btnMonthPrev',
      'btnMonthNext',
      'spanMonth',
      'containerResult',
      'containerMonthPrice',
      'containerStatistics',
      'loaderContainer',
      'containerClass',
      'containerBankDiscount',
      'modalCORS',
      'modalCORSBackdrop',
      'modalCORSCard',
      'btnModalCORSClose',
      'btnModalCORSOk',
      'version-display',
      'airportSuggestionsContainer',
      'flightCountBadge',
      'tabSearchMonth',
      'tabCompareSingleDay',
      'sectionMonthSearch',
      'sectionCompareSearch',
      'inputSingleDate',
      'containerCountryGroups',
      'containerAirportChips',
      'btnSelectAllAirports',
      'btnClearAllAirports',
      'btnCompareSearch',
      'containerCompareResult',
      'containerCompareList',
      'spanCompareSummary',
      'selectCompareSort'
    ];

    elementIds.forEach(id => {
      this.elements[id] = document.getElementById(id);
    });
  }

  get(elementId) {
    return this.elements[elementId];
  }

  showLoader() {
    this.elements.loaderContainer?.classList.remove('hidden');
  }

  hideLoader() {
    this.elements.loaderContainer?.classList.add('hidden');
  }

  showModal(modalId) {
    this.elements[modalId]?.classList.remove('hidden');
  }

  hideModal(modalId) {
    this.elements[modalId]?.classList.add('hidden');
  }

  updateFlightCountBadge(count) {
    const badge = this.elements.flightCountBadge;
    if (!badge) return;
    
    if (count > 0) {
      badge.textContent = `${count} flight${count > 1 ? 's' : ''}`;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}