// Main server file that serves both the React app and the Admin API
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const adminApi = require('./src/server/api');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
});
