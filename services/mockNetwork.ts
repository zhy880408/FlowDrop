import { Device, DeviceType, TransferProgress } from "../types";

// Simulated devices on the network
const MOCK_DEVICES: Device[] = [
  { id: 'd1', name: "Jane's iPhone 14 Pro", type: DeviceType.MOBILE, os: 'iOS 17', ip: '192.168.1.5' },
  { id: 'd2', name: "Work MacBook Air", type: DeviceType.DESKTOP, os: 'macOS Sonoma', ip: '192.168.1.12' },
  { id: 'd3', name: "Living Room Tablet", type: DeviceType.TABLET, os: 'HarmonyOS 4', ip: '192.168.1.8' },
  { id: 'd4', name: "Gaming PC", type: DeviceType.DESKTOP, os: 'Windows 11', ip: '192.168.1.20' },
];

export const scanForDevices = (onFound: (device: Device) => void) => {
  // Simulate staggered discovery
  let foundCount = 0;
  const maxDevices = Math.floor(Math.random() * MOCK_DEVICES.length) + 1; // Randomly find 1 to all devices
  
  const interval = setInterval(() => {
    if (foundCount >= maxDevices) {
      clearInterval(interval);
      return;
    }
    const device = MOCK_DEVICES[foundCount];
    onFound(device);
    foundCount++;
  }, 1200);

  return () => clearInterval(interval);
};

// Simulation of a chunked transfer
export const simulateTransfer = (
  fileSize: number, 
  onProgress: (progress: TransferProgress) => void,
  onComplete: () => void,
  onError: () => void
) => {
  let uploaded = 0;
  // Simulate high speed LAN transfer (approx 10-50 MB/s fluctuation)
  const baseSpeed = 15 * 1024 * 1024; 
  
  const interval = setInterval(() => {
    // Fluctuate speed
    const currentSpeed = baseSpeed + (Math.random() * 10 * 1024 * 1024); 
    // Simulate a chunk being sent every 100ms
    const chunkSize = currentSpeed / 10; 

    uploaded += chunkSize;
    if (uploaded > fileSize) uploaded = fileSize;

    const percentage = (uploaded / fileSize) * 100;
    const timeLeft = (fileSize - uploaded) / currentSpeed;

    onProgress({
      bytesTransferred: uploaded,
      totalBytes: fileSize,
      speed: currentSpeed,
      timeLeft: Math.max(0, timeLeft),
      percentage
    });

    if (uploaded >= fileSize) {
      clearInterval(interval);
      setTimeout(onComplete, 500); // Slight delay for 100% visual
    }
  }, 100);

  return () => clearInterval(interval);
};