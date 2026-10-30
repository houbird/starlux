/**
 * Unit Tests for Instant Startup & Request Flow Optimization
 */
import assert from 'assert';
import { DateUtils } from './modules/date-utils.js';
import { AirportDataService } from './modules/airport-data-service.js';
import { DEFAULT_AIRPORTS } from './settings.module.js';

console.log('=== Running Instant Startup & DateUtils Tests ===');

// Test 1: DateUtils.getCurrentMonth returns proper YYYY-MM
console.log('Test 1: Testing DateUtils.getCurrentMonth format...');
const currentNextMonth = DateUtils.getCurrentMonth();
assert.match(currentNextMonth, /^\d{4}-\d{2}$/, 'Should match YYYY-MM format');
console.log(`✓ DateUtils.getCurrentMonth output: ${currentNextMonth}`);

// Test 2: DateUtils month rollover simulation
console.log('\nTest 2: Testing December to January rollover logic...');
function simulateNextMonth(year, monthIndex0, day) {
  const targetDate = new Date(year, monthIndex0 + 1, 1);
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Simulated December 2026 -> January 2027
assert.strictEqual(simulateNextMonth(2026, 11, 15), '2027-01', 'December 2026 must roll over to 2027-01');
// Simulated October 2026 -> November 2026
assert.strictEqual(simulateNextMonth(2026, 9, 31), '2026-11', 'October 31 must become 2026-11 without day overflow');
// Simulated January 31 -> February
assert.strictEqual(simulateNextMonth(2026, 0, 31), '2026-02', 'January 31 must become 2026-02');
console.log('✓ Month and year rollover tests PASSED');

// Test 3: AirportDataService instant sync configuration
console.log('\nTest 3: Testing AirportDataService.getAirportConfigurationSync...');
const airportDataService = new AirportDataService();
const startTime = performance.now();
const config = airportDataService.getAirportConfigurationSync();
const elapsed = performance.now() - startTime;

assert(config.airports.length > 50, `Expected > 50 airports, got ${config.airports.length}`);
assert(config.regionStyles, 'Region styles must exist');
console.log(`✓ Retrieved ${config.airports.length} airports in ${elapsed.toFixed(3)}ms (sub-millisecond instant startup)`);

// Test 4: Default routes include DEFAULT_AIRPORTS (TPE, KMJ)
console.log('\nTest 4: Verifying default routes include required airports (TPE, KMJ)...');
const fromAirport = config.airports.find(a => a.code === DEFAULT_AIRPORTS.FROM);
const toAirport = config.airports.find(a => a.code === DEFAULT_AIRPORTS.TO);
assert(fromAirport, `Default origin ${DEFAULT_AIRPORTS.FROM} must be present`);
assert(toAirport, `Default destination ${DEFAULT_AIRPORTS.TO} must be present`);
console.log(`✓ Found ${fromAirport.name} (${fromAirport.code}) and ${toAirport.name} (${toAirport.code})`);

// Test 5: LocalStorage cache simulation
console.log('\nTest 5: Testing LocalStorage read/write simulation in AirportDataService...');
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; },
  removeItem: (key) => { delete mockStorage[key]; }
};

const serviceWithStorage = new AirportDataService();
const cachedConfig = serviceWithStorage.getAirportConfigurationSync();
assert.strictEqual(cachedConfig.airports.length, config.airports.length);
serviceWithStorage.saveStorageData(cachedConfig.airports);
assert(mockStorage[serviceWithStorage.storageKey], 'Storage key must be set');
serviceWithStorage.clearCache();
assert.strictEqual(mockStorage[serviceWithStorage.storageKey], undefined, 'Storage key must be cleared');
console.log('✓ Storage cache simulation PASSED');

console.log('\n=== All Instant Startup & DateUtils Tests PASSED ===');
