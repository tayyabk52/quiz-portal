import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

/**
 * ImageLoader component with robust error handling and CORS proxy support
 * This component solves common issues with loading images from external services like Google Drive
 */
const ImageLoader = ({
  src,
  alt = "Image",
  className,
  width = "auto",
  height = "auto",
  onLoad = () => {},
  onError = () => {}
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  // List of approaches to try (focusing only on those that work with CSP)
  const urlTransformers = [
    // Format 1: Direct URL - try this first for performance, only for images with correct extension
    (url) => {
      // Only use direct URL if it's an image file and not from problematic domains
      if (/\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url) && 
          !url.includes('drive.google.com') && 
          !url.includes('googleapis.com')) {
        return url;
      }
      return null;
    },
    
    // Format 2: Google Drive thumbnail - often works through CSP
    (url) => {
      const fileId = extractGoogleDriveId(url);
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : null;
    },
    
    // Format 3: Google Drive lh3 format - most reliable
    (url) => {
      const fileId = extractGoogleDriveId(url);
      return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : null;
    },
    
    // Format 4: Direct export with export=view (last resort)
    (url) => {
      const fileId = extractGoogleDriveId(url);
      return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : null;
    }
  ];

  // Extract the domain from a URL
  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  };

  // Extract the path from a URL
  const extractPath = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return '';
    }
  };

  // Extract Google Drive file ID
  const extractGoogleDriveId = (url) => {
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
  // Try loading with different URL transformers
  const [transformerIndex, setTransformerIndex] = useState(0);
  
  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    if (transformerIndex < urlTransformers.length) {
      setLoading(true);
      setError(false);
      
      // Get transformed URL or null if this transformer doesn't apply
      const transformedUrl = urlTransformers[transformerIndex](src);
      
      if (transformedUrl) {
        setImageSrc(transformedUrl);
        console.log(`Attempt ${transformerIndex + 1}: Loading image using ${transformedUrl}`);
      } else {
        // Skip this transformer if it returned null and try the next one
        setTransformerIndex(prevIndex => prevIndex + 1);
      }
    } else {
      // All transformers failed
      setError(true);
      setLoading(false);
      onError();
    }
  }, [src, transformerIndex]);

  const handleImageError = () => {
    if (transformerIndex < urlTransformers.length - 1) {
      // Try next transformer
      setTransformerIndex(transformerIndex + 1);
    } else {
      // All transformers failed
      setError(true);
      setLoading(false);
      onError();
    }
  };
  const handleImageLoad = () => {
    setLoading(false);
    onLoad();
    console.log(`Image loaded successfully using attempt ${transformerIndex + 1}`);
  };
  return (
    <Container className={className}>
      {error ? (
        <div>
          <ErrorMessage>
            <span role="img" aria-label="warning">⚠️</span> Image failed to load
          </ErrorMessage>
          <PlaceholderImage>
            <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="#f0f0f0"/>
              <path d="M30,40 L70,40 L70,70 L30,70 Z" fill="#e0e0e0"/>
              <path d="M35,35 L65,35 L65,50 L35,50 Z" fill="#d0d0d0"/>
              <path d="M40,55 L60,55 L60,65 L40,65 Z" fill="#d0d0d0"/>
              <circle cx="45" cy="45" r="5" fill="#b0b0b0"/>
              <polygon points="30,70 50,50 70,70" fill="#c0c0c0"/>
            </svg>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Image format not supported
            </div>
          </PlaceholderImage>
        </div>
      ) : (
        <>
          {loading && <LoadingIndicator />}
          <StyledImage
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: loading ? 'none' : 'block' }}
          />
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
`;

const StyledImage = styled.img`
  max-width: 100%;
  object-fit: contain;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  background-color: #ffebee;
  border-radius: 4px;
  width: 100%;
`;

const LoadingIndicator = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PlaceholderImage = styled.div`
  width: 100%;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border: 1px dashed #ccc;
  border-radius: 4px;
  padding: 20px;
`;

export default ImageLoader;
