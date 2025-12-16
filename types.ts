export enum DeviceType {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  UNKNOWN = 'UNKNOWN'
}

export enum TransferState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  TRANSFERRING = 'TRANSFERRING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  os: string;
  ip: string;
}

export interface FileMeta {
  file: File;
  previewUrl?: string;
  aiSummary?: string;
  isAnalyzing?: boolean;
}

export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  speed: number; // bytes per second
  timeLeft: number; // seconds
  percentage: number;
}