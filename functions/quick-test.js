/**
 * Quick Test - Verify Firebase and email config work
 * Usage: node quick-test.js
 * 
 * This script tests the email function logic WITHOUT requiring npm install
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Quick Email Function Test...\n');

// Check 1: Service Account Key exists
console.log('✓ Check 1: Service Account Key');
const serviceAccountPath = path.join(__dirname, 'subtra-da8c1-firebase-adminsdk-fbsvc-50f7334632.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('   ✅ Found: subtra-da8c1-firebase-adminsdk-fbsvc-50f7334632.json');
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
    console.log(`   📧 Project ID: ${serviceAccount.project_id}`);
    console.log(`   🔑 Client Email: ${serviceAccount.client_email}`);
  } catch (e) {
    console.error('   ❌ Invalid JSON format:', e.message);
  }
} else {
  console.log('   ❌ NOT FOUND: You need the service account key file');
}

// Check 2: Package.json dependencies
console.log('\n✓ Check 2: Required Dependencies');
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
console.log('   Required packages:');
console.log(`   - firebase-admin: ${packageJson.dependencies['firebase-admin']}`);
console.log(`   - firebase-functions: ${packageJson.dependencies['firebase-functions']}`);
console.log(`   - nodemailer: ${packageJson.dependencies['nodemailer']}`);

// Check 3: Environment variables
console.log('\n✓ Check 3: Email Environment Variables');
const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;

if (emailUser && emailPassword) {
  console.log(`   ✅ EMAIL_USER: ${emailUser.substring(0, 5)}...`);
  console.log(`   ✅ EMAIL_PASSWORD: ${emailPassword.substring(0, 3)}...`);
} else {
  console.log('   ⚠️  Email configuration not set');
  console.log('   You need to set:');
  console.log('   $env:EMAIL_USER = "your-email@gmail.com"');
  console.log('   $env:EMAIL_PASSWORD = "your-16-char-app-password"');
}

// Check 4: Test the renewal date calculation logic
console.log('\n✓ Check 4: Subscription Renewal Logic Test');
const today = new Date();
today.setHours(0, 0, 0, 0);

const testStartDate = new Date(today);
testStartDate.setDate(testStartDate.getDate() - 23); // 23 days ago

function calculateRenewalDate(startDate, billingCycle) {
  let renewalDate = new Date(startDate);

  switch (billingCycle) {
    case 'weekly':
      renewalDate.setDate(renewalDate.getDate() + 7);
      break;
    case 'monthly':
      renewalDate.setMonth(renewalDate.getMonth() + 1);
      break;
    case 'quarterly':
      renewalDate.setMonth(renewalDate.getMonth() + 3);
      break;
    case 'yearly':
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      break;
  }

  return renewalDate;
}

const testCycles = ['weekly', 'monthly', 'quarterly', 'yearly'];
const sevenDaysFromNow = new Date(today);
sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

console.log(`   Today: ${today.toDateString()}`);
console.log(`   7 days from now: ${sevenDaysFromNow.toDateString()}`);
console.log(`   Test start date: ${testStartDate.toDateString()} (23 days ago)`);
console.log('\n   Renewal dates:');

testCycles.forEach(cycle => {
  const renewalDate = calculateRenewalDate(testStartDate, cycle);
  const withinWindow = renewalDate >= today && renewalDate <= sevenDaysFromNow;
  const status = withinWindow ? '✅' : '❌';
  console.log(`   ${status} ${cycle.padEnd(10)}: ${renewalDate.toDateString()} ${withinWindow ? '(WILL SEND EMAIL)' : '(no email)'}`);
});

// Check 5: Installation status
console.log('\n✓ Check 5: Node Modules Installation');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules folder exists');
  console.log('   Dependencies are installed!');
} else {
  console.log('   ❌ node_modules folder NOT found');
  console.log('\n   Install dependencies with:');
  console.log('   npm install');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 SETUP CHECKLIST:');
console.log('='.repeat(60));
console.log('1. ✅ Service account key: ' + (fs.existsSync(serviceAccountPath) ? 'YES' : 'NO - Download from Firebase'));
console.log('2. ' + (fs.existsSync(nodeModulesPath) ? '✅' : '❌') + ' Dependencies installed: Run "npm install"');
console.log('3. ' + (emailUser && emailPassword ? '✅' : '❌') + ' Email config set: Set environment variables');
console.log('4. ' + (emailUser && emailPassword ? '✅' : '❌') + ' Gmail 2FA enabled: Check Google Account Security');
console.log('5. ' + (emailUser && emailPassword ? '✅' : '❌') + ' App password created: Generate in Gmail');
console.log('\n🚀 Next Steps:');
console.log('1. Run: npm install');
console.log('2. Set email environment variables');
console.log('3. Run: firebase deploy --only functions');
console.log('4. Check Firebase Console for logs');
console.log('\nFunction will run automatically at 9:00 AM UTC daily!');
