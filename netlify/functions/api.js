// Netlify Function entry: wraps the Express app (payments + admin API are disabled when hosted).
process.env.VERCEL = process.env.VERCEL || 'netlify-hosted'; // reuse the "hosted" safety switches
const serverless = require('serverless-http');
const { app } = require('../../server/server');

exports.handler = serverless(app);
