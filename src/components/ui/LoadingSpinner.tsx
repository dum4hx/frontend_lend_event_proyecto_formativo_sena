/**
 * Reusable loading spinner component with optional message.
 * Provides consistent loading states across the application.
 */

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-2',
  lg: 'h-16 w-16 border-3',
};

export function LoadingSpinner({ 
  size = 'md', 
  message, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full border-gray-700 border-t-[#FFD700] mx-auto mb-4 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="text-gray-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
