import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import './AuthPage.css';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const LoginContainer = styled.div`
  max-width: 500px;
  width: 90%;
  margin: 40px auto;
  background-color: white;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 40px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.6s ease;
  
  @media (max-width: 768px) {
    width: 95%;
    padding: 30px 20px;
    margin: 20px auto;
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  }
  
  &:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-5px);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormTitle = styled.h2`
  color: var(--primary-color);
  margin-bottom: 28px;
  text-align: center;
  font-size: 28px;
  font-weight: 600;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 3px;
    background: var(--primary-light);
    border-radius: 2px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color);
  font-size: 15px;
  transition: all 0.2s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--grey-300);
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s ease;
  background-color: var(--grey-50);
  
  &:focus {
    border-color: var(--primary-color);
    background-color: white;
    outline: none;
    box-shadow: 0 0 0 3px var(--primary-light);
  }
  
  &::placeholder {
    color: var(--grey-500);
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 14px 0;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  box-shadow: 0 2px 5px rgba(66, 133, 244, 0.3);
  position: relative;
  
  &:hover:not(:disabled) {
    background-color: var(--primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(66, 133, 244, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background-color: var(--primary-color);
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
    animation: ${pulse} 1.5s infinite ease-in-out;
  }
  
  &:disabled:before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    left: calc(50% - 40px);
    top: calc(50% - 8px);
    animation: ${spin} 1s linear infinite;
  }
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  text-align: center;
  margin-top: 16px;
  padding: 10px;
  background-color: var(--error-light);
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:before {
    content: '!';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    width: 18px;
    height: 18px;
    background-color: var(--error-color);
    color: white;
    border-radius: 50%;
    font-weight: bold;
    font-size: 12px;
  }
`;

const HelpText = styled.small`
  display: block;
  color: var(--text-secondary);
  margin-top: 6px;
  font-size: 13px;
  font-style: italic;
`;

// Logo component for the login page
const LogoIndicator = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background-color: var(--primary-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &:before {
    content: 'Quiz';
    font-size: 32px;
    font-weight: bold;
    color: var(--primary-color);
  }
  
  &:after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background-color: var(--secondary-color);
    border-radius: 50%;
    bottom: -2px;
    right: -2px;
  }
`;

// Decorative elements
const DecorativeCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  
  &.top-right {
    width: 150px;
    height: 150px;
    top: -75px;
    right: -75px;
    background: radial-gradient(circle, var(--primary-light) 0%, rgba(255,255,255,0) 70%);
    opacity: 0.3;
  }
  
  &.bottom-left {
    width: 100px;
    height: 100px;
    bottom: -50px;
    left: -50px;
    background: radial-gradient(circle, var(--secondary-light) 0%, rgba(255,255,255,0) 70%);
    opacity: 0.3;
  }
`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if the input is already a valid email
      let email = username.trim();
      
      // If it doesn't contain @, assume it's a username and add domain
      if (!email.includes('@')) {
        // Validate username format (no spaces or special characters except - and _)
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(email)) {
          setError('Username can only contain letters, numbers, underscores and hyphens');
          setLoading(false);
          return;
        }
        
        email = `${email}@quizportal.com`;
      }
      
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/instructions');
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide more specific error messages
      if (err.code === 'auth/invalid-email') {
        setError('Invalid username format. Please try again.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid username or password. Please try again.');
      } else {
        setError(`Authentication error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="auth-page">
      <LoginContainer>
        <DecorativeCircle className="top-right" />
        <DecorativeCircle className="bottom-left" />
        
        <Form onSubmit={handleSubmit}>
          <LogoIndicator />
          <FormTitle>Student Login</FormTitle>
          
          <FormGroup>
            <Label htmlFor="username">Username or Email</Label>
            <Input
              type="text"
              id="username"
              placeholder="Enter your username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
            <HelpText>You can enter either your username or your complete email address</HelpText>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
      </LoginContainer>
    </div>
  );
};

export default Login;
