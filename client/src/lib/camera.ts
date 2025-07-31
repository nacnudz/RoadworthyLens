export interface CameraCapabilities {
  hasCamera: boolean;
  hasMultipleCameras: boolean;
  supportedFacingModes: string[];
}

export async function getCameraCapabilities(): Promise<CameraCapabilities> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
    return {
      hasCamera: videoDevices.length > 0,
      hasMultipleCameras: videoDevices.length > 1,
      supportedFacingModes: videoDevices.length > 1 ? ['user', 'environment'] : ['user']
    };
  } catch (error) {
    console.error('Error checking camera capabilities:', error);
    return {
      hasCamera: false,
      hasMultipleCameras: false,
      supportedFacingModes: []
    };
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}

export function generatePhotoFilename(itemName: string, index: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${itemName}_${index}_${timestamp}.jpg`;
}

export async function startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
  try {
    // Try different camera configurations for better compatibility
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

    let stream: MediaStream | null = null;
    
    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        break;
      } catch (err) {
        console.log('Camera constraint failed, trying next:', err);
        continue;
      }
    }

    if (!stream) {
      throw new Error('No camera available');
    }
    
    videoElement.srcObject = stream;
    
    // Ensure video loads and plays
    return new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play()
          .then(() => resolve(stream!))
          .catch(reject);
      };
      videoElement.onerror = () => reject(new Error('Video element error'));
      
      // Set a timeout in case metadata doesn't load
      setTimeout(() => {
        if (videoElement.readyState === 0) {
          reject(new Error('Video failed to load'));
        }
      }, 5000);
    });
    
  } catch (error) {
    console.error('Failed to start camera:', error);
    throw error;
  }
}

export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

export function capturePhoto(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  ctx.drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
}

export function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
}
