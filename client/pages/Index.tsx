import React, { useState } from 'react';
import { Brain, Upload, Gamepad2, Trophy, Users, BookOpen, ArrowRight, Sparkles, Target, Clock } from 'lucide-react';
import { AuthModal, AuthButton } from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Index() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login'
  });
  const { user } = useAuth();

  const features = [
    {
      icon: <Upload className="w-8 h-8 text-blue-600" />,
      title: "Easy Upload",
      description: "Drag & drop your PDFs, Word documents, or paste URLs. We'll extract the key content instantly."
    },
    {
      icon: <Brain className="w-8 h-8 text-purple-600" />,
      title: "AI-Powered Processing",
      description: "Our AI analyzes your content and creates personalized learning experiences tailored to your material."
    },
    {
      icon: <Gamepad2 className="w-8 h-8 text-green-600" />,
      title: "Interactive Games",
      description: "Engage with roleplay simulations and creative quizzes that make learning fun and memorable."
    },
    {
      icon: <Trophy className="w-8 h-8 text-yellow-600" />,
      title: "Gamified Learning",
      description: "Earn XP, unlock badges, and level up as you master new concepts through interactive gameplay."
    }
  ];

  const stats = [
    { label: "Learning Games Created", value: "10,000+", icon: <Target className="w-5 h-5" /> },
    { label: "Students Engaged", value: "50,000+", icon: <Users className="w-5 h-5" /> },
    { label: "Average Engagement", value: "94%", icon: <Sparkles className="w-5 h-5" /> },
    { label: "Time Saved", value: "1M+ hours", icon: <Clock className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuizCraft</span>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Game
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <AuthButton
                  variant="secondary"
                  onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                >
                  Sign In
                </AuthButton>
                <AuthButton
                  onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                >
                  Get Started
                </AuthButton>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Any
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Study Material{" "}
              </span>
              Into Interactive Games
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload your PDFs, documents, or URLs and watch AI create engaging roleplay simulations 
              and quizzes that make learning fun, memorable, and effective.
            </p>
            
            {user ? (
              <Link
                to="/upload"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Start Creating Games
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            ) : (
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How QuizCraft Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From upload to interactive learning in minutes. Our AI does the heavy lifting 
              so you can focus on what matters most - learning.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
                {index < features.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              See QuizCraft In Action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Watch how a simple PDF becomes an engaging learning experience with roleplay scenarios and interactive quizzes.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto">
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Demo</h3>
                <p className="text-gray-500">Experience a sample learning game</p>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who are already using QuizCraft to make studying more engaging and effective.
          </p>
          
          {user ? (
            <Link
              to="/upload"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Create Your First Game
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          ) : (
            <button
              onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">QuizCraft</span>
            </div>
            <p className="text-gray-600 mb-4">
              AI-powered interactive learning platform
            </p>
            <p className="text-sm text-gray-500">
              Built with ❤️ for learners everywhere
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        mode={authModal.mode}
        onModeChange={(mode) => setAuthModal({ ...authModal, mode })}
      />
    </div>
  );
}
