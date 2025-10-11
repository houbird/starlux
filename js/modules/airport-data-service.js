/**
 * Airport Data Service Module
 * Handles fetching and transforming airport data from external API
 * Follows Single Responsibility Principle (SRP) - only responsible for airport data operations
 */
import { API_ENDPOINTS, COUNTRY_TO_REGION, REGION_STYLES } from '../settings.module.js';

export class AirportDataService {
  constructor(apiUrl = API_ENDPOINTS.AIRPORT_ROUTES) {
  constructor(apiUrl = API_ENDPOINTS.AIRPORT_ROUTES) {
    this.apiUrl = apiUrl;
    this.cachedData = null;
  }

  /**
   * Fetch airport data from API
   * @returns {Promise<Array>} Raw airport data from API
   */
  async fetchAirportData() {
    if (this.cachedData) {
      return this.cachedData;
    }

    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch airport data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      this.cachedData = data;
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
    return COUNTRY_TO_REGION[country] || apiRegion;
  }

  /**
   * Format location string from airport name and country
   * @param {string} airportName - Name of the airport
   * @param {string} country - Country name
   * @returns {string} Formatted location string
   */
  formatLocation(airportName, country) {
    // Extract city name from airport name (simple heuristic)
    const cityMatch = airportName.match(/^([^(]+)/);
    const city = cityMatch ? cityMatch[1].trim() : airportName;
    return `${city}, ${country}`;
  }

  /**
   * Generate region styles configuration based on available regions
   * Removes emoji flags as per requirements
   * @param {Array} airports - Transformed airport data
   * @returns {Object} Region styles configuration
   */
  generateRegionStyles(airports) {
    // Use centralized REGION_STYLES configuration
    return REGION_STYLES;
    // Use centralized REGION_STYLES configuration
    return REGION_STYLES;
  }

  /**
   * Get airports and region styles ready for use
   * Main entry point for the service (Facade pattern)
   * @returns {Promise<Object>} Object containing airports and regionStyles
   */
  async getAirportConfiguration() {
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
      // Return fallback data
      return this.getFallbackConfiguration();
    }
  }

  /**
   * Provide fallback configuration if API fails
   * @returns {Object} Minimal working configuration
   */
  getFallbackConfiguration() {
    console.warn('Using fallback airport configuration');
    const fallbackAirports = [
      {
        region: 'Taiwan',
        location: 'Taipei, Taiwan',
        name: 'Taiwan Taoyuan International',
        code: 'TPE',
        country: 'Taiwan',
        disabled: false
      },
      {
        region: 'Northeast Asia',
        location: 'Tokyo, Japan',
        name: 'Narita International Airport',
        code: 'NRT',
        country: 'Japan',
        disabled: false
      }
    ];

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
  }
}
