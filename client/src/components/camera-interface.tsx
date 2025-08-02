import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CameraInterfaceProps {
  inspectionId: string;
  itemName: string;
  onCancel: () => void;
  onPhotoTaken: () => void;
}

export default function CameraInterface({ inspectionId, itemName, onCancel, onPhotoTaken }: CameraInterfaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (photoBlob: Blob) => {
      const formData = new FormData();
      formData.append("photo", photoBlob, `${itemName}_${Date.now()}.jpg`);
      formData.append("itemName", itemName);
      
      const response = await fetch(`/api/inspections/${inspectionId}/photos`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload photo");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      });
      // Stop camera before closing interface
      stopCamera();
      // Close camera interface after successful photo upload
      onPhotoTaken();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  // Initialize camera automatically when component mounts
  useEffect(() => {
    const initializeCamera = async () => {
      console.log('Component mounted, starting camera automatically...');
      setIsLoading(true);
      setCameraError(null);
      await startCamera();
    };
    
    initializeCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (cameraReady) {
      startCamera();
    }
  }, [facingMode]);

  const startCamera = async () => {
    console.log('Starting camera initialization...');
    setCameraError(null);
    
    let mediaStream: MediaStream | null = null;
    
    try {
      // Stop existing stream first
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      console.log('Step 1: Looking for video element...');
      console.log('Video ref current:', videoRef.current);
      console.log('Document video elements:', document.querySelectorAll('video').length);
      
      // Wait for video element to be available with retries
      let videoElement = videoRef.current;
      let attempts = 0;
      
      while (!videoElement && attempts < 10) {
        console.log(`Waiting for video element, attempt ${attempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        videoElement = videoRef.current;
        attempts++;
      }
      
      if (!videoElement) {
        throw new Error('Video element not found in DOM');
      }
      
      console.log('Step 2: Video element available, checking media devices...');

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Step 3: Enumerating devices...');
      // First check if we have camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      console.log('Step 4: Requesting camera access...');
      // Try to get user media with basic constraints first
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      console.log('Step 5: Camera stream obtained successfully:', mediaStream.getTracks().length, 'tracks');
      
      console.log('Step 6: Setting up video element...');
      
      // Use the videoElement state which we know is not null
      console.log('Video element exists, setting srcObject...');
      videoElement.srcObject = mediaStream;
      
      console.log('Step 7: Video source set, ready state:', videoElement.readyState);
      
      // Set stream in state
      setStream(mediaStream);
      
      console.log('Step 8: Attempting to play video...');
      // Try to play the video without awaiting
      videoElement.play().catch((playError) => {
        console.warn('Video play failed, but continuing:', playError);
      });
      
      // Mark as done
      setIsLoading(false);
      setCameraReady(true);
      console.log('Step 9: Camera setup complete');
      
    } catch (error) {
      console.error("Camera initialization failed:", error);
      
      // Clean up stream if we got one
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown camera error';
      setCameraError(errorMessage);
      setIsLoading(false);
      
      toast({
        title: "Camera Error",
        description: `Could not access camera: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log('Stopping camera, closing', stream.getTracks().length, 'tracks');
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind, track.readyState);
      });
      
      // Also clear the video element's source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        console.log('Cleared video element source');
      }
      
      setStream(null);
      setCameraReady(false);
      console.log('Camera fully stopped');
    }
  };

  const switchCamera = () => {
    setFacingMode(current => current === "user" ? "environment" : "user");
  };

  const handleTakePhoto = async () => {
    // If camera not ready, start it first
    if (!cameraReady) {
      setIsLoading(true);
      setCameraError(null);
      await startCamera();
      return;
    }
    
    // Camera is ready, take photo
    await capturePhoto();
  };

  const capturePhoto = async () => {
    console.log('Capture photo clicked');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }
    
    if (!stream) {
      console.error('No video stream available');
      toast({
        title: "Error",
        description: "Camera not ready. Please wait for camera to load.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Check if video is actually playing
      if (video.readyState < 2) {
        throw new Error('Video not ready for capture');
      }
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error('Video dimensions not available');
      }
      
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Photo captured, data URL length:', dataUrl.length);
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      console.log('Blob created, size:', blob.size);
      uploadPhotoMutation.mutate(blob);
    } catch (error) {
      console.error("Failed to capture photo:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to capture photo: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full camera-container bg-black overflow-hidden">
      {/* Camera preview */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Always render video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          webkit-playsinline="true"
          className="w-full h-full object-cover"
          style={{ 
            backgroundColor: '#000'
          }}
          onLoadStart={() => console.log('Video load started')}
          onLoadedData={() => console.log('Video data loaded')}
          onPlay={() => console.log('Video started playing')}
          onError={(e) => console.error('Video error:', e)}
          onLoadedMetadata={() => console.log('Video metadata loaded')}
        />
        <canvas ref={canvasRef} className="hidden" />
        

        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-75">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Starting camera...</p>
            <p className="text-sm mt-2 opacity-75">Please allow camera access when prompted</p>
          </div>
        )}
        
        {/* Error overlay */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black bg-opacity-75">
            <p className="text-lg mb-4">Camera Error</p>
            <p className="text-sm opacity-75 text-center px-4">{cameraError}</p>
            <button 
              onClick={() => {
                setCameraError(null);
                setIsLoading(true);
                startCamera();
              }}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-dark"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Item label - responsive positioning */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-black/50 text-white px-3 py-2 rounded-lg text-center">
          <p className="text-xs opacity-75">Taking photo for:</p>
          <p className="text-sm font-medium">{itemName}</p>
        </div>
      </div>

      {/* Camera controls - responsive layout */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        {/* Safe area for controls with responsive spacing */}
        <div className="px-4 py-2 camera-controls" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center justify-between mb-2">
            {/* Cancel button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="bg-white/20 text-white hover:bg-white/30 active:bg-white/40 rounded-full w-14 h-14 p-0 flex-shrink-0 touch-manipulation"
            >
              <X className="text-xl" />
            </Button>

            {/* Take photo button - large and centered */}
            <Button
              onClick={handleTakePhoto}
              disabled={isLoading || uploadPhotoMutation.isPending}
              className="bg-white w-20 h-20 rounded-full flex items-center justify-center hover:bg-gray-100 active:bg-gray-200 flex-shrink-0 shadow-lg touch-manipulation"
            >
              <div className="w-14 h-14 bg-primary rounded-full"></div>
            </Button>

            {/* Switch camera button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              disabled={isLoading || !cameraReady}
              className="bg-white/20 text-white hover:bg-white/30 active:bg-white/40 rounded-full w-14 h-14 p-0 flex-shrink-0 touch-manipulation"
            >
              <RotateCcw className="text-xl" />
            </Button>
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className="text-white text-xs">
              {uploadPhotoMutation.isPending ? "Uploading..." : "Tap to capture"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
