import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Instructions.css';

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

const InstructionsContainer = styled.div`
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
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
  }
`;

const Title = styled.h2`
  color: var(--primary-color);
  margin-bottom: 25px;
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-light), var(--secondary-light));
    border-radius: 3px;
  }
`;

const StatusContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const InstructionsList = styled.div`
  margin-bottom: 30px;
  counter-reset: instruction;
`;

const InstructionItem = styled.div`
  margin-bottom: 20px;
  line-height: 1.7;
  padding: 10px 15px;
  border-radius: 8px;
  background-color: #fafafa;
  display: flex;
  align-items: flex-start;
  transition: all 0.2s ease;
  animation: ${slideIn} 0.5s ease forwards;
  animation-delay: ${props => props.index * 0.1}s;
  opacity: 0;
  
  &:hover {
    background-color: #f5f5f5;
    transform: translateX(5px);
  }
  
  strong {
    color: var(--primary-color);
    font-weight: 600;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  gap: 15px;
  
  @media (max-width: 500px) {
    flex-direction: column-reverse;
    gap: 12px;
  }
`;

const Button = styled.button`
  background-color: ${props => props.secondary ? '#fff' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary ? '2px solid var(--primary-color)' : 'none'};
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  position: relative;
  overflow: hidden;
  
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
    background-color: ${props => props.secondary ? '#f7f7f7' : 'var(--primary-dark)'};
    transform: translateY(-2px);
    box-shadow: ${props => props.secondary ? 'none' : '0 6px 12px rgba(66, 133, 244, 0.2)'};
    
    &:before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    animation: ${pulse} 1.5s infinite ease-in-out;
  }
  
  @media (max-width: 500px) {
    width: 100%;
  }
`;

const HighlightBox = styled.div`
  background-color: ${props => props.warning ? 'rgba(255, 152, 0, 0.08)' : props.error ? 'rgba(244, 67, 54, 0.08)' : 'rgba(66, 133, 244, 0.08)'};
  border-left: 4px solid ${props => props.warning ? 'var(--warning-color, #ff9800)' : props.error ? 'var(--error-color, #f44336)' : 'var(--primary-color)'};
  padding: 20px;
  margin: 25px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`;

const HighlightTitle = styled.h3`
  color: ${props => props.warning ? 'var(--warning-color, #ff9800)' : props.error ? 'var(--error-color, #f44336)' : 'var(--primary-color)'};
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:before {
    content: ${props => props.warning ? '"⚠️"' : props.error ? '"⛔"' : '"ℹ️"'};
    font-size: 18px;
  }
`;

const DecorativeCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  z-index: -1;
  
  &.top-right {
    width: 200px;
    height: 200px;
    top: -100px;
    right: -100px;
    background: radial-gradient(circle, var(--primary-light) 0%, rgba(255,255,255,0) 70%);
    opacity: 0.2;
  }
  
  &.bottom-left {
    width: 150px;
    height: 150px;
    bottom: -75px;
    left: -75px;
    background: radial-gradient(circle, var(--secondary-light) 0%, rgba(255,255,255,0) 70%);
    opacity: 0.2;
  }
