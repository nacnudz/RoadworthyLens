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
      // Stop existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        },
        audio: false,
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLoading(false);
        };
      } else {
        setIsLoading(false);
      }
      
      setStream(newStream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        uploadPhotoMutation.mutate(blob);
      }
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="relative h-screen bg-black">
      {/* Camera preview */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isLoading ? (
          <div className="text-white text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Starting camera...</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
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
