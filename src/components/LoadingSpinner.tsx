import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading...", 
  submessage = "Please wait" 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 dark:border-gray-700 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="w-16 h-16 border-4 border-purple-300 dark:border-purple-700 border-b-transparent rounded-full animate-spin absolute top-2 left-2" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">{submessage}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
