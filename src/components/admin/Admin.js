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

// Styled components for result details modal
const ResultDetailModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ResultDetailContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: var(--error-color);
  }
`;

const DetailTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  
  td {
    padding: 10px;
    border-bottom: 1px solid #eee;
  }
`;

const DetailTableHeader = styled.td`
  font-weight: bold;
  color: var(--text-color);
  width: 150px;
`;

const AnswerCard = styled.div`
  padding: 15px;
  background-color: ${props => props.correct ? '#e6f7e9' : '#ffebee'};
  border-left: 5px solid ${props => props.correct ? 'var(--success-color)' : 'var(--error-color)'};
  margin-bottom: 10px;
  border-radius: 4px;
  
  > div {
    margin-bottom: 5px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 30,
    imageUrl: '',
    score: 1 // Adding score per question
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  
  // Format time in seconds to MM:SS format
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };
    // Export results to CSV file
  const exportResultsToCSV = () => {
    if (results.length === 0) {
      alert('No results to export');
      return;
    }
    
    // Create CSV headers
    let csvContent = "User Email,Points,Max Possible Points,Percentage,Date,Correct Answers,Total Questions,Time Taken\n";
    
    // Add row for each result
    results.forEach(result => {
      const dateStr = result.submittedAt ? 
        new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A';
      const timeTaken = result.timeTaken ? formatTime(result.timeTaken) : 'N/A';
      const score = result.totalPoints ? Math.round(result.scorePercentage) : Math.round(result.score);
      const points = result.totalPoints || 'N/A';
      const maxPoints = result.maxPossiblePoints || 'N/A';
      
      csvContent += '"' + result.userEmail + '",' + 
                   points + ',' +
                   maxPoints + ',' +
                   score + '%,"' + 
                   dateStr + '",' + 
                   result.correctAnswers + ',' + 
                   result.totalQuestions + ',"' + 
                   timeTaken + '"\n';
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'quiz_results_' + new Date().toISOString().slice(0,10) + '.csv');
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
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
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create question object with converted Google Drive URL
      const questionData = {
        question: formData.question,
        options: formData.options,
        correctAnswer: parseInt(formData.correctAnswer),
        timeLimit: parseInt(formData.timeLimit),
        imageUrl: formData.imageUrl, // Keep original URL in database
        score: parseInt(formData.score) || 1 // Store score value
      };
      
      if (editingQuestion) {
        // Update existing question
        await updateDoc(doc(db, 'questions', editingQuestion.id), questionData);
        alert('Question updated successfully!');
        setEditingQuestion(null);
      } else {
        // Add new question
        await addDoc(collection(db, 'questions'), questionData);
        alert('Question added successfully!');
      }
      
      // Reset form
      setFormData({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 30,
        imageUrl: '',
        score: 1
      });
      setPreviewUrl('');
      
      // Refresh questions list
      const questionsSnapshot = await getDocs(collection(db, 'questions'));
      const questionsData = [];
      questionsSnapshot.forEach((doc) => {
        questionsData.push({ id: doc.id, ...doc.data() });
      });
      setQuestions(questionsData);
      
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error saving question. Please try again.');
    }
  };
  const handleDeleteQuestion = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await deleteDoc(doc(db, 'questions', id));
        
        // Refresh questions list
        setQuestions(questions.filter(question => question.id !== id));
        
        // Reset form if the deleted question was being edited
        if (editingQuestion && editingQuestion.id === id) {
          setFormData({
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            timeLimit: 30,
            imageUrl: '',
            score: 1
          });
          setPreviewUrl('');
          setEditingQuestion(null);
        }
        
        alert('Question deleted successfully!');
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Error deleting question. Please try again.');
      }
    }
  };
  
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      timeLimit: question.timeLimit,
      imageUrl: question.imageUrl,
      score: question.score || 1
    });
    
    // Set preview URL if there's an image
    if (question.imageUrl) {
      setPreviewUrl(convertDriveUrl(question.imageUrl));
    } else {
      setPreviewUrl('');
    }
    
    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setFormData({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      timeLimit: 30,
      imageUrl: '',
      score: 1
    });
    setPreviewUrl('');
  };

  const handleViewResultDetails = (result) => {
    setSelectedResult(result);
  };

  const handleCloseResultDetails = () => {
    setSelectedResult(null);
  };

  const handleDeleteResult = async (id) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await deleteDoc(doc(db, 'results', id));
        setResults(results.filter(result => result.id !== id));
        alert('Result deleted successfully!');
        
        // Close details modal if the deleted result was being viewed
        if (selectedResult && selectedResult.id === id) {
          setSelectedResult(null);
        }
      } catch (error) {
        console.error('Error deleting result:', error);
        alert('Error deleting result. Please try again.');
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
            <Label htmlFor="score">Question Score (points):</Label>
            <Input
              type="number"
              id="score"
              name="score"
              value={formData.score}
              min="1"
              max="100"
              onChange={handleChange}
              required
            />
            <div style={{ fontSize: '0.85rem', marginTop: '5px', color: 'var(--light-text)' }}>
              Points awarded for correct answer
            </div>
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
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <SubmitButton type="submit">
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </SubmitButton>
            {editingQuestion && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                style={{
                  background: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  padding: '12px 25px',
                  cursor: 'pointer'
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </Form>
        
        <Table>
          <thead>
            <tr>            <TableHeader>Question</TableHeader>
              <TableHeader>Time Limit</TableHeader>
              <TableHeader>Correct Option</TableHeader>
              <TableHeader>Score</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <TableRow key={q.id}>                <TableCell>{q.question}</TableCell>
                <TableCell>{q.timeLimit} seconds</TableCell>
                <TableCell>Option {q.correctAnswer + 1}</TableCell>
                <TableCell>{q.score || 1} points</TableCell><TableCell>
                  <ActionButton edit onClick={() => handleEditQuestion(q)}>Edit</ActionButton>
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
      <>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <h3>Quiz Results</h3>
          <ActionButton onClick={exportResultsToCSV}>Export to CSV</ActionButton>
        </div>
        
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
                <TableCell>
                {result.totalPoints ? 
                  `${result.totalPoints}/${result.maxPossiblePoints} (${Math.round(result.scorePercentage)}%)` : 
                  `${Math.round(result.score)}%`}
              </TableCell>
                <TableCell>
                  {result.submittedAt ? new Date(result.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}
                </TableCell>
                <TableCell>
                  {result.correctAnswers} / {result.totalQuestions}
                </TableCell>
                <TableCell>
                  <ActionButton onClick={() => handleViewResultDetails(result)}>View Details</ActionButton>
                  <ActionButton delete onClick={() => handleDeleteResult(result.id)}>Delete</ActionButton>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        
        {selectedResult && (
          <ResultDetailModal>
            <ResultDetailContent>
              <h3>Result Details</h3>
              <CloseButton onClick={handleCloseResultDetails}>×</CloseButton>
                <DetailTable>
                <tbody>
                  <tr>
                    <DetailTableHeader>User:</DetailTableHeader>
                    <td>{selectedResult.userEmail}</td>
                  </tr>
                  <tr>
                    <DetailTableHeader>Date:</DetailTableHeader>
                    <td>{selectedResult.submittedAt ? new Date(selectedResult.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                  </tr>
                  <tr>
                    <DetailTableHeader>Score Percentage:</DetailTableHeader>
                    <td>{Math.round(selectedResult.scorePercentage || selectedResult.score)}%</td>
                  </tr>
                  <tr>
                    <DetailTableHeader>Points:</DetailTableHeader>
                    <td>{selectedResult.totalPoints || 'N/A'} / {selectedResult.maxPossiblePoints || 'N/A'}</td>
                  </tr>
                  <tr>
                    <DetailTableHeader>Correct Answers:</DetailTableHeader>
                    <td>{selectedResult.correctAnswers} out of {selectedResult.totalQuestions}</td>
                  </tr>
                  {selectedResult.timeTaken && (
                    <tr>
                      <DetailTableHeader>Time Taken:</DetailTableHeader>
                      <td>{formatTime(selectedResult.timeTaken)}</td>
                    </tr>
                  )}
                </tbody>
              </DetailTable>
              
              {selectedResult.answers && selectedResult.answers.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4>Question Responses</h4>
                  {selectedResult.answers.map((answer, index) => (
                    <AnswerCard key={index} correct={answer.correct}>
                      <div><strong>Q{index + 1}:</strong> {answer.question}</div>
                      <div><strong>Selected:</strong> {answer.selected}</div>
                      {!answer.correct && <div><strong>Correct Answer:</strong> {answer.correctAnswer}</div>}
                    </AnswerCard>
                  ))}
                </div>
              )}
            </ResultDetailContent>
          </ResultDetailModal>
        )}
      </>
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
