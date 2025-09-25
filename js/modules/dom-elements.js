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
      'version-display',
      'airportSuggestionsContainer'
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
}