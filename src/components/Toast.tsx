import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'var(--success-500)',
          borderColor: 'var(--success-500)',
          color: 'white'
        };
      case 'error':
        return {
          backgroundColor: 'var(--error-500)',
          borderColor: 'var(--error-500)',
          color: 'white'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--warning-500)',
          borderColor: 'var(--warning-500)',
          color: 'white'
        };
      case 'info':
        return {
          backgroundColor: 'var(--info-500)',
          borderColor: 'var(--info-500)',
          color: 'white'
        };
      default:
        return {
          backgroundColor: 'var(--background-secondary)',
          borderColor: 'var(--accent-primary)',
          color: 'var(--foreground-primary)'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '⚠';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--spacing-16)',
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: '280px',
        maxWidth: '400px',
        padding: 'var(--spacing-12)',
        borderRadius: 'var(--spacing-8)',
        border: '1px solid',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-8)',
        animation: isVisible ? 'slideInUp 0.15s ease-out' : 'slideOutDown 0.15s ease-in forwards',
        ...getTypeStyles()
      }}
    >
      <span style={{ fontSize: 'var(--font-size-l)', fontWeight: 'bold' }}>
        {getIcon()}
      </span>
      <span className="body-s" style={{ flex: 1 }}>
        {message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: 'var(--font-size-l)',
          lineHeight: 1,
          padding: '0',
          opacity: 0.7
        }}
        onMouseEnter={(e) => (e.target as HTMLElement).style.opacity = '1'}
        onMouseLeave={(e) => (e.target as HTMLElement).style.opacity = '0.7'}
      >
        ×
      </button>
      

    </div>
  );
};

export default Toast;