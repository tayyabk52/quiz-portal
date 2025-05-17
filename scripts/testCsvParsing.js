// Test script for CSV parsing functionality
const fs = require('fs');
const path = require('path');

// Mock implementation of the parseStudentAccountsFromCSV function
function parseStudentAccountsFromCSV(csvContent) {
  try {
    // Split the CSV content into lines
    const lines = csvContent.split(/\r?\n/);
    
    // Extract headers
    const headers = lines[0].split(',');
    
    // Find the indexes of Roll Number and Pass columns
    const rollNumberIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'roll number');
    const passIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'pass');
    
    // Validate that required columns exist
    if (rollNumberIndex === -1 || passIndex === -1) {
      return {
        success: false,
        error: "CSV format incorrect. Required columns 'Roll Number' and 'Pass' not found.",
        users: []
      };
    }
    
    // Process each line to extract user data
    const users = [];
    
    // Start from index 2 to skip the header and the blank line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const columns = line.split(',');
      
      // Extract roll number and password
      const rollNumber = columns[rollNumberIndex]?.trim();
      const password = columns[passIndex]?.trim();
      
      // Skip if either is missing
      if (!rollNumber || !password) continue;
      
      // Format the email based on the roll number
      // Convert 24F-0584 to f240584@cfd.nu.edu.pk
      const emailPrefix = rollNumber.replace('-', '').toLowerCase();
      const email = `f${emailPrefix}@cfd.nu.edu.pk`;
      
      users.push({
        rollNumber,
        password,
        email
      });
    }
    
    return {
      success: true,
      users
    };
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return {
      success: false,
      error: `Error parsing CSV: ${error.message}`,
      users: []
    };
  }
}

// Mock implementation of the validateUserData function
function validateUserData(users) {
  const issues = [];
  const validUsers = [];
  
  users.forEach((user, index) => {
    const userIssues = [];
    
    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      userIssues.push(`Invalid email format: ${user.email}`);
    }
    
    // Check password (should be at least 6 chars for Firebase)
    if (!user.password || user.password.length < 6) {
      userIssues.push(`Password too short or missing (min 6 chars required)`);
    }
    
    // If issues found, add to issues array
    if (userIssues.length > 0) {
      issues.push({
        index: index + 1, // +1 for human-readable row number
        rollNumber: user.rollNumber,
        issues: userIssues
      });
    } else {
      validUsers.push(user);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
    validUsers
  };
}

// Function to run the test
function runTest() {
  console.log('CSV Parsing Test');
  console.log('================');
  
  // Create a test CSV file
  const testCsvContent = `Roll Number,Name,Pass
24F-0500,John Doe,Password123
24F-0501,Jane Smith,SecurePass456
24F-0502,Alice Johnson,Test123
24F-0503,Bob Brown,Short`;
  
  // Write test CSV file
  const testCsvPath = path.join(__dirname, 'test_students.csv');
  fs.writeFileSync(testCsvPath, testCsvContent);
  console.log(`Created test CSV at ${testCsvPath}`);
  
  // Read and parse the CSV
  const csvContent = fs.readFileSync(testCsvPath, 'utf8');
  console.log('\nParsing CSV...');
  const parseResult = parseStudentAccountsFromCSV(csvContent);
  
  if (!parseResult.success) {
    console.error(`Parsing failed: ${parseResult.error}`);
    return;
  }
  
  console.log(`Found ${parseResult.users.length} users in CSV:`);
  parseResult.users.forEach((user, i) => {
    console.log(`\nUser ${i + 1}:`);
    console.log(`- Roll Number: ${user.rollNumber}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Password: ${user.password}`);
  });
  
  // Validate the parsed data
  console.log('\nValidating user data...');
  const validation = validateUserData(parseResult.users);
  
  console.log(`\nValidation Summary:`);
  console.log(`- Valid users: ${validation.validUsers.length} out of ${parseResult.users.length}`);
  console.log(`- Issues found: ${validation.issues.length}`);
  
  if (validation.issues.length > 0) {
    console.log('\nValidation Issues:');
    validation.issues.forEach(issue => {
      console.log(`\nUser with Roll Number ${issue.rollNumber}:`);
      issue.issues.forEach(problem => {
        console.log(`- ${problem}`);
      });
    });
  }
  
  console.log('\nTest complete!');
}

// Run the test
runTest();
