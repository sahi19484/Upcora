import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Link, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthenticatedFetch } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onUploadComplete: (uploadId: string, fileName: string) => void;
  onError: (error: string) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export function FileUploader({ onUploadComplete, onError }: FileUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const authenticatedFetch = useAuthenticatedFetch();

  const uploadFile = useCallback(async (file: File) => {
    setUploadProgress({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => prev ? { ...prev, progress } : null);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setUploadProgress(prev => prev ? { ...prev, status: 'complete', progress: 100 } : null);
          onUploadComplete(response.uploadId, response.fileName);
          
          setTimeout(() => {
            setUploadProgress(null);
          }, 2000);
        } else {
          const error = JSON.parse(xhr.responseText);
          setUploadProgress(prev => prev ? { ...prev, status: 'error', error: error.error } : null);
          onError(error.error || 'Upload failed');
        }
      };

      xhr.onerror = () => {
        setUploadProgress(prev => prev ? { ...prev, status: 'error', error: 'Network error' } : null);
        onError('Network error during upload');
      };

      xhr.open('POST', '/api/upload/file');
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('quizcraft_token')}`);
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => prev ? { ...prev, status: 'error', error: 'Upload failed' } : null);
      onError('Upload failed');
    }
  }, [onUploadComplete, onError]);

  const uploadUrl = useCallback(async () => {
    if (!urlInput.trim()) return;

    setUploadProgress({
      fileName: urlInput,
      progress: 50,
      status: 'processing'
    });

    try {
      const response = await authenticatedFetch('/api/upload/url', {
        method: 'POST',
        body: JSON.stringify({ url: urlInput })
      });

      const data = await response.json();

      if (response.ok) {
        setUploadProgress(prev => prev ? { ...prev, status: 'complete', progress: 100 } : null);
        onUploadComplete(data.uploadId, data.fileName);
        setUrlInput('');
        
        setTimeout(() => {
          setUploadProgress(null);
        }, 2000);
      } else {
        setUploadProgress(prev => prev ? { ...prev, status: 'error', error: data.error } : null);
        onError(data.error || 'URL processing failed');
      }
    } catch (error) {
      console.error('URL upload error:', error);
      setUploadProgress(prev => prev ? { ...prev, status: 'error', error: 'Network error' } : null);
      onError('Network error');
    }
  }, [urlInput, authenticatedFetch, onUploadComplete, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadProgress?.status === 'uploading' || uploadProgress?.status === 'processing'
  });

  const getStatusIcon = () => {
    if (!uploadProgress) return null;
    
    switch (uploadProgress.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!uploadProgress) return '';
    
    switch (uploadProgress.status) {
      case 'uploading':
        return `Uploading ${uploadProgress.fileName}... ${uploadProgress.progress}%`;
      case 'processing':
        return `Processing ${uploadProgress.fileName}...`;
      case 'complete':
        return `Successfully uploaded ${uploadProgress.fileName}`;
      case 'error':
        return uploadProgress.error || 'Upload failed';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setUploadMode('file')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            uploadMode === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Upload File
        </button>
        <button
          onClick={() => setUploadMode('url')}
          className={cn(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            uploadMode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <Link className="w-4 h-4 inline mr-2" />
          From URL
        </button>
      </div>

      {uploadMode === 'file' ? (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400',
            uploadProgress?.status === 'uploading' || uploadProgress?.status === 'processing'
              ? 'pointer-events-none opacity-50'
              : ''
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop your file here' : 'Upload your study material'}
          </h3>
          <p className="text-gray-600 mb-4">
            Drag & drop your document here, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), TXT (max 10MB)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Enter URL
            </label>
            <div className="flex space-x-2">
              <input
                id="url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={uploadProgress?.status === 'uploading' || uploadProgress?.status === 'processing'}
              />
              <button
                onClick={uploadUrl}
                disabled={!urlInput.trim() || uploadProgress?.status === 'uploading' || uploadProgress?.status === 'processing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Process
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Enter a URL to extract text content from web pages, articles, or blog posts
            </p>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {uploadProgress && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {getStatusText()}
              </p>
              {uploadProgress.status === 'uploading' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
