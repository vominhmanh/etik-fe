'use client';

import { useEffect } from 'react';

let loaded = false;

export default function FacebookSDK() {
  useEffect(() => {
    if (loaded) return;

    // fb-root chỉ tồn tại ở client
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div');
      root.id = 'fb-root';
      document.body.appendChild(root);
    }

    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v18.0';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';

    document.body.appendChild(script);

    loaded = true;
  }, []);

  return null;
}

