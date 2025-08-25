import React, { useState, useEffect } from 'react';
import { Upload, Brain, Gamepad2, Trophy, FileText, Zap, Play, Pause, RotateCcw, ChevronRight, Users, BookOpen, Target, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnimatedProcessDiagramProps {
  autoPlay?: boolean;
  className?: string;
}

interface ProcessStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  details: string[];
  outputElements: string[];
}

export function AnimatedProcessDiagram({ autoPlay = true, className }: AnimatedProcessDiagramProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showConnections, setShowConnections] = useState(false);
  const [showOutputs, setShowOutputs] = useState<number[]>([]);

  const processSteps: ProcessStep[] = [
    {
      id: 'upload',
      title: 'Document Upload',
      description: 'Multiple format support with instant content extraction',
      icon: <Upload className="w-8 h-8" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      details: [
        'PDF Documents',
        'Word Files (.docx)',
        'PowerPoint (.pptx)',
        'Text Files',
        'Web URLs'
      ],
      outputElements: ['Raw Content', 'Metadata', 'Structure Info']
    },
    {
      id: 'ai-processing',
      title: 'AI Analysis',
      description: 'Advanced content analysis and learning structure generation',
      icon: <Brain className="w-8 h-8" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      details: [
        'Content Extraction',
        'Key Concept Identification', 
        'Learning Objective Creation',
        'Difficulty Assessment',
        'Structure Mapping'
      ],
      outputElements: ['Learning Roadmap', 'Concept Maps', 'Question Bank']
    },
    {
      id: 'game-creation',
      title: 'Interactive Content',
      description: 'Dynamic game and simulation generation from analyzed content',
      icon: <Gamepad2 className="w-8 h-8" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      details: [
        'Roleplay Scenarios',
        'Interactive Quizzes',
        'Visual Diagrams',
        'Video Narratives',
        'Drag-Drop Activities'
      ],
      outputElements: ['Game Modules', 'Interactions', 'Assessments']
    },
    {
      id: 'gamification',
      title: 'Learning Experience',
      description: 'Complete gamified learning journey with progress tracking',
      icon: <Trophy className="w-8 h-8" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      details: [
        'XP & Level System',
        'Achievement Badges',
        'Progress Tracking',
        'Leaderboards',
        'Completion Certificates'
      ],
      outputElements: ['Learning Games', 'Progress Dashboard', 'Achievements']
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % processSteps.length;
        
        // Add completed step
        if (prev !== next && !completedSteps.includes(prev)) {
          setCompletedSteps(completed => [...completed, prev]);
        }
        
        // Show connections after first step
        if (next > 0 && !showConnections) {
          setShowConnections(true);
        }
        
        // Show outputs with delay
        setTimeout(() => {
          setShowOutputs(outputs => outputs.includes(next) ? outputs : [...outputs, next]);
        }, 1000);
        
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isPlaying, completedSteps, showConnections, processSteps.length]);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps(prev => [...prev, stepIndex]);
    }
    if (!showOutputs.includes(stepIndex)) {
      setShowOutputs(prev => [...prev, stepIndex]);
    }
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setShowConnections(false);
    setShowOutputs([]);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={cn('bg-white rounded-2xl shadow-2xl p-8', className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 How Upcora Transforms Learning
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Watch your documents transform into engaging, interactive learning experiences through our AI-powered process
        </p>
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={togglePlayPause}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={resetAnimation}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Process Flow */}
      <div className="relative">
        {/* Main Process Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
          {processSteps.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted = completedSteps.includes(index);
            const showOutput = showOutputs.includes(index);

            return (
              <div key={step.id} className="relative">
                {/* Connection Arrow */}
                {index < processSteps.length - 1 && (
                  <div className={cn(
                    'hidden lg:block absolute top-16 -right-4 z-10 transition-all duration-1000',
                    showConnections ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  )}>
                    <div className="flex items-center">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"></div>
                      <ChevronRight className="w-6 h-6 text-blue-500 animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Step Card */}
                <div
                  className={cn(
                    'relative cursor-pointer transition-all duration-500 transform',
                    isActive && 'scale-105 z-20',
                    isCompleted && !isActive && 'scale-100',
                    !isActive && !isCompleted && 'scale-95 opacity-75',
                    'hover:scale-105 hover:shadow-xl'
                  )}
                  onClick={() => handleStepClick(index)}
                >
                  <div className={cn(
                    'border-2 rounded-xl p-6 transition-all duration-500',
                    step.bgColor,
                    isActive && 'shadow-2xl ring-4 ring-blue-200',
                    isCompleted && 'shadow-lg border-green-300',
                    !isActive && !isCompleted && 'shadow-md'
                  )}>
                    {/* Step Number & Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                        isActive ? 'bg-white shadow-lg scale-110' : 'bg-white/70',
                        step.color
                      )}>
                        {step.icon}
                      </div>
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                        isCompleted ? 'bg-green-500 text-white scale-110' : 'bg-gray-200 text-gray-600',
                        isActive && !isCompleted && 'bg-blue-500 text-white scale-110'
                      )}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                    </div>

                    {/* Step Content */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {step.description}
                    </p>

                    {/* Step Details */}
                    <div className={cn(
                      'transition-all duration-500 overflow-hidden',
                      isActive ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}>
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-800 mb-2">Process Details:</h4>
                        <ul className="space-y-1">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Output Elements */}
                  <div className={cn(
                    'mt-4 transition-all duration-700 transform',
                    showOutput ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  )}>
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-700 mb-2">Outputs:</div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {step.outputElements.map((output, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium transition-all duration-300',
                              'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800',
                              showOutput && 'animate-pulse'
                            )}
                            style={{ animationDelay: `${idx * 200}ms` }}
                          >
                            {output}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {processSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300',
                  currentStep === index && 'bg-blue-600 scale-125',
                  completedSteps.includes(index) && currentStep !== index && 'bg-green-500',
                  !completedSteps.includes(index) && currentStep !== index && 'bg-gray-300'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          Process Legend
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span className="text-sm text-gray-700">Active Step</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-700">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-700">Process Flow</span>
          </div>
        </div>
      </div>

      {/* Accessibility Text */}
      <div className="sr-only">
        <p>
          Animated diagram showing the Upcora learning transformation process:
          Step 1 - Document Upload with support for multiple formats,
          Step 2 - AI Analysis for content extraction and structure mapping,
          Step 3 - Interactive Content generation including games and simulations,
          Step 4 - Gamified Learning Experience with progress tracking and achievements.
          Use the play/pause controls to control the animation, or click on individual steps to explore details.
        </p>
      </div>
    </div>
  );
}
