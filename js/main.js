/**
 * Main Application Entry Point
 * Orchestrates all modules and initializes the application
 */
import { DomElements } from './modules/dom-elements.js?v=1.2.2';
import { DateUtils } from './modules/date-utils.js?v=1.2.2';
import { HolidayService } from './modules/holiday-service.js?v=1.2.2';
import { AirportManager } from './modules/airport-manager.js?v=1.2.2';
import { AirportDataService } from './modules/airport-data-service.js?v=1.2.2';
import { FlightSearch } from './modules/flight-search.js?v=1.2.2';
import { UIStateManager } from './modules/ui-state-manager.js?v=1.2.2';
import { FlightRenderer } from './modules/flight-renderer.js?v=1.2.2';
import { UrlParamsHandler } from './modules/url-params-handler.js?v=1.2.2';
import { VersionDisplay } from './modules/version-display.js?v=1.2.2';
import { FlightNumberService } from './modules/flight-number-service.js?v=1.2.2';
import { AppController } from './modules/app-controller.js?v=1.2.2';

/**
 * Application class that initializes and coordinates all modules
 */
class StarluxApp {
  constructor() {
    this.modules = {};
    this.controller = null;
  }

  async initialize() {
    try {
      // Initialize core modules
      this.modules.domElements = new DomElements();
      this.modules.holidayService = new HolidayService();
      this.modules.flightNumberService = new FlightNumberService();
      
      // Fetch airport data from API
      this.modules.airportDataService = new AirportDataService();
      const { airports, regionStyles } = await this.modules.airportDataService.getAirportConfiguration();
      
      // Initialize airport manager with fetched data
      this.modules.airportManager = new AirportManager(airports, regionStyles);
      this.modules.flightSearch = new FlightSearch();
      this.modules.uiStateManager = new UIStateManager();
      this.modules.flightRenderer = new FlightRenderer(this.modules.domElements);
      this.modules.versionDisplay = new VersionDisplay(this.modules.domElements);
      
      this.modules.urlParamsHandler = new UrlParamsHandler(
        this.modules.domElements,
        this.modules.airportManager,
        this.modules.uiStateManager
      );

      // Initialize application controller
      this.controller = new AppController(
        this.modules.domElements,
        this.modules.airportManager,
        this.modules.flightSearch,
        this.modules.flightRenderer,
        this.modules.holidayService,
        this.modules.uiStateManager,
        this.modules.urlParamsHandler,
        this.modules.versionDisplay,
        DateUtils,
        this.modules.flightNumberService
      );

      // Start the application
      this.controller.initialize();
      
      console.log('Starlux Flight Search App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Starlux App:', error);
    }
  }  // Expose key methods for backward compatibility and testing
  getController() {
    return this.controller;
  }

  getModule(moduleName) {
    return this.modules[moduleName];
  }
}

// Global app instance
let appInstance = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
  appInstance = new StarluxApp();
  await appInstance.initialize();
});

// Export functions for backward compatibility with existing code/tests
// These will delegate to the appropriate modules
export const searchFlight = (departure, arrival, departureDate) => {
  if (appInstance?.controller) {
    appInstance.controller.performFlightSearch(departure, arrival, departureDate);
  }
};

export const renderFlightInfo = (data, holidays = {}, flightDetailsHtml = '') => {
  if (appInstance?.modules?.flightRenderer) {
    appInstance.modules.flightRenderer.renderFlightInfo(data, holidays, flightDetailsHtml);
  }
};

export const urlParamsHandler = () => {
  if (appInstance?.modules?.urlParamsHandler) {
    appInstance.modules.urlParamsHandler.handleUrlParams((departure, arrival, departureDate) => {
      if (appInstance?.controller) {
        appInstance.controller.performFlightSearch(departure, arrival, departureDate);
      }
    });
  }
};

export const displayVersion = () => {
  if (appInstance?.modules?.versionDisplay) {
    appInstance.modules.versionDisplay.displayVersion();
  }
};

export const formatMonthDate = (monthValue) => {
  return DateUtils.formatMonthDate(monthValue);
};

// Make functions available globally for testing and backward compatibility
if (typeof window !== 'undefined') {
  window.searchFlight = searchFlight;
  window.renderFlightInfo = renderFlightInfo;
  window.urlParamsHandler = urlParamsHandler;
  window.displayVersion = displayVersion;
  window.formatMonthDate = formatMonthDate;
  window.StarluxApp = StarluxApp;
  window.appInstance = appInstance;
}