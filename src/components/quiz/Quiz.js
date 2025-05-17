import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import quizSecurity from './QuizSecurity';
import { convertDriveUrl } from '../../utils/imageUtils';

// Component to handle question images with error handling
const QuestionImageComponent = ({ imageUrl }) => {
  const [imageError, setImageError] = useState(false);
  const convertedUrl = convertDriveUrl(imageUrl);
  
  return (
    <ImageContainer>
      {imageError ? (
        <ImageErrorMessage>
          Image could not be loaded. Please continue with the question.
        </ImageErrorMessage>
      ) : (
        <QuestionImage 
          src={convertedUrl} 
          alt="Question illustration" 
          onError={() => setImageError(true)}
        />
      )}
    </ImageContainer>
  );
};

// Quiz data will be loaded from Firebase

const QuizContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
`;

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const QuestionNumber = styled.h3`
  color: var(--text-color);
  margin: 0;
`;

const Timer = styled.div`
  font-size: 1.2rem;
  background-color: ${props => props.timeRunningOut ? 'var(--warning-color)' : 'var(--primary-color)'};
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  display: flex;
  align-items: center;
`;

const Question = styled.h2`
  color: var(--primary-color);
  margin-bottom: 20px;
`;

const ImageContainer = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const QuestionImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
`;

const ImageErrorMessage = styled.div`
  color: var(--light-text);
  padding: 20px;
  text-align: center;
  border: 1px dashed #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const OptionsContainer = styled.div`
  margin-bottom: 30px;
`;

const OptionButton = styled.button`
  width: 100%;
  background-color: ${props => props.selected ? 'var(--primary-color)' : 'white'};
  color: ${props => props.selected ? 'white' : 'var(--text-color)'};
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  text-align: left;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${props => props.selected ? 'var(--primary-color)' : '#f0f0f0'};
  }
`;

const NavigationButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  float: right;

  &:hover {
    background-color: #3367d6;
  }

  &:disabled {
    background-color: #b3b3b3;
    cursor: not-allowed;
  }
`;

const Quiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timer, setTimer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Fetch quiz questions from Firebase
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const questionsSnapshot = await getDocs(collection(db, 'questions'));
        const questionsData = [];
        
        questionsSnapshot.forEach((doc) => {
          questionsData.push({ id: doc.id, ...doc.data() });
        });
        
        // Randomize order of questions for each student
        const shuffledQuestions = [...questionsData].sort(() => Math.random() - 0.5);
        
        setQuizData(shuffledQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);
  // Initialize timer when a new question is displayed
  useEffect(() => {
    if (currentQuestionIndex < quizData.length) {
      const timeLimit = quizData[currentQuestionIndex].timeLimit;
      setTimer(timeLimit);
      
      const countdown = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            clearInterval(countdown);
            handleNext();
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
      
      // Activate security features
      quizSecurity.activate(() => {
        // Auto-submit quiz on second security violation
        console.log("Quiz auto-submitted due to security violation");
        submitQuiz(answers);
      });
      
      return () => {
        clearInterval(countdown);
        quizSecurity.deactivate();
      };
    }
  }, [currentQuestionIndex]);

  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    // Save the answer
    const currentAnswer = {
      questionId: quizData[currentQuestionIndex].id,
      selectedOption: selectedOption !== null ? selectedOption : -1, // -1 means no selection
      isCorrect: selectedOption === quizData[currentQuestionIndex].correctAnswer
    };
    
    setAnswers([...answers, currentAnswer]);
    
    // Move to the next question or submit if it's the last one
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      // This is the last question, submit the quiz
      submitQuiz([...answers, currentAnswer]);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setIsSubmitting(true);
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Calculate score
      const correctAnswers = finalAnswers.filter(answer => answer.isCorrect).length;
      const totalQuestions = quizData.length;
      const score = (correctAnswers / totalQuestions) * 100;
      
      // Save results to Firebase
      await addDoc(collection(db, 'results'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        score: score,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        answers: finalAnswers,
        submittedAt: serverTimestamp()
      });
      
      // Navigate to results page
      navigate('/result', { 
        state: { 
          score: score,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions
        } 
      });
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('An error occurred while submitting your quiz. Please try again.');
      setIsSubmitting(false);
    }
  };
  // Show loading state while fetching questions
  if (loading) {
    return (
      <QuizContainer>
        <h2>Loading questions...</h2>
        <p>Please wait while we prepare your quiz.</p>
      </QuizContainer>
    );
  }
  
  // Check if there are any questions available
  if (quizData.length === 0) {
    return (
      <QuizContainer>
        <h2>No questions available</h2>
        <p>There are no quiz questions available at this time. Please try again later or contact your instructor.</p>
      </QuizContainer>
    );
  }

  // If quiz is completed
  if (currentQuestionIndex >= quizData.length) {
    return (
      <QuizContainer>
        <h2>Submitting your answers...</h2>
        <p>Please wait while we process your results.</p>
      </QuizContainer>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const isTimeRunningOut = timer <= 5;

  return (
    <QuizContainer>
      <QuestionHeader>
        <QuestionNumber>
          Question {currentQuestionIndex + 1} of {quizData.length}
        </QuestionNumber>
        <Timer timeRunningOut={isTimeRunningOut}>
          Time left: {timer}s
        </Timer>
      </QuestionHeader>
      
      <Question>{currentQuestion.question}</Question>      {currentQuestion.imageUrl && (
        <QuestionImageComponent imageUrl={currentQuestion.imageUrl} />
      )}
      
      <OptionsContainer>
        {currentQuestion.options.map((option, index) => (
          <OptionButton
            key={index}
            selected={selectedOption === index}
            onClick={() => handleOptionSelect(index)}
          >
            {option}
          </OptionButton>
        ))}
      </OptionsContainer>
      
      <NavigationButton
        onClick={handleNext}
        disabled={isSubmitting}
      >
        {currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'Submit Quiz'}
      </NavigationButton>
    </QuizContainer>
  );
};

export default Quiz;
