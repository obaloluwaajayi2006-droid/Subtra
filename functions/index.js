/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Set global options for cost control
setGlobalOptions({ maxInstances: 10 });

// Configure nodemailer with Gmail (you'll need to set environment variables)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password"
  }
});

/**
 * Scheduled function to check for subscriptions expiring in 7 days
 * Runs daily at 9:00 AM UTC
 */
exports.checkExpiringSubscriptions = onSchedule("every day 09:00", async (context) => {
  const db = admin.firestore();

  try {
    logger.info("Starting expiring subscriptions check...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate 7 days from now
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    sevenDaysLater.setHours(23, 59, 59, 999);

    // Get all users
    const usersSnapshot = await db.collection("users").get();

    let emailsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      if (!userData.email) {
        logger.warn(`User ${userId} has no email address`);
        continue;
      }

      try {
        // Get user's subscriptions that renew in 7 days
        const subsSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("subscriptions")
          .where("startDate", "<=", admin.firestore.Timestamp.fromDate(sevenDaysLater))
          .get();

        // Filter subscriptions that are renewing within 7 days
        const expiringSubscriptions = [];

        for (const subDoc of subsSnapshot.docs) {
          const sub = subDoc.data();

          // Calculate renewal date based on billing cycle
          let renewalDate = new Date(sub.startDate.toDate());

          switch (sub.billingCycle) {
            case "monthly":
              renewalDate.setMonth(renewalDate.getMonth() + 1);
              break;
            case "yearly":
              renewalDate.setFullYear(renewalDate.getFullYear() + 1);
              break;
            case "quarterly":
              renewalDate.setMonth(renewalDate.getMonth() + 3);
              break;
            case "weekly":
              renewalDate.setDate(renewalDate.getDate() + 7);
              break;
          }

          // Check if renewal is within 7 days
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

        // Send email if there are expiring subscriptions
        if (expiringSubscriptions.length > 0) {
          const emailHtml = generateEmailHtml(
            userData.displayName || userData.email,
            expiringSubscriptions
          );

          await transporter.sendMail({
            from: `"Subtra" <${process.env.EMAIL_USER || "noreply@subtra.app"}>`,
            to: userData.email,
            subject: `⏰ Reminder: ${expiringSubscriptions.length} subscription(s) renewing in 7 days`,
            html: emailHtml
          });

          emailsSent++;
          logger.info(`Email sent to ${userData.email} for ${expiringSubscriptions.length} expiring subscription(s)`);
        }
      } catch (userError) {
        logger.error(`Error processing user ${userId}:`, userError);
      }
    }

    logger.info(`Expiring subscriptions check completed. Emails sent: ${emailsSent}`);
    return { success: true, emailsSent };
  } catch (error) {
    logger.error("Error in checkExpiringSubscriptions:", error);
    throw error;
  }
});

/**
 * Generate HTML email content
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
    .join("");

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
            <h1>⏰ Subscription Renewal Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We wanted to remind you that the following subscription(s) will renew in 7 days:</p>
            
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
            
            <p>Make sure your payment method is up to date to avoid any interruptions in your service.</p>
            
            <a href="https://subtra-da8c1.firebaseapp.com/dashboard" class="btn">Manage Subscriptions</a>
          </div>
          <div class="footer">
            <p>© 2026 Subtra. All rights reserved.</p>
            <p>You're receiving this email because you have active subscriptions. You can manage your preferences in your profile settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
