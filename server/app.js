// Shared Express app (API routes only — no static file serving, no
// app.listen()). Used by both:
//   - server/server.js  → local dev, adds static serving + app.listen()
//   - api/index.js       → Vercel serverless entrypoint, deployed as-is
//     (Vercel's own CDN serves the static html/css/js/assets directly,
//     so the serverless function only needs to handle /api/*)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Fail fast instead of buffering queries for 10s when Mongo is disconnected —
// route handlers already catch the resulting error and return a clean 503.
mongoose.set('bufferCommands', false);

// Serverless functions get a fresh module scope on cold starts but reuse it
// on warm ones — caching the connection promise here means a warm
// invocation doesn't re-dial MongoDB on every request.
let cachedConnection = null;
function connectDB() {
  if (cachedConnection) return cachedConnection;
  cachedConnection = mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
      cachedConnection = null; // let the next request retry instead of staying broken forever
      console.error('MongoDB connection failed:', err.message);
      throw err;
    });
  return cachedConnection;
}

const app = express();

// Defense in depth: a bug in some future route could still throw an
// unhandled rejection outside a try/catch. Log it instead of letting the
// whole process crash, so one broken request can't take the site offline.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection (server stayed up):', err);
});

app.use(cors());
app.use(express.json());

// Kick off (or reuse) the DB connection before any /api route runs. This is
// best-effort — the route handlers themselves still catch DB errors and
// return a clean 503, so a slow/failed connection here doesn't crash anything.
app.use('/api', (req, res, next) => {
  connectDB().catch(() => {});
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

module.exports = { app, connectDB };
