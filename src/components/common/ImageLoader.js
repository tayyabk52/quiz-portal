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

  // List of CORS proxies to try
  const corsProxies = [
    // Format 1: Direct URL - try this first for performance
    (url) => url,
    
    // Format 2: Statically.io - a popular and reliable CORS proxy service
    (url) => `https://cdn.statically.io/img/${extractDomain(url)}${extractPath(url)}`,
    
    // Format 3: Special handler for Google Drive
    (url) => {
      const fileId = extractGoogleDriveId(url);
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000` : url;
    },
    
    // Format 4: Another Google Drive approach
    (url) => {
      const fileId = extractGoogleDriveId(url);
      return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : url;
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

  // Try loading with different proxies
  const [proxyIndex, setProxyIndex] = useState(0);
  
  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    if (proxyIndex < corsProxies.length) {
      setLoading(true);
      setError(false);
      const proxiedUrl = corsProxies[proxyIndex](src);
      setImageSrc(proxiedUrl);
      console.log(`Attempt ${proxyIndex + 1}: Loading image using ${proxiedUrl}`);
    } else {
      // All proxies failed
      setError(true);
      setLoading(false);
      onError();
    }
  }, [src, proxyIndex]);

  const handleImageError = () => {
    if (proxyIndex < corsProxies.length - 1) {
      // Try next proxy
      setProxyIndex(proxyIndex + 1);
    } else {
      // All proxies failed
      setError(true);
      setLoading(false);
      onError();
    }
  };

  const handleImageLoad = () => {
    setLoading(false);
    onLoad();
    console.log(`Image loaded successfully using attempt ${proxyIndex + 1}`);
  };

  return (
    <Container className={className}>
      {error ? (
        <ErrorMessage>
          <span role="img" aria-label="warning">⚠️</span> Image failed to load
        </ErrorMessage>
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

export default ImageLoader;
