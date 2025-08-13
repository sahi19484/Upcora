import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ArrowRight, Trophy, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_GAME = {
  title: "Time Management Fundamentals",
  summary: "Learn essential time management skills through interactive scenarios",
  learningObjectives: [
    "Understand the Eisenhower Matrix for task prioritization",
    "Apply time-blocking techniques to daily schedules",
    "Identify and overcome common time-wasting habits"
  ],
  roleplay: {
    scenario: "You're a college student with multiple deadlines approaching. You need to prioritize your tasks effectively.",
    steps: [
      {
        id: "step1",
        text: "It's Sunday evening. You have three assignments due this week: a major research paper (due Friday), a math problem set (due Tuesday), and a presentation (due Thursday). You also have a part-time job. What's your first priority?",
        choices: [
          {
            id: "a",
            label: "Start the research paper since it's worth the most points",
            feedback: "Good thinking! Starting with high-impact tasks is smart, but consider urgency too.",
            nextStep: "step2"
          },
          {
            id: "b", 
            label: "Do the math homework since it's due first",
            feedback: "Excellent! Tackling urgent tasks first prevents last-minute stress.",
            nextStep: "step2"
          },
          {
            id: "c",
            label: "Plan out the presentation since it requires the most preparation",
            feedback: "Strategic thinking! Planning complex tasks early is wise.",
            nextStep: "step2"
          }
        ]
      },
      {
        id: "step2",
        text: "You've been working for 2 hours and feel mentally drained. Your friends invite you to watch a movie. What do you do?",
        choices: [
          {
            id: "a",
            label: "Take a 30-minute break, then get back to work",
            feedback: "Perfect! Strategic breaks actually improve productivity and focus.",
            nextStep: null
          },
          {
            id: "b",
            label: "Go watch the movie - you deserve a longer break",
            feedback: "While breaks are important, longer breaks might derail your momentum. Consider shorter, more frequent breaks.",
            nextStep: null
          },
          {
            id: "c",
            label: "Keep working through the fatigue",
            feedback: "Persistence is valuable, but working while exhausted often leads to poor quality work. Strategic breaks are more effective.",
            nextStep: null
          }
        ]
      }
    ]
  },
  quiz: {
    theme: "Time Management Challenge",
    questions: [
      {
        id: "q1",
        question: "According to the Eisenhower Matrix, which quadrant should you focus on most?",
        options: [
          "Urgent and Important (Quadrant I)",
          "Important but Not Urgent (Quadrant II)", 
          "Urgent but Not Important (Quadrant III)",
          "Neither Urgent nor Important (Quadrant IV)"
        ],
        answerIndex: 1,
        explanation: "Quadrant II (Important but Not Urgent) is where you should spend most of your time. This includes planning, prevention, and skill development."
      },
      {
        id: "q2",
        question: "What is the most effective way to handle distractions while studying?",
        options: [
          "Ignore them completely",
          "Address them immediately",
          "Set specific times to check them",
          "Multitask to handle both"
        ],
        answerIndex: 2,
        explanation: "Setting specific times to check distractions (like emails or social media) helps maintain focus while ensuring you don't miss important communications."
      },
      {
        id: "q3",
        question: "Which time-blocking technique is most effective for large projects?",
        options: [
          "Schedule one large block for the entire project",
          "Break it into smaller daily blocks over time",
          "Work on it only when you feel motivated",
          "Do it all in the last few days"
        ],
        answerIndex: 1,
        explanation: "Breaking large projects into smaller daily blocks prevents overwhelm and ensures steady progress."
      }
    ]
  }
};

export function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [currentPhase, setCurrentPhase] = useState<'intro' | 'roleplay' | 'quiz' | 'complete'>('intro');
  const [currentStep, setCurrentStep] = useState<string>('step1');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  const resetDemo = () => {
    setCurrentPhase('intro');
    setCurrentStep('step1');
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowFeedback(null);
  };

  const handleClose = () => {
    resetDemo();
    onClose();
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
    let correct = 0;
    DEMO_GAME.quiz.questions.forEach(question => {
      if (selectedAnswers[question.id] === question.answerIndex) {
        correct++;
      }
    });
    return { correct, total: DEMO_GAME.quiz.questions.length };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Loomify Demo</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Intro Phase */}
          {currentPhase === 'intro' && (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{DEMO_GAME.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{DEMO_GAME.summary}</p>
              
              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-blue-900 mb-4">What you'll learn:</h2>
                <ul className="space-y-2 text-left">
                  {DEMO_GAME.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2 text-blue-800">
                      <Star className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setCurrentPhase('roleplay')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Demo Experience
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          )}

          {/* Roleplay Phase */}
          {currentPhase === 'roleplay' && (
            <div>
              <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-2">Interactive Scenario</h2>
                <p className="opacity-90">{DEMO_GAME.roleplay.scenario}</p>
              </div>

              {(() => {
                const step = DEMO_GAME.roleplay.steps.find(s => s.id === currentStep);
                if (!step) return null;

                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium text-green-800 mb-1">Feedback</h4>
                            <p className="text-green-700">{showFeedback}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Quiz Phase */}
          {currentPhase === 'quiz' && (
            <div>
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-2">{DEMO_GAME.quiz.theme}</h2>
                <div className="flex items-center justify-between">
                  <span>Question {currentQuestion + 1} of {DEMO_GAME.quiz.questions.length}</span>
                </div>
              </div>

              {(() => {
                const question = DEMO_GAME.quiz.questions[currentQuestion];
                const hasAnswered = selectedAnswers[question.id] !== undefined;
                const isLastQuestion = currentQuestion === DEMO_GAME.quiz.questions.length - 1;

                return (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                          onClick={() => setCurrentPhase('complete')}
                          disabled={!hasAnswered}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Complete Demo
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
                );
              })()}
            </div>
          )}

          {/* Complete Phase */}
          {currentPhase === 'complete' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Demo Complete! 🎉</h1>
              
              {(() => {
                const { correct, total } = calculateScore();
                const percentage = Math.round((correct / total) * 100);
                
                return (
                  <div>
                    <p className="text-lg text-gray-600 mb-6">
                      You scored {correct} out of {total} questions correctly ({percentage}%)
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-6 mb-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        What you just experienced:
                      </h3>
                      <ul className="text-blue-800 space-y-1">
                        <li>• Interactive roleplay scenario with branching choices</li>
                        <li>• Real-time feedback on your decisions</li>
                        <li>• Knowledge-testing quiz with explanations</li>
                        <li>• Immediate progress tracking and scoring</li>
                      </ul>
                    </div>

                    <p className="text-gray-600 mb-6">
                      This is just a sample! With QuizCraft, you can upload any study material 
                      and our AI will create personalized learning games just like this one.
                    </p>
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={resetDemo}
                  className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Try Demo Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started with QuizCraft
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
