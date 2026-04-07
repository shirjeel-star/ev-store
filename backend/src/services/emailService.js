const { sendMail } = require('../config/email');

// Order confirmation email
async function sendOrderConfirmation(email, order) {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          ${item.name}${item.variantName ? ` — ${item.variantName}` : ''}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.price).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#16a34a;margin:0;">⚡ VoltStore</h1>
  </div>
  <h2>Order Confirmed!</h2>
  <p>Hi there,</p>
  <p>Thank you for your order! We've received your payment and are processing your order now.</p>
  <p><strong>Order Number:</strong> ${order.orderNumber}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="background:#f4f4f4;">
        <th style="padding:8px;text-align:left;">Item</th>
        <th style="padding:8px;text-align:center;">Qty</th>
        <th style="padding:8px;text-align:right;">Price</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td colspan="2" style="padding:8px;text-align:right;"><strong>Subtotal:</strong></td>
          <td style="padding:8px;text-align:right;">$${Number(order.subtotal).toFixed(2)}</td></tr>
      ${Number(order.discountAmount) > 0 ? `
      <tr><td colspan="2" style="padding:8px;text-align:right;color:#16a34a;"><strong>Discount:</strong></td>
          <td style="padding:8px;text-align:right;color:#16a34a;">-$${Number(order.discountAmount).toFixed(2)}</td></tr>` : ''}
      <tr><td colspan="2" style="padding:8px;text-align:right;"><strong>Shipping:</strong></td>
          <td style="padding:8px;text-align:right;">$${Number(order.shippingAmount).toFixed(2)}</td></tr>
      <tr><td colspan="2" style="padding:8px;text-align:right;"><strong>Tax:</strong></td>
          <td style="padding:8px;text-align:right;">$${Number(order.taxAmount).toFixed(2)}</td></tr>
      <tr style="background:#f9f9f9;">
        <td colspan="2" style="padding:8px;text-align:right;font-size:18px;"><strong>Total:</strong></td>
        <td style="padding:8px;text-align:right;font-size:18px;font-weight:bold;">$${Number(order.total).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  <p>We'll send you a shipping confirmation with a tracking number once your order ships.</p>
  <p style="margin-top:32px;font-size:12px;color:#666;">
    Questions? Reply to this email or visit our <a href="${process.env.FRONTEND_URL}/support">support page</a>.
  </p>
  <p style="font-size:12px;color:#666;">VoltStore — Charge Smarter. Drive Further.</p>
</body>
</html>`;

  return sendMail({
    to: email,
    subject: `VoltStore — Order Confirmed #${order.orderNumber}`,
    html,
    text: `Order ${order.orderNumber} confirmed. Total: $${Number(order.total).toFixed(2)}.`,
  });
}

// Shipping confirmation email
async function sendShippingConfirmation(email, order) {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#16a34a;">⚡ VoltStore</h1>
  <h2>Your Order Has Shipped!</h2>
  <p>Order <strong>${order.orderNumber}</strong> is on its way.</p>
  ${order.trackingNumber ? `
  <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
  ${order.trackingUrl ? `<a href="${order.trackingUrl}" style="background:#16a34a;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;display:inline-block;">Track Package</a>` : ''}
  ` : ''}
  <p style="margin-top:32px;font-size:12px;color:#666;">VoltStore — Charge Smarter. Drive Further.</p>
</body>
</html>`;

  return sendMail({
    to: email,
    subject: `VoltStore — Your order #${order.orderNumber} has shipped!`,
    html,
  });
}

// Abandoned cart recovery email
async function sendAbandonedCartEmail(email, cart, recoveryLink) {
  const itemsHtml = cart.items
    .map((item) => `<li>${item.quantity}x ${item.product.name} — $${Number(item.price).toFixed(2)}</li>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#16a34a;">⚡ VoltStore</h1>
  <h2>You left something behind!</h2>
  <p>Your cart is waiting for you. Here's what you had:</p>
  <ul style="line-height:2;">${itemsHtml}</ul>
  <p>Complete your purchase and start charging smarter today.</p>
  <a href="${recoveryLink}" style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-size:16px;">
    Complete My Order
  </a>
  <p style="margin-top:24px;color:#16a34a;font-weight:bold;">Use code <strong>COMEBACK10</strong> for 10% off!</p>
  <p style="font-size:12px;color:#666;margin-top:32px;">VoltStore — Charge Smarter. Drive Further.</p>
</body>
</html>`;

  return sendMail({
    to: email,
    subject: "VoltStore — Don't forget your EV charging gear!",
    html,
  });
}

// Partner welcome email
async function sendPartnerWelcome(email, partner, user) {
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#111;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#16a34a;">⚡ VoltStore Partners</h1>
  <h2>Welcome to the VoltStore Partner Program!</h2>
  <p>Hi ${user.firstName},</p>
  <p>Your partner application has been <strong>approved</strong>! You can now start earning commissions.</p>
  <p><strong>Your referral code:</strong> <code style="background:#f4f4f4;padding:4px 8px;border-radius:4px;">${partner.referralCode}</code></p>
  <p><strong>Commission rate:</strong> ${partner.commissionRate}%</p>
  <p>Share this link to start earning:</p>
  <p><code>${process.env.FRONTEND_URL}/?ref=${partner.referralCode}</code></p>
  <a href="${process.env.FRONTEND_URL}/partner/dashboard" style="background:#16a34a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
    View Partner Dashboard
  </a>
  <p style="font-size:12px;color:#666;margin-top:32px;">VoltStore — Charge Smarter. Drive Further.</p>
</body>
</html>`;

  return sendMail({
    to: email,
    subject: 'Welcome to VoltStore Partner Program!',
    html,
  });
}

module.exports = {
  sendOrderConfirmation,
  sendShippingConfirmation,
  sendAbandonedCartEmail,
  sendPartnerWelcome,
};
