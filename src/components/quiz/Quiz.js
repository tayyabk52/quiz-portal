import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import quizSecurity from './QuizSecurity';
import ImageLoader from '../common/ImageLoader';
import './Quiz.css';

// Use the common ImageLoader component for question images
const QuestionImageComponent = ({ imageUrl }) => {
  return (
    <ImageContainer>
      <ImageLoader 
        src={imageUrl} 
        alt="Question illustration" 
      />
    </ImageContainer>
  );
};

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled components for Quiz
const QuizContainer = styled.div`
  max-width: 800px;
  width: 90%;
  margin: 0 auto;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 40px;
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.6s ease;
  
  @media (max-width: 768px) {
    width: 95%;
    padding: 30px 20px;
    margin: 20px auto;
    border-radius: 12px;
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 30px;
`;

const TopHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const QuestionNumber = styled.div`
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
`;

const QuestionCounter = styled.span`
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 14px;
`;

const Timer = styled.div`
  font-size: 1rem;
  background-color: ${props => props.timeRunningOut ? 'var(--warning-color, #ff9800)' : 'var(--primary-color)'};
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  box-shadow: ${props => props.timeRunningOut ? '0 4px 12px rgba(255, 152, 0, 0.3)' : '0 4px 12px rgba(66, 133, 244, 0.2)'};
  transition: all 0.3s ease;
  
  &:before {
    content: '⏱️';
    font-size: 14px;
  }
`;

const Question = styled.h2`
  color: var(--primary-color);
  margin-bottom: 30px;
  font-size: 24px;
  line-height: 1.4;
  position: relative;
  font-weight: 600;
  animation: ${fadeIn} 0.5s ease;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 0;
    width: 40px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-light), var(--primary-color));
    border-radius: 3px;
  }
`;

const ImageContainer = styled.div`
  text-align: center;
  margin: 30px auto;
  max-width: 90%;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-5px);
  }
  
  img {
    max-width: 100%;
    border-radius: 12px;
  }
`;

const OptionsContainer = styled.div`
  margin-bottom: 35px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const OptionButton = styled.button`
  width: 100%;
  background-color: ${props => props.selected ? 'var(--primary-color)' : 'white'};
  color: ${props => props.selected ? 'white' : 'var(--text-color)'};
  border: 1px solid ${props => props.selected ? 'var(--primary-color)' : '#eaeaea'};
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 0;
  text-align: left;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.selected ? '0 6px 12px rgba(66, 133, 244, 0.2)' : '0 2px 5px rgba(0, 0, 0, 0.05)'};
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.5s ease forwards;
  animation-delay: ${props => props.index * 0.1}s;
  opacity: 0;
  
  &:before {
    content: ${props => props.selected ? '"✓"' : '""'};
    font-weight: bold;
    margin-right: ${props => props.selected ? '10px' : '0'};
    color: white;
  }
  
  &:hover {
    background-color: ${props => props.selected ? 'var(--primary-dark)' : '#f7f9fc'};
    transform: translateX(5px);
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0) 100%);
    transition: left 0.7s ease;
  }
  
  &:hover:after {
    left: 100%;
  }
`;

const NavigationButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  float: right;
  box-shadow: 0 4px 10px rgba(66, 133, 244, 0.3);
  position: relative;
  overflow: hidden;
  min-width: 150px;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transition: left 0.7s ease;
  }

  &:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(66, 133, 244, 0.4);
    
    &:before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: #b3b3b3;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
`;

const LoadingTitle = styled.h2`
  color: var(--primary-color);
  margin-bottom: 20px;
  font-size: 24px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  margin: 20px auto;
  border: 3px solid rgba(66, 133, 244, 0.2);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: ${spin} 1s linear infinite;
`;

const DecorativeCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  z-index: -1;
  
  &.top-right {
    width: 180px;
    height: 180px;
    top: -90px;
    right: -90px;
    background: radial-gradient(circle, var(--primary-light) 0%, rgba(255,255,255,0) 70%);
    opacity: 0.2;
  }
  
  &.bottom-left {
    width: 140px;
    height: 140px;
    bottom: -70px;
    left: -70px;
    background: radial-gradient(circle, var(--secondary-light) 0%, rgba(255,255,255,0) 70%);
    opacity: 0.2;
  }
