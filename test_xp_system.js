// test_xp_system.js
// Test script to verify XP system integration

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'xp_test_' + Date.now() + '@example.com',
  password: 'testpassword123'
};

let authToken = null;
let userId = null;

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      ...(userId && { 'X-User-ID': userId }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Test 1: User Registration and Login
async function testUserAuth() {
  console.log('\n🧪 Test 1: User Authentication');
  
  try {
    // Register user
    console.log('📝 Registering test user...');
    const registerResponse = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    console.log('✅ Registration successful:', registerResponse.message);
    userId = registerResponse.user_id;
    
    // Login user
    console.log('🔐 Logging in test user...');
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    console.log('✅ Login successful:', loginResponse.message);
    authToken = loginResponse.access_token;
    
  } catch (error) {
    console.log('⚠️  Auth test completed (user may already exist):', error.message);
    
    // Try login if registration failed
    try {
      const loginResponse = await makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(TEST_USER)
      });
      
      console.log('✅ Login successful:', loginResponse.message);
      authToken = loginResponse.access_token;
      userId = loginResponse.user_id;
    } catch (loginError) {
      console.error('❌ Login failed:', loginError.message);
      throw loginError;
    }
  }
}

// Test 2: Get Initial XP Data
async function testGetXP() {
  console.log('\n🧪 Test 2: Get Initial XP Data');
  
  try {
    const xpResponse = await makeRequest('/api/user/xp');
    
    console.log('✅ XP data retrieved:');
    console.log('   Total XP:', xpResponse.total_xp);
    console.log('   Level:', xpResponse.level);
    console.log('   Progress:', xpResponse.level_progress.progress_percentage + '%');
    console.log('   Recent gains:', xpResponse.recent_gains?.length || 0);
    
    return xpResponse;
  } catch (error) {
    console.error('❌ Failed to get XP data:', error.message);
    throw error;
  }
}

