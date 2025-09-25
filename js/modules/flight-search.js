/**
 * Flight Search Module
 * Handles flight search API calls and data processing
 */
export class FlightSearch {
  constructor() {
    this.apiUrl = 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/calendars/monthly';
  }

  async searchFlight(departure, arrival, departureDate, cabin, corporateCode) {
    const returnDateObj = new Date(departureDate);
    returnDateObj.setDate(returnDateObj.getDate() + 5);
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
        adt: 1,
        chd: 0,
        inf: 0
      },
      goFareFamilyCode: null,
      corporateCode
    };

    console.log('API URL:', this.apiUrl);
    console.log('Request data:', data);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'jx-lang': 'zh-TW',
        },
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