// Netlify Function entry: wraps the Express app.
// NETLIFY env var is set automatically by Netlify CI; PAYSTACK_SECRET_KEY enables live payments.
const serverless = require('serverless-http');
const { app } = require('../../server/server');

exports.handler = serverless(app);
