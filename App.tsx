import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Device, DeviceType, TransferState, FileMeta, TransferProgress as TransferProgressType } from './types';
import { IconLaptop, IconSmartphone, IconTablet, IconWifi, IconFile, IconSparkles, IconSend, IconX, IconCheck } from './components/Icons';
import { RadarScan } from './components/RadarScan';
import { scanForDevices, simulateTransfer } from './services/mockNetwork';
import { analyzeFile } from './services/geminiService';

// Format bytes to human readable
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.ceil(seconds / 60)}m`;
};

const App: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [transferState, setTransferState] = useState<TransferState>(TransferState.IDLE);
  const [progress, setProgress] = useState<TransferProgressType>({ bytesTransferred: 0, totalBytes: 0, speed: 0, timeLeft: 0, percentage: 0 });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Scan
  useEffect(() => {
    const stopScan = scanForDevices((device) => {
      setDevices(prev => {
        if (prev.find(d => d.id === device.id)) return prev;
        return [...prev, device];
      });
    });
    return () => stopScan();
  }, []);

  // Handle File Drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    setFileMeta({ file, previewUrl });
    setTransferState(TransferState.IDLE);
  };

  const triggerAIAnalysis = async () => {
    if (!fileMeta) return;
    setFileMeta(prev => prev ? ({ ...prev, isAnalyzing: true }) : null);
    
    const summary = await analyzeFile(fileMeta.file);
    
    setFileMeta(prev => prev ? ({ ...prev, isAnalyzing: false, aiSummary: summary }) : null);
  };

  const startTransfer = () => {
    if (!selectedDevice || !fileMeta) return;
    setTransferState(TransferState.CONNECTING);
    
    // Simulate handshake delay
    setTimeout(() => {
      setTransferState(TransferState.TRANSFERRING);
      simulateTransfer(
        fileMeta.file.size,
        (p) => setProgress(p),
        () => setTransferState(TransferState.COMPLETED),
        () => setTransferState(TransferState.ERROR)
      );
    }, 1500);
  };

  const resetTransfer = () => {
    setFileMeta(null);
    setTransferState(TransferState.IDLE);
    setProgress({ bytesTransferred: 0, totalBytes: 0, speed: 0, timeLeft: 0, percentage: 0 });
    setSelectedDevice(null);
  };

  const DeviceIcon = ({ type, className }: { type: DeviceType, className?: string }) => {
    switch (type) {
      case DeviceType.MOBILE: return <IconSmartphone className={className} />;
      case DeviceType.TABLET: return <IconTablet className={className} />;
      case DeviceType.DESKTOP: return <IconLaptop className={className} />;
      default: return <IconLaptop className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
            <IconWifi className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">FlowDrop</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Your Device</span>
            <span className="text-sm font-semibold text-slate-700">Pixel 8 Pro</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
             <IconSmartphone className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        
        {/* Step 1: Device Discovery (Visual) */}
        {!selectedDevice && (
          <div className="w-full flex flex-col items-center justify-center py-12">
            <RadarScan />
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className="group relative flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all duration-200 text-left"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${device.type === DeviceType.MOBILE ? 'bg-orange-50 text-orange-600' : 'bg-brand-50 text-brand-600'} group-hover:scale-110 transition-transform`}>
                    <DeviceIcon type={device.type} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{device.name}</h3>
                    <p className="text-xs text-slate-500">{device.os} • {device.ip}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </button>
              ))}
              {devices.length === 0 && (
                <div className="col-span-full text-center text-slate-400 py-4">Waiting for devices...</div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 & 3: Selection & Transfer */}
        {selectedDevice && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-[fadeIn_0.3s_ease-out]">
            
            {/* Context Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <button onClick={resetTransfer} disabled={transferState !== TransferState.IDLE && transferState !== TransferState.COMPLETED} className="p-1 hover:bg-slate-200 rounded-full transition-colors disabled:opacity-30">
                   <IconX className="w-5 h-5 text-slate-500" />
                 </button>
                 <div className="flex items-center gap-2">
                   <span className="text-slate-500">Sending to</span>
                   <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <DeviceIcon type={selectedDevice.type} className="w-4 h-4" />
                      {selectedDevice.name}
                   </span>
                 </div>
              </div>
              <div className="text-xs font-mono text-slate-400">{selectedDevice.ip}</div>
            </div>

            {/* Content Area */}
            <div className="p-8 min-h-[400px] flex flex-col justify-center">
              
              {/* File Selection State */}
              {!fileMeta && (
                <div 
                  className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-colors ${dragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mb-4 pointer-events-none">
                    <IconFile className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2 pointer-events-none">Drop file to send</h3>
                  <p className="text-slate-500 text-sm mb-6 pointer-events-none">or click to browse local files</p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Select File
                  </button>
                </div>
              )}

              {/* File Preview & Actions State */}
              {fileMeta && transferState === TransferState.IDLE && (
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    {fileMeta.previewUrl ? (
                      <img src={fileMeta.previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg shadow-sm" />
                    ) : (
                      <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500">
                        <IconFile className="w-10 h-10" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 break-all line-clamp-2">{fileMeta.file.name}</h4>
                      <p className="text-sm text-slate-500 mt-1">{formatBytes(fileMeta.file.size)} • {fileMeta.file.type || 'Unknown Type'}</p>
                      
                      {/* AI Section */}
                      <div className="mt-4">
                         {!fileMeta.aiSummary ? (
                           <button 
                             onClick={triggerAIAnalysis}
                             disabled={fileMeta.isAnalyzing}
                             className="flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                           >
                             <IconSparkles className="w-3 h-3" />
                             {fileMeta.isAnalyzing ? 'Analyzing with Gemini...' : 'Generate Smart Context'}
                           </button>
                         ) : (
                           <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 mb-1">
                                <IconSparkles className="w-3 h-3" />
                                <span>Gemini Insight</span>
                              </div>
                              <p className="text-sm text-purple-900 leading-relaxed">"{fileMeta.aiSummary}"</p>
                           </div>
                         )}
                      </div>
                    </div>
                    <button onClick={() => setFileMeta(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <IconX className="w-5 h-5" />
                    </button>
                  </div>

                  <button 
                    onClick={startTransfer}
                    className="w-full py-4 bg-brand-600 text-white font-bold text-lg rounded-xl hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-500/30 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <IconSend className="w-6 h-6" />
                    Send Now
                  </button>
                </div>
              )}

              {/* Transfer Progress State */}
              {transferState !== TransferState.IDLE && (
                <div className="flex flex-col items-center justify-center py-8">
                  {transferState === TransferState.COMPLETED ? (
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_ease-in-out]">
                      <IconCheck className="w-10 h-10" />
                    </div>
                  ) : (
                    <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                       <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                         <circle className="text-slate-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent"></circle>
                         <circle 
                           className="text-brand-500 progress-ring__circle stroke-current transition-[stroke-dashoffset] duration-300 ease-linear" 
                           strokeWidth="8" 
                           strokeLinecap="round" 
                           cx="50" 
                           cy="50" 
                           r="40" 
                           fill="transparent" 
                           strokeDasharray="251.2" 
                           strokeDashoffset={251.2 - (251.2 * progress.percentage) / 100}
                         ></circle>
                       </svg>
                       <div className="absolute flex flex-col items-center">
                         <span className="text-2xl font-bold text-slate-800">{Math.round(progress.percentage)}%</span>
                       </div>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    {transferState === TransferState.CONNECTING ? 'Handshake...' : 
                     transferState === TransferState.COMPLETED ? 'Sent Successfully!' : 
                     'Transferring...'}
                  </h3>
                  
                  {transferState === TransferState.TRANSFERRING && (
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{formatBytes(progress.speed)}/s</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>{formatTime(progress.timeLeft)} remaining</span>
                    </div>
                  )}

                  {transferState === TransferState.COMPLETED && (
                    <button onClick={resetTransfer} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                      Send Another File
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>FlowDrop Local Network Transfer • Secure P2P Encryption</p>
      </footer>
    </div>
  );
};

export default App;