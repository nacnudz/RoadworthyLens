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
