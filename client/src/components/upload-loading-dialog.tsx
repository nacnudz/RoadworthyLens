import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Wifi, WifiOff } from "lucide-react";

interface UploadLoadingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionId: string;
  onUploadComplete: () => void;
}

export function UploadLoadingDialog({ 
  isOpen, 
  onClose, 
  inspectionId, 
  onUploadComplete 
}: UploadLoadingDialogProps) {
  const [uploadStatus, setUploadStatus] = useState<'checking' | 'uploading' | 'success' | 'failed' | 'not-accessible'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && inspectionId) {
      startUpload();
    }
  }, [isOpen, inspectionId]);

  const startUpload = async () => {
    try {
      setUploadStatus('checking');
      setMessage('Checking network accessibility...');

      const response = await fetch(`/api/inspections/${inspectionId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.accessibilityCheck === false) {
          setUploadStatus('not-accessible');
          setMessage(result.message);
          return;
        }
        throw new Error(result.message);
      }

      setUploadStatus('uploading');
      setMessage('Uploading photos to network location...');

      // Wait for the actual upload to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUploadStatus('success');
      setMessage(result.message);
      
      // Auto-close after success
      setTimeout(() => {
        onUploadComplete();
        onClose();
      }, 2000);

    } catch (error) {
      setUploadStatus('failed');
      setMessage('Upload failed. Photos saved locally only.');
    }
  };

  const handleRetry = () => {
    startUpload();
  };

  const handleClose = () => {
    onClose();
  };

  const getIcon = () => {
    switch (uploadStatus) {
      case 'checking':
        return <Wifi className="h-6 w-6 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'not-accessible':
        return <WifiOff className="h-6 w-6 text-orange-500" />;
    }
  };

  const getTitle = () => {
    switch (uploadStatus) {
      case 'checking':
        return 'Checking Network';
      case 'uploading':
        return 'Uploading Photos';
      case 'success':
        return 'Upload Complete';
      case 'failed':
        return 'Upload Failed';
      case 'not-accessible':
        return 'Network Not Accessible';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center gap-2 mt-6">
          {uploadStatus === 'not-accessible' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                OK
              </Button>
              <Button onClick={handleRetry}>
                Retry
              </Button>
            </>
          )}
          
          {uploadStatus === 'failed' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                OK
              </Button>
              <Button onClick={handleRetry}>
                Retry
              </Button>
            </>
          )}
          
          {uploadStatus === 'success' && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}