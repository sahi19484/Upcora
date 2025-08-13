import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface MediaContent {
  url: string;
  altText: string;
  description?: string;
  searchTerms?: string[];
}

interface MediaDisplayProps {
  media: MediaContent;
  type: 'image' | 'video';
  className?: string;
  autoPlay?: boolean;
  showDescription?: boolean;
}

export function MediaDisplay({ media, type, className, autoPlay = false, showDescription = true }: MediaDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (type === 'image') {
    return (
      <div className={cn('relative group', className)}>
        <img
          src={media.url}
          alt={media.altText}
          className="w-full h-auto rounded-lg shadow-lg transition-transform group-hover:scale-105"
          onClick={() => setIsFullscreen(true)}
        />
        
        {/* Fullscreen overlay */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={media.url}
              alt={media.altText}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        
        {/* Expand button overlay */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {showDescription && media.description && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {media.description}
          </div>
        )}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div className={cn('relative group', className)}>
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
          {/* Video iframe for embedded content */}
          {media.url.includes('vimeo.com') || media.url.includes('youtube.com') ? (
            <iframe
              src={media.url}
              title={media.altText}
              className="w-full aspect-video"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video
              className="w-full aspect-video"
              controls
              autoPlay={autoPlay}
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={media.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          
          {/* Custom video controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {showDescription && media.description && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {media.description}
          </div>
        )}
      </div>
    );
  }

  return null;
}

interface MediaGalleryProps {
  images?: Array<MediaContent & { concept?: string }>;
  videos?: Array<MediaContent & { topic?: string }>;
  className?: string;
}

export function MediaGallery({ images = [], videos = [], className }: MediaGalleryProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');

  if (images.length === 0 && videos.length === 0) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      <div className="flex space-x-1 mb-4">
        {images.length > 0 && (
          <button
            onClick={() => setActiveTab('images')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'images'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            Images ({images.length})
          </button>
        )}
        {videos.length > 0 && (
          <button
            onClick={() => setActiveTab('videos')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'videos'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            Videos ({videos.length})
          </button>
        )}
      </div>

      <div className="space-y-4">
        {activeTab === 'images' && images.map((image, index) => (
          <div key={index}>
            {image.concept && (
              <h4 className="font-medium text-gray-900 mb-2">{image.concept}</h4>
            )}
            <MediaDisplay
              media={image}
              type="image"
              className="max-w-md"
            />
          </div>
        ))}
        
        {activeTab === 'videos' && videos.map((video, index) => (
          <div key={index}>
            {video.topic && (
              <h4 className="font-medium text-gray-900 mb-2">{video.topic}</h4>
            )}
            <MediaDisplay
              media={video}
              type="video"
              className="max-w-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressVisualizationProps {
  currentStep: number;
  totalSteps: number;
  milestones?: string[];
  className?: string;
}

export function ProgressVisualization({ currentStep, totalSteps, milestones = [], className }: ProgressVisualizationProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Learning Progress</span>
        <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {milestones.length > 0 && (
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {milestones.map((milestone, index) => (
              <span
                key={index}
                className={cn(
                  'transition-colors',
                  (index + 1) * (100 / milestones.length) <= progressPercentage
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-400'
                )}
              >
                {milestone}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
