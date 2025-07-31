import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarcodeScannerProps {
  onScanResult: (result: string) => void;
  onCancel: () => void;
}

export default function BarcodeScanner({ onScanResult, onCancel }: BarcodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setIsLoading(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      // Try different camera configurations
      const constraints = [
        // Try environment camera first (back camera on mobile)
        {
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        },
        // Fallback to any camera
        {
          video: { 
            width: { ideal: 1920, min: 640 },
            height: { ideal: 1080, min: 480 }
          }
        },
        // Basic fallback
        {
          video: true
        }
      ];

      let newStream: MediaStream | null = null;
      
      for (const constraint of constraints) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          console.log('Camera constraint failed, trying next:', err);
          continue;
        }
      }

      if (!newStream || !videoRef.current) {
        throw new Error('No camera available');
      }
      
      videoRef.current.srcObject = newStream;
      
      // Wait for video to load and start scanning
      await new Promise<void>((resolve, reject) => {
        const video = videoRef.current!;
        
        const onLoadedMetadata = () => {
          video.play()
            .then(() => {
              setStream(newStream);
              setIsLoading(false);
              startScanningLoop();
              resolve();
            })
            .catch(reject);
        };
        
        const onError = () => reject(new Error('Video element error'));
        
        video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        video.addEventListener('error', onError, { once: true });
        
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoadedMetadata);
          video.removeEventListener('error', onError);
          if (video.readyState === 0) {
            reject(new Error('Video failed to load'));
          }
        }, 10000);
      });
      
    } catch (error) {
      console.error("Failed to start scanner:", error);
      toast({
        title: "Scanner Error",
        description: "Could not access camera for scanning. Please check permissions.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const startScanningLoop = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    
    try {
      // Dynamic import for ZXing library
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const codeReader = new BrowserMultiFormatReader();
      
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          
          if (!context || video.readyState !== 4) return;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get image data for scanning
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to decode barcode/QR code
          const result = await codeReader.decodeFromImageData(imageData);
          
          if (result && result.getText()) {
            // Found a code!
            const scannedText = result.getText();
            console.log('Scanned:', scannedText);
            
            toast({
              title: "Code Scanned",
              description: `Found: ${scannedText}`,
            });
            
            onScanResult(scannedText);
            return;
          }
        } catch (scanError) {
          // No code found in this frame, continue scanning
        }
      }, 500); // Scan every 500ms
      
    } catch (error) {
      console.error("Failed to initialize barcode reader:", error);
      toast({
        title: "Scanner Error",
        description: "Failed to initialize barcode reader",
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsScanning(false);
  };

  return (
    <div className="relative h-screen bg-black">
      {/* Camera preview */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isLoading ? (
          <div className="text-white text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Starting scanner...</p>
            <p className="text-sm mt-2 opacity-75">Please allow camera access</p>
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

      {/* Scanning overlay */}
      {!isLoading && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Scanning frame */}
          <div className="absolute inset-x-8 top-1/2 transform -translate-y-1/2 h-48 border-2 border-white rounded-lg">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-center">
          <p className="text-sm opacity-75">Barcode/QR Scanner</p>
          <p className="text-lg font-medium">Point camera at roadworthy number</p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-4 right-4">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={onCancel}
            variant="outline"
            size="lg"
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <X className="mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Scanning status */}
      {isScanning && !isLoading && (
        <div className="absolute bottom-32 left-4 right-4">
          <div className="bg-green-500/20 text-white px-4 py-2 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-pulse">
                <Camera className="h-4 w-4" />
              </div>
              <span className="text-sm">Scanning for codes...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}