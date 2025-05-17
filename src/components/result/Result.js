import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const ResultContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
`;

const ResultHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const ResultTitle = styled.h2`
  color: var(--primary-color);
  margin-bottom: 10px;
`;

const ScoreDisplay = styled.div`
  text-align: center;
  margin: 30px 0;
`;

const ScoreCircle = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: ${props => {
    if (props.score >= 70) return 'var(--success-color)';
    if (props.score >= 40) return 'var(--warning-color)';
    return 'var(--error-color)';
  }};
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const ScoreText = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1;
`;

const ScoreLabel = styled.div`
  font-size: 1rem;
  margin-top: 5px;
`;

const ResultDetails = styled.div`
  margin-bottom: 30px;
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.div`
  font-weight: bold;
  color: var(--text-color);
`;

const DetailValue = styled.div`
  color: var(--light-text);
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

const PreviousAttemptsSection = styled.div`
  margin-top: 40px;
  border-top: 1px solid #eee;
  padding-top: 20px;
`;

const AttemptTitle = styled.h3`
  color: var(--primary-color);
  margin-bottom: 15px;
`;

const ToggleButton = styled(Button)`
  margin: 20px auto;
  display: block;
`;

const AnswerReviewSection = styled.div`
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 20px;
`;

const QuestionCard = styled.div`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  border-left: 4px solid ${props => props.correct ? 'var(--success-color)' : 'var(--error-color)'};
`;

const QuestionHeader = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
`;

const AnswerOption = styled.div`
  margin: 5px 0;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: ${props => {
    if (props.selected && props.correct) return 'rgba(40, 167, 69, 0.2)';
    if (props.selected && !props.correct) return 'rgba(220, 53, 69, 0.2)';
    if (props.correct) return 'rgba(40, 167, 69, 0.1)';
    return 'transparent';
  }};
  border: 1px solid ${props => {
    if (props.selected && props.correct) return 'var(--success-color)';
    if (props.selected && !props.correct) return 'var(--error-color)';
    if (props.correct) return 'var(--success-color)';
    return '#eee';
  }};
`;

const QuestionScore = styled.div`
  text-align: right;
  font-weight: bold;
  margin-top: 10px;
  color: ${props => props.score > 0 ? 'var(--success-color)' : 'var(--error-color)'};
`;

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewAnswers, setViewAnswers] = useState(false);

  // Get the data from location state (passed from Quiz component)
  const scorePercentage = location.state?.scorePercentage || 0;
  const totalPoints = location.state?.totalPoints || 0;
  const maxPossiblePoints = location.state?.maxPossiblePoints || 0;
  const correctAnswers = location.state?.correctAnswers || 0;
  const totalQuestions = location.state?.totalQuestions || 0;
  const answers = location.state?.answers || [];
  
  useEffect(() => {
    const fetchPreviousAttempts = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        // Query Firestore for previous attempts by this user
        const resultsRef = collection(db, 'results');
        const q = query(
          resultsRef,
          where('userId', '==', currentUser.uid),
          orderBy('submittedAt', 'desc'),
          limit(5) // Limit to recent attempts
        );
        
        const querySnapshot = await getDocs(q);
        const attempts = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          attempts.push({
            id: doc.id,
            score: data.score,
            submittedAt: data.submittedAt.toDate(),
            correctAnswers: data.correctAnswers,
            totalQuestions: data.totalQuestions
          });
        });
        
        setPreviousAttempts(attempts.filter((_, index) => index > 0)); // Exclude current attempt
        setLoading(false);
      } catch (error) {
        console.error('Error fetching previous attempts:', error);
        setLoading(false);
      }
    };
    
    fetchPreviousAttempts();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return (
    <ResultContainer>
      <ResultHeader>
        <ResultTitle>Quiz Results</ResultTitle>
        <p>Thank you for completing the quiz!</p>
      </ResultHeader>
      
      <ScoreDisplay>
        <ScoreCircle score={scorePercentage}>
          <ScoreText>{Math.round(scorePercentage)}%</ScoreText>
          <ScoreLabel>Score</ScoreLabel>
        </ScoreCircle>
      </ScoreDisplay>
      
      <ResultDetails>
        <DetailRow>
          <DetailLabel>Points Earned:</DetailLabel>
          <DetailValue>{totalPoints} out of {maxPossiblePoints} points</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Correct Answers:</DetailLabel>
          <DetailValue>{correctAnswers} out of {totalQuestions} questions</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Completion Time:</DetailLabel>
          <DetailValue>{formatDate(new Date())}</DetailValue>
        </DetailRow>
        <DetailRow>
          <DetailLabel>Result:</DetailLabel>
          <DetailValue>
            {scorePercentage >= 70 ? 'Passed' : 'Need Improvement'}
          </DetailValue>
        </DetailRow>
      </ResultDetails>
      
      <ToggleButton 
        onClick={() => setViewAnswers(!viewAnswers)} 
        secondary={viewAnswers}
      >
        {viewAnswers ? 'Hide Answers' : 'Show Answers'}
      </ToggleButton>
      
      {viewAnswers && answers.length > 0 && (
        <AnswerReviewSection>
          <AttemptTitle>Review Your Answers</AttemptTitle>
          {answers.map((answer, index) => (
            <QuestionCard key={index} correct={answer.correct}>
              <QuestionHeader>
                Question {index + 1}: {answer.question}
              </QuestionHeader>
              {answer.selectedOption !== -1 ? (
                <>
                  <AnswerOption 
                    selected={true} 
                    correct={answer.correct}
                  >
                    Your answer: {answer.selected}
                  </AnswerOption>
                  {!answer.correct && (
                    <AnswerOption correct={true}>
                      Correct answer: {answer.correctAnswer}
                    </AnswerOption>
                  )}
                </>
              ) : (
                <AnswerOption>
                  No answer selected
                </AnswerOption>
              )}
              <QuestionScore score={answer.score}>
                Score: {answer.score} / {answer.maxScore} points
              </QuestionScore>
            </QuestionCard>
          ))}
        </AnswerReviewSection>
      )}
      
      {previousAttempts.length > 0 && (
        <PreviousAttemptsSection>
          <AttemptTitle>Previous Attempts</AttemptTitle>
          {previousAttempts.map((attempt, index) => (
            <DetailRow key={index}>
              <DetailLabel>{formatDate(attempt.submittedAt)}</DetailLabel>
              <DetailValue>
                Score: {Math.round(attempt.scorePercentage || attempt.score)}% 
                ({attempt.correctAnswers}/{attempt.totalQuestions})
              </DetailValue>
            </DetailRow>
          ))}
        </PreviousAttemptsSection>
      )}
      
      <ButtonContainer>
        <Button secondary onClick={handleLogout}>
          Logout
        </Button>
      </ButtonContainer>
    </ResultContainer>
  );
};

export default Result;
