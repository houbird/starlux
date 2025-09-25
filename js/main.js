/**
 * Main Application Entry Point
 * Orchestrates all modules and initializes the application
 */
import { DomElements } from './modules/dom-elements.js';
import { DateUtils } from './modules/date-utils.js';
import { HolidayService } from './modules/holiday-service.js';
import { AirportManager } from './modules/airport-manager.js';
import { FlightSearch } from './modules/flight-search.js';
import { UIStateManager } from './modules/ui-state-manager.js';
import { FlightRenderer } from './modules/flight-renderer.js';
import { UrlParamsHandler } from './modules/url-params-handler.js';
import { VersionDisplay } from './modules/version-display.js';
import { AppController } from './modules/app-controller.js';

// Import settings data
// Note: settings.js needs to be loaded before this module
// or converted to export its data

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
        DateUtils
      );

      // Start the application
      this.controller.initialize();
      
      console.log('Starlux Flight Search App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Starlux App:', error);
    }
  }

  // Expose key methods for backward compatibility and testing
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

export const renderFlightInfo = (data, holidays = {}) => {
  if (appInstance?.modules?.flightRenderer) {
    appInstance.modules.flightRenderer.renderFlightInfo(data, holidays);
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