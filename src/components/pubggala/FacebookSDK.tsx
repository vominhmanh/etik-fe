'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    FB?: any;
  }
}

const SCRIPT_ID = 'facebook-jssdk';
const SDK_SRC = 'https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v18.0';

let loaded = false;

export default function FacebookSDK() {
  useEffect(() => {
    const notifyReady = () => window.dispatchEvent(new Event('fb-sdk-ready'));

    if (loaded || window.FB?.XFBML) {
      loaded = true;
      notifyReady();
      return;
    }

    // fb-root chỉ tồn tại ở client
    if (!document.getElementById('fb-root')) {
      const root = document.createElement('div');
      root.id = 'fb-root';
      document.body.appendChild(root);
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => {
        loaded = true;
        notifyReady();
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SDK_SRC;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      loaded = true;
      notifyReady();
    };

    document.body.appendChild(script);

    loaded = true;
  }, []);

  return null;
}

