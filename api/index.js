// Vercel serverless entry: exposes the Express app (payments + admin API are disabled when hosted).
const { app } = require('../server/server');

module.exports = app;
