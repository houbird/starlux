/**
 * Flight Search Module
 * Handles flight search API calls and data processing
 */
import { API_ENDPOINTS, DEFAULT_TRAVELERS, DEFAULT_HEADERS, DEFAULT_SEARCH } from '../settings.module.js?v=1.2.3';

export class FlightSearch {
  constructor() {
    this.apiUrl = API_ENDPOINTS.FLIGHT_SEARCH;
    this.singleDayApiUrl = API_ENDPOINTS.FLIGHT_SEARCH_DAILY || 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/search';
    this.defaultTravelers = DEFAULT_TRAVELERS;
    this.defaultHeaders = DEFAULT_HEADERS;
    this.returnDaysOffset = DEFAULT_SEARCH.RETURN_DAYS_OFFSET;
  }

  async searchFlight(departure, arrival, departureDate, cabin, corporateCode, customReturnDate = null) {
    if (customReturnDate) {
      return this.searchSingleDayFlight(departure, arrival, departureDate, cabin, corporateCode, customReturnDate);
    }

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
        const errorText = await response.text().catch(() => '');
        console.warn(`Flight search API responded with status ${response.status}:`, errorText);
        if (
          response.status === 403 ||
          errorText.includes('corsdemo') ||
          errorText.includes('/cors') ||
          errorText.includes('cors-anywhere')
        ) {
          throw new Error('CORS_ERROR');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const flightData = await response.json();
      console.log('Flight data received:', flightData);
      return flightData;
    } catch (error) {
      console.error('Flight search failed:', error);
      
      if (
        error.message === 'CORS_ERROR' ||
        error.message.includes('403') ||
        error.message.includes('Forbidden') ||
        error.message.includes('See /cors') ||
        error.message.includes('corsdemo') ||
        error.message.includes('Failed to fetch') ||
        error.name === 'TypeError'
      ) {
        throw new Error('CORS_ERROR');
      }
      
      throw error;
    }
  }

  async searchSingleDayFlight(departure, arrival, departureDate, cabin = 'eco', corporateCode = null, customReturnDate = null) {
    let returnDate = customReturnDate;
    if (!returnDate) {
      const returnDateObj = new Date(departureDate);
      returnDateObj.setDate(returnDateObj.getDate() + this.returnDaysOffset);
      returnDate = returnDateObj.toISOString().split('T')[0];
    }

    const data = {
      cabin: cabin || 'eco',
      itineraries: [
        {
          departureDate,
          departure,
          arrival
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
      }
    };

    const headers = {
      'content-type': 'application/json',
      'accept': 'application/json, text/plain, */*',
      'jx-deeplink-from': 'everymundo',
      'jx-lang': 'zh-TW'
    };

    console.log('Single-Day Flight API URL:', this.singleDayApiUrl);
    console.log('Single-Day Flight Request data:', data);

    try {
      const response = await fetch(this.singleDayApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`Single-day flight search API responded with status ${response.status}:`, errorText);
        if (
          response.status === 403 ||
          errorText.includes('corsdemo') ||
          errorText.includes('/cors') ||
          errorText.includes('cors-anywhere')
        ) {
          throw new Error('CORS_ERROR');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const flightData = await response.json();
      console.log('Single-day flight data received:', flightData);
      return flightData;
    } catch (error) {
      console.error('Single-day flight search failed:', error);
      if (
        error.message === 'CORS_ERROR' ||
        error.message.includes('403') ||
        error.message.includes('Forbidden') ||
        error.message.includes('See /cors') ||
        error.message.includes('corsdemo') ||
        error.message.includes('Failed to fetch') ||
        error.name === 'TypeError'
      ) {
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