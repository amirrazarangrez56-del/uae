import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Camera, 
  Sparkles, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  FileText,
  StopCircle,
  ScanLine,
  Plus,
  Layers,
  CheckCircle2
} from 'lucide-react';

export interface QueuedDocument {
  id: string;
  name: string;
  base64: string;
  status: 'pending' | 'extracting' | 'completed' | 'failed';
}

interface DocumentScannerProps {
  imageSrc: string | null;
  onImageSelected: (base64: string) => void;
  onClearImage: () => void;
  onExtract: () => void;
  isExtracting: boolean;
  hasApiKeys: boolean;
  onOpenKeyModal: () => void;
  onLoadSample?: () => void;

  // Multi-document / bulk upload support
  queuedFiles?: QueuedDocument[];
  onAddQueuedFiles?: (files: QueuedDocument[]) => void;
  onRemoveQueuedFile?: (id: string) => void;
  onSelectQueuedFile?: (file: QueuedDocument) => void;
  onExtractAllBatch?: () => void;
  batchProgress?: { current: number; total: number; currentDocName?: string } | null;
  activeRoomNumber?: string;
  maxCapacity?: number;
  currentGuestCount?: number;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  imageSrc,
  onImageSelected,
  onClearImage,
  onExtract,
  isExtracting,
  hasApiKeys,
  onOpenKeyModal,
  onLoadSample,
  queuedFiles = [],
  onAddQueuedFiles,
  onRemoveQueuedFile,
  onSelectQueuedFile,
  onExtractAllBatch,
  batchProgress,
  activeRoomNumber,
  maxCapacity,
  currentGuestCount = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable: ' + (err.message || 'Error'));
      setIsCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();

    const newDoc: QueuedDocument = {
      id: `cam-${Date.now()}`,
      name: `Camera Snapshot ${queuedFiles.length + 1}`,
      base64: dataUrl,
      status: 'pending',
    };

