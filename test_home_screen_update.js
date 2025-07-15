// test_home_screen_update.js
// Test script to verify the complete flow of profile updates and HomeScreen refresh

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'home_test_' + Date.now() + '@example.com',
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

// Simulate the complete flow
async function testHomeScreenUpdateFlow() {
  console.log('🧪 Testing HomeScreen Update Flow\n');
  
  try {
    // 1. Register and login user
    console.log('📝 Registering test user...');
    const registerResponse = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    console.log('✅ Registration successful');
    userId = registerResponse.user_id;
    
    console.log('🔐 Logging in test user...');
    const loginResponse = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    console.log('✅ Login successful');
    authToken = loginResponse.access_token;
    
    // 2. Check initial profile completion (simulating HomeScreen load)
    console.log('\n📊 Step 1: Initial HomeScreen load');
    const initialCompletion = await makeRequest('/api/user/profile/completion');
    console.log('   HomeScreen would show profile completion:', initialCompletion.completion_status + '%');
    
    // 3. Simulate user going to ProfileScreen and updating profile
    console.log('\n📝 Step 2: User updates profile in ProfileScreen');
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
    
    console.log('   Profile updated successfully');
    console.log('   New completion status from backend:', profileResponse.completion_status + '%');
    
    // 4. Simulate ProfileScreen calling loadProgressData()
    console.log('\n🔄 Step 3: ProfileScreen calls loadProgressData()');
    const profileCompletionAfterUpdate = await makeRequest('/api/user/profile/completion');
    console.log('   ProfileScreen would show completion:', profileCompletionAfterUpdate.completion_status + '%');
    
    // 5. Simulate user navigating back to HomeScreen
    console.log('\n🏠 Step 4: User navigates back to HomeScreen');
    console.log('   HomeScreen useFocusEffect triggers loadProgressData()');
    const homeScreenCompletion = await makeRequest('/api/user/profile/completion');
    console.log('   HomeScreen would show completion:', homeScreenCompletion.completion_status + '%');
    
    // 6. Verify the flow worked correctly
    console.log('\n✅ Verification:');
    console.log('   Initial completion:', initialCompletion.completion_status + '%');
    console.log('   After profile update:', profileCompletionAfterUpdate.completion_status + '%');
    console.log('   HomeScreen after navigation:', homeScreenCompletion.completion_status + '%');
    
    if (homeScreenCompletion.completion_status > initialCompletion.completion_status) {
      console.log('✅ SUCCESS: HomeScreen would show updated completion percentage!');
    } else {
      console.log('❌ FAILURE: HomeScreen would not show updated completion percentage');
    }
    
    console.log('\n🎉 HomeScreen update flow test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run test
testHomeScreenUpdateFlow(); 