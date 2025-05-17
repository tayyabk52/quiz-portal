import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { createMultipleUsers } from '../../firebase/config';
import { parseStudentAccountsFromCSV, validateUserData } from '../../utils/csvUtils';

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

// User Management Section Component
const UserManagementSection = () => {
  const fileInputRef = useRef(null);
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
  };
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

  return (
    <div>
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
    </div>
  );
};

export default UserManagementSection;
