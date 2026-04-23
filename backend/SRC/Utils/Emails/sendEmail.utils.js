// src/Utils/Emails/sendEmail.utils.js
import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email service (e.g., SendGrid, AWS SES)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Development using Mailtrap or similar
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (process.env.EMAIL_ENABLED === 'false') {
      return { skipped: true };
    }

    if (process.env.NODE_ENV !== 'production' && !process.env.EMAIL_HOST) {
      console.warn('⚠️  Email skipped: EMAIL_HOST not configured');
      return { skipped: true };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `FitCore <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};

export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to FitCore!';
  const html = `
    <h1>Welcome to FitCore, ${user.firstName}!</h1>
    <p>Thank you for joining our fitness community.</p>
    <p>You're now registered as a <strong>${user.userType}</strong> user.</p>
    <p>Start your fitness journey today!</p>
    <a href="${process.env.FRONTEND_URL}/login">Login Now</a>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    html,
    text: `Welcome to FitCore, ${user.firstName}! Thank you for joining our fitness community.`
  });
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request';
  const html = `
    <h1>Password Reset</h1>
    <p>Hi ${user.firstName},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link is valid for 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    html,
    text: `Hi ${user.firstName}, reset your password here: ${resetUrl}`
  });
};

export const sendWorkoutReminderEmail = async (user, workout) => {
  const subject = `Reminder: ${workout.focus} Workout Today!`;
  const html = `
    <h1>Time to Workout, ${user.firstName}!</h1>
    <p>Don't forget your <strong>${workout.focus}</strong> workout today.</p>
    <p>Stay consistent and reach your goals!</p>
    <a href="${process.env.FRONTEND_URL}/workouts">View Workout Plan</a>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    html,
    text: `Time to workout, ${user.firstName}! Don't forget your ${workout.focus} workout today.`
  });
};