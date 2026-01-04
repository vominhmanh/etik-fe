'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    FB?: any;
  }
}

interface FBPostProps {
  href: string;
}

export default function FBPost({ href }: FBPostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parseAttemptedRef = useRef(false);

  const parsePost = () => {
    if (!containerRef.current || !href) return;

    // Clear any existing content first
    containerRef.current.innerHTML = '';
    
    // Recreate the fb-post div
    const fbPostDiv = document.createElement('div');
    fbPostDiv.className = 'fb-post';
    fbPostDiv.setAttribute('data-href', href);
    fbPostDiv.setAttribute('data-width', 'auto');
    containerRef.current.appendChild(fbPostDiv);

    if (window.FB && window.FB.XFBML) {
      // Parse the specific container
      window.FB.XFBML.parse(containerRef.current);
    } else {
      // Retry if SDK not ready yet
      let retryCount = 0;
      const maxRetries = 25; // 5 seconds max
      
      const checkInterval = setInterval(() => {
        if (window.FB && window.FB.XFBML && containerRef.current) {
          clearInterval(checkInterval);
          window.FB.XFBML.parse(containerRef.current);
        } else {
          retryCount++;
          if (retryCount >= maxRetries) {
            clearInterval(checkInterval);
          }
        }
      }, 200);
    }
  };

  useEffect(() => {
    if (!href) return;

    // Reset parse attempt flag when href changes
    parseAttemptedRef.current = false;

    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      if (!parseAttemptedRef.current) {
        parseAttemptedRef.current = true;
        parsePost();
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [href]);

  // Also parse when component mounts (for dialog reopening)
  useEffect(() => {
    if (href && containerRef.current && !parseAttemptedRef.current) {
      const timeoutId = setTimeout(() => {
        parseAttemptedRef.current = true;
        parsePost();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', minHeight: '400px' }}
    />
  );
}

