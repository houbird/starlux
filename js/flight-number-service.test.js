/**
 * Flight Number Service Tests
 * Validates FlightNumberService functionality
 */

import { FlightNumberService } from './modules/flight-number-service.js';

async function testFlightNumberService() {
  console.log('🧪 Starting FlightNumberService Tests...\n');
  
  const service = new FlightNumberService();

  // Test 1: Fetch flight numbers
  console.log('Test 1: Fetching flight numbers from API...');
  const flights = await service.fetchFlightNumbers();
  console.log(`✅ Fetched ${flights.length} flights`);
  console.log(`Sample flight:`, flights[0]);

  // Test 2: Find flights for a specific route (TPE to KMJ)
  console.log('\nTest 2: Finding flights from TPE to KMJ...');
  const tpeToKmj = await service.findFlights('TPE', 'KMJ');
  console.log(`✅ Found ${tpeToKmj.length} flights from TPE to KMJ`);
  tpeToKmj.forEach(flight => {
    console.log(`  - ${service.formatFlightInfo(flight)}`);
  });

  // Test 3: Find flights for another route (TPE to LAX)
  console.log('\nTest 3: Finding flights from TPE to LAX...');
  const tpeToLax = await service.findFlights('TPE', 'LAX');
  console.log(`✅ Found ${tpeToLax.length} flights from TPE to LAX`);
  tpeToLax.forEach(flight => {
    console.log(`  - ${service.formatFlightInfo(flight)}`);
  });

  // Test 4: Format flight info
  console.log('\nTest 4: Testing flight info formatting...');
  if (flights.length > 0) {
    const formatted = service.formatFlightInfo(flights[0]);
    console.log(`✅ Formatted: ${formatted}`);
  }

  // Test 5: Get display string
  console.log('\nTest 5: Getting display string for TPE to KMJ...');
  const displayString = await service.getFlightNumbersDisplay('TPE', 'KMJ');
  console.log(`✅ Display string: ${displayString}`);

  // Test 6: Test non-existent route
  console.log('\nTest 6: Testing non-existent route (AAA to BBB)...');
  const nonExistent = await service.getFlightNumbersDisplay('AAA', 'BBB');
  console.log(`✅ Non-existent route result: ${nonExistent}`);

  // Test 7: Get flight count
  console.log('\nTest 7: Getting flight count for TPE to KMJ...');
  const count = await service.getFlightCount('TPE', 'KMJ');
  console.log(`✅ Flight count: ${count}`);

  // Test 8: Get detailed HTML
  console.log('\nTest 8: Getting detailed HTML for TPE to KMJ...');
  const detailedHtml = await service.getFlightDetailsHtml('TPE', 'KMJ');
  console.log(`✅ HTML length: ${detailedHtml.length} characters`);
  console.log('HTML Preview:', detailedHtml.substring(0, 200) + '...');

  // Test 9: Cache verification
  console.log('\nTest 9: Verifying cache...');
  const startTime = performance.now();
  await service.fetchFlightNumbers();
  const cachedTime = performance.now() - startTime;
  console.log(`✅ Cached fetch time: ${cachedTime.toFixed(2)}ms (should be very fast)`);

  // Test 10: Clear cache
  console.log('\nTest 10: Testing cache clear...');
  service.clearCache();
  const freshStartTime = performance.now();
  await service.fetchFlightNumbers();
  const freshTime = performance.now() - freshStartTime;
  console.log(`✅ Fresh fetch time after clear: ${freshTime.toFixed(2)}ms`);

  console.log('\n✅ All FlightNumberService tests completed successfully!');
}

// Run tests when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', testFlightNumberService);
} else {
  testFlightNumberService();
}

export { testFlightNumberService };
