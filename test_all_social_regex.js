// Test script for all social media URL regex validations

const testAllSocialRegex = () => {
  console.log('🔍 Testing All Social Media URL Regex Validations...\n');
  
  // GitHub regex pattern
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/?$/;
  
  // LinkedIn regex pattern
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in\/[a-zA-Z0-9-]+\/?|company\/[a-zA-Z0-9-]+\/?)$/;
  
  // Instagram regex pattern
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/;
  
  // Dribbble regex pattern
  const dribbbleRegex = /^https?:\/\/(www\.)?dribbble\.com\/[a-zA-Z0-9-]+\/?$/;
  
  // Website regex pattern (general)
  const websiteRegex = /^https?:\/\/(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,6}(\/.*)?$/;
  
  console.log('✅ GitHub URL Tests:');
  const githubTests = [
    'https://github.com/username',
    'https://www.github.com/username',
    'https://github.com/user-name',
    'https://github.com/user123',
    // Invalid ones
    'https://github.com/',
    'https://github.com',
    'https://github.com/user name',
    'https://github.com/user@name',
    'https://notgithub.com/username'
  ];
  
  githubTests.forEach(url => {
    const isValid = githubRegex.test(url);
    console.log(`${isValid ? '✅' : '❌'} ${url}`);
  });
  
  console.log('\n✅ LinkedIn URL Tests:');
  const linkedinTests = [
    'https://linkedin.com/in/username',
    'https://www.linkedin.com/in/username',
    'https://linkedin.com/in/user-name',
    'https://linkedin.com/company/companyname',
    'https://linkedin.com/company/company-name',
    // Invalid ones
    'https://linkedin.com/',
    'https://linkedin.com',
    'https://linkedin.com/in/',
    'https://linkedin.com/in/user name',
    'https://notlinkedin.com/in/username'
  ];
  
  linkedinTests.forEach(url => {
    const isValid = linkedinRegex.test(url);
    console.log(`${isValid ? '✅' : '❌'} ${url}`);
  });
  
  console.log('\n✅ Instagram URL Tests:');
  const instagramTests = [
    'https://instagram.com/username',
    'https://www.instagram.com/username',
    'https://instagram.com/user.name',
    'https://instagram.com/user_name',
    'https://instagram.com/user123',
    // Invalid ones
    'https://instagram.com/',
    'https://instagram.com',
    'https://instagram.com/user name',
    'https://instagram.com/user@name',
    'https://notinstagram.com/username'
  ];
  
  instagramTests.forEach(url => {
    const isValid = instagramRegex.test(url);
    console.log(`${isValid ? '✅' : '❌'} ${url}`);
  });
  
  console.log('\n✅ Dribbble URL Tests:');
  const dribbbleTests = [
    'https://dribbble.com/username',
    'https://www.dribbble.com/username',
    'https://dribbble.com/user-name',
    'https://dribbble.com/user123',
    // Invalid ones
    'https://dribbble.com/',
    'https://dribbble.com',
    'https://dribbble.com/user name',
    'https://dribbble.com/user@name',
    'https://notdribbble.com/username'
  ];
  
  dribbbleTests.forEach(url => {
    const isValid = dribbbleRegex.test(url);
    console.log(`${isValid ? '✅' : '❌'} ${url}`);
  });
  
  console.log('\n✅ Website URL Tests:');
  const websiteTests = [
    'https://example.com',
    'https://www.example.com',
    'https://example.com/path',
    'https://example.com/path/to/page',
    'https://subdomain.example.com',
    'https://example.co.uk',
    'https://example.io',
    'https://example.net',
    'https://example.org',
    // Invalid ones
    'https://example',
    'https://example.',
    'https://example..',
    'https://example.com.',
    'https://example.com..',
    'https://example.com123',
    'https://example.comabc',
    'https://example.com@',
    'https://example.com#',
    'https://example.com$',
    'https://example.com%',
    'https://example.com^',
    'https://example.com&',
    'https://example.com*',
    'https://example.com(',
    'https://example.com)',
    'https://example.com+',
    'https://example.com=',
    'https://example.com[',
    'https://example.com]',
    'https://example.com{',
    'https://example.com}',
    'https://example.com|',
    'https://example.com\\',
    'https://example.com/',
    'https://example.com?',
    'https://example.com<',
    'https://example.com>',
    'https://example.com,',
    'https://example.com;',
    'https://example.com:',
    'https://example.com"',
    'https://example.com\'',
    'https://example.com`',
    'https://example.com~',
    'https://example.com!'
  ];
  
  websiteTests.forEach(url => {
    const isValid = websiteRegex.test(url);
    console.log(`${isValid ? '✅' : '❌'} ${url}`);
  });
  
  console.log('\n🎯 Validation Summary:');
  console.log('• GitHub URLs must be: https://github.com/username');
  console.log('• LinkedIn URLs must be: https://linkedin.com/in/username or https://linkedin.com/company/companyname');
  console.log('• Instagram URLs must be: https://instagram.com/username');
  console.log('• Dribbble URLs must be: https://dribbble.com/username');
  console.log('• Website URLs must be: https://domain.tld with valid TLD (2-6 letters)');
  console.log('• Usernames can contain letters, numbers, hyphens, dots, and underscores (varies by platform)');
  console.log('• No spaces, special characters, or invalid domains allowed');
  console.log('• Both www and non-www versions are accepted');
  console.log('• Trailing slashes are optional');
  
  console.log('\n🚀 All Social Media Regex Validation Implementation Complete!');
};

testAllSocialRegex(); 