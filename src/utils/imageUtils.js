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
  
  try {
    // Extract file ID using regex for standard Google Drive sharing URLs
    // This covers formats like:
    // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // - https://drive.google.com/open?id=FILE_ID
    // - Any URL with '/d/' pattern
    
    let fileId = null;
    
    // Standard file sharing format
    if (driveUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = driveUrl.match(/\/file\/d\/([^\/\?]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        fileId = fileIdMatch[1];
      }
    }
    
    // Open link format
    if (!fileId && driveUrl.includes('drive.google.com/open?id=')) {
      const fileIdMatch = driveUrl.match(/id=([^&]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        fileId = fileIdMatch[1];
      }
    }
    
    // Generic /d/ format
    if (!fileId && driveUrl.includes('/d/')) {
      const sharingMatch = driveUrl.match(/\/d\/([^\/\?]+)/);
      if (sharingMatch && sharingMatch[1]) {
        fileId = sharingMatch[1];
      }
    }
    
    // If we found a file ID, use the reliable direct access format with both parameters
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    // Handle Google Drive folder URLs which don't work as image sources
    if (driveUrl.includes('drive.google.com/drive/folders/')) {
      console.warn('Folder URLs cannot be used as direct image sources:', driveUrl);
      return driveUrl;
    }
    
    // Fallback to using the original URL
    return driveUrl;
  } catch (error) {
    console.error('Error processing Google Drive URL:', error);
    return driveUrl;
  }
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
