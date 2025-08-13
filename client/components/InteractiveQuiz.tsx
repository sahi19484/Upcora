import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle, Star, Trophy, Clock, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { MediaDisplay } from './MediaDisplay';

interface MediaContent {
  url: string;
  altText: string;
  description?: string;
}

interface QuizQuestion {
  id: string;
  type?: string;
  question: string;
  options?: string[];
  answerIndex?: number;
  items?: string[];
  categories?: string[];
  correctMapping?: Record<string, string>;
  explanation: string;
  mediaContent?: {
    image?: MediaContent;
    video?: MediaContent;
  };
  difficulty?: string;
  points?: number;
}

interface InteractiveQuizProps {
  questions: QuizQuestion[];
  theme: string;
  gameFormat?: string;
  onAnswerSubmit: (questionId: string, answer: any) => void;
  onComplete: () => void;
  currentQuestion: number;
  setCurrentQuestion: (index: number) => void;
  selectedAnswers: Record<string, any>;
}

interface DragDropItem {
  id: string;
  content: string;
  category?: string;
}

export function InteractiveQuiz({
  questions,
  theme,
  gameFormat = 'standard',
  onAnswerSubmit,
  onComplete,
  currentQuestion,
  setCurrentQuestion,
  selectedAnswers
}: InteractiveQuizProps) {
  const [draggedItem, setDraggedItem] = useState<DragDropItem | null>(null);
  const [dropZones, setDropZones] = useState<Record<string, string[]>>({});

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const hasAnswered = selectedAnswers[question.id] !== undefined;

  const initializeDragDrop = (question: QuizQuestion) => {
    if (question.type === 'drag-drop' && question.categories) {
      const zones: Record<string, string[]> = {};
      question.categories.forEach(category => {
        zones[category] = selectedAnswers[question.id]?.[category] || [];
      });
      setDropZones(zones);
    }
  };

  React.useEffect(() => {
    initializeDragDrop(question);
  }, [currentQuestion, question]);

  const handleDragStart = (item: DragDropItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newDropZones = { ...dropZones };
    
    // Remove item from its current category
    Object.keys(newDropZones).forEach(key => {
      newDropZones[key] = newDropZones[key].filter(item => item !== draggedItem.content);
    });
    
    // Add item to new category
    if (!newDropZones[categoryId]) newDropZones[categoryId] = [];
    newDropZones[categoryId].push(draggedItem.content);
    
    setDropZones(newDropZones);
    onAnswerSubmit(question.id, newDropZones);
    setDraggedItem(null);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return <Star className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'hard': return <Trophy className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const renderMultipleChoice = () => {
    if (!question.options) return null;

    return (
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswers[question.id] === index;
          const isCorrect = index === question.answerIndex;
          const showResult = hasAnswered;

          return (
            <button
              key={index}
              onClick={() => !hasAnswered && onAnswerSubmit(question.id, index)}
              disabled={hasAnswered}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-all duration-200',
                !hasAnswered && 'hover:border-blue-300 hover:bg-blue-50 hover:scale-[1.02]',
                !hasAnswered && isSelected && 'border-blue-500 bg-blue-50 scale-[1.02]',
                showResult && isCorrect && 'border-green-500 bg-green-50 text-green-800 scale-[1.02]',
                showResult && isSelected && !isCorrect && 'border-red-500 bg-red-50 text-red-800',
                hasAnswered && 'cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{option}</span>
                <div className="flex items-center space-x-2">
                  {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                  {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderDragDrop = () => {
    if (!question.items || !question.categories) return null;

    const unassignedItems = question.items.filter(item => 
      !Object.values(dropZones).flat().includes(item)
    );

    return (
      <div className="space-y-6">
        {/* Items to drag */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Available Items</h4>
          <div className="flex flex-wrap gap-2">
            {unassignedItems.map((item, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart({ id: `item-${index}`, content: item })}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Drop zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.categories.map((category, index) => (
            <div
              key={index}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, category)}
              className="min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
              <div className="space-y-2">
                {dropZones[category]?.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg border border-blue-200"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasAnswered && question.correctMapping && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Correct Answer:</h4>
            <div className="space-y-1 text-sm text-blue-700">
              {Object.entries(question.correctMapping).map(([item, category], index) => (
                <div key={index}>
                  <strong>{item}</strong> → {category}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">{theme}</h2>
            {question.difficulty && (
              <span className={cn(
                'px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1',
                getDifficultyColor(question.difficulty)
              )}>
                {getDifficultyIcon(question.difficulty)}
                <span className="capitalize">{question.difficulty}</span>
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Take your time</span>
              </div>
              {question.points && (
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>{question.points} points</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{question.question}</h3>
        
        {/* Media Content */}
        {question.mediaContent?.image && (
          <div className="mb-6">
            <MediaDisplay
              media={question.mediaContent.image}
              type="image"
              className="max-w-md mx-auto"
            />
          </div>
        )}
        
        {question.mediaContent?.video && (
          <div className="mb-6">
            <MediaDisplay
              media={question.mediaContent.video}
              type="video"
              className="max-w-lg mx-auto"
            />
          </div>
        )}

        {/* Question Type Rendering */}
        <div className="mb-6">
          {question.type === 'drag-drop' ? renderDragDrop() : renderMultipleChoice()}
        </div>

        {/* Explanation */}
        {hasAnswered && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-1">Explanation</h4>
            <p className="text-blue-700">{question.explanation}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          
          {isLastQuestion ? (
            <button
              onClick={onComplete}
              disabled={!hasAnswered}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Complete Quiz</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={!hasAnswered}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
