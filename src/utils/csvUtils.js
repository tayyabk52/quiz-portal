/**
 * Utility functions for parsing and processing CSV files
 */

/**
 * Parse CSV content to extract student accounts
 * @param {string} csvContent - The CSV file content as string
 * @returns {Array} Array of user objects with email and password
 */
export const parseStudentAccountsFromCSV = (csvContent) => {
  try {
    // Split the CSV content into lines (fix the backslash escaping)
    const lines = csvContent.split(/\r?\n/);
    
    // Extract headers
    const headers = lines[0].split(',');
      // Find the indexes of Roll Number, Pass, and Email columns
    const rollNumberIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'roll number');
    const passIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'pass');
    const emailIndex = headers.findIndex(header => 
      header.trim().toLowerCase() === 'email');
    
    // Validate that required columns exist
    if (rollNumberIndex === -1 || passIndex === -1) {
      return {
        success: false,
        error: "CSV format incorrect. Required columns 'Roll Number' and 'Pass' not found.",
        users: []
      };
    }
    
    // Log headers found for debugging
    console.log('CSV headers found:', { 
      rollNumberIndex, 
      passIndex, 
      emailIndex,
      allHeaders: headers.map(h => h.trim())
    });
    
    // Process each line to extract user data
    const users = [];
    
    // Start from index 2 (or earlier if needed) to skip header and any blank lines
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const columns = line.split(',');
        // Extract roll number and password
      const rollNumber = columns[rollNumberIndex]?.trim();
      const password = columns[passIndex]?.trim();
      
      // Skip if either is missing
      if (!rollNumber || !password) continue;
      
      // Get email from the CSV if available, otherwise format it based on roll number
      let email;
      if (emailIndex !== -1 && columns[emailIndex]) {
        email = columns[emailIndex].trim();
      } else {
        // Format the email based on the roll number
        // Convert 24F-0584 to f240584@cfd.nu.edu.pk
        const emailPrefix = rollNumber.replace('-', '').toLowerCase();
        email = `f${emailPrefix}@cfd.nu.edu.pk`;
      }
      
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
};

/**
 * Validates extracted user data
 * @param {Array} users - Array of user objects
 * @returns {Object} Object with validation results
 */
export const validateUserData = (users) => {
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
};
