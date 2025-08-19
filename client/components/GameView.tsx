import React, { useState, useEffect } from "react";
import {
  Clock,
  Star,
  Trophy,
  ArrowRight,
  CheckCircle,
  XCircle,
  Play,
  Award,
  Target,
  Zap,
  BookOpen,
  Eye,
  Film,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  MediaDisplay,
  MediaGallery,
  ProgressVisualization,
} from "./MediaDisplay";
import { InteractiveQuiz } from "./InteractiveQuiz";
import { LearningRoadmap } from "./LearningRoadmap";
import { VisualDiagrams } from "./VisualDiagrams";
import { GamifiedVideo } from "./GamifiedVideo";

interface MediaContent {
  url: string;
  altText: string;
  description?: string;
  searchTerms?: string[];
}

interface GameData {
  title: string;
  summary: string;
  totalEstimatedTime?: string;

  // Learning Roadmap
  roadmap?: Array<{
    module: string;
    moduleDescription: string;
    estimatedTime: string;
    lessons: Array<{
      title: string;
      summary: string;
      estimatedTime: string;
      difficultyLevel: string;
      learningObjectives: string[];
      keyTopics: string[];
    }>;
  }>;

  // Visual Diagrams
  diagrams?: Array<{
    topic: string;
    type: string;
    description: string;
    diagramCode: string;
    altText: string;
  }>;

  // Gamified Video
  video?: {
    title: string;
    visualStyle: string;
    totalDuration: string;
    scenes: Array<{
      sceneNumber: number;
      duration: string;
      narration: string;
      visuals: string;
      characters: string[];
      environment: string;
      transitions: string;
    }>;
  };

  // Legacy fields for backward compatibility
  keyTopics?: string[];
  visualConcepts?: string[];
  learningObjectives?: string[];
  mediaContent?: {
    headerImage?: MediaContent & { purpose: string };
    conceptImages?: Array<
      MediaContent & { concept: string; placement: string }
    >;
    videos?: Array<MediaContent & { topic: string; placement: string }>;
  };
  roleplay?: {
    scenario: string;
    backgroundImage?: MediaContent;
    steps: Array<{
      id: string;
      text: string;
      mediaContent?: {
        image?: MediaContent;
        video?: MediaContent;
      };
      choices: Array<{
        id: string;
        label: string;
        feedback: string;
        nextStep: string | null;
        points?: number;
      }>;
    }>;
  };

  // Enhanced Quiz
  quiz: {
    theme: string;
    description?: string;
    totalQuestions?: number;
    gameFormat?: string;
    questions: Array<{
      id: string;
      type?: string;
      question: string;
      options?: string[];
      answerIndex?: number;
      correctAnswer?: string;
      correctIndex?: number;
      correctOrder?: number[];
      items?: string[];
      categories?: string[];
      correctMapping?: Record<string, string>;
      explanation?: string;
      feedback?: {
        correct: string;
        incorrect: string;
      };
      mediaContent?: {
        image?: MediaContent;
        video?: MediaContent;
      };
      difficulty?: string;
      points?: number;
    }>;
  };

  // Enhanced Gamification
  gamification?: {
    achievements?: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      condition: string;
    }>;
    progressMilestones?: string[];
    bonusChallenges?: Array<{
      title: string;
      description: string;
      points: number;
      type?: string;
    }>;
  };
}

interface GameViewProps {
  gameId: string;
  onComplete: (score: number, xpEarned: number, badges: string[]) => void;
}

