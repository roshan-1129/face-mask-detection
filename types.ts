export enum UserRole {
  ADMIN = 'ADMIN',
  SECURITY = 'SECURITY',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Violation {
  id: string;
  timestamp: number;
  imageUrl: string; // Base64 snapshot
  location: string;
  status: 'REVIEWED' | 'PENDING';
  confidence: number;
}

export interface DailyStats {
  totalEntries: number;
  masksDetected: number;
  violations: number;
  hourlyTraffic: { hour: string; count: number }[];
  maskComplianceRate: number; // Percentage
}

export enum DetectionStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  MASK_DETECTED = 'MASK_DETECTED',
  NO_MASK = 'NO_MASK',
  ERROR = 'ERROR'
}

export interface FacePrediction {
  bbox: [number, number, number, number]; // [x, y, width, height]
  hasMask: boolean;
  score: number;
}

export interface DetectionResult {
  hasMask: boolean; // Global status (if ANY face has no mask => false)
  confidence: number;
  message?: string;
  faces: FacePrediction[];
}