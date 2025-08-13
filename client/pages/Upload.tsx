import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Loader2 } from 'lucide-react';
import { FileUploader } from '../components/FileUploader';

export default function Upload() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<{
    uploadId: string;
    fileName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = async (uploadId: string, fileName: string) => {
    setProcessing({ uploadId, fileName });
    setError(null);

    try {
      const response = await authenticatedFetch('/api/games/process', {
        method: 'POST',
        body: JSON.stringify({ uploadId })
      });

      const data = await response.json();

      if (response.ok) {
        navigate(`/game/${data.gameSessionId}`);
      } else {
        setError(data.error || 'Failed to process upload');
        setProcessing(null);
      }
    } catch (error) {
      setError('Network error while processing upload');
      setProcessing(null);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setProcessing(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Loomify</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Your Study Material
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload a PDF, Word document, text file, or provide a URL. 
            Our AI will transform it into an engaging interactive learning experience.
          </p>
        </div>

        {processing ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Creating Your Learning Game
              </h2>
              <p className="text-gray-600 mb-4">
                Processing "{processing.fileName}" with AI...
              </p>
              <div className="max-w-md mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This usually takes 30-60 seconds
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <FileUploader
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
            
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Supported Formats
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">📄 Document Formats</h3>
              <ul className="space-y-1">
                <li>• PDF files (.pdf)</li>
                <li>• Word documents (.docx, .doc)</li>
                <li>• PowerPoint presentations (.pptx, .ppt)</li>
                <li>• Text files (.txt)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">🌐 Web Content</h3>
              <ul className="space-y-1">
                <li>• Blog articles</li>
                <li>• Educational websites</li>
                <li>• Online documentation</li>
                <li>• Study guides</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-4">
            Maximum file size: 10MB. Content should be at least 100 words for best results.
          </p>
        </div>
      </main>
    </div>
  );
}
