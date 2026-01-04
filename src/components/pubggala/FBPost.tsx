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

  useEffect(() => {
    if (!href) return;

    const parsePost = () => {
      if (window.FB && window.FB.XFBML && containerRef.current) {
        window.FB.XFBML.parse(containerRef.current);
      } else {
        // Retry if SDK not ready yet
        const checkInterval = setInterval(() => {
          if (window.FB && window.FB.XFBML && containerRef.current) {
            clearInterval(checkInterval);
            window.FB.XFBML.parse(containerRef.current);
          }
        }, 200);

        // Stop retrying after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    };

    // Delay to ensure DOM is ready
    const timeoutId = setTimeout(parsePost, 300);

    return () => clearTimeout(timeoutId);
  }, [href]);

  return (
    <div
      ref={containerRef}
      className="fb-post"
      data-href={href}
      data-width="auto"
    />
  );
}

