import React from 'react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Clean minimal loading screen component following Midnight Blue Wealth theme
 * Reusable across the entire application
 */
export default function LoadingScreen({ 
  message = 'Loading...', 
  fullScreen = true,
  size = 'md'
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-2',
    lg: 'h-16 w-16 border-[3px]',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const containerClasses = fullScreen
    ? 'min-h-screen bg-[var(--color-bg-app)] flex items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClasses} role="status" aria-live="polite" aria-label={message}>
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mx-auto mb-4">
          <div
            className={`${sizeClasses[size]} animate-spin rounded-full border-t-[var(--color-accent-primary)] border-r-[var(--color-accent-primary)] border-b-transparent border-l-transparent`}
            aria-hidden="true"
          >
            <span className="sr-only">Loading</span>
          </div>
          {/* Optional: Subtle pulsing ring for depth */}
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full border border-[var(--color-accent-primary)]/20 animate-pulse`}
            aria-hidden="true"
          />
        </div>
        
        {/* Message */}
        <p className={`${textSizeClasses[size]} text-[var(--color-text-secondary)] font-medium`}>
          {message}
        </p>
      </div>
    </div>
  );
}
