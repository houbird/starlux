/**
 * Airport Data Service Module
 * Handles fetching, caching (SWR), and transforming airport data from external API
 * Follows Single Responsibility Principle (SRP)
 */
import { API_ENDPOINTS, COUNTRY_TO_REGION, REGION_STYLES } from '../settings.module.js';
import { DEFAULT_AIRPORT_ROUTES } from './default-airports-data.js';

export class AirportDataService {
  constructor(apiUrl = API_ENDPOINTS.AIRPORT_ROUTES) {
    this.apiUrl = apiUrl;
    this.storageKey = 'starlux_cached_airport_routes_v1';
    this.cachedData = null;
  }

  /**
   * Safely read cached routes from localStorage
   * @returns {Array|null}
   */
  getStorageData() {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(this.storageKey);
        if (item) {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read airport routes from localStorage:', e);
    }
    return null;
  }

  /**
   * Safely write routes to localStorage
   * @param {Array} data
   */
  saveStorageData(data) {
    try {
      if (typeof localStorage !== 'undefined' && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Failed to write airport routes to localStorage:', e);
    }
  }

  /**
   * Synchronous airport configuration getter for instant sub-millisecond startup (SWR)
   * Prioritizes localStorage cache, falls back to bundled DEFAULT_AIRPORT_ROUTES
   * @returns {Object} { airports, regionStyles }
   */
  getAirportConfigurationSync() {
    const rawData = this.getStorageData() || DEFAULT_AIRPORT_ROUTES;
    this.cachedData = rawData;
    const airports = this.transformAirportData(rawData);
    const regionStyles = this.generateRegionStyles(airports);

    return {
      airports,
      regionStyles
    };
  }

  /**
   * Fetch airport data from API
   * @returns {Promise<Array>} Raw airport data from API
   */
  async fetchAirportData() {
    if (this.cachedData) {
      return this.cachedData;
    }

    const stored = this.getStorageData();
    if (stored) {
      this.cachedData = stored;
      return stored;
    }

    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch airport data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cachedData = data;
      this.saveStorageData(data);
      return data;
    } catch (error) {
      console.error('Error fetching airport data:', error);
      throw error;
    }
  }

  /**
   * Transform API data to application format
   * Maps from API structure to internal airport structure
   * @param {Array} apiData - Raw data from API
   * @returns {Array} Transformed airport data
   */
  transformAirportData(apiData) {
    return apiData.map(airport => ({
      region: this.getRegionFromCountry(airport.country, airport.region),
      location: this.formatLocation(airport.airport, airport.country),
      name: airport.airport,
      code: airport.iata,
      country: airport.country,
      timezone: airport.timezone,
      disabled: false
    }));
  }

  /**
   * Map country to application region
   * @param {string} country - Country name
   * @param {string} apiRegion - Region from API (Asia, America, Europe, etc.)
   * @returns {string} Application region name
   */
  getRegionFromCountry(country, apiRegion) {
    return COUNTRY_TO_REGION[country] || apiRegion;
  }

  /**
   * Format location string from airport name and country
   * @param {string} airportName - Name of the airport
   * @param {string} country - Country name
   * @returns {string} Formatted location string
   */
  formatLocation(airportName, country) {
    const cityMatch = airportName.match(/^([^(]+)/);
    const city = cityMatch ? cityMatch[1].trim() : airportName;
    return `${city}, ${country}`;
  }

  /**
   * Generate region styles configuration based on available regions
   * @param {Array} airports - Transformed airport data
   * @returns {Object} Region styles configuration
   */
  generateRegionStyles(airports) {
    return REGION_STYLES;
  }

  /**
   * Main entry point for the service (Facade pattern)
   * Resolves immediately with cached/bundled data if available
   * @returns {Promise<Object>} Object containing airports and regionStyles
   */
  async getAirportConfiguration() {
    const syncConfig = this.getAirportConfigurationSync();
    if (syncConfig?.airports?.length > 0) {
      return syncConfig;
    }

    try {
      const rawData = await this.fetchAirportData();
      const airports = this.transformAirportData(rawData);
      const regionStyles = this.generateRegionStyles(airports);

      return {
        airports,
        regionStyles
      };
    } catch (error) {
      console.error('Failed to get airport configuration:', error);
      return this.getFallbackConfiguration();
    }
  }

  /**
   * Background revalidation (SWR)
   * Fetches latest routes in background without blocking UI, updates cache,
   * and fires callback if routes have changed
   * @param {Function} onUpdateCallback - Optional callback({ airports, regionStyles })
   */
  async refreshDataInBackground(onUpdateCallback = null) {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) return;

      const freshData = await response.json();
      if (!Array.isArray(freshData) || freshData.length === 0) return;

      const currentIatas = new Set((this.cachedData || []).map(a => a.iata));
      const freshIatas = new Set(freshData.map(a => a.iata));
      const hasDifference = freshData.length !== (this.cachedData || []).length ||
        freshData.some(a => !currentIatas.has(a.iata)) ||
        (this.cachedData || []).some(a => !freshIatas.has(a.iata));

      this.cachedData = freshData;
      this.saveStorageData(freshData);

      if (hasDifference && typeof onUpdateCallback === 'function') {
        const airports = this.transformAirportData(freshData);
        const regionStyles = this.generateRegionStyles(airports);
        onUpdateCallback({ airports, regionStyles });
      }
    } catch (error) {
      console.warn('Background airport data refresh skipped:', error.message);
    }
  }

  /**
   * Provide fallback configuration if API fails
   * @returns {Object} Minimal working configuration
   */
  getFallbackConfiguration() {
    console.warn('Using fallback airport configuration');
    const fallbackAirports = this.transformAirportData(DEFAULT_AIRPORT_ROUTES);
    return {
      airports: fallbackAirports,
      regionStyles: this.generateRegionStyles(fallbackAirports)
    };
  }

  /**
   * Clear cached data (useful for testing or forcing refresh)
   */
  clearCache() {
    this.cachedData = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch (e) {}
  }
}
