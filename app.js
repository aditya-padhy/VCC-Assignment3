// const express = require('express');
// const client = require('prom-client');
// const promBundle = require('express-prom-bundle')();

// const app = express();

// // Middleware to collect HTTP metrics
// app.use(promBundle);

// // ... your routes ...
// app.get('/', (req, res) => res.send('Hellowo World!'));

// // prom-client exposes /metrics
// const metricsServer = express();
// metricsServer.get('/metrics', async (req, res) => {
//   res.set('Content-Type', client.register.contentType);
//   res.end(await client.register.metrics());
// });
// metricsServer.listen(9091, '0.0.0.0'); 
// // Run on a separate port so app remains on 80

const express = require('express');
const client = require('prom-client');
const promBundle = require('express-prom-bundle')();

const app = express();
const PORT = 80; // Define port
const METRICS_PORT = 9091; // Define metrics port

// Middleware to collect HTTP metrics
app.use(promBundle);

// Your routes
app.get('/', (req, res) => res.send('Hellowo World!'));

// Start the main application server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Main app server listening on port ${PORT}`);
});

// ----- Metrics Server -----
// You can actually integrate metrics into the main app usually,
// but keeping it separate is fine too if intended.
// If integrating, you'd add the '/metrics' route to the main 'app'
// and only need one 'app.listen()'.
// Keeping it separate for now as per your original code:
const metricsServer = express();
metricsServer.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

metricsServer.listen(METRICS_PORT, '0.0.0.0', () => {
  console.log(`Metrics server listening on port ${METRICS_PORT}`);
});
