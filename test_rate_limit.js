// Test script to verify rate limiting
const axios = require('axios');

const BASE_URL = 'http://localhost:5000'; // Adjust if your backend runs on different port
const USER_ID = 'test_user_id'; // Replace with actual user ID

async function testRateLimit() {
  console.log('Testing rate limiting for XP endpoint...\n');
  
  const headers = {
    'X-User-ID': USER_ID,
    'Content-Type': 'application/json'
  };
  
  let successCount = 0;
  let rateLimitCount = 0;
  
  // Make 10 requests quickly to test rate limiting
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`Request ${i}: Making XP request...`);
      const response = await axios.get(`${BASE_URL}/api/user/xp`, { headers });
      console.log(`Request ${i}: ✅ Success - Status: ${response.status}`);
      successCount++;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.log(`Request ${i}: ❌ Rate Limited - Status: ${error.response.status}`);
        rateLimitCount++;
      } else {
        console.log(`Request ${i}: ❌ Error - ${error.message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n=== Rate Limit Test Results ===');
  console.log(`Successful requests: ${successCount}`);
  console.log(`Rate limited requests: ${rateLimitCount}`);
  console.log(`Total requests: ${successCount + rateLimitCount}`);
  
  if (rateLimitCount > 0) {
    console.log('✅ Rate limiting is working!');
  } else {
    console.log('⚠️  No rate limiting detected - check configuration');
  }
}

// Run the test
testRateLimit().catch(console.error); 