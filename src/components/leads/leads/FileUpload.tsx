'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Download, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { LeadAttachment } from '@/lib/leads/types';
import { ConfirmModal } from '@/components/leads/ui/ConfirmModal';

interface FileUploadProps {
  leadId: string;
  attachments: LeadAttachment[];
  onUpload: (file: File, description?: string) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  maxSize?: number; // in MB
}

const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/plain': 'TXT',
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/mp4': 'M4A',
  'audio/ogg': 'OGG',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'application/zip': 'ZIP',
  'text/csv': 'CSV'
};

export const FileUpload = ({ 
  leadId, 
  attachments, 
  onUpload, 
  onDelete,
  maxSize = 10 
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!Object.keys(ALLOWED_TYPES).includes(file.type)) {
      setErrorMessage('File type not supported. Please upload PDF, DOC, XLS, audio, or image files.');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setErrorMessage(`File size exceeds ${maxSize}MB limit. Please choose a smaller file.`);
      return;
    }

    await uploadFile(file);
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Camera captures are always images, so they should be valid
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await onUpload(file, description);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setDescription('');
      
      // Reset file inputs
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    setDeleteFileId(attachmentId);
  };

  const confirmDelete = async () => {
    if (!deleteFileId) return;
    
    try {
      await onDelete(deleteFileId);
      setDeleteFileId(null);
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage('Failed to delete file. Please try again.');
    }
  };

  const handleDownload = (attachment: LeadAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.file_data;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleAudioPlay = (attachmentId: string, audioData: string) => {
    if (playingAudio === attachmentId) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioData;
        audioRef.current.play();
        setPlayingAudio(attachmentId);
      }
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload File</h3>
          <p className="text-sm text-gray-600 mb-4">
            PDF, DOC, XLS, Audio, Images (Max {maxSize}MB)
          </p>
          
          {/* Description Input */}
          <input
            type="text"
            placeholder="Optional: Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          />

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={Object.keys(ALLOWED_TYPES).join(',')}
            className="hidden"
            disabled={isUploading}
          />
          
          {/* Camera Input */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading... {uploadProgress}%
                </span>
              ) : (
                <span className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </span>
              )}
            </button>
            
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title="Take a photo"
            >
              <span className="flex items-center">
                📷 Camera
              </span>
            </button>
          </div>

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">
            Attachments ({attachments.length})
          </h4>
          {attachments.map((attachment) => {
            const isAudio = attachment.file_type.startsWith('audio/');
            const isPlaying = playingAudio === attachment.id;

            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {getFileIcon(attachment.file_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                      {attachment.file_name}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(attachment.file_size)}
                      {attachment.description && ` • ${attachment.description}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(attachment.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  {isAudio && (
                    <button
                      onClick={() => toggleAudioPlay(attachment.id, attachment.file_data)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        className="hidden"
      />

      {/* Error Message Modal */}
      {errorMessage && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={() => setErrorMessage(null)}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Error</h3>
              </div>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="btn btn-primary w-full"
              >
                OK
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteFileId !== null}
        onClose={() => setDeleteFileId(null)}
        onConfirm={confirmDelete}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
