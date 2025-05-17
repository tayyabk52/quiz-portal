/**
 * Utilities for handling Google Drive image URLs in the quiz application
 */

/**
 * Converts a Google Drive sharing link to a direct image URL that can be used in <img> tags
 * 
 * @param {string} driveUrl - The Google Drive sharing URL
 * @returns {string} - A direct image URL
 */
export const convertDriveUrl = (driveUrl) => {
  if (!driveUrl) return '';
  
  // Handle already converted URLs
  if (driveUrl.includes('drive.google.com/uc?')) {
    return driveUrl;
  }
  
  // Handle standard Google Drive sharing URLs
  // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  if (driveUrl.includes('drive.google.com/file/d/')) {
    const fileIdMatch = driveUrl.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1].split('/')[0]; // Remove any trailing path components
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  
  // Handle alternate format Google Drive sharing URLs
  // Format: https://drive.google.com/open?id=FILE_ID
  if (driveUrl.includes('drive.google.com/open?id=')) {
    const fileIdMatch = driveUrl.match(/id=([^&]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
    }
  }
  
  // Handle Google Drive folder URLs with preview
  if (driveUrl.includes('drive.google.com/drive/folders/')) {
    // These don't typically work directly as image sources
    // Return original URL and it will need to be manually fixed
    return driveUrl;
  }
    // Extract file ID from any Google Drive URL with "usp=sharing"
  const sharingMatch = driveUrl.match(/\/d\/([^\/\?]+)/);
  if (sharingMatch && sharingMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${sharingMatch[1]}`;
  }
  
  // Handle the exact format from your Firebase database (from screenshot)
  if (driveUrl.includes('https://drive.google.com/file/d/') && driveUrl.includes('usp=sharing')) {
    // Example: "https://drive.google.com/file/d/1L20Q_IzazNbHR0kIXPZ9jQ_AoQGNxFm9/view?usp=sharing"
    const fileId = driveUrl.split('/file/d/')[1].split('/')[0];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return driveUrl;
};

/**
 * Tests if a URL is a valid image URL
 * 
 * @param {string} url - The URL to test
 * @returns {boolean} - True if the URL is likely a valid image
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Check if it's a direct image URL
  if (/\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url)) {
    return true;
  }
  
  // Check if it's a Google Drive URL
  if (url.includes('drive.google.com')) {
    return true;
  }
  
  // Add more checks for other image hosting services if needed
  
  return false;
};

export default {
  convertDriveUrl,
  isValidImageUrl
};