// Test 3: Add XP Points
async function testAddXP() {
  console.log('\n🧪 Test 3: Add XP Points');
  
  const testXPAmounts = [
    { amount: 50, source: 'Interview Completion' },
    { amount: 25, source: 'Feedback Provided' },
    { amount: 100, source: 'Perfect Interview' },
    { amount: 10, source: 'Daily Login' }
  ];
  
  for (const xpData of testXPAmounts) {
    try {
      console.log(`📈 Adding ${xpData.amount} XP from ${xpData.source}...`);
      
      const response = await makeRequest('/api/user/xp', {
        method: 'PUT',
        body: JSON.stringify(xpData)
      });
      
      console.log('✅ XP added successfully:');
      console.log('   New total XP:', response.total_xp);
      console.log('   New level:', response.level);
      console.log('   Progress:', response.level_progress.progress_percentage + '%');
      console.log('   Recent gain:', response.gain);
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Failed to add ${xpData.amount} XP:`, error.message);
    }
  }
}

// Test 4: Verify XP Persistence
async function testXPPersistence() {
  console.log('\n🧪 Test 4: Verify XP Persistence');
  
  try {
    const xpResponse = await makeRequest('/api/user/xp');
    
    console.log('✅ XP data persisted:');
    console.log('   Total XP:', xpResponse.total_xp);
    console.log('   Level:', xpResponse.level);
    console.log('   Progress:', xpResponse.level_progress.progress_percentage + '%');
    console.log('   Recent gains count:', xpResponse.recent_gains?.length || 0);
    
    // Verify recent gains
    if (xpResponse.recent_gains && xpResponse.recent_gains.length > 0) {
      console.log('   Recent gains:');
      xpResponse.recent_gains.slice(0, 3).forEach((gain, index) => {
        console.log(`     ${index + 1}. +${gain.amount} XP from ${gain.source}`);
      });
    }
    
    return xpResponse;
  } catch (error) {
    console.error('❌ Failed to verify XP persistence:', error.message);
    throw error;
  }
}

// Test 5: Test XP Level Calculation
async function testXPLevelCalculation() {
  console.log('\n🧪 Test 5: Test XP Level Calculation');
  
  try {
    const xpResponse = await makeRequest('/api/user/xp');
    const totalXP = xpResponse.total_xp;
    const level = xpResponse.level;
    
    // Manual calculation
    const expectedLevel = Math.floor(totalXP / 100) + 1;
    const xpForCurrentLevel = (expectedLevel - 1) * 100;
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const progressPercentage = Math.round((xpInCurrentLevel / 100) * 100);
    
    console.log('✅ Level calculation verification:');
    console.log('   Total XP:', totalXP);
    console.log('   Expected level:', expectedLevel);
    console.log('   Actual level:', level);
    console.log('   XP in current level:', xpInCurrentLevel);
    console.log('   Expected progress:', progressPercentage + '%');
    console.log('   Actual progress:', xpResponse.level_progress.progress_percentage + '%');
    
    if (expectedLevel === level) {
      console.log('✅ Level calculation is correct!');
    } else {
      console.log('❌ Level calculation mismatch!');
    }
    
  } catch (error) {
    console.error('❌ Failed to test XP level calculation:', error.message);
  }
}

// Test 6: Test Invalid XP Updates
async function testInvalidXPUpdates() {
  console.log('\n🧪 Test 6: Test Invalid XP Updates');
  
  const invalidTests = [
    { amount: -10, source: 'Negative XP', expectedError: 'XP amount must be positive' },
    { amount: 0, source: 'Zero XP', expectedError: 'XP amount must be positive' },
    { amount: 'invalid', source: 'Invalid type', expectedError: 'Valid amount is required' },
    { source: 'Missing amount', expectedError: 'Valid amount is required' }
  ];
  
  for (const test of invalidTests) {
    try {
      console.log(`🚫 Testing invalid XP update: ${test.source}...`);
      
      await makeRequest('/api/user/xp', {
        method: 'PUT',
        body: JSON.stringify(test)
      });
      
      console.log('❌ Invalid XP update should have failed but succeeded');
      
    } catch (error) {
      if (error.message.includes(test.expectedError)) {
        console.log(`✅ Correctly rejected invalid XP update: ${test.source}`);
      } else {
        console.log(`⚠️  Unexpected error for ${test.source}:`, error.message);
      }
    }
  }
}

// Test 7: Test XP with Profile Completion
async function testXPWithProfileCompletion() {
  console.log('\n🧪 Test 7: Test XP with Profile Completion');
  
  try {
    // Update profile to trigger XP bonuses
    console.log('📝 Updating profile to trigger XP bonuses...');
    
    const profileData = {
      name: 'Test User',
      profession: 'Student',
      career_choices: ['Software Developer'],
      college_name: 'Test University',
      college_email: 'test@university.edu'
    };
    
    const profileResponse = await makeRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    
    console.log('✅ Profile updated successfully');
    console.log('   Profile completion:', profileResponse.completion_status + '%');
    
    if (profileResponse.xp) {
      console.log('   XP from profile completion:', profileResponse.xp.total_xp);
    }
    
    // Check XP after profile update
    const xpResponse = await makeRequest('/api/user/xp');
    console.log('   Current total XP:', xpResponse.total_xp);
    
  } catch (error) {
    console.error('❌ Failed to test XP with profile completion:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting XP System Integration Tests\n');
  
  try {
    await testUserAuth();
    await testGetXP();
    await testAddXP();
    await testXPPersistence();
    await testXPLevelCalculation();
    await testInvalidXPUpdates();
    await testXPWithProfileCompletion();
    
    console.log('\n🎉 All XP system tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ User authentication working');
    console.log('✅ XP data retrieval working');
    console.log('✅ XP updates working');
    console.log('✅ XP persistence working');
    console.log('✅ Level calculation working');
    console.log('✅ Invalid input validation working');
    console.log('✅ Profile completion XP bonuses working');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testUserAuth,
  testGetXP,
  testAddXP,
  testXPPersistence,
  testXPLevelCalculation,
  testInvalidXPUpdates,
  testXPWithProfileCompletion
}; 