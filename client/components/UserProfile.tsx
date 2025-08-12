import React from 'react';
import { Trophy, Star, Target, Clock, BookOpen, Award } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface UserStats {
  totalUploads: number;
  totalGames: number;
  averageScore: number;
  totalTimeSpent: number;
  streak: number;
}

interface UserProfileProps {
  stats?: UserStats;
  showCompact?: boolean;
}

const BADGE_ICONS: Record<string, React.ReactNode> = {
  'Perfect Score': <Trophy className="w-4 h-4" />,
  'Excellence': <Star className="w-4 h-4" />,
  'Great Job': <Target className="w-4 h-4" />,
  'Speed Learner': <Clock className="w-4 h-4" />,
  'Knowledge Seeker': <BookOpen className="w-4 h-4" />,
  'First Upload': <Award className="w-4 h-4" />,
  'Quiz Master': <Trophy className="w-4 h-4" />,
  'Rising Star': <Star className="w-4 h-4" />,
  'Perfectionist': <Award className="w-4 h-4" />
};

const BADGE_COLORS: Record<string, string> = {
  'Perfect Score': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Excellence': 'bg-purple-100 text-purple-800 border-purple-200',
  'Great Job': 'bg-blue-100 text-blue-800 border-blue-200',
  'Speed Learner': 'bg-green-100 text-green-800 border-green-200',
  'Knowledge Seeker': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'First Upload': 'bg-pink-100 text-pink-800 border-pink-200',
  'Quiz Master': 'bg-orange-100 text-orange-800 border-orange-200',
  'Rising Star': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'Perfectionist': 'bg-emerald-100 text-emerald-800 border-emerald-200'
};

export function UserProfile({ stats, showCompact = false }: UserProfileProps) {
  const { user } = useAuth();

  if (!user) return null;

  const xpToNextLevel = ((user.level) * 100) - user.xp;
  const xpInCurrentLevel = user.xp - ((user.level - 1) * 100);
  const progressPercentage = (xpInCurrentLevel / 100) * 100;

  if (showCompact) {
    return (
      <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{user.name || user.email}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Level {user.level}</span>
            <span>•</span>
            <span>{user.xp} XP</span>
            {user.badges.length > 0 && (
              <>
                <span>•</span>
                <span>{user.badges.length} badges</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user.name || 'Learning Explorer'}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Level and XP */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">Level {user.level}</div>
            <div className="text-sm text-gray-500">{user.xp} total XP</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress to Level {user.level + 1}</span>
            <span>{xpInCurrentLevel}/100 XP</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          {xpToNextLevel > 0 && (
            <p className="text-sm text-gray-500">
              {xpToNextLevel} XP needed for next level
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      {user.badges.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {user.badges.map((badge, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                  BADGE_COLORS[badge] || 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {BADGE_ICONS[badge] || <Award className="w-4 h-4" />}
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalUploads}</div>
              <div className="text-sm text-gray-600">Materials Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalGames}</div>
              <div className="text-sm text-gray-600">Games Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageScore}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.streak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility component for displaying badges in other parts of the app
export function BadgeDisplay({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.slice(0, 3).map((badge, index) => (
        <div
          key={index}
          className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
            BADGE_COLORS[badge] || 'bg-gray-100 text-gray-800 border-gray-200'
          }`}
        >
          {BADGE_ICONS[badge] || <Award className="w-3 h-3" />}
          <span>{badge}</span>
        </div>
      ))}
      {badges.length > 3 && (
        <div className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs">
          +{badges.length - 3} more
        </div>
      )}
    </div>
  );
}

// XP earned notification component
export function XPNotification({ xp, badges }: { xp: number; badges: string[] }) {
  if (xp === 0 && badges.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">Rewards Earned!</h4>
          {xp > 0 && (
            <p className="text-sm text-gray-600">+{xp} XP earned</p>
          )}
          {badges.length > 0 && (
            <div className="mt-2">
              <BadgeDisplay badges={badges} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
