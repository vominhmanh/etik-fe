"use client";

import { memo, useEffect, useRef } from "react";

declare global {
  interface Window {
    FB?: any;
  }
}

interface FBPostProps {
  href: string;
  width?: number; // tùy chọn
}

function FBPost({ href, width = 350 }: FBPostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const parsedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!href || parsedRef.current) return;

    const tryParse = () => {
      const container = containerRef.current;
      if (window.FB && window.FB.XFBML && container) {
        try {
          window.FB.XFBML.parse(container);
        } catch {
          // ignore
        }
        parsedRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Thử ngay, rồi fallback bằng interval nếu SDK chưa load
    tryParse();
    if (!parsedRef.current) {
      intervalRef.current = window.setInterval(tryParse, 300);
      // timeout an toàn sau 10s
      window.setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [href]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        border: "3px solid #E1C693",
        background: "#fff",
        overflow: "visible", // để FB có thể expand
        minHeight: '591px',
      }}
    >
      <div
        className="fb-post"
        data-href={href}
        data-width="auto"
        // tránh đặt height cứng ở đây; để FB xử lý chiều cao động
      />
    </div>
  );
}

export default memo(FBPost);
