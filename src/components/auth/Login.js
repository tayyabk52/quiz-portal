import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

const LoginContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormTitle = styled.h2`
  color: var(--primary-color);
  margin-bottom: 20px;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: var(--text-color);
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const Button = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #3367d6;
  }

  &:disabled {
    background-color: #b3b3b3;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: var(--error-color);
  text-align: center;
  margin-top: 15px;
`;

const HelpText = styled.small`
  display: block;
  color: #666;
  margin-top: 5px;
  font-size: 12px;
`;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();  const handleSubmit = async (e) => {
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
  };
  return (
    <LoginContainer>
      <Form onSubmit={handleSubmit}>
        <FormTitle>Student Login</FormTitle>
        
        <FormGroup>
          <Label htmlFor="username">Username or Email</Label>          <Input
            type="text"
            id="username"
            placeholder="Enter username or full email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </Form>
    </LoginContainer>
  );
};

export default Login;
