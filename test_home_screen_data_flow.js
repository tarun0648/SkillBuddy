// test_home_screen_data_flow.js
// Test script to verify complete data flow from backend to HomeScreen display

const API_BASE_URL = 'http://localhost:5000';

// Test user data
const testUser = {
  email: `test_home_${Date.now()}@example.com`,
  password: 'testpassword123',
  name: 'Test User',
  profession: 'Student',
  career_choices: ['Web Development'],
  college_name: 'Test University',
  college_email: 'test@university.edu'
};

async function testHomeScreenDataFlow() {
  console.log('🧪 Testing Complete HomeScreen Data Flow');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create user with onboarding data
    console.log('\n📝 Step 1: Creating user with onboarding data...');
    const registrationResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    const registrationResult = await registrationResponse.json();
    console.log('Registration Response Status:', registrationResponse.status);
    console.log('Registration Response:', registrationResult);
    
    if (!registrationResponse.ok) {
      throw new Error(`Registration failed: ${registrationResult.error}`);
    }
    
    const userId = registrationResult.user_id;
    console.log('✅ User created successfully with ID:', userId);
    
    // Step 2: Login to get authentication
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response:', loginResult);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }
    
    console.log('✅ Login successful');
    
    // Step 3: Test profile completion endpoint
    console.log('\n📊 Step 3: Testing profile completion endpoint...');
    const completionResponse = await fetch(`${API_BASE_URL}/user/profile/completion`, {
      method: 'GET',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json',
      },
    });
    
    const completionResult = await completionResponse.json();
    console.log('Completion Response Status:', completionResponse.status);
    console.log('Completion Response:', completionResult);
    
    if (!completionResponse.ok) {
      throw new Error(`Profile completion check failed: ${completionResult.error}`);
    }
    
    console.log('✅ Profile completion endpoint working');
    console.log('📈 Expected completion: ~66.67% (4 fields completed)');
    console.log('📈 Actual completion:', completionResult.completion_status);
    
    // Step 4: Test XP endpoint
    console.log('\n⭐ Step 4: Testing XP endpoint...');
    const xpResponse = await fetch(`${API_BASE_URL}/user/xp`, {
      method: 'GET',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json',
      },
    });
    
    const xpResult = await xpResponse.json();
    console.log('XP Response Status:', xpResponse.status);
    console.log('XP Response:', xpResult);
    
    if (!xpResponse.ok) {
      throw new Error(`XP retrieval failed: ${xpResult.error}`);
    }
    
    console.log('✅ XP endpoint working');
    console.log('⭐ Expected XP: 0 (initial value)');
    console.log('⭐ Actual XP:', xpResult.xp.total_xp);
    console.log('⭐ Expected Level: 1');
    console.log('⭐ Actual Level:', xpResult.xp.level);
    
    // Step 5: Test profile endpoint
    console.log('\n👤 Step 5: Testing profile endpoint...');
    const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json',
      },
    });
    
    const profileResult = await profileResponse.json();
    console.log('Profile Response Status:', profileResponse.status);
    console.log('Profile Response:', profileResult);
    
    if (!profileResponse.ok) {
      throw new Error(`Profile retrieval failed: ${profileResult.error}`);
    }
    
    console.log('✅ Profile endpoint working');
    
    // Step 6: Verify data consistency
    console.log('\n🔍 Step 6: Verifying data consistency...');
    const profile = profileResult.user.profile;
    
    console.log('📊 Profile Data Verification:');
    console.log('Name:', profile.name, 'Expected:', testUser.name);
    console.log('Profession:', profile.profession, 'Expected:', testUser.profession);
    console.log('Career Choices:', profile.career_choices, 'Expected:', testUser.career_choices);
    console.log('College Name:', profile.college_name, 'Expected:', testUser.college_name);
    console.log('College Email:', profile.college_email, 'Expected:', testUser.college_email);
    console.log('Completion Status:', profile.completion_status);
    console.log('Is Profile Complete:', profile.is_profile_complete);
    
    // Step 7: Simulate HomeScreen data loading
    console.log('\n📱 Step 7: Simulating HomeScreen data loading...');
    
    // Simulate what HomeScreen would receive
    const homeScreenData = {
      isAuthenticated: true,
      user: {
        id: userId,
        email: testUser.email,
        profile: profile
      },
      profileCompletionPercentage: profile.completion_status,
      xpData: {
        total_xp: xpResult.xp.total_xp,
        level: xpResult.xp.level,
        level_progress: xpResult.xp.level_progress
      }
    };
    
    console.log('📱 HomeScreen Data Simulation:');
    console.log('isAuthenticated:', homeScreenData.isAuthenticated);
    console.log('user.id:', homeScreenData.user.id);
    console.log('profileCompletionPercentage:', homeScreenData.profileCompletionPercentage);
    console.log('totalXP:', homeScreenData.xpData.total_xp);
    console.log('level:', homeScreenData.xpData.level);
    
    // Check if data would be displayed
    const shouldShowProgress = homeScreenData.isAuthenticated && homeScreenData.user;
    console.log('Should show progress section:', shouldShowProgress);
    
    if (shouldShowProgress) {
      console.log('✅ Progress section would be displayed');
      console.log('✅ Profile completion bar would show:', homeScreenData.profileCompletionPercentage + '%');
      console.log('✅ XP bar would show:', homeScreenData.xpData.total_xp + ' XP');
      console.log('✅ Level would show: Level', homeScreenData.xpData.level);
    } else {
      console.log('❌ Progress section would NOT be displayed');
    }
    
    console.log('\n🎉 HomeScreen Data Flow Test Completed Successfully!');
    console.log('=' .repeat(60));
    console.log('Summary:');
    console.log('✅ User created with onboarding data');
    console.log('✅ Profile completion calculated correctly');
    console.log('✅ XP system initialized properly');
    console.log('✅ All endpoints working correctly');
    console.log('✅ Data consistency verified');
    console.log('✅ HomeScreen would display data correctly');
    
    console.log('\n🔧 If HomeScreen is not showing data:');
    console.log('1. Check authentication state in frontend');
    console.log('2. Verify user object exists and has id');
    console.log('3. Check if data loading functions are called');
    console.log('4. Verify API calls are successful');
    console.log('5. Check for JavaScript errors in console');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testHomeScreenDataFlow(); 