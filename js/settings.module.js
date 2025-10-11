/**
 * Application Configuration Settings - ES6 Module Version
 * This file provides ES6 module exports for use in modern JavaScript modules
 * 
 * For non-module scripts, use settings.js which exposes via window.AppConfig
 */

// ============================================================================
// API Configuration
// ============================================================================

export const API_ENDPOINTS = {
  AIRPORT_ROUTES: 'https://opensheet.elk.sh/1ezR0gCNjmVRRUBKtnP1LfMhGDPPyzLMbH8UsJEMBnrw/routes',
  TAIWAN_CALENDAR: 'https://opensheet.elk.sh/1yC_pjiP0orcMqRy0rpymMjDpISJhiJBcMoOmCowru84/taiwan-calendar',
  FLIGHT_SEARCH: 'https://cors-anywhere.herokuapp.com/https://ecapi.starlux-airlines.com/searchFlight/v2/flights/calendars/monthly',
  CORS_PROXY: 'https://cors-anywhere.herokuapp.com',
  STARLUX_BASE: 'https://ecapi.starlux-airlines.com'
};

export const EXTERNAL_URLS = {
  CORS_DEMO: 'https://cors-anywhere.herokuapp.com/corsdemo',
  STARLUX_BOOKING: 'https://www.starlux-airlines.com/zh-TW/booking/everymundo',
  STARLUX_SEARCH: 'https://www.starlux-airlines.com/en-TW/booking/search-result?trip=round-trip',
  STARLUX_MAIN: 'https://www.STARLUX-airlines.com/'
};

// ============================================================================
// Application Defaults
// ============================================================================

export const DEFAULT_AIRPORTS = {
  FROM: 'TPE',
  TO: 'KMJ'
};

export const DEFAULT_SEARCH = {
  CABIN_CLASS: 'eco',
  CORPORATE_CODE: 'COBRAND01',
  RETURN_DAYS_OFFSET: 5,
  MAX_SUGGESTIONS: 5
};

export const DEFAULT_TRAVELERS = {
  ADULTS: 1,
  CHILDREN: 0,
  INFANTS: 0
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'jx-lang': 'zh-TW'
};

// ============================================================================
// Region Styles Configuration
// ============================================================================

export const REGION_STYLES = {
  "Taiwan": { borderColorClass: "border-region-taiwan" },
  "Hong Kong / Macau Area": { borderColorClass: "border-region-hkmo" },
  "Northeast Asia": { borderColorClass: "border-region-neasia" },
  "Southeast Asia": { borderColorClass: "border-region-seasia" },
  "North America": { borderColorClass: "border-region-namerica" },
  "Middle East": { borderColorClass: "border-region-middle-east" },
  "Europe": { borderColorClass: "border-region-europe" }
};

export const REGION_COLORS = {
  'region-taiwan': '#00A0A0',
  'region-hkmo': '#800080',
  'region-neasia': '#4682B4',
  'region-seasia': '#FFA500',
  'region-namerica': '#B22222',
  'region-middle-east': '#DAA520',
  'region-europe': '#228B22'
};

export const COUNTRY_TO_REGION = {
  'Taiwan': 'Taiwan',
  'Hong Kong': 'Hong Kong / Macau Area',
  'Macau': 'Hong Kong / Macau Area',
  'Japan': 'Northeast Asia',
  'South Korea': 'Northeast Asia',
  'Thailand': 'Southeast Asia',
  'Vietnam': 'Southeast Asia',
  'Philippines': 'Southeast Asia',
  'Malaysia': 'Southeast Asia',
  'Singapore': 'Southeast Asia',
  'Indonesia': 'Southeast Asia',
  'United States': 'North America',
  'Canada': 'North America',
  'United Arab Emirates': 'Middle East',
  'Belgium': 'Europe',
  'Czech Republic': 'Europe'
};

// ============================================================================
// Cabin Classes Configuration
// ============================================================================

export const CABIN_CLASSES = {
  ECONOMY: { code: 'eco', label: 'Economy' },
  PREMIUM_ECONOMY: { code: 'ecoPremium', label: 'Premium Economy' },
  BUSINESS: { code: 'business', label: 'Business' },
  FIRST: { code: 'first', label: 'First' }
};

export const BANK_DISCOUNTS = {
  NONE: { code: '', label: 'None' },
  WORLD_ELITE: { code: 'COBRAND01', label: 'World Elite_10% off' },
  WORLD: { code: 'COBRAND01', label: 'World_10% off' },
  TITANIUM_BUSINESS: { code: 'COBRAND02', label: 'Titanium business_5% off' },
  TITANIUM: { code: 'COBRAND02', label: 'Titanium_5% off' }
};

// ============================================================================
// UI Configuration
// ============================================================================

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DROPDOWN_CONFIG = {
  DARK_MODE: true,
  MULTIPLE: false,
  ENABLE_SEARCH: true
};
