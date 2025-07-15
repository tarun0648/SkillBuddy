// test_profile_completion.js
// Test script to verify profile completion endpoint

const BASE_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'profile_test_' + Date.now() + '@example.com',
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

// Test profile completion flow
async function testProfileCompletion() {
  console.log('🧪 Testing Profile Completion Flow\n');
  
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
    
    // 2. Check initial profile completion
    console.log('\n📊 Checking initial profile completion...');
    const initialCompletion = await makeRequest('/api/user/profile/completion');
    console.log('✅ Initial completion:', initialCompletion.completion_status + '%');
    
    // 3. Update profile to increase completion
    console.log('\n📝 Updating profile to increase completion...');
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
    console.log('   New completion status:', profileResponse.completion_status + '%');
    
    // 4. Check updated profile completion
    console.log('\n📊 Checking updated profile completion...');
    const updatedCompletion = await makeRequest('/api/user/profile/completion');
    console.log('✅ Updated completion:', updatedCompletion.completion_status + '%');
    
    // 5. Verify the completion percentage increased
    if (updatedCompletion.completion_status > initialCompletion.completion_status) {
      console.log('✅ Profile completion percentage increased correctly!');
    } else {
      console.log('❌ Profile completion percentage did not increase as expected');
    }
    
    console.log('\n🎉 Profile completion test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run test
testProfileCompletion(); 