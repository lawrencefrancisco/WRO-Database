const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an OTP verification email
 * @param {string} to - The recipient email address
 * @param {string} otp - The 6-digit OTP code
 */
const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: to,
    subject: 'WRO Philippines - Your Verification Code',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0D1B3E; margin-bottom: 5px;">Verify Your Account</h2>
          <p style="color: #666; font-size: 14px;">WRO Philippines · Participant Access</p>
        </div>
        
        <div style="background-color: #fff; padding: 30px; border-radius: 8px; text-align: center; border: 1px solid #eaeaea;">
          <p style="font-size: 15px; color: #333; margin-bottom: 20px;">Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #F6C945; margin-bottom: 20px;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #999;">This code expires in 15 minutes.</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #aaa;">
          <p>If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`Error sending email: ${error}`);
    return false;
  }
};

module.exports = {
  sendOTPEmail
};
