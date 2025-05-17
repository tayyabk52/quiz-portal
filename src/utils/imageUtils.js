/**
 * Utilities for handling Google Drive image URLs in the quiz application
 * 
 * This module provides multiple approaches to resolve Google Drive image URLs
 * to ensure maximum compatibility across different sharing formats and browser environments.
 */

/**
 * Formats for displaying Google Drive images
 * Each format has different compatibility with browsers and CORS policies
 * @type {Object}
 */
const DriveFormats = {
  // Format 1: lh3.googleusercontent.com - Most reliable for browser display
  WEB_CONTENT: (fileId) => `https://lh3.googleusercontent.com/d/${fileId}`,
  
  // Format 2: Thumbnail with large size - Good fallback with wide compatibility
  THUMBNAIL: (fileId) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
  
  // Format 3: Simple content URL - Works in many browsers
  CONTENT: (fileId) => `https://drive.google.com/uc?id=${fileId}`,
  
  // Format 4: Traditional uc export format - Sometimes blocked by CORS
  EXPORT_VIEW: (fileId) => `https://drive.google.com/uc?export=view&id=${fileId}`,
  
  // Format 5: Direct content serving with export=download
  DOWNLOAD: (fileId) => `https://drive.google.com/uc?export=download&id=${fileId}`
};

/**
 * Array of URL formats to try in sequence (ordered by reliability)
 */
export const DRIVE_FORMAT_ARRAY = [
  DriveFormats.WEB_CONTENT,
  DriveFormats.THUMBNAIL,
  DriveFormats.CONTENT,
  DriveFormats.EXPORT_VIEW,
  DriveFormats.DOWNLOAD
];

/**
 * Extracts the file ID from a Google Drive URL regardless of format
 * 
 * @param {string} url - The Google Drive URL
 * @returns {string|null} - The file ID or null if not found
 */
export const extractFileId = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    // Pattern 1: /file/d/{fileId}/view
    const filePathMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$|\?)/);
    if (filePathMatch) return filePathMatch[1];
    
    // Pattern 2: id={fileId}
    const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)(?:&|$)/);
    if (idParamMatch) return idParamMatch[1];
    
    // Pattern 3: /d/{fileId}/
    const dPathMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)(?:\/|$|\?)/);
    if (dPathMatch) return dPathMatch[1];
    
    // Pattern 4: /open?id={fileId}
    const openIdMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)(?:&|$)/);
    if (openIdMatch) return openIdMatch[1];
  } catch (e) {
    console.error("Error extracting file ID:", e);
  }
  
  return null;
};

/**
 * Get a Drive URL in a specific format based on attempt number
 * 
 * @param {string} url - Original Drive URL
 * @param {number} attempt - Current attempt number (0-based)
 * @returns {string} - Formatted URL to try
 */
export const getImageUrlByAttempt = (url, attempt = 0) => {
  const fileId = extractFileId(url);
  if (!fileId) return url;
  
  // Get the format function for this attempt or use the last one if we've exhausted all options
  const formatFunction = DRIVE_FORMAT_ARRAY[Math.min(attempt, DRIVE_FORMAT_ARRAY.length - 1)];
  return formatFunction(fileId);
};

/**
 * Converts a Google Drive sharing link to a direct image URL that can be used in <img> tags
 * 
 * @param {string} driveUrl - The Google Drive sharing URL 
 * @returns {string} - The most reliable format to try first
 */
export const convertDriveUrl = (driveUrl) => {
  if (!driveUrl) return '';
  
  // Return the original URL if it's already a converted format
  if (driveUrl.includes('drive.google.com/uc?') || 
      driveUrl.includes('drive.google.com/thumbnail') ||
      driveUrl.includes('lh3.googleusercontent.com')) {
    return driveUrl;
  }
  
  // Extract the file ID from the URL
  const fileId = extractFileId(driveUrl);
  
  // Return the original URL if we couldn't extract a file ID
  if (!fileId) return driveUrl;
  
  // Return the most reliable format
  return DriveFormats.WEB_CONTENT(fileId);
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
  if (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com')) {
    return true;
  }
  
  // Add more checks for other image hosting services if needed
  
  return false;
};

/**
 * Creates an image component that uses progressive enhancement to try different image URLs
 * until one loads successfully
 * 
 * @param {Object} props - Component props
 * @param {string} props.imageUrl - The original image URL
 * @param {string} props.alt - Alt text for the image
 * @param {Function} props.onLoadSuccess - Optional callback when an image loads successfully
 * @param {Function} props.onAllAttemptsFailed - Optional callback when all attempts fail
 * @returns {Object} - React component and current state
 */
export const createProgressiveImageLoader = (imageUrl) => {
  // Current state
  let attempt = 0;
  let isLoading = true;
  let hasError = false;
  let currentUrl = '';
  
  // Setup initial URL
  if (imageUrl) {
    currentUrl = getImageUrlByAttempt(imageUrl, attempt);
  }
  
  return {
    // Return methods to control the image loading
    getNextUrl: () => {
      attempt = Math.min(attempt + 1, DRIVE_FORMAT_ARRAY.length - 1);
      currentUrl = getImageUrlByAttempt(imageUrl, attempt);
      return currentUrl;
    },
    getCurrentUrl: () => currentUrl,
    getCurrentAttempt: () => attempt,
    hasMoreAttempts: () => attempt < DRIVE_FORMAT_ARRAY.length - 1
  };
};

export default {
  convertDriveUrl,
  extractFileId,
  isValidImageUrl,
  getImageUrlByAttempt,
  createProgressiveImageLoader,
  DRIVE_FORMAT_ARRAY
};
