// Sample Quiz Questions for Firebase
// This file contains sample questions you can import to Firebase

const sampleQuestions = [
  {
    id: "q1",
    question: "Which programming language is primarily used for iOS app development?",
    options: [
      "Java",
      "Swift",
      "C#",
      "Python"
    ],
    correctAnswer: 1, // 0-based index (Swift)
    timeLimit: 30, // seconds
    imageUrl: "https://drive.google.com/file/d/SAMPLE_FILE_ID_1/view?usp=sharing" // Replace with actual Google Drive link
  },
  {
    id: "q2",
    question: "Which of these is NOT a JavaScript framework?",
    options: [
      "React",
      "Angular",
      "Django",
      "Vue"
    ],
    correctAnswer: 2, // Django
    timeLimit: 30,
    imageUrl: "https://drive.google.com/file/d/SAMPLE_FILE_ID_2/view?usp=sharing" // Replace with actual Google Drive link
  },
  {
    id: "q3",
    question: "Which HTML tag is used to create a hyperlink?",
    options: [
      "<a>",
      "<link>",
      "<href>",
      "<url>"
    ],
    correctAnswer: 0, // <a>
    timeLimit: 20,
    imageUrl: "https://drive.google.com/file/d/SAMPLE_FILE_ID_3/view?usp=sharing" // Replace with actual Google Drive link
  },
  {
    id: "q4",
    question: "Which CSS property is used to change the text color?",
    options: [
      "text-color",
      "font-color",
      "color",
      "foreground-color"
    ],
    correctAnswer: 2, // color
    timeLimit: 20,
    imageUrl: "https://drive.google.com/file/d/SAMPLE_FILE_ID_4/view?usp=sharing" // Replace with actual Google Drive link
  },
  {
    id: "q5",
    question: "Which of these data structures operates on a LIFO (Last-In-First-Out) principle?",
    options: [
      "Queue",
      "Stack",
      "Heap",
      "Tree"
    ],
    correctAnswer: 1, // Stack
    timeLimit: 30,
    imageUrl: "https://drive.google.com/file/d/SAMPLE_FILE_ID_5/view?usp=sharing" // Replace with actual Google Drive link
  }
];

// Function for importing questions to Firebase (for reference)
/*
const importQuestionsToFirebase = async () => {
  const db = getFirestore();
  const batch = writeBatch(db);
  
  sampleQuestions.forEach(question => {
    // Convert Google Drive link to direct image URL
    question.imageUrl = convertDriveUrl(question.imageUrl);
    
    const questionRef = doc(db, "questions", question.id);
    batch.set(questionRef, question);
  });
  
  await batch.commit();
  console.log("Questions imported successfully!");
};
*/

// Export the questions for use in scripts
module.exports = sampleQuestions;
