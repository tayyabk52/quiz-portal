import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { createMultipleUsers, deleteUsers, resetUserPassword, auth, db } from '../../firebase/config';
import { parseStudentAccountsFromCSV, validateUserData } from '../../utils/csvUtils';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
  // Fetch users from Firebase (in a real app, you'd use Firebase Admin SDK via a backend)
  // For this example, we'll use the authentication state to get users
  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab === 'manage') {
        setIsLoading(true);
        try {
          // In a real implementation with Firebase Admin SDK, you would fetch all users
          // For this client-side demo, we'll get users from results collection as a workaround
          const querySnapshot = await getDocs(collection(db, 'results'));
          
          // Extract unique users from results
          const uniqueUsers = new Map();
          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userEmail && !uniqueUsers.has(data.userEmail)) {
              uniqueUsers.set(data.userEmail, {
                email: data.userEmail,
                // We don't have the password here, it would be unavailable in a real system too
                // You could store additional user metadata in Firestore if needed
                lastQuiz: data.submittedAt ? new Date(data.submittedAt.seconds * 1000) : null,
                score: data.scorePercentage || data.score
              });
            }
          });
          
          const usersList = Array.from(uniqueUsers.values());
          setUsers(usersList);
          setFilteredUsers(usersList);
        } catch (error) {
          console.error('Error fetching users:', error);
          setStatusMessage({
            type: 'error',
            message: 'Failed to load users: ' + error.message
          });
        }
        setIsLoading(false);
      }
    };
    
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
  
  const handleResetPassword = (user) => {
    setUserToReset(user);
    setShowResetModal(true);
  };
  
  const handleConfirmReset = async () => {
    if (!userToReset) return;
    
    setStatusMessage({ type: '', message: '' });
    
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
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `Error: ${error.message}`
      });
    }
    
    setShowResetModal(false);
    setUserToReset(null);
  };
  
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
      const results = await deleteUsers(selectedUsers, adminPassword, (progress) => {
        // You could update UI based on progress here
      });
      
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
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `Error: ${error.message}`
      });
    }
    
    setIsLoading(false);
    setShowDeleteModal(false);
    setAdminPassword('');
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
      <>
        <SearchContainer>
          <SearchInput 
            type="text" 
            placeholder="Search users by email..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <ActionButton onClick={() => setSearchQuery('')}>
            Clear
          </ActionButton>
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
        ) : (
          <UserCardContainer>
            {filteredUsers.map(user => (
              <UserCard key={user.email}>
                <UserCardHeader>
                  <Checkbox 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.email)}
                    onChange={() => handleUserSelect(user.email)}
                  />
                  <UserCardTitle>{user.email}</UserCardTitle>
                </UserCardHeader>
                
                {user.lastQuiz && (
                  <UserInfo>
                    <strong>Last Quiz:</strong> 
                    {user.lastQuiz.toLocaleDateString()} {user.lastQuiz.toLocaleTimeString()}
                  </UserInfo>
                )}
                
                {user.score !== undefined && (
                  <UserInfo>
                    <strong>Score:</strong> {Math.round(user.score)}%
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
