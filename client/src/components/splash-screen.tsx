import { useEffect, useState } from "react";
import logoImage from "@assets/g5_OHHI6Nzo2KgfUVpTJD_1754076026694.jpeg";

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number; // Minimum time to show splash in milliseconds
}

export default function SplashScreen({ onComplete, minDisplayTime = 2000 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random progress increments
      });
    }, 100);

    // Complete splash screen after minimum display time and progress is done
    const completionTimer = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 500); // Allow fade out animation to complete
      }, remainingTime);
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimer);
    };
  }, [onComplete, minDisplayTime]);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-grid-pattern"></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-8">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
          <img 
            src={logoImage} 
            alt="Roadworthy Inspection Logo" 
            className="relative w-40 h-40 md:w-48 md:h-48 object-contain animate-float shadow-2xl rounded-2xl"
          />
        </div>
        
        {/* App title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
            Roadworthy Lens
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-medium">
            Vehicle Inspection Management
          </p>
        </div>
        
        {/* Loading progress */}
        <div className="w-64 md:w-80 space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-shimmer rounded-full"></div>
            </div>
          </div>
          <p className="text-sm text-white/70 text-center animate-pulse">
            Loading application...
          </p>
        </div>
        
        {/* Loading dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
      
      {/* Version info */}
      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-white/60">
          Version 1.0 • Vehicle Inspection System
        </p>
      </div>
    </div>
  );
}