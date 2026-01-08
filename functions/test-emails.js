/**
 * Test script to verify the email function works
 * Run this from the functions directory: 
 * First: npm install
 * Then: node test-emails.js
 */

let admin;
let nodemailer;

try {
  admin = require('firebase-admin');
  nodemailer = require('nodemailer');
} catch (e) {
  console.error('❌ Dependencies not installed!');
  console.error('\nRun this first:');
  console.error('npm install');
  process.exit(1);
}

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = require('./subtra-da8c1-firebase-adminsdk-fbsvc-50f7334632.json');
} catch (e) {
  console.error('❌ Service account key not found!');
  console.error('Expected: subtra-da8c1-firebase-adminsdk-fbsvc-50f7334632.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'subtra-da8c1'
});

const db = admin.firestore();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Step 1: Create a test subscription that renews in 7 days
 */
async function createTestSubscription(userId, testEmail) {
  try {
    console.log('\n📝 Creating test subscription...');

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 23); // 30 days ago for monthly cycle

    const testSub = {
      name: 'Test Netflix Subscription',
      amount: 15.99,
      currency: 'USD',
      billingCycle: 'monthly',
      category: 'Entertainment',
      startDate: admin.firestore.Timestamp.fromDate(sevenDaysAgo),
      reminderSent: false,
      createdAt: admin.firestore.Timestamp.now()
    };

    const subRef = await db
      .collection('users')
      .doc(userId)
      .collection('subscriptions')
      .add(testSub);

    console.log('✅ Test subscription created:');
    console.log(`   - ID: ${subRef.id}`);
    console.log(`   - Name: ${testSub.name}`);
    console.log(`   - Renewal in: ~7 days`);
    console.log(`   - Amount: ${testSub.currency} ${testSub.amount}`);

    return subRef.id;
  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
    throw error;
  }
}

/**
 * Step 2: Verify user has email
 */
async function verifyUserEmail(userId) {
  try {
    console.log('\n👤 Verifying user...');

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error('❌ User not found');
      return null;
    }

    const userData = userDoc.data();
    console.log('✅ User found:');
    console.log(`   - Name: ${userData.displayName || 'Not set'}`);
    console.log(`   - Email: ${userData.email || 'Not set'}`);

    if (!userData.email) {
      throw new Error('User has no email address');
    }

    return userData;
  } catch (error) {
    console.error('❌ Error verifying user:', error);
    throw error;
  }
}

/**
 * Step 3: Simulate the email function
 */
async function simulateEmailCheck(userId) {
  try {
    console.log('\n📧 Simulating email check...');

    const userData = await verifyUserEmail(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    console.log(`   - Checking range: ${today.toDateString()} to ${sevenDaysLater.toDateString()}`);

    const subsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('subscriptions')
      .get();

    const expiringSubscriptions = [];

    for (const subDoc of subsSnapshot.docs) {
      const sub = subDoc.data();

      // Calculate renewal date
      let renewalDate = new Date(sub.startDate.toDate());

      switch (sub.billingCycle) {
        case 'monthly':
          renewalDate.setMonth(renewalDate.getMonth() + 1);
          break;
        case 'yearly':
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);
          break;
        case 'quarterly':
          renewalDate.setMonth(renewalDate.getMonth() + 3);
          break;
        case 'weekly':
          renewalDate.setDate(renewalDate.getDate() + 7);
          break;
      }

      console.log(`   - ${sub.name}: Renews on ${renewalDate.toDateString()}`);

      if (renewalDate >= today && renewalDate <= sevenDaysLater) {
        expiringSubscriptions.push({
          id: subDoc.id,
          name: sub.name,
          amount: sub.amount,
          currency: sub.currency,
          billingCycle: sub.billingCycle,
          renewalDate: renewalDate
        });
      }
    }

    if (expiringSubscriptions.length > 0) {
      console.log(`\n✅ Found ${expiringSubscriptions.length} subscription(s) renewing in 7 days!`);
      return { userData, expiringSubscriptions };
    } else {
      console.log('\n⚠️  No subscriptions found renewing in 7 days');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in email check:', error);
    throw error;
  }
}

/**
 * Step 4: Send test email
 */
async function sendTestEmail(userData, subscriptions) {
  try {
    console.log('\n✉️ Sending test email...');

    const html = generateEmailHtml(userData.displayName || userData.email, subscriptions);

    const mailOptions = {
      from: `"Subtra" <${process.env.EMAIL_USER || 'noreply@subtra.app'}>`,
      to: userData.email,
      subject: `⏰ TEST: ${subscriptions.length} subscription(s) renewing in 7 days`,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log(`   - To: ${userData.email}`);
    console.log(`   - Message ID: ${info.messageId}`);
    console.log(`   - Response: ${info.response}`);

    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

/**
 * Generate email HTML
 */
function generateEmailHtml(userName, subscriptions) {
  const subscriptionRows = subscriptions
    .map(sub => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${sub.name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${sub.currency} ${sub.amount.toFixed(2)}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${sub.renewalDate.toLocaleDateString()}
        </td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #047857; color: white; padding: 24px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { background: #f9fafb; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ TEST: Subscription Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p><strong>This is a TEST email</strong> - Your email configuration is working!</p>
            <p>Here are subscriptions renewing in 7 days:</p>
            
            <table>
              <thead style="background: #f3f4f6;">
                <tr>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Subscription</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Amount</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Renewal Date</th>
                </tr>
              </thead>
              <tbody>
                ${subscriptionRows}
              </tbody>
            </table>
            
            <a href="https://subtra-da8c1.firebaseapp.com/dashboard/index.html" class="btn">View Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2026 Subtra. All rights reserved.</p>
            <p><strong>TEST EMAIL</strong> - If you received this, your email configuration is working correctly!</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Main test flow
 */
async function runTest() {
  console.log('🚀 Starting email function test...\n');

  try {
    // Get current user UID (you'll need to provide this or modify)
    // For now, we'll use a test user
    const testUserId = 'test-user-123'; // Replace with actual user ID

    console.log('⚙️ Configuration:');
    console.log(`   - Firebase Project: subtra-da8c1`);
    console.log(`   - Test User ID: ${testUserId}`);
    console.log(`   - Email Service: Gmail`);

    // Step 1: Create test subscription
    const subId = await createTestSubscription(testUserId);

    // Step 2: Verify user and email
    const emailCheckResult = await simulateEmailCheck(testUserId);

    if (emailCheckResult) {
      // Step 3: Send test email
      await sendTestEmail(emailCheckResult.userData, emailCheckResult.expiringSubscriptions);

      console.log('\n✅ TEST SUCCESSFUL!');
      console.log('\nNext steps:');
      console.log('1. Check your email inbox');
      console.log('2. If email received, your configuration is working!');
      console.log('3. The real function will run tomorrow at 9:00 AM UTC');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run the test
runTest();
