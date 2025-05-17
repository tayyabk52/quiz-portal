// Express API endpoints for Firebase Admin operations
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { 
  listAllUsers, 
  deleteMultipleUsers, 
  generatePasswordResetLinks,
  setUserStatus
} = require('./admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Authentication middleware - replace with proper auth in production
const authenticate = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // Simple API key check - use a more robust auth system in production
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ 
      error: 'Unauthorized. Valid API key required.' 
    });
  }
  
  next();
};

// API Routes

// Get all users from Firebase Authentication
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const users = await listAllUsers(req.query.maxResults);
    res.json({ users });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

// Delete multiple users
app.post('/api/users/delete', authenticate, async (req, res) => {
  try {
    const { uids } = req.body;
    
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Expected array of user UIDs.'
      });
    }
    
    const results = await deleteMultipleUsers(uids);
    res.json(results);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to delete users',
      message: error.message 
    });
  }
});

// Generate password reset links
app.post('/api/users/reset-password', authenticate, async (req, res) => {
  try {
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Expected array of user emails.'
      });
    }
    
    const results = await generatePasswordResetLinks(emails);
    res.json(results);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate password reset links',
      message: error.message 
    });
  }
});

// Update user status (enable/disable)
app.post('/api/users/:uid/status', authenticate, async (req, res) => {
  try {
    const { uid } = req.params;
    const { action } = req.body;
    
    if (!uid) {
      return res.status(400).json({ 
        error: 'Invalid request. User UID is required.'
      });
    }
    
    if (!['enable', 'disable'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be either "enable" or "disable".'
      });
    }
    
    // Set the disabled status based on the action
    const disabled = action === 'disable';
    
    const result = await setUserStatus(uid, disabled);
    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: `Failed to ${req.body.action} user`,
      message: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Admin API server running on port ${PORT}`);
});

module.exports = app;
