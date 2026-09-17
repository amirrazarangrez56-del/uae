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
  ScanLine
} from 'lucide-react';

interface DocumentScannerProps {
  imageSrc: string | null;
  onImageSelected: (base64: string) => void;
  onClearImage: () => void;
  onExtract: () => void;
  isExtracting: boolean;
  hasApiKeys: boolean;
  onOpenKeyModal: () => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  imageSrc,
  onImageSelected,
  onClearImage,
  onExtract,
  isExtracting,
  hasApiKeys,
  onOpenKeyModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

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
    onImageSelected(dataUrl);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected(reader.result);
        setZoomLevel(1);
        setRotation(0);
      }
    };
    reader.readAsDataURL(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      readFile(file);
    }
  };

  return (
    <div className="clean-card scanner-box">
      <div className="clean-card-header">
        <div className="clean-card-title">
          <ScanLine size={18} className="text-primary" />
          <span>Document Scanner & Uploader</span>
        </div>
        {imageSrc && (
          <button
            type="button"
            className="clean-icon-btn"
            onClick={onClearImage}
            title="Remove document"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden-file-input"
          />
          <div className="dropzone-center">
            <div className="dropzone-icon-box">
              <UploadCloud size={30} />
            </div>
            <h3 className="dropzone-heading">Upload Passport or Visa</h3>
            <p className="dropzone-sub">Drag and drop file here, or click to browse</p>

            <div className="dropzone-buttons" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="clean-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText size={15} />
                <span>Browse File</span>
              </button>
              <button type="button" className="clean-btn-outline" onClick={startCamera}>
                <Camera size={15} />
                <span>Use Camera</span>
              </button>
            </div>

            {cameraError && <div className="camera-error-badge">{cameraError}</div>}
          </div>
        </div>
      )}

      {/* Main Extraction Action Button */}
      <div className="scanner-action-bottom">
        {!hasApiKeys ? (
          <div className="no-keys-alert">
            <span>Please add your Gemini API key in Settings (gear icon on top right).</span>
            <button type="button" className="add-key-link" onClick={onOpenKeyModal}>
              Settings ⚙️
            </button>
          </div>
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
                : 'Extract All Details & Fill A4 Form'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
