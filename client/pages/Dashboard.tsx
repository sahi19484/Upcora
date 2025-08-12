import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Calendar, Trophy, Target, Clock, Play, LogOut } from 'lucide-react';
import { UserProfile } from '../components/UserProfile';
import { useAuth, useAuthenticatedFetch } from '../hooks/useAuth';
import { AuthModal } from '../components/AuthModal';

interface GameSession {
  id: string;
  title: string;
  gameType: string;
  isCompleted: boolean;
  createdAt: string;
  upload: {
    fileName: string;
    fileType: string;
  };
  scores: Array<{
    score: number;
    maxScore: number;
    createdAt: string;
  }>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();
  const [games, setGames] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login'
  });

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <BookOpen className="w-12 h-12 mx-auto text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view your learning dashboard and game history.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
              className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
        
        <AuthModal
          isOpen={authModal.isOpen}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          mode={authModal.mode}
          onModeChange={(mode) => setAuthModal({ ...authModal, mode })}
        />
      </div>
    );
  }

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await authenticatedFetch('/api/games');
      const data = await response.json();

      if (response.ok) {
        setGames(data.games);
      } else {
        setError(data.error || 'Failed to fetch games');
      }
    } catch (error) {
      setError('Network error while fetching games');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStats = () => {
    const totalGames = games.length;
    const completedGames = games.filter(g => g.isCompleted).length;
    const totalScores = games.flatMap(g => g.scores);
    const averageScore = totalScores.length > 0 
      ? Math.round(totalScores.reduce((sum, s) => sum + (s.score / s.maxScore * 100), 0) / totalScores.length)
      : 0;

    return {
      totalUploads: games.length,
      totalGames: completedGames,
      averageScore,
      totalTimeSpent: 0, // Would calculate from actual time data
      streak: user.streakDays
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">QuizCraft</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/upload"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Game
              </Link>
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || 'Learning Explorer'}!
          </h1>
          <p className="text-gray-600">
            Track your progress and continue your learning journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <Target className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.totalGames}</div>
                <div className="text-sm text-gray-600">Games Completed</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <Trophy className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <Calendar className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.streak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <Clock className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-gray-900">{user.level}</div>
                <div className="text-sm text-gray-600">Current Level</div>
              </div>
            </div>

            {/* Recent Games */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Your Learning Games</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading your games...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : games.length === 0 ? (
                <div className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No games yet</h3>
                  <p className="text-gray-600 mb-4">
                    Upload your first study material to create an interactive learning game.
                  </p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Game
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {games.slice(0, 5).map((game) => (
                    <div key={game.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {game.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Based on: {game.upload.fileName}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Created {formatDate(game.createdAt)}</span>
                            {game.scores.length > 0 && (
                              <span>
                                Best Score: {Math.round((game.scores[0].score / game.scores[0].maxScore) * 100)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {game.isCompleted ? (
                            <div className="flex items-center text-green-600">
                              <Trophy className="w-4 h-4 mr-1" />
                              <span className="text-sm">Completed</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">In Progress</div>
                          )}
                          <Link
                            to={`/game/${game.id}`}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Play
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UserProfile stats={stats} />
          </div>
        </div>
      </main>
    </div>
  );
}
