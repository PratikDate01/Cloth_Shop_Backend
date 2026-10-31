const nodemailer = require('nodemailer');
const {
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
} = require('../templates/emailTemplates');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }
  return transporter;
};

/**
 * Send an email safely without blocking business operations if SMTP fails
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.log(`📨 [Email Simulated - No SMTP Configured] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true };
    }

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Aura Atelier'}" <${process.env.FROM_EMAIL || 'no-reply@auraatelier.com'}>`,
      to,
      subject,
      html,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️ Failed to send email to ${to}:`, error.message);
    // Never throw error to caller - business actions must succeed even if mail delivery fails
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (user) => {
  return await sendEmail({
    to: user.email,
    subject: 'Welcome to Aura Atelier - Exclusive 10% Off Inside',
    html: welcomeEmailTemplate(user.name),
  });
};

const sendOrderConfirmationEmail = async (order) => {
  return await sendEmail({
    to: order.customerInfo.email,
    subject: `Order Confirmed: #${order.orderNumber} - Aura Atelier`,
    html: orderConfirmationTemplate(order),
  });
};

const sendOrderStatusEmail = async (order, status) => {
  return await sendEmail({
    to: order.customerInfo.email,
    subject: `Order #${order.orderNumber} Status: ${status}`,
    html: orderStatusUpdateTemplate(order, status),
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};
