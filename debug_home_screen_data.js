// debug_home_screen_data.js
// Debug script to identify why profile completion and XP data are not showing in HomeScreen

console.log('🔍 Debugging HomeScreen Data Display Issues');
console.log('=' .repeat(50));

console.log('\n📱 HomeScreen Implementation Analysis:');
console.log('✅ Progress Section is conditionally rendered: {isAuthenticated && user && ...}');
console.log('✅ Profile Completion: ProgressBar with profileCompletionPercentage');
console.log('✅ XP Level: ProgressBar with getProgressPercentage()');
console.log('✅ Data loading: loadProgressData() and loadXPData() called on mount and focus');

console.log('\n🔧 Potential Issues:');

console.log('\n1. 🔐 Authentication Issues:');
console.log('❓ isAuthenticated() might be returning false');
console.log('❓ user object might be null or undefined');
console.log('❓ user.id might be missing');

console.log('\n2. 📊 Data Loading Issues:');
console.log('❓ loadProgressData() might be failing');
console.log('❓ loadXPData() might be failing');
console.log('❓ API calls might be returning errors');
console.log('❓ Network connectivity issues');

console.log('\n3. 🎯 Data State Issues:');
console.log('❓ profileCompletionPercentage might be 0 or undefined');
console.log('❓ XP data might not be properly initialized');
console.log('❓ Zustand stores might not be updating correctly');

console.log('\n4. 🎨 UI Rendering Issues:');
console.log('❓ Progress Section might be hidden due to conditions');
console.log('❓ Styles might be making elements invisible');
console.log('❓ Component might not be re-rendering on data updates');

console.log('\n🔍 Debug Steps:');

console.log('\nStep 1: Check Authentication State');
console.log('- Verify isAuthenticated() returns true');
console.log('- Verify user object exists and has id');
console.log('- Check if user.profile exists');

console.log('\nStep 2: Check Data Loading');
console.log('- Add console.log in useEffect to see if data loading is triggered');
console.log('- Check if loadProgressData() and loadXPData() are called');
console.log('- Verify API responses in network tab');

console.log('\nStep 3: Check Data Values');
console.log('- Log profileCompletionPercentage value');
console.log('- Log XP data values (totalXP, level, etc.)');
console.log('- Check if values are 0, undefined, or null');

console.log('\nStep 4: Check UI Conditions');
console.log('- Verify {isAuthenticated && user && ...} condition is met');
console.log('- Check if Progress Section is actually rendered');
console.log('- Verify styles are not hiding the elements');

console.log('\n🛠️ Quick Fixes to Try:');

console.log('\n1. Add Debug Logging:');
console.log('```javascript');
console.log('useEffect(() => {');
console.log('  console.log("HomeScreen: isAuthenticated:", isAuthenticated);');
console.log('  console.log("HomeScreen: user:", user);');
console.log('  console.log("HomeScreen: profileCompletionPercentage:", profileCompletionPercentage);');
console.log('  console.log("HomeScreen: totalXP:", totalXP);');
console.log('  console.log("HomeScreen: level:", level);');
console.log('}, [isAuthenticated, user, profileCompletionPercentage, totalXP, level]);');
console.log('```');

console.log('\n2. Force Data Refresh:');
console.log('```javascript');
console.log('useEffect(() => {');
console.log('  if (isAuthenticated && user?.id) {');
console.log('    console.log("HomeScreen: Forcing data refresh");');
console.log('    loadProgressData().then(() => console.log("Progress loaded"));');
console.log('    loadXPData().then(() => console.log("XP loaded"));');
console.log('  }');
console.log('}, []);');
console.log('```');

console.log('\n3. Check API Endpoints:');
console.log('- Test GET /user/profile/completion');
console.log('- Test GET /user/xp');
console.log('- Verify responses contain expected data');

console.log('\n4. Verify Backend Data:');
console.log('- Check if user was created with onboarding data');
console.log('- Verify profile completion was calculated correctly');
console.log('- Confirm XP system was initialized');

console.log('\n🎯 Most Likely Causes:');
console.log('1. 🔐 User not properly authenticated after signup');
console.log('2. 📊 Data not loaded due to timing issues');
console.log('3. 🎨 UI condition not met (isAuthenticated && user)');
console.log('4. 🔄 State not updating after data fetch');

console.log('\n💡 Recommended Solution:');
console.log('1. Add comprehensive logging to track data flow');
console.log('2. Ensure authentication state is properly set after signup');
console.log('3. Add loading states and error handling');
console.log('4. Verify backend data exists and is accessible');

console.log('\n🔧 Implementation Check:');
console.log('✅ Progress Section exists in HomeScreen');
console.log('✅ useProgress hook is imported and used');
console.log('✅ Data loading functions are called');
console.log('❓ Need to verify data is actually being fetched and stored'); 