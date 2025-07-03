import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
  text?: string;
  subtitle?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  text = 'Lädt...', 
  subtitle,
  fullScreen = false,
  overlay = false,
  className = ''
}) => {
  const baseClasses = "flex flex-col items-center justify-center";
  
  const containerClasses = fullScreen 
    ? `${baseClasses} min-h-screen bg-gradient-to-br from-gray-50 to-blue-50`
    : overlay
    ? `${baseClasses} absolute inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50`
    : `${baseClasses} py-12`;

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Background decoration for full screen */}
      {fullScreen && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Large animated logo */}
        <LoadingSpinner 
          size="xl" 
          text={text}
          showText={false}
          className="mb-6"
        />

        {/* Main text */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2 animate-pulse">
          {text}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-gray-600 text-lg animate-pulse" style={{ animationDelay: '0.5s' }}>
            {subtitle}
          </p>
        )}

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Brand footer for full screen */}
      {fullScreen && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-sm font-medium">Neighborly</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
