import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Lädt...', 
  showText = true,
  className = ''
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-6 h-6',
      text: 'text-sm',
      spacing: 'mt-2'
    },
    md: {
      container: 'w-12 h-12',
      text: 'text-base',
      spacing: 'mt-3'
    },
    lg: {
      container: 'w-16 h-16',
      text: 'text-lg',
      spacing: 'mt-4'
    },
    xl: {
      container: 'w-24 h-24',
      text: 'text-xl',
      spacing: 'mt-6'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Animated N Logo */}
      <div className={`${config.container} relative`}>
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 animate-pulse"></div>
        
        {/* Rotating gradient ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent loading-ring"
        ></div>

        {/* Center N Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`${config.container} bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 loading-logo`}
            style={{
              width: '80%',
              height: '80%'
            }}
          >
            <span
              className="text-white font-bold"
              style={{
                fontSize: size === 'sm' ? '0.75rem' :
                         size === 'md' ? '1rem' :
                         size === 'lg' ? '1.25rem' : '1.5rem'
              }}
            >
              N
            </span>
          </div>
        </div>
      </div>

      {/* Loading text */}
      {showText && (
        <p className={`${config.text} ${config.spacing} text-gray-600 font-medium animate-pulse`}>
          {text}
        </p>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes logoFloat {
          0% {
            transform: translateY(0px) scale(1);
          }
          100% {
            transform: translateY(-2px) scale(1.05);
          }
        }

        @keyframes loadingRingSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .loading-ring {
          background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3b82f6);
          border-radius: 50%;
          mask: radial-gradient(circle at center, transparent 70%, black 72%);
          -webkit-mask: radial-gradient(circle at center, transparent 70%, black 72%);
          animation: loadingRingSpin 2s linear infinite;
        }

        .loading-logo {
          animation: logoFloat 2s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
