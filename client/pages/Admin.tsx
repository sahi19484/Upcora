import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield, 
  Trash2,
  Crown,
  Activity,
  Database,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth, useAuthenticatedFetch } from '../hooks/useAuth';

interface AdminStats {
  totalUsers: number;
  totalUploads: number;
  totalGames: number;
  totalScores: number;
  averageScore: number;
  recentActivity: Array<{
    id: string;
    action: string;
    resource: string;
    createdAt: string;
    userId: string;
  }>;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  xp: number;
  level: number;
  badges: string[];
  lastActiveAt: string;
  createdAt: string;
  _count: {
    uploads: number;
    scores: number;
    gameSessions: number;
  };
}

interface Upload {
  id: string;
  fileName: string;
  fileType: string;
  isProcessed: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  gameSessions: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
  }>;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  if (!user || user.role !== 'ADMIN') {
    navigate('/');
    return null;
  }

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'content') {
      fetchUploads();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch admin stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  const fetchUploads = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/uploads');
      const data = await response.json();
      if (response.ok) {
        setUploads(data.uploads);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch uploads');
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchUsers(); // Refresh users list
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to update user role');
    }
  };

  const deleteUpload = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/admin/uploads/${uploadId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUploads(); // Refresh uploads list
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete upload');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'content', label: 'Content', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Uploads</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUploads}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Games Created</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalGames}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {stats.recentActivity.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {activity.resource} • {formatDate(activity.createdAt)}
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || user.email}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            Level {user.level} • {user.xp} XP
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          className="text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="USER">User</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {user._count.gameSessions} games • {user._count.scores} scores
                        </div>
                        <div className="text-xs text-gray-500">
                          {user._count.uploads} uploads
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.role === 'ADMIN' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Content Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {upload.fileName}
                          </div>
                          <div className="text-sm text-gray-500">{upload.fileType}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {upload.user.name || upload.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            upload.isProcessed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {upload.isProcessed ? 'Processed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(upload.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteUpload(upload.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
