/**
 * Responsive HTML email templates with premium fashion branding
 */

const baseEmailLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 20px; color: #111; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5; }
    .header { background: #000000; padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; }
    .header p { color: #aaaaaa; margin: 5px 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
    .body { padding: 35px 30px; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background: #000000; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600; margin-top: 20px; }
    .footer { background: #fdfdfd; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee; }
    .highlight { background: #f9f9f9; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #000; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AURA ATELIER</h1>
      <p>Luxury & Contemporary Fashion</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AURA ATELIER. All rights reserved.</p>
      <p>For any queries, reach us at support@auraatelier.com</p>
    </div>
  </div>
</body>
</html>
`;

const welcomeEmailTemplate = (userName) => {
  const content = `
    <h2>Welcome to Aura Atelier, ${userName}!</h2>
    <p>Thank you for joining our community of contemporary fashion enthusiasts. We are dedicated to bringing you meticulously crafted clothing, sustainable materials, and timeless aesthetics.</p>
    <div class="highlight">
      <strong>Your Welcome Gift:</strong> Use code <strong>WELCOME10</strong> at checkout to enjoy 10% off your first purchase!
    </div>
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" class="button">Explore New Arrivals</a>
  `;
  return baseEmailLayout('Welcome to Aura Atelier', content);
};

const orderConfirmationTemplate = (order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 13px; color: #666;">Size: ${item.size} | Color: ${item.color} | Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600;">
          ₹${item.subtotal}
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h2>Order Confirmed!</h2>
    <p>Dear ${order.customerInfo.fullName},</p>
    <p>Thank you for shopping with us. Your order <strong>#${order.orderNumber}</strong> has been received and is being prepared with utmost care.</p>
    
    <div class="highlight">
      <strong>Order Summary:</strong><br/>
      Order Number: #${order.orderNumber}<br/>
      Payment Method: ${order.paymentInfo.method.toUpperCase()} (${order.paymentInfo.status})<br/>
      Shipping To: ${order.shippingAddress.houseNumber}, ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0; font-weight: bold; font-size: 16px;">Total Paid / Payable</td>
        <td style="padding: 12px 0; font-weight: bold; font-size: 16px; text-align: right;">₹${order.pricing.finalAmount}</td>
      </tr>
    </table>

    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/track-order?orderId=${order.orderNumber}" class="button">Track Your Order</a>
  `;
  return baseEmailLayout(`Order Confirmation #${order.orderNumber}`, content);
};

const orderStatusUpdateTemplate = (order, status) => {
  const content = `
    <h2>Order Status Update</h2>
    <p>Dear ${order.customerInfo.fullName},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> status has been updated to:</p>
    <div class="highlight" style="font-size: 18px; font-weight: 600; color: #000;">
      📍 ${status.toUpperCase()}
    </div>
    ${order.tracking?.courierName ? `<p><strong>Courier:</strong> ${order.tracking.courierName}<br/><strong>Tracking Number:</strong> ${order.tracking.trackingNumber}</p>` : ''}
    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/track-order?orderId=${order.orderNumber}" class="button">View Live Tracking</a>
  `;
  return baseEmailLayout(`Order #${order.orderNumber} Update: ${status}`, content);
};

module.exports = {
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
};
