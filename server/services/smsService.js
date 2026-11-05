/**
 * SMS Service (Vonage Integration)
 * RolalBet UK Sportsbook Platform
 */

const https = require('https');
const querystring = require('querystring');

const VONAGE_API_KEY = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;
const VONAGE_FROM = process.env.VONAGE_FROM || 'RolalBet';

/**
 * Send an SMS via Vonage REST API
 */
function sendViaNexmo({ to, text }) {
  return new Promise((resolve, reject) => {
    const payload = querystring.stringify({
      api_key: VONAGE_API_KEY,
      api_secret: VONAGE_API_SECRET,
      from: VONAGE_FROM,
      to,
      text
    });

    const req = https.request('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const msg = parsed.messages && parsed.messages[0];
          if (msg && msg.status === '0') {
            resolve({ success: true, messageId: msg['message-id'] });
          } else {
            const errText = (msg && msg['error-text']) || `Vonage status ${msg && msg.status}`;
            reject(new Error(errText));
          }
        } catch (e) {
          reject(new Error(`Vonage non-JSON response: ${body}`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Vonage SMS request timed out after 10s'));
    });

    req.on('error', (err) => reject(err));

    req.write(payload);
    req.end();
  });
}

/**
 * Sends a 6-digit SMS verification code to a UK mobile number
 * @param {Object} options
 * @param {string} options.phone   - E.164 format, e.g. +447700900123
 * @param {string} options.code    - 6-digit OTP
 * @param {string} [options.fullName]
 */
async function sendVerificationCodeSms({ phone, code, fullName }) {
  const cleanPhone = String(phone || '').replace(/\s+/g, '');
  const cleanCode  = String(code  || '').trim();

  if (!cleanPhone || !cleanCode) {
    throw new Error('Phone number and verification code are required to send SMS.');
  }

  if (!VONAGE_API_KEY || !VONAGE_API_SECRET) {
    throw new Error('SMS service is not configured (missing VONAGE_API_KEY / VONAGE_API_SECRET).');
  }

  const name = (fullName && String(fullName).trim()) || 'Player';
  const text = `RolalBet UK: Hi ${name}, your verification code is ${cleanCode}. Valid for 5 minutes. Do not share this code.`;

  return sendViaNexmo({ to: cleanPhone, text });
}

module.exports = { sendVerificationCodeSms };
