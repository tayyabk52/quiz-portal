import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { convertDriveUrl, isValidImageUrl } from '../../utils/imageUtils';

// This component would only be accessible to administrators in a real application
// It would require additional authentication and authorization checks

const AdminContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const AdminTitle = styled.h2`
  color: var(--primary-color);
  margin-bottom: 20px;
  text-align: center;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  padding: 10px 20px;
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-color)'};
  border: none;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  transition: all 0.3s;

  &:hover {
    background-color: ${props => props.active ? 'var(--primary-color)' : '#f0f0f0'};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  background-color: #f8f9fa;
  color: var(--text-color);
  font-weight: bold;
  border-bottom: 2px solid #ddd;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  background-color: ${props => {
    if (props.delete) return 'var(--error-color)';
    if (props.edit) return 'var(--warning-color)';
    return 'var(--primary-color)';
  }};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  margin-right: 5px;
  cursor: pointer;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
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

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  min-height: 100px;

  &:focus {
    border-color: var(--primary-color);
    outline: none;
  }
`;

const SubmitButton = styled.button`
  background-color: var(--success-color);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
  align-self: flex-start;

  &:hover {
    background-color: #2d964d;
  }
`;

const ImagePreview = styled.div`
  margin-top: 10px;
  
  img {
    max-width: 200px;
    max-height: 200px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px;
  }
`;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 30,
    imageUrl: ''
  });
  const [previewUrl, setPreviewUrl] = useState('');

  // Fetch questions and results from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch questions
        const questionsSnapshot = await getDocs(collection(db, 'questions'));
        const questionsData = [];
        questionsSnapshot.forEach((doc) => {
          questionsData.push({ id: doc.id, ...doc.data() });
        });
        setQuestions(questionsData);
        
        // Fetch results
        const resultsSnapshot = await getDocs(collection(db, 'results'));
        const resultsData = [];
        resultsSnapshot.forEach((doc) => {
          resultsData.push({ id: doc.id, ...doc.data() });
        });
        setResults(resultsData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({
      ...formData,
      options: newOptions
    });
  };  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({
      ...formData,
      imageUrl: url
    });
    
    // If it's a valid URL, convert it to a direct image URL and set as preview
    if (url && isValidImageUrl(url)) {
      const directUrl = convertDriveUrl(url);
      setPreviewUrl(directUrl);
    } else {
      setPreviewUrl('');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {      // Create question object with converted Google Drive URL
      const newQuestion = {
        question: formData.question,
        options: formData.options,
        correctAnswer: parseInt(formData.correctAnswer),
        timeLimit: parseInt(formData.timeLimit),
        imageUrl: formData.imageUrl ? convertDriveUrl(formData.imageUrl) : '' // Convert to direct image URL
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'questions'), newQuestion);
      
      // Reset form
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 30,
        imageUrl: ''
      });
      setPreviewUrl('');
      
      // Refresh questions list
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionsData = [];
      questionsSnapshot.forEach((doc) => {
        questionsData.push({ id: doc.id, ...doc.data() });
      });
      setQuestions(questionsData);
      
      alert('Question added successfully!');
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Error adding question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        
        // Refresh questions list
        setQuestions(questions.filter(question => question.id !== id));
        
        alert('Question deleted successfully!');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question. Please try again.');
      }
    }
  };

  const renderQuestionsTab = () => {
    return (
      <>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="question">Question:</Label>
            <Input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Options:</Label>
            {formData.options.map((option, index) => (
              <Input
                key={index}
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{ marginBottom: '10px' }}
                required
              />
            ))}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="correctAnswer">Correct Answer:</Label>
            <select
              id="correctAnswer"
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleChange}
              required
              style={{ padding: '12px', width: '100%', borderRadius: '4px' }}
            >
              {formData.options.map((_, index) => (
                <option key={index} value={index}>
                  Option {index + 1}
                </option>
              ))}
            </select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="timeLimit">Time Limit (seconds):</Label>
            <Input
              type="number"
              id="timeLimit"
              name="timeLimit"
              value={formData.timeLimit}
              min="5"
              max="300"
              onChange={handleChange}
              required
            />
          </FormGroup>
            <FormGroup>
            <Label htmlFor="imageUrl">Question Image URL (Google Drive):</Label>
            <Input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleImageUrlChange}
              placeholder="Paste your Google Drive shared image URL here"
            />
            <div style={{ fontSize: '0.85rem', marginTop: '5px', color: 'var(--light-text)' }}>
              Tips: 
              <ul>
                <li>Upload image to Google Drive</li>
                <li>Right-click on the file and select "Get link"</li>
                <li>Make sure it's set to "Anyone with the link can view"</li>
                <li>Copy and paste the shared link here</li>
              </ul>
            </div>
            {previewUrl && (
              <ImagePreview>
                <img src={previewUrl} alt="Preview" />
              </ImagePreview>
            )}
          </FormGroup>
          
          <SubmitButton type="submit">Add Question</SubmitButton>
        </Form>
        
        <Table>
          <thead>
            <tr>
              <TableHeader>Question</TableHeader>
              <TableHeader>Time Limit</TableHeader>
              <TableHeader>Correct Option</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.question}</TableCell>
                <TableCell>{q.timeLimit} seconds</TableCell>
                <TableCell>Option {q.correctAnswer + 1}</TableCell>
                <TableCell>
                  <ActionButton edit>Edit</ActionButton>
                  <ActionButton delete onClick={() => handleDeleteQuestion(q.id)}>Delete</ActionButton>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </>
    );
  };

  const renderResultsTab = () => {
    return (
      <Table>
        <thead>
          <tr>
            <TableHeader>User</TableHeader>
            <TableHeader>Score</TableHeader>
            <TableHeader>Date</TableHeader>
            <TableHeader>Correct Answers</TableHeader>
            <TableHeader>Actions</TableHeader>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell>{result.userEmail}</TableCell>
              <TableCell>{Math.round(result.score)}%</TableCell>
              <TableCell>
                {result.submittedAt ? new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
              </TableCell>
              <TableCell>
                {result.correctAnswers} / {result.totalQuestions}
              </TableCell>
              <TableCell>
                <ActionButton>View Details</ActionButton>
                <ActionButton delete>Delete</ActionButton>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <AdminContainer>
      <AdminTitle>Admin Dashboard</AdminTitle>
      
      <Tabs>
        <Tab
          active={activeTab === 'questions'}
          onClick={() => setActiveTab('questions')}
        >
          Manage Questions
        </Tab>
        <Tab
          active={activeTab === 'results'}
          onClick={() => setActiveTab('results')}
        >
          View Results
        </Tab>
      </Tabs>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        activeTab === 'questions' ? renderQuestionsTab() : renderResultsTab()
      )}
    </AdminContainer>
  );
};

export default Admin;
