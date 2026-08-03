// Vercel serverless entrypoint. Vercel treats a file under /api that
// exports an Express app as a serverless function — every request Express
// would normally handle is routed here (see vercel.json's rewrite rule that
// sends all /api/* traffic to this function). Static files (html/css/js/
// assets) are served directly by Vercel's CDN, not through Express.
const { app } = require('../server/app');

module.exports = app;
