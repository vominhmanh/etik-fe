// lib/gtag.ts

// Định nghĩa ID của Google Analytics (thay bằng ID của bạn)
export const GA_TRACKING_ID = "AW-16949452196";

// Định nghĩa kiểu dữ liệu cho gtag
declare global {
  interface Window {
    gtag: (command: string, eventName: string, params?: Record<string, any>) => void;
  }
}

// Hàm gửi pageview đến Google Analytics
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Hàm gửi event đến Google Analytics
export const event = (action: string, params: Record<string, any>) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, params);
  }
};