export function GameView({ gameId, onComplete }: GameViewProps) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<
    | "intro"
    | "roadmap"
    | "diagrams"
    | "video"
    | "roleplay"
    | "quiz"
    | "complete"
  >("intro");
  const [currentStep, setCurrentStep] = useState<string>("step1");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentDiagram, setCurrentDiagram] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>(
    {},
  );
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleplayScore, setRoleplayScore] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      console.log("Fetching game data for gameId:", gameId);
      const response = await fetch(`/api/games/${gameId}`);
      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        setError(
          `Failed to load game: ${response.status} ${response.statusText}`,
        );
        return;
      }

      const data = await response.json();
      console.log("Game data received:", data);

      if (data.gameData) {
        setGameData(data.gameData);
        setStartTime(new Date());
      } else {
        setError("Invalid game data received");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError(
        `Network error while loading game: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleplayChoice = (choice: any) => {
    setShowFeedback(choice.feedback);

    // Add points from roleplay choices
    if (choice.points) {
      setRoleplayScore((prev) => prev + choice.points);
    }

    setTimeout(() => {
      setShowFeedback(null);
      if (choice.nextStep) {
        setCurrentStep(choice.nextStep);
      } else {
        setCurrentPhase("quiz");
      }
    }, 4000); // Slightly longer to read enhanced feedback
  };

  const handleQuizAnswer = (questionId: string, answer: any) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const calculateScore = () => {
    if (!gameData) return { score: 0, maxScore: 0, correctAnswers: 0 };

    let correctAnswers = 0;
    let totalScore = 0;
    let maxScore = 0;

    gameData.quiz.questions.forEach((question) => {
      const userAnswer = selectedAnswers[question.id];
      const questionPoints = question.points || 10;
      maxScore += questionPoints;

      let isCorrect = false;

      if (question.type === "drag-drop" && question.correctMapping) {
        // Check drag-drop answers
        const correctMappings = Object.keys(question.correctMapping).length;
        let correctUserMappings = 0;

        if (userAnswer && typeof userAnswer === "object") {
          Object.entries(question.correctMapping).forEach(
            ([item, correctCategory]) => {
              Object.entries(userAnswer).forEach(([category, items]) => {
                if (
                  category === correctCategory &&
                  Array.isArray(items) &&
                  items.includes(item)
                ) {
                  correctUserMappings++;
                }
              });
            },
          );
        }

        if (correctUserMappings === correctMappings) {
          isCorrect = true;
          correctAnswers++;
          totalScore += questionPoints;
        } else {
          // Partial credit for drag-drop
          totalScore += Math.floor(
            (correctUserMappings / correctMappings) * questionPoints,
          );
        }
      } else {
        // Standard multiple choice
        if (userAnswer === question.answerIndex) {
          isCorrect = true;
          correctAnswers++;
          totalScore += questionPoints;
        }
      }
    });

    return {
      score: totalScore,
      maxScore,
      correctAnswers,
    };
  };

  const submitScore = async () => {
    if (!gameData || !startTime) return;

    const { score, maxScore, correctAnswers } = calculateScore();
    const timeSpent = Math.floor((Date.now() - startTime.getTime()) / 1000);

    try {
      const response = await fetch(`/api/games/${gameId}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          maxScore,
          timeSpent,
          correctAnswers,
          totalQuestions: gameData.quiz.questions.length,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onComplete(score, data.xpEarned, data.badges);
        setCurrentPhase("complete");
      } else {
        setError(data.error || "Failed to submit score");
      }
    } catch (error) {
      setError("Network error while submitting score");
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Game
        </h2>
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
  if (currentPhase === "intro") {
    const hasRoadmap = gameData.roadmap && gameData.roadmap.length > 0;
    const hasDiagrams = gameData.diagrams && gameData.diagrams.length > 0;
    const hasVideo =
      gameData.video &&
      gameData.video.scenes &&
      gameData.video.scenes.length > 0;
    const nextPhase = hasRoadmap
      ? "roadmap"
      : hasDiagrams
        ? "diagrams"
        : hasVideo
          ? "video"
          : "quiz";

    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {gameData.title}
          </h1>
          <p className="text-xl text-gray-600 mb-6">{gameData.summary}</p>

          {gameData.totalEstimatedTime && (
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Total Time: {gameData.totalEstimatedTime}
              </span>
            </div>
          )}
        </div>

        {/* 4-Part Learning Journey Overview */}
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            🎓 Your Complete Learning Experience
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Part 1: Learning Roadmap */}
            {hasRoadmap && (
              <div className="bg-white rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-blue-900">
                    1. Learning Roadmap
                  </h3>
                  <p className="text-sm text-blue-700">
                    Structured modules and lessons with clear learning
                    objectives
                  </p>
                  <div className="text-xs text-blue-600">
                    {gameData.roadmap?.length} modules • Interactive lessons
                  </div>
                </div>
              </div>
            )}

            {/* Part 2: Visual Diagrams */}
            {hasDiagrams && (
              <div className="bg-white rounded-lg p-6 border-2 border-green-200 hover:border-green-400 transition-colors">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-900">
                    2. Visual Diagrams
                  </h3>
                  <p className="text-sm text-green-700">
                    Interactive flowcharts, concept maps, and process diagrams
                  </p>
                  <div className="text-xs text-green-600">
                    {gameData.diagrams?.length} diagrams • Visual learning
                  </div>
                </div>
              </div>
            )}

            {/* Part 3: Learning Video */}
            {hasVideo && (
              <div className="bg-white rounded-lg p-6 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                    <Film className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-900">
                    3. Gamified Video
                  </h3>
                  <p className="text-sm text-purple-700">
                    Animated storytelling with characters and engaging
                    narratives
                  </p>
                  <div className="text-xs text-purple-600">
                    {gameData.video?.scenes?.length} scenes •{" "}
                    {gameData.video?.totalDuration}
                  </div>
                </div>
              </div>
            )}

            {/* Part 4: Quiz Game */}
            <div className="bg-white rounded-lg p-6 border-2 border-pink-200 hover:border-pink-400 transition-colors">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-pink-900">
                  4. Treasure Hunt Quiz
                </h3>
                <p className="text-sm text-pink-700">
                  Gamified assessment with themed challenges and rewards
                </p>
                <div className="text-xs text-pink-600">
                  {gameData.quiz.totalQuestions ||
                    gameData.quiz.questions.length}{" "}
                  questions • {gameData.quiz.theme}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Path Preview */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Learning Overview */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              What You'll Learn
            </h3>
            {gameData.roadmap && gameData.roadmap.length > 0 ? (
              <div className="space-y-3">
                {gameData.roadmap.slice(0, 2).map((module, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">
                      {module.module}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {module.moduleDescription}
                    </p>
                    <div className="text-xs text-blue-600 mt-1">
                      {module.lessons.length} lessons • {module.estimatedTime}
                    </div>
                  </div>
                ))}
                {gameData.roadmap.length > 2 && (
                  <p className="text-sm text-gray-500 italic">
                    ...and {gameData.roadmap.length - 2} more modules
                  </p>
                )}
              </div>
            ) : gameData.learningObjectives ? (
              <ul className="space-y-2">
                {gameData.learningObjectives
                  .slice(0, 3)
                  .map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Star className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>

          {/* Achievements Preview */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="w-6 h-6 mr-2 text-purple-600" />
              Achievements to Unlock
            </h3>
            {gameData.gamification?.achievements && (
              <div className="space-y-3">
                {gameData.gamification.achievements
                  .slice(0, 3)
                  .map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        {achievement.icon === "trophy" && (
                          <Trophy className="w-5 h-5 text-purple-600" />
                        )}
                        {achievement.icon === "map" && (
                          <BookOpen className="w-5 h-5 text-purple-600" />
                        )}
                        {achievement.icon === "eye" && (
                          <Eye className="w-5 h-5 text-purple-600" />
                        )}
                        {achievement.icon === "play" && (
                          <Play className="w-5 h-5 text-purple-600" />
                        )}
                        {achievement.icon === "crown" && (
                          <Award className="w-5 h-5 text-purple-600" />
                        )}
                        {achievement.icon === "zap" && (
                          <Zap className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={() => setCurrentPhase(nextPhase)}
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-xl"
          >
            <Play className="w-8 h-8 mr-3" />
            Begin Your Learning Adventure
            <ArrowRight className="w-8 h-8 ml-3" />
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Complete journey estimated at{" "}
            {gameData.totalEstimatedTime || "45-60 minutes"}
          </p>
        </div>
      </div>
    );
  }

  // Learning Roadmap Phase
  if (currentPhase === "roadmap" && gameData.roadmap) {
    return (
      <LearningRoadmap
        roadmap={gameData.roadmap}
        currentModule={currentModule}
        completedModules={completedModules}
        onModuleComplete={(moduleIndex) => {
          setCompletedModules((prev) => [...prev, moduleIndex]);
        }}
        onContinue={() => {
          const hasDiagrams = gameData.diagrams && gameData.diagrams.length > 0;
          const hasVideo =
            gameData.video &&
            gameData.video.scenes &&
            gameData.video.scenes.length > 0;
          const nextPhase = hasDiagrams
            ? "diagrams"
            : hasVideo
              ? "video"
              : "quiz";
          setCurrentPhase(nextPhase);
        }}
      />
    );
  }

  // Visual Diagrams Phase
  if (currentPhase === "diagrams" && gameData.diagrams) {
    return (
      <VisualDiagrams
        diagrams={gameData.diagrams}
        currentDiagram={currentDiagram}
        onDiagramChange={setCurrentDiagram}
        onContinue={() => {
          const hasVideo =
            gameData.video &&
            gameData.video.scenes &&
            gameData.video.scenes.length > 0;
          const nextPhase = hasVideo ? "video" : "quiz";
          setCurrentPhase(nextPhase);
        }}
      />
    );
  }

  // Gamified Video Phase
  if (currentPhase === "video" && gameData.video) {
    return (
      <GamifiedVideo
        video={gameData.video}
        currentScene={currentScene}
        onSceneChange={setCurrentScene}
        onContinue={() => setCurrentPhase("quiz")}
      />
    );
  }

  // Roleplay Phase
  if (currentPhase === "roleplay") {
    const step = gameData.roleplay.steps.find((s) => s.id === currentStep);
    const totalSteps = 3;

    if (!step) {
      setCurrentPhase("quiz");
      return null;
    }

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Visualization */}
        <ProgressVisualization
          currentStep={2}
          totalSteps={totalSteps}
          milestones={
            gameData.gamification?.progressMilestones || [
              "25%",
              "50%",
              "75%",
              "100%",
            ]
          }
          className="mb-6"
        />

        {/* Background Image */}
        {gameData.roleplay.backgroundImage && (
          <div className="mb-6">
            <MediaDisplay
              media={gameData.roleplay.backgroundImage}
              type="image"
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}

        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-2 flex items-center">
              <Target className="w-6 h-6 mr-2" />
              Roleplay Simulation
            </h2>
            <p className="opacity-90 text-lg leading-relaxed">
              {gameData.roleplay.scenario}
            </p>
            {roleplayScore > 0 && (
              <div className="mt-4 flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-3 py-2 w-fit">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">
                  Current Score: {roleplayScore} points
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-lg">
          {/* Step Media Content */}
          {step.mediaContent?.image && (
            <div className="mb-6">
              <MediaDisplay
                media={step.mediaContent.image}
                type="image"
                className="max-w-lg mx-auto"
              />
            </div>
          )}

          <p className="text-xl text-gray-900 mb-8 leading-relaxed">
            {step.text}
          </p>

          {!showFeedback ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Choose your approach:
              </h3>
              {step.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleRoleplayChoice(choice)}
                  className="w-full text-left p-6 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">{choice.label}</span>
                    {choice.points && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        +{choice.points} pts
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-800 mb-2 text-lg">
                    Expert Feedback
                  </h4>
                  <p className="text-green-700 text-lg leading-relaxed">
                    {showFeedback}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Quiz Phase
  if (currentPhase === "quiz") {
    return (
      <div>
        {/* Progress Visualization */}
        <div className="max-w-4xl mx-auto p-6 pb-0">
          <ProgressVisualization
            currentStep={3}
            totalSteps={3}
            milestones={
              gameData.gamification?.progressMilestones || [
                "25%",
                "50%",
                "75%",
                "100%",
              ]
            }
            className="mb-6"
          />
        </div>

        <InteractiveQuiz
          questions={gameData.quiz.questions}
          theme={gameData.quiz.theme}
          gameFormat={gameData.quiz.gameFormat}
          onAnswerSubmit={handleQuizAnswer}
          onComplete={submitScore}
          currentQuestion={currentQuestion}
          setCurrentQuestion={setCurrentQuestion}
          selectedAnswers={selectedAnswers}
        />
      </div>
    );
  }

  // Complete Phase (handled by parent component)
  return null;
}