`;

const Quiz = () => {
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timer, setTimer] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const navigate = useNavigate();
  
  // Refs to access DOM elements
  const fullscreenWarningRef = useRef(null);
  const quizContainerRef = useRef(null);
  const lastTimerValue = useRef(null);
  
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
    if (quizData.length > 0 && currentQuestionIndex < quizData.length) {
      const timeLimit = quizData[currentQuestionIndex].timeLimit;
      setTimer(timeLimit);
      lastTimerValue.current = timeLimit;
      
      let countdown;
      
      if (!timerPaused) {
        countdown = setInterval(() => {
          setTimer((prevTimer) => {
            if (prevTimer <= 1) {
              clearInterval(countdown);
              handleNext();
              return 0;
            }
            lastTimerValue.current = prevTimer - 1;
            return prevTimer - 1;
          });
        }, 1000);
      }
      
      // Setup fullscreen security features
      setupQuizSecurity();
        return () => {
        if (countdown) clearInterval(countdown);
        quizSecurity.deactivate();
      };
    }
  }, [currentQuestionIndex, quizData, timerPaused]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up quiz security with fullscreen features
  const setupQuizSecurity = () => {
    // Check if fullscreen is required - if we're no longer showing the prompt and we're in fullscreen,
    // then fullscreen is required. Otherwise, the user opted to continue without fullscreen.
    const fullscreenRequired = !showFullscreenPrompt && quizSecurity.checkFullscreen();

    // If fullscreen is required, setup the fullscreen security features
    if (fullscreenRequired) {
      // Setup the fullscreen security with all necessary callbacks
      quizSecurity.setupFullscreenSecurity({
        onExit: () => {
          console.log('Fullscreen exited');
          setTimerPaused(true);
          if (fullscreenWarningRef.current) {
            fullscreenWarningRef.current.style.display = 'flex';
          }
        },
        onReturn: () => {
          console.log('Fullscreen returned');
          setTimerPaused(false);
          if (fullscreenWarningRef.current) {
            fullscreenWarningRef.current.style.display = 'none';
          }
        },
        onTimeout: () => {
          console.log('Fullscreen exit timeout - submitting quiz');
          submitQuiz(answers);
        },
        timerElement: fullscreenWarningRef.current?.querySelector('.fullscreen-warning-timer'),
        pauseTimer: () => {
          setTimerPaused(true);
        },
        resumeTimer: () => {
          setTimerPaused(false);
        },
        countdownTime: 10
      });
    }
    
    // Activate general security features, passing the fullscreen requirement flag
    quizSecurity.activate(() => {
      // Auto-submit quiz on second security violation
      console.log("Quiz auto-submitted due to security violation");
      submitQuiz(answers);
    }, fullscreenRequired);
  };
  // Enter fullscreen mode
  const enterFullscreenMode = () => {
    quizSecurity.enterFullscreen(document.documentElement)
      .then(() => {
        setShowFullscreenPrompt(false);
      })
      .catch((err) => {
        console.error('Failed to enter fullscreen:', err);
        const userChoice = window.confirm('Unable to enter fullscreen mode. Would you like to continue the quiz without fullscreen? Click Cancel to try again.');
        if (userChoice) {
          // User wants to continue without fullscreen
          setShowFullscreenPrompt(false);
        }
      });
  };

  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex);
  };
  
  const handleNext = () => {
    const currentQuestion = quizData[currentQuestionIndex];
    // Save the answer with more details
    const currentAnswer = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      selectedOption: selectedOption !== null ? selectedOption : -1, // -1 means no selection
      selected: selectedOption !== null ? currentQuestion.options[selectedOption] : 'No selection',
      correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
      correct: selectedOption === currentQuestion.correctAnswer,
      // Include the score for this question
      score: selectedOption === currentQuestion.correctAnswer ? 
        (currentQuestion.score || 1) : 0,
      maxScore: currentQuestion.score || 1
    };
    
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);
    
    // Move to the next question or submit if it's the last one
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      // This is the last question, submit the quiz
      submitQuiz(newAnswers);
    }
  };
  
  const submitQuiz = async (finalAnswers) => {
    setIsSubmitting(true);
    
    try {
      // Try to deactivate security features before submitting
      quizSecurity.deactivate();
      
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Calculate score
      const correctAnswers = finalAnswers.filter(answer => answer.correct).length;
      const totalQuestions = quizData.length;
      
      // Calculate earned points and total possible points
      const totalPoints = finalAnswers.reduce((sum, answer) => sum + answer.score, 0);
      const maxPossiblePoints = finalAnswers.reduce((sum, answer) => sum + answer.maxScore, 0);
      
      // Calculate percentage score
      const scorePercentage = (totalPoints / maxPossiblePoints) * 100;
      
      // Record the time quiz was completed
      const completionTime = new Date();
      
      // Save results to Firebase
      await addDoc(collection(db, 'results'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        scorePercentage: scorePercentage,
        totalPoints: totalPoints,
        maxPossiblePoints: maxPossiblePoints,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        answers: finalAnswers,
        timeTaken: finalAnswers.length * 30, // Approximate time taken (30 seconds per question)
        submittedAt: serverTimestamp()
      });
      
      // Exit fullscreen before navigating to results
      if (quizSecurity.checkFullscreen()) {
        await quizSecurity.exitFullscreen();
      }
      
      // Navigate to results page
      navigate('/result', { 
        state: { 
          scorePercentage: scorePercentage,
          totalPoints: totalPoints,
          maxPossiblePoints: maxPossiblePoints,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions,
          answers: finalAnswers,
          completionTime: completionTime
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
      <div className="quiz-page">
        <QuizContainer>
          <LoadingTitle>Preparing Your Quiz</LoadingTitle>
          <p>Please wait while we load your questions...</p>
          <LoadingSpinner />
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </QuizContainer>
      </div>
    );
  }
  
  // Check if there are any questions available
  if (quizData.length === 0) {
    return (
      <div className="quiz-page">
        <QuizContainer>
          <DecorativeCircle className="top-right" />
          <DecorativeCircle className="bottom-left" />
          <LoadingTitle>No Questions Available</LoadingTitle>
          <p>There are no quiz questions available at this time. Please try again later or contact your instructor.</p>
          <NavigationButton onClick={() => navigate('/instructions')}>
            Back to Instructions
          </NavigationButton>
        </QuizContainer>
      </div>
    );
  }

  // If quiz is completed
  if (currentQuestionIndex >= quizData.length || isSubmitting) {
    return (
      <div className="quiz-page">
        <QuizContainer>
          <DecorativeCircle className="top-right" />
          <DecorativeCircle className="bottom-left" />
          <LoadingTitle>Submitting Your Answers</LoadingTitle>
          <p>Please wait while we process your results...</p>
          <LoadingSpinner />
        </QuizContainer>
      </div>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const isTimeRunningOut = timer <= 5;
  const progressPercentage = ((currentQuestionIndex) / quizData.length) * 100;
  // Show fullscreen prompt before starting the quiz
  if (showFullscreenPrompt) {
    return (
      <div className="quiz-page">
        <div className="fullscreen-initial-message">          <div className="fullscreen-initial-content">            <div className="fullscreen-initial-icon">⚠️</div>
            <h2 className="fullscreen-initial-title">Fullscreen Mode Required</h2>
            <div className="fullscreen-initial-text-content">
              <p>This quiz requires fullscreen mode to maintain academic integrity. Please click the button below to enter fullscreen mode and begin the quiz.</p>
              <p>Important: Exiting fullscreen during the test will pause the timer and give you 10 seconds to return. If you don't return to fullscreen within this time, your quiz will be automatically submitted.</p>
            </div>
            <div className="fullscreen-button-container">
              <button className="fullscreen-initial-button" onClick={enterFullscreenMode}>
                Enter Fullscreen & Begin Quiz
              </button>
              <button className="fullscreen-discard-button" onClick={() => setShowFullscreenPrompt(false)}>
                Continue Without Fullscreen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      {/* Fullscreen Exit Warning Overlay */}
      <div className="fullscreen-warning-container" ref={fullscreenWarningRef}>
        <div className="fullscreen-warning">
          <div className="fullscreen-warning-icon">⚠️</div>
          <h2 className="fullscreen-warning-title">Fullscreen Mode Required</h2>
          <p className="fullscreen-warning-message">
            You have exited fullscreen mode. The quiz timer has been paused.
            Please return to fullscreen mode to continue with your quiz.
          </p>
          <div className="fullscreen-warning-timer">10</div>
          <p>Your quiz will be automatically submitted if you don't return to fullscreen.</p>
          <button 
            className="fullscreen-warning-button" 
            onClick={() => quizSecurity.enterFullscreen(document.documentElement)}>
            Return to Fullscreen
          </button>
        </div>
      </div>

      <QuizContainer ref={quizContainerRef}>
        <DecorativeCircle className="top-right" />
        <DecorativeCircle className="bottom-left" />
        
        <QuestionHeader>
          <TopHeader>
            <QuestionNumber>
              <div className="question-indicator">
                Question <span className="question-indicator-current">{currentQuestionIndex + 1}</span> of {quizData.length}
              </div>
            </QuestionNumber>
            <Timer timeRunningOut={isTimeRunningOut} className={isTimeRunningOut ? 'timer-warning' : ''}>
              {timer}s
            </Timer>
          </TopHeader>
          
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </QuestionHeader>
        
        <Question>{currentQuestion.question}</Question>
        
        {currentQuestion.imageUrl && (
          <QuestionImageComponent imageUrl={currentQuestion.imageUrl} />
        )}
        
        <OptionsContainer>
          {currentQuestion.options.map((option, index) => (
            <OptionButton
              key={index}
              index={index}
              selected={selectedOption === index}
              onClick={() => handleOptionSelect(index)}
              className={selectedOption === index ? 'option-selected' : ''}
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
    </div>
  );
};

export default Quiz;
