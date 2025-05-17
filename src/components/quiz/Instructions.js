import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const InstructionsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
`;

const Title = styled.h2`
  color: var(--primary-color);
  margin-bottom: 20px;
  text-align: center;
`;

const InstructionsList = styled.ol`
  margin-bottom: 30px;
`;

const InstructionItem = styled.li`
  margin-bottom: 15px;
  line-height: 1.6;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`;

const Button = styled.button`
  background-color: ${props => props.secondary ? '#fff' : 'var(--primary-color)'};
  color: ${props => props.secondary ? 'var(--primary-color)' : 'white'};
  border: ${props => props.secondary ? '1px solid var(--primary-color)' : 'none'};
  padding: 12px 25px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${props => props.secondary ? '#f0f0f0' : '#3367d6'};
  }
`;

const HighlightBox = styled.div`
  background-color: #f8f9fa;
  border-left: 4px solid var(--primary-color);
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
`;

const HighlightTitle = styled.h3`
  color: var(--primary-color);
  margin-bottom: 10px;
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
      <InstructionsContainer>
        <Title>Loading...</Title>
        <p>Please wait while we check your quiz status.</p>
      </InstructionsContainer>
    );
  }
  
  if (error) {
    return (
      <InstructionsContainer>
        <Title>Error</Title>
        <HighlightBox>
          <p>{error}</p>
        </HighlightBox>
        <ButtonContainer>
          <Button secondary onClick={handleLogout}>
            Logout
          </Button>
        </ButtonContainer>
      </InstructionsContainer>
    );
  }

  return (
    <InstructionsContainer>
      <Title>Quiz Instructions</Title>
      
      {hasAttemptedQuiz ? (
        <HighlightBox>
          <HighlightTitle>Quiz Already Completed</HighlightTitle>
          <p>You have already taken this quiz. Only one attempt is allowed per user.</p>
          <p>If you believe this is an error, please contact your instructor.</p>
        </HighlightBox>
      ) : (
        <HighlightBox>
          <HighlightTitle>Important!</HighlightTitle>
          <p>Please read all instructions carefully before starting the quiz. Once you begin, you cannot pause or restart the quiz.</p>
        </HighlightBox>
      )}
      
      <InstructionsList>
        <InstructionItem>
          <strong>Time Limit:</strong> Each question has its own time limit. The timer for each question will be displayed on the screen.
        </InstructionItem>
        <InstructionItem>
          <strong>Question Navigation:</strong> You can only move forward in the quiz. Once you answer a question, you cannot go back to review or change your answer.
        </InstructionItem>
        <InstructionItem>
          <strong>Answer Selection:</strong> For each question, select the appropriate option by clicking on it. Only one option can be selected per question.
        </InstructionItem>
        <InstructionItem>
          <strong>Quiz Completion:</strong> The quiz ends when you've answered all questions or when the time runs out for the last active question.
        </InstructionItem>
        <InstructionItem>
          <strong>Results:</strong> Your score will be displayed immediately after completing the quiz. Results will also be stored for future reference.
        </InstructionItem>
        <InstructionItem>
          <strong>Attempts:</strong> You are allowed only one attempt at this quiz. Once completed, you cannot take it again.
        </InstructionItem>
        <InstructionItem>
          <strong>Security Rules:</strong> You must not navigate away from the quiz tab or window. A warning will be issued for the first violation. The second violation will result in automatic submission of the quiz.
        </InstructionItem>
        <InstructionItem>
          <strong>Technical Issues:</strong> If you encounter any technical problems during the quiz, please contact your instructor immediately.
        </InstructionItem>
      </InstructionsList>
      
      {!hasAttemptedQuiz && (
        <HighlightBox>
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
  );
};

export default Instructions;
