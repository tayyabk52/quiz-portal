// Server-side API for admin operations
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

const router = express.Router();

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
    path.join(__dirname, '..', 'firebase', 'quiz-portal-a76c9-firebase-adminsdk-fbsvc-c882b8e421.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
}

// Middleware to check if the user is an admin
const checkAdminAuth = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userEmail = decodedToken.email;
    
    if (!userEmail || !userEmail.includes(process.env.ADMIN_EMAIL_PATTERN || 'admin')) {
      return res.status(403).json({ error: 'Forbidden - Not an admin user' });
    }
    
    req.adminUser = decodedToken;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// API Routes
router.get('/users', checkAdminAuth, async (req, res) => {
  try {
    const userRecords = await admin.auth().listUsers();
    
    // Get user data from Firestore
    const firestore = admin.firestore();
    const usersCollection = firestore.collection('users');
    const resultsCollection = firestore.collection('results');
    
    // Fetch additional user data
    const usersSnapshot = await usersCollection.get();
    const userMetadata = {};
    
    usersSnapshot.forEach(doc => {
      userMetadata[doc.id] = doc.data();
    });
    
    // Fetch quiz results
    const resultsSnapshot = await resultsCollection.get();
    const quizResults = {};
    
    resultsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.userEmail) {
        quizResults[data.userEmail] = {
          lastQuiz: data.submittedAt,
          score: data.scorePercentage || data.score
        };
      }
    });
    
    // Combine data
    const enrichedUsers = userRecords.users.map(user => {
      const metadata = userMetadata[user.email] || {};
      const quizData = quizResults[user.email] || {};
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        disabled: user.disabled,
        createdAt: new Date(user.metadata.creationTime),
        lastSignIn: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
        rollNumber: metadata.rollNumber,
        hasAttemptedQuiz: !!quizData.lastQuiz,
        lastQuiz: quizData.lastQuiz,
        score: quizData.score
      };
    });
    
    res.json({
      users: enrichedUsers,
      total: userRecords.users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:uid', checkAdminAuth, async (req, res) => {
  try {
    const uid = req.params.uid;
    
    // Get user email before deleting (for Firestore cleanup)
    const userRecord = await admin.auth().getUser(uid);
    const userEmail = userRecord.email;
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Delete from Firestore 'users' collection if exists
    try {
      const firestore = admin.firestore();
      await firestore.collection('users').doc(userEmail).delete();
    } catch (firestoreError) {
      console.warn(`Could not delete Firestore data for ${userEmail}:`, firestoreError);
      // Continue execution since the auth user was deleted successfully
    }
    
    res.json({ message: `User ${uid} successfully deleted` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/bulk-delete', checkAdminAuth, async (req, res) => {
  try {
    const { uids } = req.body;
    
    if (!uids || !Array.isArray(uids) || uids.length === 0) {
      return res.status(400).json({ error: 'Invalid request. Expected array of uids.' });
    }
    
    const results = {
      successful: [],
      failed: [],
      total: uids.length
    };
    
    const firestore = admin.firestore();
    
    // Process users sequentially to avoid Firebase quota limits
    for (const uid of uids) {
      try {
        // Get user email before deleting
        const userRecord = await admin.auth().getUser(uid);
        const userEmail = userRecord.email;
        
        // Delete from Firebase Auth
        await admin.auth().deleteUser(uid);
        
        // Delete from Firestore 'users' collection if exists
        try {
          await firestore.collection('users').doc(userEmail).delete();
        } catch (firestoreError) {
          console.warn(`Could not delete Firestore data for ${userEmail}:`, firestoreError);
        }
        
        results.successful.push({
          uid,
          email: userEmail
        });
      } catch (error) {
        results.failed.push({
          uid,
          error: error.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/reset-password', checkAdminAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);
    
    // In a production environment, you would send the link via email service
    // For this demo, we'll just return the link
    res.json({
      success: true,
      email,
      link,
      message: 'Password reset link generated successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/create', checkAdminAuth, async (req, res) => {
  try {
    const { email, password, displayName, rollNumber } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0]
    });
    
    // Create a document in Firestore for additional user data
    const firestore = admin.firestore();
    await firestore.collection('users').doc(email).set({
      email,
      rollNumber,
      createdAt: new Date(),
      uid: userRecord.uid
    });
    
    res.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/bulk-create', checkAdminAuth, async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Invalid request. Expected array of users.' });
    }
    
    const results = {
      successful: [],
      failed: [],
      total: users.length
    };
    
    const firestore = admin.firestore();
    
    // Process users sequentially to avoid Firebase quota limits
    for (const user of users) {
      try {
        // Create the user in Firebase Auth
        const userRecord = await admin.auth().createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName || user.email.split('@')[0]
        });
        
        // Create a document in Firestore for additional user data
        await firestore.collection('users').doc(user.email).set({
          email: user.email,
          rollNumber: user.rollNumber,
          createdAt: new Date(),
          uid: userRecord.uid
        });
        
        results.successful.push({
          email: user.email,
          rollNumber: user.rollNumber
        });
      } catch (error) {
        results.failed.push({
          email: user.email,
          rollNumber: user.rollNumber,
          error: error.message
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error in bulk create:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;