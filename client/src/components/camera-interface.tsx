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

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      console.log('Starting camera initialization...');
      
      // Stop existing stream first
      if (stream) {
        console.log('Stopping existing stream...');
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (!videoRef.current) {
        console.error('Video ref not available');
        setIsLoading(false);
        return;
      }

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      // First check if we have camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Try different camera configurations for better compatibility
      const constraints = [
        // Try environment camera first (back camera on mobile)
        {
          video: { 
            facingMode: facingMode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        },
        // Fallback to any camera with lower resolution
        {
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // Most basic fallback
        {
          video: true
        }
      ];

      let newStream: MediaStream | null = null;
      let lastError: any = null;
      
      for (let i = 0; i < constraints.length; i++) {
        const constraint = constraints[i];
        try {
          console.log(`Trying camera constraint ${i + 1}:`, constraint);
          newStream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera stream obtained successfully:', newStream.getTracks().length, 'tracks');
          break;
        } catch (err) {
          lastError = err;
          console.log(`Camera constraint ${i + 1} failed:`, err);
          continue;
        }
      }

      if (!newStream) {
        throw lastError || new Error('No camera available');
      }
      
      // Set video source
      console.log('Setting video source...');
      videoRef.current.srcObject = newStream;
      
      // Ensure video loads and plays
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!;
        
        const onLoadedMetadata = () => {
          console.log('Video metadata loaded, attempting to play...');
          video.play()
            .then(() => {
              console.log('Video playing successfully');
              setStream(newStream);
              setIsLoading(false);
              resolve();
            })
            .catch((playError) => {
              console.error('Video play failed:', playError);
              reject(playError);
            });
        };
        
        const onError = (errorEvent: any) => {
          console.error('Video element error:', errorEvent);
          reject(new Error('Video element error'));
        };
        
        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        video.addEventListener('error', onError, { once: true });
        
        // Set a timeout in case metadata doesn't load
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          if (video.readyState === 0) {
            console.error('Video failed to load within timeout');
            reject(new Error('Video failed to load'));
          }
        }, 10000);
      });
      
    } catch (error) {
      console.error("Failed to start camera:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Camera Error",
        description: `Could not access camera: ${errorMessage}. Please check permissions and try again.`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    setFacingMode(current => current === "user" ? "environment" : "user");
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
    <div className="relative h-screen bg-black">
      {/* Camera preview */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isLoading ? (
          <div className="text-white text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Starting camera...</p>
            <p className="text-sm mt-2 opacity-75">Please allow camera access when prompted</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              webkit-playsinline="true"
              className="w-full h-full object-cover"
              style={{ 
                transform: 'scaleX(-1)',
                backgroundColor: '#000'
              }}
              onLoadStart={() => console.log('Video load started')}
              onLoadedData={() => console.log('Video data loaded')}
              onPlay={() => console.log('Video started playing')}
              onError={(e) => console.error('Video error:', e)}
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}
      </div>

      {/* Item label */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-center">
          <p className="text-sm opacity-75">Taking photo for:</p>
          <p className="text-lg font-medium">{itemName}</p>
        </div>
      </div>

      {/* Camera controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="bg-white/20 text-white hover:bg-white/30 rounded-full p-3"
          >
            <X className="text-xl" />
          </Button>

          <Button
            onClick={capturePhoto}
            disabled={isLoading || uploadPhotoMutation.isPending}
            className="bg-white w-16 h-16 rounded-full flex items-center justify-center hover:bg-gray-100"
          >
            <div className="w-12 h-12 bg-primary rounded-full"></div>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            disabled={isLoading}
            className="bg-white/20 text-white hover:bg-white/30 rounded-full p-3"
          >
            <RotateCcw className="text-xl" />
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-white text-sm">
            {uploadPhotoMutation.isPending ? "Uploading..." : "Tap to capture"}
          </p>
        </div>
      </div>
    </div>
  );
}
