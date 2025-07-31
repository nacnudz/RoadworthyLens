// Local storage utilities for offline capability
export interface OfflineInspection {
  id: string;
  roadworthyNumber: string;
  clientName: string;
  vehicleDescription: string;
  status: string;
  checklistItems: Record<string, boolean>;
  photos: Record<string, string[]>; // URLs to local photos
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

const OFFLINE_INSPECTIONS_KEY = 'roadworthy_offline_inspections';
const OFFLINE_SETTINGS_KEY = 'roadworthy_offline_settings';

export function saveOfflineInspection(inspection: OfflineInspection): void {
  try {
    const existing = getOfflineInspections();
    const updated = existing.filter(i => i.id !== inspection.id);
    updated.push(inspection);
    localStorage.setItem(OFFLINE_INSPECTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save offline inspection:', error);
  }
}

export function getOfflineInspections(): OfflineInspection[] {
  try {
    const data = localStorage.getItem(OFFLINE_INSPECTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load offline inspections:', error);
    return [];
  }
}

export function removeOfflineInspection(id: string): void {
  try {
    const existing = getOfflineInspections();
    const updated = existing.filter(i => i.id !== id);
    localStorage.setItem(OFFLINE_INSPECTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove offline inspection:', error);
  }
}

export function saveOfflineSettings(settings: any): void {
  try {
    localStorage.setItem(OFFLINE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save offline settings:', error);
  }
}

export function getOfflineSettings(): any {
  try {
    const data = localStorage.getItem(OFFLINE_SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load offline settings:', error);
    return null;
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function savePhotoLocally(file: File, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataUrl = e.target?.result as string;
        localStorage.setItem(`photo_${filename}`, dataUrl);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getLocalPhoto(filename: string): string | null {
  try {
    return localStorage.getItem(`photo_${filename}`);
  } catch (error) {
    console.error('Failed to load local photo:', error);
    return null;
  }
}
