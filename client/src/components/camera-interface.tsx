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
      
      if (!videoRef.current) return;
      
      // Import camera functions dynamically
      const { startCamera: startCameraLib } = await import("@/lib/camera");
      const newStream = await startCameraLib(videoRef.current);
      setStream(newStream);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to start camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions and try again.",
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
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const { capturePhoto: capturePhotoLib, dataURItoBlob } = await import("@/lib/camera");
      const dataUrl = capturePhotoLib(videoRef.current);
      const blob = dataURItoBlob(dataUrl);
      uploadPhotoMutation.mutate(blob);
    } catch (error) {
      console.error("Failed to capture photo:", error);
      toast({
        title: "Error",
        description: "Failed to capture photo",
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
