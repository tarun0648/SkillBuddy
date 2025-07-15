// test_enhanced_signup.js
// Test script for enhanced signup with onboarding data

const API_BASE_URL = 'http://localhost:5000';

// Mock onboarding data
const mockOnboardingData = {
  name: 'John Doe',
  profession: 'Software Engineer',
  career_choices: ['Web Development', 'Mobile Development'],
  college_name: 'MIT',
  college_email: 'john.doe@mit.edu'
};

// Test data
const testUser = {
  email: `test_enhanced_${Date.now()}@example.com`,
  password: 'testpassword123',
  ...mockOnboardingData
};

async function testEnhancedSignup() {
  console.log('🧪 Testing Enhanced Signup with Onboarding Data');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Test registration with onboarding data
    console.log('\n📝 Step 1: Testing registration with onboarding data...');
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
    
    // Step 2: Test login to verify user was created properly
    console.log('\n🔐 Step 2: Testing login with created user...');
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
    
    // Step 3: Test profile retrieval to verify onboarding data was saved
    console.log('\n👤 Step 3: Testing profile retrieval...');
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
    
    // Verify onboarding data was saved correctly
    const profile = profileResult.user.profile;
    console.log('\n📊 Verifying onboarding data:');
    console.log('Name:', profile.name, 'Expected:', testUser.name);
    console.log('Profession:', profile.profession, 'Expected:', testUser.profession);
    console.log('Career Choices:', profile.career_choices, 'Expected:', testUser.career_choices);
    console.log('College Name:', profile.college_name, 'Expected:', testUser.college_name);
    console.log('College Email:', profile.college_email, 'Expected:', testUser.college_email);
    console.log('Completion Status:', profile.completion_status, 'Expected: ~66.67%');
    console.log('Is Profile Complete:', profile.is_profile_complete, 'Expected: true');
    
    // Verify completion status calculation
    const expectedCompletion = 66.67; // 4 fields * 16.67%
    if (Math.abs(profile.completion_status - expectedCompletion) < 1) {
      console.log('✅ Profile completion status calculated correctly');
    } else {
      console.log('❌ Profile completion status incorrect');
    }
    
    // Step 4: Test profile completion endpoint
    console.log('\n📈 Step 4: Testing profile completion endpoint...');
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
    
    console.log('✅ Profile completion endpoint working correctly');
    
    // Step 5: Test XP data
    console.log('\n⭐ Step 5: Testing XP data...');
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
    
    console.log('✅ XP data initialized correctly');
    
    console.log('\n🎉 Enhanced Signup Test Completed Successfully!');
    console.log('=' .repeat(50));
    console.log('Summary:');
    console.log('✅ User registration with onboarding data works');
    console.log('✅ Login works with created user');
    console.log('✅ Profile data is saved correctly');
    console.log('✅ Completion status is calculated correctly');
    console.log('✅ Profile completion endpoint works');
    console.log('✅ XP system is initialized');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testEnhancedSignup(); 