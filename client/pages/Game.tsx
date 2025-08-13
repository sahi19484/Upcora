import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Trophy, Star, Share, RotateCcw } from 'lucide-react';
import { GameView } from '../components/GameView';

export default function Game() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameComplete, setGameComplete] = useState<{
    score: number;
    xpEarned: number;
    badges: string[];
  } | null>(null);
  const [showXPNotification, setShowXPNotification] = useState(false);

  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleGameComplete = (score: number, xpEarned: number, badges: string[]) => {
    setGameComplete({ score, xpEarned, badges });
    setShowXPNotification(true);
    
    setTimeout(() => {
      setShowXPNotification(false);
    }, 5000);
  };

  const getScoreMessage = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage === 100) return "Perfect! Outstanding work! 🏆";
    if (percentage >= 90) return "Excellent! You've mastered this material! 🌟";
    if (percentage >= 75) return "Great job! You have a solid understanding! 👏";
    if (percentage >= 60) return "Good effort! Keep practicing to improve! 📚";
    return "Keep learning! Every attempt makes you stronger! 💪";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Home
              </button>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Loomify</span>
              </div>
            </div>

            {gameComplete && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </button>
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: 'Loomify Learning Game',
                      text: `I just completed a learning game on Loomify and scored ${gameComplete.score} points!`,
                      url: window.location.href
                    }) || navigator.clipboard.writeText(window.location.href);
                  }}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gameComplete ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Game Complete! 🎉
              </h1>
              
              <p className="text-lg text-gray-600 mb-6">
                {getScoreMessage(gameComplete.score, 100)}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {gameComplete.score}
                  </div>
                  <div className="text-sm text-blue-800">Points Scored</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    +{gameComplete.xpEarned}
                  </div>
                  <div className="text-sm text-green-800">XP Earned</div>
                </div>
              </div>

              {gameComplete.badges.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    New Badges Earned! 🏅
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {gameComplete.badges.map((badge, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200"
                      >
                        <Star className="w-4 h-4" />
                        <span className="font-medium">{badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Another Game
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <GameView gameId={gameId} onComplete={handleGameComplete} />
        )}
      </main>

    </div>
  );
}
