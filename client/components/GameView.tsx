import React, { useState, useEffect } from 'react';
import { Clock, Star, Trophy, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface GameData {
  title: string;
  summary: string;
  learningObjectives: string[];
  roleplay: {
    scenario: string;
    steps: Array<{
      id: string;
      text: string;
      choices: Array<{
        id: string;
        label: string;
        feedback: string;
        nextStep: string | null;
      }>;
    }>;
  };
  quiz: {
    theme: string;
    questions: Array<{
      id: string;
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }>;
  };
}

interface GameViewProps {
  gameId: string;
  onComplete: (score: number, xpEarned: number, badges: string[]) => void;
}

export function GameView({ gameId, onComplete }: GameViewProps) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'roleplay' | 'quiz' | 'complete'>('intro');
  const [currentStep, setCurrentStep] = useState<string>('step1');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      const data = await response.json();

      if (response.ok) {
        setGameData(data.gameData);
        setStartTime(new Date());
      } else {
        setError(data.error || 'Failed to load game');
      }
    } catch (error) {
      setError('Network error while loading game');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleplayChoice = (choice: any) => {
    setShowFeedback(choice.feedback);
    
    setTimeout(() => {
      setShowFeedback(null);
      if (choice.nextStep) {
        setCurrentStep(choice.nextStep);
      } else {
        setCurrentPhase('quiz');
      }
    }, 3000);
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const calculateScore = () => {
    if (!gameData) return { score: 0, maxScore: 0, correctAnswers: 0 };
    
    let correctAnswers = 0;
    gameData.quiz.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.answerIndex) {
        correctAnswers++;
      }
    });

    return {
      score: correctAnswers,
      maxScore: gameData.quiz.questions.length,
      correctAnswers
    };
  };

  const submitScore = async () => {
    if (!gameData || !startTime) return;

    const { score, maxScore, correctAnswers } = calculateScore();
    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000);

    try {
      const response = await fetch(`/api/games/${gameId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score,
          maxScore,
          timeSpent,
          correctAnswers,
          totalQuestions: gameData.quiz.questions.length
        })
      });

      const data = await response.json();

      if (response.ok) {
        onComplete(score, data.xpEarned, data.badges);
        setCurrentPhase('complete');
      } else {
        setError(data.error || 'Failed to submit score');
      }
    } catch (error) {
      setError('Network error while submitting score');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Game</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Game data not found</p>
      </div>
    );
  }

  // Intro Phase
  if (currentPhase === 'intro') {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{gameData.title}</h1>
          <p className="text-lg text-gray-600 mb-6">{gameData.summary}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Learning Objectives</h2>
          <ul className="space-y-2">
            {gameData.learningObjectives.map((objective, index) => (
              <li key={index} className="flex items-start space-x-2 text-blue-800">
                <Star className="w-5 h-5 mt-0.5 text-blue-600" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentPhase('roleplay')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Learning Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  // Roleplay Phase
  if (currentPhase === 'roleplay') {
    const step = gameData.roleplay.steps.find(s => s.id === currentStep);
    
    if (!step) {
      setCurrentPhase('quiz');
      return null;
    }

    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Roleplay Simulation</h2>
            <p className="opacity-90">{gameData.roleplay.scenario}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <p className="text-lg text-gray-900 mb-6">{step.text}</p>
          
          {!showFeedback ? (
            <div className="space-y-3">
              {step.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleRoleplayChoice(choice)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800 mb-1">Feedback</h4>
                  <p className="text-green-700">{showFeedback}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Phase
  if (currentPhase === 'quiz') {
    const question = gameData.quiz.questions[currentQuestion];
    const isLastQuestion = currentQuestion === gameData.quiz.questions.length - 1;
    const hasAnswered = selectedAnswers[question.id] !== undefined;

    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">{gameData.quiz.theme}</h2>
            <div className="flex items-center justify-between">
              <span>Question {currentQuestion + 1} of {gameData.quiz.questions.length}</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Take your time</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{question.question}</h3>
          
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswers[question.id] === index;
              const isCorrect = index === question.answerIndex;
              const showResult = hasAnswered;

              return (
                <button
                  key={index}
                  onClick={() => !hasAnswered && handleQuizAnswer(question.id, index)}
                  disabled={hasAnswered}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-colors',
                    !hasAnswered && 'hover:border-blue-300 hover:bg-blue-50',
                    !hasAnswered && isSelected && 'border-blue-500 bg-blue-50',
                    showResult && isCorrect && 'border-green-500 bg-green-50 text-green-800',
                    showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50 text-red-800',
                    hasAnswered && 'cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-1">Explanation</h4>
              <p className="text-blue-700">{question.explanation}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {isLastQuestion ? (
              <button
                onClick={submitScore}
                disabled={!hasAnswered}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={!hasAnswered}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Complete Phase (handled by parent component)
  return null;
}
