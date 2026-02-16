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
      <div className="flex flex-col items-center gap-4">
        {/* Simplified spinner */}
        <div className="relative w-16 h-16">
          <div className="w-16 h-16 border-4 border-primary/30 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">{message}</p>
          {submessage && <p className="text-xs text-muted-foreground mt-1">{submessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;