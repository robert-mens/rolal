/**
 * Email Service (Resend Integration)
 * RolalBet UK Sportsbook Platform
 */

const https = require('https');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = process.env.RESEND_FROM || 'RolalBet UK <auth@rolalbet.online>';

/**
 * Raw HTTPS POST to Resend API
 */
function sendViaResend(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data: parsed });
          } else {
            reject(new Error(parsed.message || parsed.error || `Resend error status ${res.statusCode}`));
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body });
          } else {
            reject(new Error(`Resend non-JSON error ${res.statusCode}: ${body}`));
          }
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Resend request timed out after 10s'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Sends a 6-digit verification code to the user during registration
 * @param {Object} options
 * @param {string} options.email
 * @param {string} options.code
 * @param {string} [options.fullName]
 */
async function sendVerificationCodeEmail({ email, code, fullName }) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCode = String(code || '').trim();
  const recipientName = (fullName && String(fullName).trim()) || 'Player';

  if (!cleanEmail || !cleanCode) {
    throw new Error('Email address and verification code are required to send verification email.');
  }

  const subject = `Your RolalBet UK Verification Code: ${cleanCode}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RolalBet Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0E1015; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8F9FA;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0E1015; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #161920; border: 1px solid #2A2E35; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.5);">
          <!-- Top Bar Brand -->
          <tr>
            <td style="background-color: #111418; padding: 22px 28px; border-bottom: 2px solid #FFC107;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 1.5px; color: #F8F9FA; text-transform: uppercase;">
                      ROLAL<span style="color: #FFC107;">BET</span>
                    </span>
                    <span style="display: inline-block; margin-left: 8px; padding: 2px 7px; background-color: #FFC107; color: #111418; font-size: 10px; font-weight: 800; border-radius: 3px; vertical-align: middle; letter-spacing: 0.5px;">UK</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; color: #94A3B8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Identity Auth</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px;">
              <h1 style="margin: 0 0 14px 0; font-size: 18px; font-weight: 700; color: #F8F9FA;">
                Verify Your Email Address
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; color: #94A3B8;">
                Hi <strong style="color: #F8F9FA;">${recipientName}</strong>, thank you for registering with RolalBet UK. Please enter the 6-digit authentication code below to complete your account setup:
              </p>

              <!-- Verification Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #0E1015; border: 1.5px dashed #FFC107; border-radius: 6px; padding: 20px 10px;">
                    <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #FFC107; font-family: 'Courier New', Courier, monospace; display: block;">
                      ${cleanCode}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Alert -->
              <div style="background-color: rgba(255, 193, 7, 0.08); border-left: 3px solid #FFC107; padding: 10px 14px; border-radius: 2px; margin: 20px 0 24px 0;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #FFC107;">
                  ⏳ This authentication code expires in 5 minutes.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748B;">
                If you did not request this registration code, you can safely ignore this email. No account will be created without this verification step.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111418; padding: 18px 28px; border-top: 1px solid #232832; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748B;">
                RolalBet United Kingdom Sportsbook &bull; 18+ Please Gamble Responsibly
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                Protected by 256-Bit SSL Encryption &bull; Official Account Security
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Your RolalBet UK Verification Code is: ${cleanCode}

Hi ${recipientName},

Use the 6-digit code above to complete your RolalBet UK registration.
This code expires in 5 minutes.

If you did not request this code, please ignore this email.

RolalBet United Kingdom Sportsbook
  `.trim();

  let fromAddress = DEFAULT_FROM;
  try {
    const res = await sendViaResend({
      from: fromAddress,
      to: cleanEmail,
      subject,
      html,
      text
    });
    return { success: true, id: res.data?.id };
  } catch (primaryErr) {
    console.warn('[EmailService] Primary from error:', primaryErr.message, '- retrying with onboarding@resend.dev');
    try {
      const fallbackRes = await sendViaResend({
        from: 'RolalBet UK <onboarding@resend.dev>',
        to: cleanEmail,
        subject,
        html,
        text
      });
      return { success: true, id: fallbackRes.data?.id };
    } catch (fallbackErr) {
      console.error('[EmailService] Resend email send error:', fallbackErr.message);
      throw fallbackErr;
    }
  }
}

module.exports = {
  sendVerificationCodeEmail
};
