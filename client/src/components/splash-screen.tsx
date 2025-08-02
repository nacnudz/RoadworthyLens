import { useEffect, useState } from "react";
import logoImage from "@assets/g5_OHHI6Nzo2KgfUVpTJD-Photoroom_1754111976984.png";

interface SplashScreenProps {
  onComplete: () => void;
  minDisplayTime?: number; // Minimum time to show splash in milliseconds
}

export default function SplashScreen({ onComplete, minDisplayTime = 3000 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'loading' | 'complete'>('initial');

  useEffect(() => {
    const startTime = Date.now();
    
    // Initial animation phase
    setTimeout(() => setAnimationPhase('loading'), 500);
    
    // Smooth loading progress with ease-out curve
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setAnimationPhase('complete');
          return 100;
        }
        // Ease-out curve for more natural progress
        const remaining = 100 - prev;
        const increment = remaining * 0.1 + 2;
        return Math.min(prev + increment, 100);
      });
    }, 80);

    // Complete splash screen after minimum display time and progress is done
    const completionTimer = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(onComplete, 800); // Allow fade out animation to complete
      }, remainingTime);
    }, 1200);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completionTimer);
    };
  }, [onComplete, minDisplayTime]);

  return (
    <div 
      className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center justify-center transition-all duration-800 ${
        fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full animate-float-random"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 4 + 3}s`
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 px-8">
        {/* Logo with modern animation */}
        <div className={`relative transition-all duration-1000 ${animationPhase === 'initial' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}`}>
          {/* Glowing ring effect */}
          <div className="absolute inset-0 rounded-full">
            <div className="w-full h-full border-2 border-primary/30 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-4 border border-blue-400/40 rounded-full animate-spin-slow-reverse"></div>
          </div>
          
          {/* Logo with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-blue-500/40 rounded-full blur-xl animate-pulse-glow"></div>
            <img 
              src={logoImage} 
              alt="Roadworthy Inspection Logo" 
              className="relative w-64 h-64 md:w-72 md:h-72 object-contain drop-shadow-2xl"
            />
          </div>
        </div>
        
        {/* App title with stagger animation */}
        <div className={`text-center space-y-3 transition-all duration-1000 delay-300 ${animationPhase === 'initial' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent tracking-wide">
            Roadworthy Lens
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light tracking-wide">
            Vehicle Inspection Management
          </p>
        </div>
        
        {/* Modern loading indicator */}
        <div className={`w-80 md:w-96 space-y-6 transition-all duration-1000 delay-500 ${animationPhase === 'initial' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}`}>
          {/* Progress bar */}
          <div className="relative">
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-primary via-blue-400 to-primary rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast"></div>
              </div>
            </div>
            {/* Progress percentage */}
            <div className="absolute -top-8 left-0 text-sm text-white/70 font-medium">
              {Math.round(progress)}%
            </div>
          </div>
          
          {/* Loading text with typewriter effect */}
          <div className="text-center">
            <p className="text-base text-white/80 font-light tracking-wide">
              {animationPhase === 'initial' && 'Initializing...'}
              {animationPhase === 'loading' && 'Loading application...'}
              {animationPhase === 'complete' && 'Ready to launch'}
            </p>
          </div>
        </div>
        
        {/* Modern loading spinner */}
        <div className={`transition-all duration-1000 delay-700 ${animationPhase === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
          <div className="relative w-12 h-12">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
            {/* Spinning arc */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin"></div>
            {/* Inner dot */}
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Version info */}
      <div className={`absolute bottom-8 text-center transition-all duration-1000 delay-1000 ${animationPhase === 'initial' ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-sm text-white/50 font-light tracking-wide">
          Version 1.0 • Professional Vehicle Inspection System
        </p>
      </div>
    </div>
  );
}