`;

const Instructions = () => {
  const navigate = useNavigate();
  const [hasAttemptedQuiz, setHasAttemptedQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if the user has already attempted the quiz
  useEffect(() => {
    const checkPreviousAttempts = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          console.error('No authenticated user');
          navigate('/');
          return;
        }
        
        // Query Firestore for any results by this user
        const q = query(
          collection(db, 'results'),
          where('userEmail', '==', user.email)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setHasAttemptedQuiz(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error checking quiz attempts:', err);
        setError('Failed to check your quiz history. Please try again later.');
        setLoading(false);
      }
    };
    
    checkPreviousAttempts();
  }, [navigate]);

  const handleStartQuiz = () => {
    if (hasAttemptedQuiz) {
      alert('You have already taken this quiz. Only one attempt is allowed.');
      return;
    }
    navigate('/quiz');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="instructions-page">
        <InstructionsContainer>
          <Title>Preparing Your Quiz</Title>
          <div className="loading-container">
            <p>Please wait while we check your quiz status...</p>
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          </div>
        </InstructionsContainer>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="instructions-page">
        <InstructionsContainer>
          <DecorativeCircle className="top-right" />
          <DecorativeCircle className="bottom-left" />
          <Title>Something Went Wrong</Title>
          <HighlightBox error>
            <HighlightTitle error>Error Detected</HighlightTitle>
            <p>{error}</p>
          </HighlightBox>
          <ButtonContainer>
            <Button secondary onClick={handleLogout}>
              Return to Login
            </Button>
          </ButtonContainer>
        </InstructionsContainer>
      </div>
    );
  }

  return (
    <div className="instructions-page">
      <InstructionsContainer>
        <DecorativeCircle className="top-right" />
        <DecorativeCircle className="bottom-left" />
        
        <Title>Quiz Instructions</Title>
        
        <StatusContainer>
          <div className={`quiz-status ${hasAttemptedQuiz ? 'completed' : 'available'}`}>
            {hasAttemptedQuiz ? '✓ Quiz Already Completed' : '● Quiz Available'}
          </div>
        </StatusContainer>
        
        {hasAttemptedQuiz ? (
          <HighlightBox warning>
            <HighlightTitle warning>Quiz Already Completed</HighlightTitle>
            <p>You have already taken this quiz. Only one attempt is allowed per user.</p>
            <p>If you believe this is an error, please contact your instructor.</p>
          </HighlightBox>
        ) : (
          <HighlightBox>
            <HighlightTitle>Important Information</HighlightTitle>
            <p>Please read all instructions carefully before starting the quiz. Once you begin, you cannot pause or restart the quiz.</p>
          </HighlightBox>
        )}
        
        <InstructionsList>
          {[
            { title: 'Time Limit', content: 'Each question has its own time limit. The timer for each question will be displayed on the screen.' },
            { title: 'Question Navigation', content: 'You can only move forward in the quiz. Once you answer a question, you cannot go back to review or change your answer.' },
            { title: 'Answer Selection', content: 'For each question, select the appropriate option by clicking on it. Only one option can be selected per question.' },
            { title: 'Quiz Completion', content: 'The quiz ends when you\'ve answered all questions or when the time runs out for the last active question.' },
            { title: 'Results', content: 'Your score will be displayed immediately after completing the quiz. Results will also be stored for future reference.' },
            { title: 'Attempts', content: 'You are allowed only one attempt at this quiz. Once completed, you cannot take it again.' },
            { title: 'Security Rules', content: 'You must not navigate away from the quiz tab or window. A warning will be issued for the first violation. The second violation will result in automatic submission of the quiz.' },
            { title: 'Technical Issues', content: 'If you encounter any technical problems during the quiz, please contact your instructor immediately.' }
          ].map((instruction, index) => (
            <InstructionItem key={index} index={index}>
              <div className="instruction-icon">{index + 1}</div>
              <div>
                <strong>{instruction.title}:</strong> {instruction.content}
              </div>
            </InstructionItem>
          ))}
        </InstructionsList>
        
        {!hasAttemptedQuiz && (
          <HighlightBox>
            <HighlightTitle>Confirmation</HighlightTitle>
            <p>By clicking "Start Quiz," you acknowledge that you have read and understood all the instructions provided above.</p>
          </HighlightBox>
        )}
        
        <ButtonContainer>
          <Button secondary onClick={handleLogout}>
            Logout
          </Button>
          {!hasAttemptedQuiz ? (
            <Button onClick={handleStartQuiz}>
              Start Quiz
            </Button>
          ) : (
            <Button secondary disabled>
              Already Completed
            </Button>
          )}
        </ButtonContainer>
      </InstructionsContainer>
    </div>
  );
};

export default Instructions;
