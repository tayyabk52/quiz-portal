import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getImageUrlByAttempt } from '../../utils/imageUtils';

/**
 * A component that progressively attempts different URL formats for Google Drive images
 * until one loads successfully or all formats are exhausted.
 */
const ProgressiveImage = ({ 
  imageUrl, 
  alt = "Image", 
  className, 
  maxAttempts = 5,
  onLoadSuccess = () => {},
  onLoadError = () => {}
}) => {
  const [loadingAttempt, setLoadingAttempt] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [finalImageUrl, setFinalImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Set initial URL
  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
      setImageError(false);
      const url = getImageUrlByAttempt(imageUrl, loadingAttempt);
      setFinalImageUrl(url);
      console.log(`Image loading attempt ${loadingAttempt + 1}: Using ${url}`);
    }
  }, [imageUrl, loadingAttempt]);
  
  // Try next format when image fails to load
  const handleImageError = () => {
    // Try next format if we haven't exhausted all options
    if (loadingAttempt < maxAttempts - 1) {
      setLoadingAttempt(loadingAttempt + 1);
    } else {
      // All attempts failed
      setImageError(true);
      setIsLoading(false);
      console.error('All image loading attempts failed for:', imageUrl);
      onLoadError();
    }
  };
  
  // Image loading feedback
  const handleImageLoad = () => {
    setIsLoading(false);
    console.log(`Image loaded successfully on attempt ${loadingAttempt + 1}`);
    onLoadSuccess();
  };
  
  return (
    <ImageContainer className={className}>
      {imageError ? (
        <ImageErrorMessage>
          <span role="img" aria-label="warning">⚠️</span> Image could not be loaded.
        </ImageErrorMessage>
      ) : finalImageUrl ? (
        <>
          {isLoading && <ImageLoadingIndicator />}
          <StyledImage 
            src={finalImageUrl} 
            alt={alt}
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: isLoading ? 'none' : 'block' }}
            loading="eager"
            crossOrigin="anonymous"
          />
        </>
      ) : (
        <ImageLoadingIndicator />
      )}
    </ImageContainer>
  );
};

const ImageContainer = styled.div`
  position: relative;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  object-fit: contain;
`;

const ImageErrorMessage = styled.div`
  color: var(--error-color);
  padding: 15px;
  text-align: center;
  border: 1px dashed var(--error-color);
  border-radius: 8px;
  width: 100%;
  font-weight: bold;
`;

const ImageLoadingIndicator = styled.div`
  position: relative;
  width: 30px;
  height: 30px;
  
  &:after {
    content: '';
    display: block;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid var(--primary-color);
    border-top-color: transparent;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default ProgressiveImage;
