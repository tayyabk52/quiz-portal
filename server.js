// Main server file that serves both the React app and the Admin API
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const adminApi = require('./src/server/api');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the dev setup
app.use(cors());

// Parse JSON requests
app.use(express.json());

// Mount the Admin API under /api
app.use('/api', adminApi);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
