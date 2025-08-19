import React, { useState, useEffect } from 'react';
import { Play, Pause, ArrowRight, ArrowLeft, Users, Eye, Volume2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface VideoScene {
  sceneNumber: number;
  duration: string;
  narration: string;
  visuals: string;
  characters: string[];
  environment: string;
  transitions: string;
}

interface VideoData {
  title: string;
  visualStyle: string;
  totalDuration: string;
  scenes: VideoScene[];
}

interface GamifiedVideoProps {
  video: VideoData;
  currentScene: number;
  onSceneChange: (index: number) => void;
  onContinue: () => void;
}

export function GamifiedVideo({ 
  video, 
  currentScene, 
  onSceneChange, 
  onContinue 
}: GamifiedVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchedScenes, setWatchedScenes] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);

  useEffect(() => {
    if (isPlaying && autoAdvance) {
      const timer = setTimeout(() => {
        setWatchedScenes(prev => new Set([...prev, currentScene]));
        if (currentScene < video.scenes.length - 1) {
          onSceneChange(currentScene + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, 8000); // 8 seconds per scene for demo

      const progressTimer = setInterval(() => {
        setProgress(prev => Math.min(prev + 1.25, 100)); // 100% over 8 seconds
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [isPlaying, currentScene, video.scenes.length, onSceneChange, autoAdvance]);

  const currentSceneData = video.scenes[currentScene];
  const allScenesWatched = watchedScenes.size === video.scenes.length;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setWatchedScenes(prev => new Set([...prev, currentScene]));
    }
  };

  const handleSceneSelect = (index: number) => {
    setIsPlaying(false);
    setProgress(0);
    onSceneChange(index);
  };

  const getSceneVisual = (sceneNumber: number) => {
    const visuals = ['🎬', '📚', '🎯', '🏆', '✨', '🌟'];
    return visuals[sceneNumber % visuals.length];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🎬 Interactive Learning Video</h1>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-purple-900 mb-2">{video.title}</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Duration: {video.totalDuration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>Style: {video.visualStyle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-black rounded-lg overflow-hidden shadow-2xl mb-8">
        {/* Video Content */}
        <div className="relative bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 aspect-video flex items-center justify-center">
          {/* Scene Content */}
          <div className="text-center p-8 space-y-6">
            <div className="text-8xl animate-pulse">
              {getSceneVisual(currentScene)}
            </div>
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4">
                Scene {currentSceneData.sceneNumber}: {currentSceneData.environment}
              </h3>
              <div className="bg-black bg-opacity-50 rounded-lg p-6">
                <p className="text-lg text-gray-100 leading-relaxed">
                  {currentSceneData.narration}
                </p>
              </div>
              <div className="text-sm text-gray-300">
                <p><strong>Visuals:</strong> {currentSceneData.visuals}</p>
                {currentSceneData.characters.length > 0 && (
                  <p><strong>Characters:</strong> {currentSceneData.characters.join(', ')}</p>
                )}
                <p><strong>Transitions:</strong> {currentSceneData.transitions}</p>
              </div>
            </div>
          </div>

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-all duration-200"
            >
              <div className="bg-white bg-opacity-90 rounded-full p-6 hover:bg-opacity-100 transition-all duration-200 transform hover:scale-110">
                <Play className="w-12 h-12 text-gray-800 ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* Video Controls */}
        <div className="bg-gray-900 p-4">
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              
              <button
                onClick={() => handleSceneSelect(Math.max(0, currentScene - 1))}
                disabled={currentScene === 0}
                className="p-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => handleSceneSelect(Math.min(video.scenes.length - 1, currentScene + 1))}
                disabled={currentScene === video.scenes.length - 1}
                className="p-2 text-white hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4 text-white">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-advance</span>
              </label>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span className="text-sm">Scene {currentScene + 1} of {video.scenes.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scene Timeline */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Video Timeline</h3>
        <div className="grid gap-4">
          {video.scenes.map((scene, index) => (
            <button
              key={index}
              onClick={() => handleSceneSelect(index)}
              className={cn(
                "text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
                index === currentScene && "border-purple-500 bg-purple-50",
                index !== currentScene && watchedScenes.has(index) && "border-green-300 bg-green-50",
                index !== currentScene && !watchedScenes.has(index) && "border-gray-200 hover:border-purple-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getSceneVisual(index)}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Scene {scene.sceneNumber}</h4>
                    <p className="text-sm text-gray-600">{scene.environment}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{scene.duration}</span>
                  {watchedScenes.has(index) && (
                    <span className="text-xs text-green-600 font-medium">✓ Watched</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{scene.narration}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      {allScenesWatched && (
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Play className="w-6 h-6 text-purple-600" />
              <span className="text-lg font-semibold text-purple-800">Video Learning Complete!</span>
            </div>
            <p className="text-purple-700">
              Fantastic! You've experienced the complete learning journey. Ready for the final treasure hunt quiz?
            </p>
          </div>
          <button
            onClick={onContinue}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Play className="w-6 h-6 mr-2" />
            Continue to Final Quiz
            <ArrowRight className="w-6 h-6 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}
