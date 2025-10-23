// Firebase configuration for GPS backup system
// This file handles saving and retrieving last known GPS locations

export interface GPSBackupData {
  latitude: number;
  longitude: number;
  timestamp: number;
  binId: string;
  source: 'gps_live' | 'manual';
}

export interface FirebaseBackupResponse {
  bin1?: GPSBackupData;
  bin2?: GPSBackupData;
}

class FirebaseBackupService {
  private baseUrl = ' https://smartbins-c724c-default-rtdb.firebaseio.com/';
  
  // Save last known GPS location for a bin
  async saveLastKnownGPS(binId: 'bin1' | 'bin2', data: GPSBackupData): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/monitoring/backup/${binId}.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save GPS backup: ${response.status}`);
      }
      
      console.log(`✅ GPS backup saved for ${binId}:`, data);
      return true;
    } catch (error) {
      console.error(`❌ Error saving GPS backup for ${binId}:`, error);
      return false;
    }
  }
  
  // Get last known GPS location for a bin
  async getLastKnownGPS(binId: 'bin1' | 'bin2'): Promise<GPSBackupData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/monitoring/backup/${binId}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GPS backup: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.latitude && data.longitude) {
        console.log(`✅ GPS backup retrieved for ${binId}:`, data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching GPS backup for ${binId}:`, error);
      return null;
    }
  }
  
  // Get all backup GPS locations
  async getAllBackupGPS(): Promise<FirebaseBackupResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/monitoring/backup.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch all GPS backups: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data) {
        console.log('✅ All GPS backups retrieved:', data);
        return data;
      }
      
      return {};
    } catch (error) {
      console.error('❌ Error fetching all GPS backups:', error);
      return {};
    }
  }
  
  // Check if GPS data is valid and in correct region
  isGPSValid(data: { latitude: number; longitude: number; gps_valid?: boolean }): boolean {
    const isInCorrectRegion = data.latitude >= 10.0 && data.latitude <= 10.5 && 
                              data.longitude >= 123.5 && data.longitude <= 124.0;
    return data.gps_valid !== false && data.latitude !== 0 && data.longitude !== 0 && isInCorrectRegion;
  }
  
  // Create backup data from bin data
  createBackupData(binId: 'bin1' | 'bin2', binData: any): GPSBackupData {
    return {
      latitude: binData.latitude,
      longitude: binData.longitude,
      timestamp: binData.timestamp || Date.now(),
      binId: binId,
      source: 'gps_live'
    };
  }
}

export const firebaseBackupService = new FirebaseBackupService();
export default firebaseBackupService;