    if (onAddQueuedFiles) {
      onAddQueuedFiles([newDoc]);
    }
    onImageSelected(dataUrl);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
    e.target.value = '';
  };

  const processFiles = (files: File[]) => {
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (validFiles.length === 0) return;

    const readPromises = validFiles.map((file, idx) => {
      return new Promise<QueuedDocument>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `doc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            base64: typeof reader.result === 'string' ? reader.result : '',
            status: 'pending',
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then((docs) => {
      if (docs.length > 0) {
        if (onAddQueuedFiles) {
          onAddQueuedFiles(docs);
        }
        // Set the first as the active preview
        onImageSelected(docs[0].base64);
        setZoomLevel(1);
        setRotation(0);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const hasMultipleQueue = queuedFiles.length > 1;

  return (
    <div className="clean-card scanner-box">
      <div className="clean-card-header">
        <div className="clean-card-title">
          <ScanLine size={18} className="text-primary" />
          <span>Passport &amp; Visa Scanner</span>
          {activeRoomNumber && (
            <span className="scanner-room-tag">Room {activeRoomNumber}</span>
          )}
        </div>
        
        <div className="clean-header-actions">
          {queuedFiles.length > 0 && (
            <button
              type="button"
              className="clean-btn-subtle small"
              onClick={() => fileInputRef.current?.click()}
              title="Add more passports or visas to this room"
            >
              <Plus size={13} />
              <span>Add More</span>
            </button>
          )}

          {imageSrc && (
            <button
              type="button"
              className="clean-icon-btn"
              onClick={onClearImage}
              title="Clear active image"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Capacity & Multiple Passports Info Banner */}
      {maxCapacity !== undefined && (
        <div className="scanner-capacity-banner">
          <div className="capacity-text">
            <Layers size={14} />
            <span>Room Capacity: <strong>{maxCapacity} Guests</strong></span>
            <span className="occupants-pill">Current: {currentGuestCount} / {maxCapacity}</span>
          </div>
          {queuedFiles.length > 0 && (
            <div className="queued-count-badge">
              {queuedFiles.length} {queuedFiles.length === 1 ? 'Document' : 'Documents'} Queued
            </div>
          )}
        </div>
      )}

      {/* Multi-Document Queue Strip (When 2+ files are queued) */}
      {queuedFiles.length > 0 && (
        <div className="multi-doc-queue-strip">
          <div className="queue-strip-scroll">
            {queuedFiles.map((doc, index) => {
              const isSelected = doc.base64 === imageSrc;
              return (
                <div
                  key={doc.id}
                  className={`doc-queue-item ${isSelected ? 'selected' : ''} ${doc.status}`}
                  onClick={() => {
                    onSelectQueuedFile?.(doc);
                    onImageSelected(doc.base64);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  title={doc.name}
                >
                  <img src={doc.base64} alt={doc.name} className="queue-thumb-img" />
                  <div className="queue-item-meta">
                    <span className="queue-item-num">#{index + 1}</span>
                    <span className="queue-item-name">{doc.name}</span>
                  </div>
                  {doc.status === 'completed' && (
                    <CheckCircle2 size={13} className="queue-status-done" />
                  )}
                  {onRemoveQueuedFile && (
                    <button
                      type="button"
                      className="queue-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveQueuedFile(doc.id);
                      }}
                      title="Remove from queue"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Viewfinder / Image Viewport / Dropzone */}
      {isCameraActive ? (
        <div className="camera-viewfinder-box">
          <video ref={videoRef} autoPlay playsInline className="camera-video-feed" />
          <div className="camera-controls-bar">
            <button type="button" className="clean-btn-secondary" onClick={stopCamera}>
              <StopCircle size={15} /> Cancel
            </button>
            <button type="button" className="clean-btn-primary" onClick={captureCameraPhoto}>
              <Camera size={16} /> Snap Photo
            </button>
          </div>
        </div>
      ) : imageSrc ? (
        <div className="preview-area">
          <div className="preview-image-viewport">
            <img
              src={imageSrc}
              alt="Uploaded Document"
              className="preview-image"
              style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
            />
          </div>

          <div className="preview-toolbar">
            <button
              type="button"
              className="zoom-tool-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
            <span className="zoom-text">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              className="zoom-tool-btn"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              className="zoom-tool-btn"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title="Rotate"
            >
              <RotateCw size={15} />
            </button>
            <button
              type="button"
              className="zoom-tool-btn"
              onClick={() => {
                setZoomLevel(1);
                setRotation(0);
              }}
              title="Reset Zoom"
            >
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`clean-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="dropzone-center">
            <div className="dropzone-icon-box">
              <UploadCloud size={30} />
            </div>
            <h3 className="dropzone-heading">Upload Passport(s) or Visa(s)</h3>
            <p className="dropzone-sub">
              Upload single or multiple passports/visas for bulk room entry
            </p>

            <div className="dropzone-buttons" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="clean-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={15} />
                <span>Browse Multiple Files</span>
              </button>
              <button type="button" className="clean-btn-outline" onClick={startCamera}>
                <Camera size={15} />
                <span>Use Camera</span>
              </button>
              {onLoadSample && (
                <button
                  type="button"
                  className="clean-btn-outline"
                  onClick={onLoadSample}
                  title="Load a built-in sample document to test AI parsing immediately"
                >
                  <Sparkles size={15} />
                  <span>Try Sample Document</span>
                </button>
              )}
            </div>

            {cameraError && <div className="camera-error-badge">{cameraError}</div>}
          </div>
        </div>
      )}

      {/* Batch Extraction Progress Notification */}
      {batchProgress && (
        <div className="batch-progress-box">
          <div className="progress-header">
            <span>
              Extracting Document {batchProgress.current} of {batchProgress.total}...
            </span>
            <span className="progress-pct">
              {Math.round((batchProgress.current / batchProgress.total) * 100)}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
          {batchProgress.currentDocName && (
            <div className="progress-doc-title">{batchProgress.currentDocName}</div>
          )}
        </div>
      )}

      {/* Hidden file input for adding more */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf,.pdf"
        multiple
        style={{ display: 'none' }}
      />

      {/* Main Extraction Action Bottom */}
      <div className="scanner-action-bottom">
        {!hasApiKeys ? (
          <div className="no-keys-alert">
            <span>Live AI: Add Gemini API key in Settings (gear icon on top right).</span>
            <button type="button" className="add-key-link" onClick={onOpenKeyModal}>
              Settings ⚙️
            </button>
          </div>
        ) : hasMultipleQueue && onExtractAllBatch ? (
          <button
            type="button"
            className={`extract-btn-main ${isExtracting ? 'extracting' : ''}`}
            onClick={onExtractAllBatch}
            disabled={isExtracting}
          >
            <Sparkles size={17} className={isExtracting ? 'spinning' : ''} />
            <span>
              {isExtracting
                ? `Extracting ${batchProgress?.current || 1} of ${queuedFiles.length}...`
                : `Live Gemini AI Extract All (${queuedFiles.length} Documents)`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={`extract-btn-main ${isExtracting ? 'extracting' : ''}`}
            onClick={onExtract}
            disabled={!imageSrc || isExtracting}
          >
            <Sparkles size={17} className={isExtracting ? 'spinning' : ''} />
            <span>
              {isExtracting
                ? 'Extracting Document Details...'
                : 'Live Gemini AI Extract & Parse'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
