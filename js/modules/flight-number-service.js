/**
 * Flight Number Service Module
 * Handles fetching, caching, and querying flight number data
 * Follows Single Responsibility Principle (SRP)
 */
import { API_ENDPOINTS } from '../settings.module.js';

export class FlightNumberService {
  constructor() {
    this.apiUrl = API_ENDPOINTS.FLIGHT_NUMBERS;
    this.storageKey = 'starlux_cached_flight_numbers_v1';
    this.cachedFlights = null;
    this._loadInitialCache();
  }

  /**
   * Initialize memory cache from localStorage if available
   * @private
   */
  _loadInitialCache() {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(this.storageKey);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.cachedFlights = parsed;
          }
        }
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }

  /**
   * Fetch all flight numbers from API with cache fallback
   * @returns {Promise<Array>} Flight number data
   */
  async fetchFlightNumbers() {
    if (this.cachedFlights) {
      return this.cachedFlights;
    }

    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch flight numbers: ${response.status}`);
      }
      
      const data = await response.json();
      this.cachedFlights = data;
      try {
        if (typeof localStorage !== 'undefined' && Array.isArray(data)) {
          localStorage.setItem(this.storageKey, JSON.stringify(data));
        }
      } catch (e) {}
      return data;
    } catch (error) {
      console.error('Error fetching flight numbers:', error);
      return [];
    }
  }

  /**
   * Preload flight numbers in background without blocking UI
   */
  async preloadInBackground() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data)) {
        this.cachedFlights = data;
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Background flight numbers preload skipped:', e.message);
    }
  }

  /**
   * Find flights matching departure and arrival airports
   * @param {string} depIata - Departure airport IATA code (e.g., 'TPE')
   * @param {string} arrIata - Arrival airport IATA code (e.g., 'KMJ')
   * @returns {Promise<Array>} Matching flight numbers
   */
  async findFlights(depIata, arrIata) {
    const flights = await this.fetchFlightNumbers();
    
    return flights.filter(flight => 
      flight.dep_iata === depIata && flight.arr_iata === arrIata
    );
  }

  /**
   * Format flight number for display
   * @param {Object} flight - Flight data object
   * @returns {string} Formatted flight info
   */
  formatFlightInfo(flight) {
    return `${flight.flight_iata} (${flight.dep_iata} → ${flight.arr_iata})`;
  }

  /**
   * Get flight numbers as simple display string
   * @param {string} depIata - Departure airport code
   * @param {string} arrIata - Arrival airport code
   * @returns {Promise<string>} Comma-separated flight numbers
   */
  async getFlightNumbersDisplay(depIata, arrIata) {
    const flights = await this.findFlights(depIata, arrIata);
    
    if (flights.length === 0) {
      return 'No direct flights';
    }
    
    return flights.map(f => f.flight_iata).join(', ');
  }

  /**
   * Get flight count for a route
   * @param {string} depIata - Departure airport code
   * @param {string} arrIata - Arrival airport code
   * @returns {Promise<number>} Number of flights
   */
  async getFlightCount(depIata, arrIata) {
    const flights = await this.findFlights(depIata, arrIata);
    return flights.length;
  }

  /**
   * Get detailed flight information HTML
   * @param {string} depIata - Departure airport code
   * @param {string} arrIata - Arrival airport code
   * @returns {Promise<string>} HTML string with detailed flight info
   */
  async getFlightDetailsHtml(depIata, arrIata) {
    const flights = await this.findFlights(depIata, arrIata);
    
    if (flights.length === 0) {
      return '<div class="text-gray-400 italic">No direct flights available</div>';
    }
    
    const flightCards = flights.map(flight => `
      <div class="bg-gray-800 rounded-lg p-3 mb-2 border border-gray-700 hover:border-blue-500 transition-colors">
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="text-blue-400 font-bold text-lg">${flight.flight_iata}</span>
            <span class="text-gray-500 text-sm ml-2">${flight.flight_icao}</span>
          </div>
          <div class="text-xs text-gray-400">
            <div>${flight.airline_name}</div>
            <div>${flight.airline_iata}</div>
          </div>
        </div>
        <div class="flex items-center text-sm">
          <div class="text-gray-300">
            <div class="font-semibold">${flight.dep_iata}</div>
            <div class="text-xs text-gray-500">${flight.dep_airport}</div>
          </div>
          <div class="mx-3 text-gray-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
            </svg>
          </div>
          <div class="text-gray-300">
            <div class="font-semibold">${flight.arr_iata}</div>
            <div class="text-xs text-gray-500">${flight.arr_airport}</div>
          </div>
        </div>
      </div>
    `).join('');
    
    return flightCards;
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this.cachedFlights = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {}
  }
}
