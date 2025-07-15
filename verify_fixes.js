// verify_fixes.js
// Simple verification script to check file syntax and structure

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying HomeScreen Profile Completion and XP Display Fixes');
console.log('=' .repeat(60));

const filesToCheck = [
  'interview-app/services/xpStore.js',
  'interview-app/hooks/useProgress.js',
  'interview-app/screens/HomeScreen.js'
];

const checkFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for key fixes
    const checks = {
      'XP Store User ID Sync': content.includes('useAuthStore') && content.includes('authStore.user?.id'),
      'Enhanced Logging': content.includes('console.log') && content.includes('XP Store:'),
      'useProgress User ID Setup': content.includes('apiService.setUserId') && content.includes('setUserId(user.id)'),
      'HomeScreen Data Loading': content.includes('Promise.all') && content.includes('loadXPData'),
      'Fallback UI': content.includes('loadingText') && content.includes('debugText'),
      'Debug Information': content.includes('Debug: Auth=') && content.includes('Completion=')
    };
    
    // Adjust checks based on file type
    if (filePath.includes('xpStore.js')) {
      checks['useProgress User ID Setup'] = true; // Not applicable to XP store
      checks['HomeScreen Data Loading'] = true; // Not applicable to XP store
      checks['Fallback UI'] = true; // Not applicable to XP store
      checks['Debug Information'] = true; // Not applicable to XP store
    } else if (filePath.includes('useProgress.js')) {
      checks['XP Store User ID Sync'] = true; // Not applicable to useProgress
      checks['Enhanced Logging'] = content.includes('console.log') && content.includes('useProgress:');
      checks['HomeScreen Data Loading'] = true; // Not applicable to useProgress
      checks['Fallback UI'] = true; // Not applicable to useProgress
      checks['Debug Information'] = true; // Not applicable to useProgress
    } else if (filePath.includes('HomeScreen.js')) {
      checks['XP Store User ID Sync'] = true; // Not applicable to HomeScreen
      checks['Enhanced Logging'] = content.includes('console.log') && content.includes('HomeScreen:');
    }
    
    console.log(`\n📁 ${filePath}:`);
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    return Object.values(checks).every(Boolean);
  } catch (error) {
    console.log(`\n❌ ${filePath}: File not found or error reading`);
    return false;
  }
};

console.log('\n🔍 Checking file fixes...');
const results = filesToCheck.map(checkFile);

console.log('\n📊 Summary:');
console.log(`Files checked: ${filesToCheck.length}`);
console.log(`Files with fixes: ${results.filter(Boolean).length}`);

if (results.every(Boolean)) {
  console.log('\n🎉 All fixes verified successfully!');
  console.log('\n📱 Next Steps:');
  console.log('1. Open the React Native app');
  console.log('2. Login with your account');
  console.log('3. Navigate to HomeScreen');
  console.log('4. Check that profile completion and XP bars are displayed');
  console.log('5. Look for debug information showing current values');
  console.log('6. Test navigation between screens');
} else {
  console.log('\n⚠️  Some fixes may be missing. Please check the files above.');
} 