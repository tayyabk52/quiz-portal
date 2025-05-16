// Firebase Test Users Setup Script
// This script demonstrates how to create test users for your Quiz Portal
// using Firebase Admin SDK in a Node.js environment

// Note: This script should be executed in a secure environment, not in the browser

// Prerequisites:
// 1. Firebase Admin SDK installed: npm install firebase-admin
// 2. Service account key file downloaded from Firebase Console

// Example usage (replace with real implementation):

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Array of test users to create
const testUsers = [
  {
    email: 'student1@quizportal.com', // Format: username@quizportal.com
    password: 'password123',
    displayName: 'Student 1',
    role: 'student'
  },
  {
    email: 'student2@quizportal.com',
    password: 'password123',
    displayName: 'Student 2',
    role: 'student'
  },
  {
    email: 'admin@quizportal.com',
    password: 'adminpass',
    displayName: 'Admin User',
    role: 'admin'
  }
];

// Function to create users
async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    try {
      // Create user in Firebase Authentication
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName
      });
      
      console.log(`User created: ${user.email} (${userRecord.uid})`);
      
      // Store additional user metadata in Firestore
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        email: user.email,
        displayName: user.displayName,
        role: user.role, // 'student' or 'admin'
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`User data stored in Firestore for ${user.email}`);
      
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }
  
  console.log('Test user creation completed.');
}

// Execute the function
createTestUsers()
  .then(() => {
    console.log('Script execution completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });

// IMPORTANT: In production, you would need to implement:
// 1. Better error handling
// 2. Security checks
// 3. Environment variable handling for sensitive information
// 4. Batch operations for larger sets of users
