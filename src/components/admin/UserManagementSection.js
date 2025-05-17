import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { createMultipleUsers, resetUserPassword, syncUsersToFirestore, deleteUsers, auth, db } from '../../firebase/config';
import { parseStudentAccountsFromCSV, validateUserData } from '../../utils/csvUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';

// API URL from environment variables or default to the deployed Netlify functions
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Styled components for User Management
const FileUploadArea = styled.div`
  border: 2px dashed #ccc;
  border-radius: 5px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--primary-color);
  }
`;

const VisuallyHiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
`;

const PreviewSection = styled.div`
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 10px;
`;

const StatusText = styled.p`
  color: ${props => {
    if (props.error) return 'var(--error-color)';
    if (props.success) return 'green';
    return 'var(--light-text)';
  }};
  margin: 10px 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin: 10px 0;
  
  .progress-inner {
    height: 10px;
    background-color: var(--primary-color);
    border-radius: 4px;
    transition: width 0.3s ease;
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
    &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const TabContainer = styled.div`
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

const SearchContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Checkbox = styled.input`
  margin-right: 10px;
`;

const UserCardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const UserCard = styled.div`
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const UserCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const UserCardTitle = styled.h4`
  margin: 0;
  color: var(--primary-color);
`;

const UserInfo = styled.p`
  margin: 5px 0;
  font-size: 14px;
  
  strong {
    font-weight: bold;
    margin-right: 5px;
  }
`;

const UserActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: var(--primary-color);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: var(--error-color);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const BulkActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
  margin-bottom: 20px;
`;

// User Management Section Component
const UserManagementSection = () => {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('import');
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importStatus, setImportStatus] = useState({
    isImporting: false,
    progress: 0,
    message: '',
    error: null,
    results: null
  });
  
  // State for user management features
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  // Function to fetch users from API
  const fetchUsers = async () => {
    if (activeTab === 'manage') {
      setIsLoading(true);
      setStatusMessage({ type: '', message: '' });
      
      // First, try the test endpoint to check if API is working
      try {
        console.log('Testing API connection...');
        const testResponse = await fetch(`${API_URL}/test`);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('API test successful:', testData);
        } else {
          console.warn('API test failed:', testResponse.status, testResponse.statusText);
        }
      } catch (testError) {
        console.error('API test error:', testError);
      }
      
      try {
        // Get current user's ID token for authentication
        const idToken = await auth.currentUser.getIdToken(true);
        console.log('Got ID token, fetching users from API');
        
        const apiUrl = `${API_URL}/users`;
        console.log('API URL:', apiUrl);
        
        // Fetch users from our API
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('API response status:', response.status, response.statusText);
        
        if (!response.ok) {
          // Try to get response text for debugging
          const errorText = await response.text();
          console.error('API error response text:', errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Check if response is actually JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Response is not JSON:', contentType, text.substring(0, 200));
          throw new Error(`Invalid content type: ${contentType}`);
        }
          const data = await response.json();
        console.log('API response data:', data);
        
        if (!data.users) {
          throw new Error('Invalid response format from API');
        }
          // Process the dates in the user data
        const processedUsers = data.users.map(user => {
          // Convert string dates to Date objects with error handling
          const safeDate = (dateValue) => {
            if (!dateValue) return null;
            try {
              const date = new Date(dateValue);
              // Check if date is valid
              return isNaN(date.getTime()) ? null : date;
            } catch (e) {
              console.warn(`Invalid date value: ${dateValue}`);
              return null;
            }
          };
          
          return {
            ...user,
            createdAt: safeDate(user.createdAt),
            lastSignIn: safeDate(user.lastSignIn),
            lastQuiz: safeDate(user.lastQuiz)
          };
        });
        
        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
        console.log(`Found ${processedUsers.length} users from API`);
      } catch (error) {
        console.error('Error fetching users from API:', error);
        
        // Fallback to the old method if API fails
        try {
          // Try to get users from our custom 'users' collection first
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const usersList = [];
          
          // Map user documents to our format
          usersSnapshot.forEach(doc => {
            const userData = doc.data();
            usersList.push({
              email: userData.email,
              rollNumber: userData.rollNumber,
              createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
              uid: userData.uid
            });
          });
          
          // If there are no users in the users collection, try to get them from results
          if (usersList.length === 0) {
            console.log("API failed and no users found in 'users' collection, falling back to 'results'");
            
            const resultsSnapshot = await getDocs(collection(db, 'results'));
            const uniqueUsers = new Map();
            
            // Extract unique users from results
            resultsSnapshot.forEach(doc => {
              const data = doc.data();
              if (data.userEmail && !uniqueUsers.has(data.userEmail)) {
                uniqueUsers.set(data.userEmail, {
                  email: data.userEmail,
                  lastQuiz: data.submittedAt ? new Date(data.submittedAt.seconds * 1000) : null,
                  score: data.scorePercentage || data.score
                });
              }
            });
            
            // Add them to the users list
            uniqueUsers.forEach(user => {
              usersList.push(user);
            });
          }
          
          // Get additional quiz data for users
          const resultsSnapshot = await getDocs(collection(db, 'results'));
          const quizData = new Map();
          
          resultsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userEmail) {
              quizData.set(data.userEmail, {
                lastQuiz: data.submittedAt ? new Date(data.submittedAt.seconds * 1000) : null,
                score: data.scorePercentage || data.score
              });
            }
          });
          
          // Merge quiz data with user data
          const enrichedUsers = usersList.map(user => {
            const quizInfo = quizData.get(user.email);
            return {
              ...user,
              lastQuiz: quizInfo?.lastQuiz || null,
              score: quizInfo?.score || null,
              hasAttemptedQuiz: !!quizInfo
            };
          });
          
          setUsers(enrichedUsers);
          setFilteredUsers(enrichedUsers);
          console.log(`API failed but found ${enrichedUsers.length} users from Firestore`);
          
          setStatusMessage({
            type: 'warning',
            message: 'Using local data - some admin features may not work. Check server connection.'
          });
        } catch (fallbackError) {
          console.error('Error in fallback user fetching:', fallbackError);
          setStatusMessage({
            type: 'error',
            message: 'Failed to load users: ' + error.message
          });
        }
      }
      
      setIsLoading(false);
    }
  };

  // Load users when tab changes
  useEffect(() => {
    fetchUsers();
  }, [activeTab]);
  
  // Filter users based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleUserSelect = (email) => {
    if (selectedUsers.includes(email)) {
      setSelectedUsers(selectedUsers.filter(userEmail => userEmail !== email));
    } else {
      setSelectedUsers([...selectedUsers, email]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.email));
    }
  };
  
  // Reset password using API
  const handleResetPassword = (user) => {
    setUserToReset(user);
    setShowResetModal(true);
  };
  
  const handleConfirmReset = async () => {
    if (!userToReset) return;
    
    setStatusMessage({ type: '', message: '' });
    
    try {
      // Get current user's ID token for authentication
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Call the API endpoint
      const response = await fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: userToReset.email })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: `Password reset email has been sent to ${userToReset.email}`
        });
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      
      // Fallback to the old method if API fails
      try {
        const result = await resetUserPassword(userToReset.email);
        
        if (result.success) {
          setStatusMessage({
            type: 'success',
            message: `Password reset email sent to ${userToReset.email}`
          });
        } else {
          setStatusMessage({
            type: 'error',
            message: `Failed to reset password: ${result.error}`
          });
        }
      } catch (fallbackError) {
        setStatusMessage({
          type: 'error',
          message: `Error: ${error.message}`
        });
      }
    }
    
    setShowResetModal(false);
    setUserToReset(null);
  };
  
  // Delete users using API
  const handleDeleteSelected = () => {
    if (selectedUsers.length === 0) {
      setStatusMessage({
        type: 'error',
        message: 'No users selected for deletion'
      });
      return;
    }
    
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
    if (selectedUsers.length === 0 || !adminPassword) {
      setShowDeleteModal(false);
      return;
    }
    
    setStatusMessage({ type: '', message: '' });
    setIsLoading(true);
    
    try {
      // Get current user's ID token for authentication
      const idToken = await auth.currentUser.getIdToken(true);
      
      // Get UIDs for selected email addresses
      const selectedUids = users
        .filter(user => selectedUsers.includes(user.email))
        .map(user => user.uid)
        .filter(uid => uid); // Filter out any undefined UIDs
        // If we don't have any UIDs (might happen if using fallback user data), 
      // throw an error to use the fallback method
      if (selectedUids.length === 0) {
        throw new Error('No UIDs found for selected users');
      }
      
      // Process in batches to avoid timeouts (max 20 users per batch)
      const BATCH_SIZE = 20;
      const allResults = {
        successful: [],
        failed: [],
        total: selectedUids.length
      };
      
      setStatusMessage({
        type: 'info',
        message: `Deleting ${selectedUids.length} users in batches...`
      });
      
      // Split into batches if needed
      const batches = [];
      for (let i = 0; i < selectedUids.length; i += BATCH_SIZE) {
        batches.push(selectedUids.slice(i, i + BATCH_SIZE));
      }
      
      // Process each batch
      for (let i = 0; i < batches.length; i++) {
        const batchUids = batches[i];
        setStatusMessage({
          type: 'info', 
          message: `Processing batch ${i+1}/${batches.length} (${batchUids.length} users)...`
        });
        
        // Call the bulk delete API endpoint for this batch
        const response = await fetch(`${API_URL}/users/bulk-delete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ uids: batchUids })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const batchResults = await response.json();
        
        // Combine batch results with overall results
        allResults.successful = [...allResults.successful, ...batchResults.successful];
        allResults.failed = [...allResults.failed, ...batchResults.failed];
      }
      
      const results = allResults;
      
      setStatusMessage({
        type: 'success',
        message: `Successfully deleted ${results.successful.length} of ${results.total} users`
      });
      
      // Remove deleted users from the state
      const deletedEmails = results.successful.map(user => user.email);
      setUsers(users.filter(user => !deletedEmails.includes(user.email)));
      setSelectedUsers([]);
      
    } catch (error) {
      console.error('Error deleting users using API:', error);
      
      // Fallback to the old method if API fails
      try {
        const results = await deleteUsers(selectedUsers, adminPassword);
        
        if (results.adminError) {
          setStatusMessage({
            type: 'error',
            message: `Authentication failed: ${results.adminError}`
          });
        } else {
          setStatusMessage({
            type: 'success',
            message: `Successfully deleted ${results.successful.length} of ${results.total} users`
          });
          
          // Update users list
          setUsers(users.filter(user => !selectedUsers.includes(user.email)));
          setSelectedUsers([]);
        }
      } catch (fallbackError) {
        setStatusMessage({
          type: 'error',
          message: `Error: ${error.message}`
        });
      }
    }
    
    setIsLoading(false);
    setShowDeleteModal(false);
    setAdminPassword('');
  };
  
  // Sync all known email addresses to the users collection in Firestore
  const handleSyncUsers = async () => {
    setStatusMessage({ type: '', message: '' });
    setIsLoading(true);
    
    try {
      // Gather all unique email addresses we know about
      const allEmails = users.map(user => user.email);
      
      // Trigger the sync operation
      const results = await syncUsersToFirestore(allEmails);
      
      setStatusMessage({
        type: 'success',
        message: `Successfully synced ${results.successful.length} of ${results.total} users to database`
      });
      
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `Error syncing users: ${error.message}`
      });
    }
    
    setIsLoading(false);
  };
  
  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setImportStatus({
        ...importStatus,
        error: 'Please upload a valid CSV file',
      });
      return;
    }

    setCsvFile(file);
    setImportStatus({
      ...importStatus,
      error: null,
      message: 'File selected: ' + file.name,
    });

    // Read and parse the CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvContent = event.target.result;
        console.log('CSV content (first 100 chars):', csvContent.substring(0, 100));
        
        const parseResult = parseStudentAccountsFromCSV(csvContent);
        console.log('Parse result:', parseResult.success ? 
          `Success - Found ${parseResult.users.length} users` : 
          `Error - ${parseResult.error}`);
        
        if (!parseResult.success) {
          setImportStatus({
            ...importStatus,
            error: parseResult.error
          });
          return;
        }

        console.log('First user in parsed data:', parseResult.users[0]);
        setParsedData(parseResult.users);
        
        // Validate the parsed data
        const validation = validateUserData(parseResult.users);
        setValidationResults(validation);
        console.log('Validation result:', 
          `Valid users: ${validation.validUsers.length}, Issues: ${validation.issues.length}`);
      } catch (error) {
        console.error('CSV parsing error:', error);
        setImportStatus({
          ...importStatus,
          error: `Error parsing CSV: ${error.message}`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImportUsers = async () => {
    if (!validationResults?.validUsers || validationResults.validUsers.length === 0) {
      setImportStatus({
        ...importStatus,
        error: 'No valid users to import'
      });
      return;
    }

    setImportStatus({
      ...importStatus,
      isImporting: true,
      progress: 0,
      message: 'Starting user import...',
      error: null
    });

    try {
      // Progress callback function
      const onProgress = (progressData) => {
        const progressPercent = Math.round((progressData.processed / progressData.total) * 100);
        setImportStatus(prev => ({
          ...prev,
          progress: progressPercent,
          message: `Processed ${progressData.processed} of ${progressData.total} (${progressData.current})`,
          error: progressData.error || null
        }));
      };

      // Create users
      const results = await createMultipleUsers(validationResults.validUsers, onProgress);
      
      setImportStatus({
        isImporting: false,
        progress: 100,
        message: `Import completed! Successfully created ${results.successful.length} out of ${results.total} accounts.`,
        error: null,
        results: results
      });
    } catch (error) {
      setImportStatus({
        ...importStatus,
        isImporting: false,
        error: `Import failed: ${error.message}`
      });
    }
  };  // Render the users from CSV file for import
  const renderUserTable = () => {
    console.log('Rendering user table, parsedData:', parsedData ? 
      `${parsedData.length} users available` : 'No data available');
      
    if (!parsedData || parsedData.length === 0) return (
      <div>
        <p>No users found in the CSV file or the file format is incorrect.</p>
        <p>Please make sure your CSV file contains columns named "Roll Number" and "Pass".</p>
      </div>
    );
    
    return (
      <div>
        <h3>User Preview ({parsedData.length} users found)</h3>
        <Table>
          <thead>
            <tr>
              <TableHeader>Roll Number</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Password</TableHeader>
              <TableHeader>Status</TableHeader>
            </tr>
          </thead>
          <tbody>
            {parsedData.map((user, index) => {
              const hasIssues = validationResults?.issues?.some(issue => 
                issue.rollNumber === user.rollNumber
              );
              
              const issues = validationResults?.issues?.find(issue => 
                issue.rollNumber === user.rollNumber
              )?.issues || [];
              
              return (
                <TableRow key={index} style={{ 
                  backgroundColor: hasIssues ? '#ffebee' : undefined 
                }}>
                  <TableCell>{user.rollNumber}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.password}</TableCell>
                  <TableCell>
                    {hasIssues ? (
                      <span style={{ color: 'var(--error-color)' }}>
                        Error: {issues.join(', ')}
                      </span>
                    ) : (
                      <span style={{ color: 'green' }}>Valid</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        
        {validationResults && (
          <div style={{ marginTop: '20px' }}>
            <h4>Validation Summary</h4>
            <p>
              Valid users: <strong>{validationResults.validUsers?.length || 0}</strong> out of <strong>{parsedData.length}</strong>
            </p>
            <p>
              Issues found: <strong>{validationResults.issues?.length || 0}</strong>
            </p>
            
            {validationResults.validUsers?.length > 0 && (
              <ActionButton 
                onClick={handleImportUsers} 
                disabled={importStatus.isImporting}
              >
                {importStatus.isImporting ? 'Importing...' : 'Import Valid Users'}
              </ActionButton>
            )}
          </div>
        )}
        
        {importStatus.isImporting && (
          <div style={{ marginTop: '20px' }}>
            <h4>Import Progress</h4>
            <ProgressBar>
              <div 
                className="progress-inner" 
                style={{ width: `${importStatus.progress}%` }}
              />
            </ProgressBar>
            <StatusText>{importStatus.message}</StatusText>
          </div>
        )}
        
        {importStatus.results && (
          <div style={{ marginTop: '20px' }}>
            <h4>Import Results</h4>
            <p>
              Successfully created: <strong>{importStatus.results.successful.length}</strong> accounts
            </p>
            <p>
              Failed: <strong>{importStatus.results.failed.length}</strong> accounts
            </p>
            
            {importStatus.results.failed.length > 0 && (
              <PreviewSection>
                <h5>Failed Accounts</h5>
                <Table>
                  <thead>
                    <tr>
                      <TableHeader>Roll Number</TableHeader>
                      <TableHeader>Email</TableHeader>
                      <TableHeader>Error</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {importStatus.results.failed.map((fail, index) => (
                      <TableRow key={index}>
                        <TableCell>{fail.rollNumber}</TableCell>
                        <TableCell>{fail.email}</TableCell>
                        <TableCell>{fail.error}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </PreviewSection>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render the user management interface
  const renderManageUsers = () => {
    if (isLoading) {
      return <p>Loading users...</p>;
    }
    
    return (
      <>        <h3>User Management ({filteredUsers.length} users{filteredUsers.length !== users.length ? ` of ${users.length} total` : ''})</h3>
        
        <div style={{ display: 'flex', marginBottom: '10px', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#4CAF50', marginRight: '5px' }}></div>
            <span>Quiz Completed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '15px', height: '15px', backgroundColor: '#FFC107', marginRight: '5px' }}></div>
            <span>Quiz Not Attempted</span>
          </div>
        </div>

        <SearchContainer>
          <SearchInput 
            type="text" 
            placeholder="Search users by email..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />          <ActionButton onClick={() => setSearchQuery('')}>
            Clear
          </ActionButton>
          <ActionButton onClick={handleSyncUsers}>
            Sync Users
          </ActionButton>
          {renderDiagnosticsButton()}
        </SearchContainer>
        
        {statusMessage.message && (
          <StatusText error={statusMessage.type === 'error'} success={statusMessage.type === 'success'}>
            {statusMessage.message}
          </StatusText>
        )}
        
        {filteredUsers.length > 0 && (
          <BulkActionBar>
            <div>
              <Checkbox 
                type="checkbox" 
                id="selectAll"
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={handleSelectAll}
              />
              <Label htmlFor="selectAll">
                {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 
                  ? 'Deselect All' 
                  : 'Select All'
                }
              </Label>
            </div>
            
            {selectedUsers.length > 0 && (
              <ActionButton delete onClick={handleDeleteSelected}>
                Delete Selected ({selectedUsers.length})
              </ActionButton>
            )}
          </BulkActionBar>
        )}
        
        {filteredUsers.length === 0 ? (
          <p>No users found matching your search.</p>
        ) : (          <UserCardContainer>
            {filteredUsers.map(user => (
              <UserCard key={user.email} style={{
                borderLeft: user.hasAttemptedQuiz ? '4px solid #4CAF50' : '4px solid #FFC107'
              }}>
                <UserCardHeader>
                  <Checkbox 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.email)}
                    onChange={() => handleUserSelect(user.email)}
                  />
                  <UserCardTitle>{user.email}</UserCardTitle>
                </UserCardHeader>
                
                {user.rollNumber && (
                  <UserInfo>
                    <strong>Roll Number:</strong> {user.rollNumber}
                  </UserInfo>
                )}                {user.createdAt && (
                  <UserInfo>
                    <strong>Created:</strong> 
                    {(() => {
                      try {
                        if (user.createdAt instanceof Date) {
                          return user.createdAt.toLocaleDateString();
                        } else if (typeof user.createdAt === 'string') {
                          const date = new Date(user.createdAt);
                          return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                        }
                        return 'Unknown date';
                      } catch (e) {
                        console.warn('Error formatting createdAt date:', e);
                        return 'Date error';
                      }
                    })()}
                  </UserInfo>
                )}
                  {user.lastQuiz ? (
                  <>
                    <UserInfo>
                      <strong>Last Quiz:</strong> 
                      {(() => {
                        try {
                          if (user.lastQuiz instanceof Date) {
                            return `${user.lastQuiz.toLocaleDateString()} ${user.lastQuiz.toLocaleTimeString()}`;
                          } else if (typeof user.lastQuiz === 'string') {
                            const date = new Date(user.lastQuiz);
                            return isNaN(date.getTime()) ? 
                              'Invalid date' : 
                              `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                          }
                          return 'Unknown date';
                        } catch (e) {
                          console.warn('Error formatting lastQuiz date:', e);
                          return 'Date error';
                        }
                      })()}
                    </UserInfo>
                    
                    {user.score !== undefined && (
                      <UserInfo>
                        <strong>Score:</strong> {Math.round(user.score)}%
                      </UserInfo>
                    )}
                  </>
                ) : (
                  <UserInfo style={{ color: '#FFC107' }}>
                    <strong>Status:</strong> Quiz not attempted
                  </UserInfo>
                )}
                
                <UserActions>
                  <ActionButton onClick={() => handleResetPassword(user)}>
                    Reset Password
                  </ActionButton>
                </UserActions>
              </UserCard>
            ))}
          </UserCardContainer>
        )}
        
        {/* Password Reset Modal */}
        {showResetModal && userToReset && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Reset Password</ModalTitle>
                <CloseButton onClick={() => setShowResetModal(false)}>×</CloseButton>
              </ModalHeader>
              
              <p>Send password reset email to {userToReset.email}?</p>
              <p>The user will receive an email with instructions to create a new password.</p>
              
              <UserActions>
                <ActionButton onClick={handleConfirmReset}>
                  Send Reset Email
                </ActionButton>
                <ActionButton 
                  style={{ backgroundColor: '#ccc', color: '#333' }}
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </ActionButton>
              </UserActions>
            </ModalContent>
          </Modal>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Delete Users</ModalTitle>
                <CloseButton onClick={() => setShowDeleteModal(false)}>×</CloseButton>
              </ModalHeader>
              
              <p>Are you sure you want to delete {selectedUsers.length} selected users?</p>
              <p>This action cannot be undone.</p>
              
              <FormGroup>
                <Label htmlFor="adminPassword">Confirm your password:</Label>
                <Input
                  type="password"
                  id="adminPassword"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter your admin password"
                  required
                />
              </FormGroup>
              
              <UserActions>
                <ActionButton 
                  delete 
                  onClick={handleConfirmDelete}
                  disabled={!adminPassword}
                >
                  Delete Users
                </ActionButton>
                <ActionButton 
                  style={{ backgroundColor: '#ccc', color: '#333' }}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </ActionButton>
              </UserActions>
            </ModalContent>
          </Modal>
        )}
      </>
    );
  };
  
  // Diagnostic function to check connection to API endpoints
  const runDiagnostics = async () => {
    const endpoints = ['/api/debug', '/api/test', '/api/users'];
    const results = {};
    
    setStatusMessage({ 
      type: 'info', 
      message: 'Running API diagnostics...' 
    });
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const response = await fetch(endpoint);
        let responseData = '';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }
        } catch (parseError) {
          responseData = `Error parsing response: ${parseError.message}`;
        }
        
        results[endpoint] = {
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          response: responseData
        };
        
        console.log(`Endpoint ${endpoint}:`, results[endpoint]);
      } catch (error) {
        results[endpoint] = { error: error.message };
        console.error(`Error testing ${endpoint}:`, error);
      }
    }
    
    console.log('API Diagnostics completed:', results);
    
    // Check if the debug endpoint worked
    if (results['/api/debug']?.ok) {
      setStatusMessage({
        type: 'success',
        message: `API connection working. Environment found: ${results['/api/debug'].response.netlifyEnvironment || 'unknown'}`
      });
    } else {
      setStatusMessage({
        type: 'warning',
        message: 'API diagnostic failed. Check console for details.'
      });
    }
    
    return results;
  };
  
  // Add a diagnostic button to the render function
  const renderDiagnosticsButton = () => (
    <ActionButton 
      style={{ backgroundColor: '#9c27b0' }}
      onClick={runDiagnostics}
    >
      Run API Diagnostics
    </ActionButton>
  );
  
  return (
    <div>
      <TabContainer>
        <Tab 
          active={activeTab === 'import'} 
          onClick={() => setActiveTab('import')}
        >
          Import Users
        </Tab>
        <Tab 
          active={activeTab === 'manage'} 
          onClick={() => setActiveTab('manage')}
        >
          Manage Users
        </Tab>
      </TabContainer>
      
      {activeTab === 'import' ? (
        <>
          <h3>Bulk User Import</h3>
          <p>Upload a CSV file containing student records to create multiple user accounts at once.</p>
          
          <FileUploadArea onClick={handleFileUploadClick}>
            <div>
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 14.9861C11 15.5384 11.4477 15.9861 12 15.9861C12.5523 15.9861 13 15.5384 13 14.9861V7.82831L16.2428 11.0711C16.6333 11.4616 17.2665 11.4616 17.657 11.0711C18.0475 10.6806 18.0475 10.0474 17.657 9.65692L12.7071 4.70692C12.3166 4.31639 11.6834 4.31639 11.2929 4.70692L6.34315 9.65692C5.95262 10.0474 5.95262 10.6806 6.34315 11.0711C6.73367 11.4616 7.36684 11.4616 7.75736 11.0711L11 7.82831V14.9861Z" fill="currentColor" />
                <path d="M4 14H6V18H18V14H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V14Z" fill="currentColor" />
              </svg>
              <p>Click to upload a CSV file or drag and drop here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--light-text)' }}>
                File should contain Roll Number and Pass columns
              </p>
            </div>
            <VisuallyHiddenInput
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </FileUploadArea>
          
          {importStatus.error && (
            <StatusText error>{importStatus.error}</StatusText>
          )}
          
          {importStatus.message && !importStatus.error && (
            <StatusText success>{importStatus.message}</StatusText>
          )}
          
          <PreviewSection>
            {renderUserTable()}
          </PreviewSection>
        </>
      ) : (
        <>
          <h3>Manage Users</h3>
          <p>Search, view, and manage all user accounts in the system.</p>
          
          {renderManageUsers()}
        </>
      )}
    </div>
  );
};

export default UserManagementSection;
