/**
 * Flight Search Module
 * Handles flight search API calls and data processing
 */
import { API_ENDPOINTS, DEFAULT_TRAVELERS, DEFAULT_HEADERS, DEFAULT_SEARCH } from '../settings.module.js';

export class FlightSearch {
  constructor() {
    this.apiUrl = API_ENDPOINTS.FLIGHT_SEARCH;
    this.defaultTravelers = DEFAULT_TRAVELERS;
    this.defaultHeaders = DEFAULT_HEADERS;
    this.returnDaysOffset = DEFAULT_SEARCH.RETURN_DAYS_OFFSET;
  }

  async searchFlight(departure, arrival, departureDate, cabin, corporateCode) {
    const returnDateObj = new Date(departureDate);
    returnDateObj.setDate(returnDateObj.getDate() + this.returnDaysOffset);
    const returnDate = returnDateObj.toISOString().split('T')[0];

    const data = {
      cabin,
      itineraries: [
        {
          departure,
          arrival,
          departureDate
        },
        {
          departureDate: returnDate,
          departure: arrival,
          arrival: departure
        }
      ],
      travelers: {
        adt: this.defaultTravelers.ADULTS,
        chd: this.defaultTravelers.CHILDREN,
        inf: this.defaultTravelers.INFANTS
      },
      goFareFamilyCode: null,
      corporateCode
    };

    console.log('API URL:', this.apiUrl);
    console.log('Request data:', data);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const flightData = await response.json();
      console.log('Flight data received:', flightData);
      return flightData;
    } catch (error) {
      console.error('Flight search failed:', error);
      
      if (error.message.includes('See /cors')) {
        throw new Error('CORS_ERROR');
      }
      
      throw error;
    }
  }

  updateUrlParams(departure, arrival, departureDate, returnDate, cabin, corporateCode) {
    const searchParams = new URLSearchParams({
      departure,
      arrival,
      departureDate,
      returnDate,
      cabin,
      corporateCode,
    });

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }
}