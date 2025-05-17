// Import Sample Questions to Firebase Script
// This script helps import the sample questions to Firebase Firestore

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');
const sampleQuestions = require('./sampleQuestions');
const { convertDriveUrl } = require('../src/utils/imageUtils');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Function to import questions
async function importQuestions() {
  console.log('Importing sample questions to Firebase...');
  
  const batch = db.batch();
  
  for (const question of sampleQuestions) {
    try {
      // Create a reference to the question document
      const questionRef = db.collection('questions').doc(question.id);
      
      // Convert Google Drive link to direct image URL if applicable
      if (question.imageUrl && question.imageUrl.includes('drive.google.com')) {
        try {
          question.imageUrl = convertDriveUrl(question.imageUrl);
        } catch (error) {
          console.warn(`Warning: Could not convert Drive URL for question ${question.id}: ${error.message}`);
        }
      }
      
      // Add the question to the batch
      batch.set(questionRef, {
        ...question,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Question "${question.question.substring(0, 30)}..." prepared for import`);
      
    } catch (error) {
      console.error(`Error preparing question ${question.id}:`, error);
    }
  }
  
  // Commit all the batched writes
  try {
    await batch.commit();
    console.log(`Successfully imported ${sampleQuestions.length} questions to Firestore!`);
  } catch (error) {
    console.error('Error committing batch write:', error);
  }
}

// Execute the function
importQuestions()
  .then(() => {
    console.log('Script execution completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });

// IMPORTANT: In production, you would need to:
// 1. Handle image conversion more robustly
// 2. Implement better error handling and logging
// 3. Add validation for question structure
// 4. Consider running this in smaller batches for large datasets
