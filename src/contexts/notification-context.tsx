'use client';

import React, { useState, ReactNode, createContext } from 'react';

type MessageType = "success" | "error" | "warning" | "info" | null;

interface NotificationContextType {
  notification: MessageType;
  notificationText: string | null;
  success: (...listTexts: any[]) => void;
  error: (...listTexts: any[]) => void;
  warning: (...listTexts: any[]) => void;
  info: (...listTexts: any[]) => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notification: null,
  notificationText: null,
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  clear: () => {},
});

export interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<MessageType>(null);
  const [notificationText, setNotificationText] = useState<string | null>(null);

  const success = (...listTexts: any[]) => {
    setNotificationText(listTexts.map(t => String(t)).join(' '));
    setNotification('success');
  };

  const error = (...listTexts: any[]) => {
    setNotificationText(listTexts.map(t => String(t)).join(' '));
    setNotification('error');
  };

  const warning = (...listTexts: any[]) => {
    setNotificationText(listTexts.map(t => String(t)).join(' '));
    setNotification('warning');
  };

  const info = (...listTexts: any[]) => {
    setNotificationText(listTexts.map(t => String(t)).join(' '));
    setNotification('info');
  };

  const clear = () => {
    setNotificationText(null);
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{
      success,
      error,
      warning,
      info,
      clear,
      notification,
      notificationText
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export { NotificationProvider };
export default NotificationContext;
