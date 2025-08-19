import React, { useState } from "react";
import {
  Clock,
  BookOpen,
  Target,
  CheckCircle,
  ArrowRight,
  Star,
  Award,
  Users,
} from "lucide-react";
import { cn } from "../lib/utils";

interface LearningObjective {
  title: string;
  summary: string;
  estimatedTime: string;
  difficultyLevel: string;
  learningObjectives: string[];
  keyTopics: string[];
}

interface Module {
  module: string;
  moduleDescription: string;
  estimatedTime: string;
  lessons: LearningObjective[];
}

interface LearningRoadmapProps {
  roadmap: Module[];
  currentModule: number;
  completedModules: number[];
  onModuleComplete: (moduleIndex: number) => void;
  onContinue: () => void;
}

export function LearningRoadmap({
  roadmap,
  currentModule,
  completedModules,
  onModuleComplete,
  onContinue,
}: LearningRoadmapProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [studiedLessons, setStudiedLessons] = useState<Set<string>>(new Set());

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return <Star className="w-4 h-4" />;
      case "intermediate":
        return <Target className="w-4 h-4" />;
      case "advanced":
        return <Award className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const handleLessonStudy = (moduleIndex: number, lessonIndex: number) => {
    const lessonKey = `${moduleIndex}-${lessonIndex}`;
    setStudiedLessons((prev) => new Set([...prev, lessonKey]));

    // Check if all lessons in module are studied
    const module = roadmap[moduleIndex];
    const moduleStudiedCount = module.lessons.filter(
      (_, idx) =>
        studiedLessons.has(`${moduleIndex}-${idx}`) ||
        `${moduleIndex}-${idx}` === lessonKey,
    ).length;

    if (moduleStudiedCount === module.lessons.length) {
      onModuleComplete(moduleIndex);
    }
  };

  const allModulesCompleted = completedModules.length === roadmap.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📚 Learning Roadmap
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Follow this structured path to master all concepts step by step
        </p>

        {/* Progress Overview */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-blue-700">
              Overall Progress
            </span>
            <span className="text-sm text-blue-600">
              {completedModules.length} of {roadmap.length} modules completed
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${(completedModules.length / roadmap.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        {roadmap.map((module, moduleIndex) => {
          const isCompleted = completedModules.includes(moduleIndex);
          const isCurrent = moduleIndex === currentModule;
          const isExpanded = expandedModule === moduleIndex;

          return (
            <div
              key={moduleIndex}
              className={cn(
                "bg-white rounded-lg border-2 transition-all duration-200",
                isCompleted && "border-green-500 bg-green-50",
                isCurrent && !isCompleted && "border-blue-500 bg-blue-50",
                !isCurrent && !isCompleted && "border-gray-200",
              )}
            >
              {/* Module Header */}
              <div
                className="p-6 cursor-pointer"
                onClick={() =>
                  setExpandedModule(isExpanded ? null : moduleIndex)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        isCompleted && "bg-green-500 text-white",
                        isCurrent && !isCompleted && "bg-blue-500 text-white",
                        !isCurrent &&
                          !isCompleted &&
                          "bg-gray-200 text-gray-600",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="font-bold">{moduleIndex + 1}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {module.module}
                      </h3>
                      <p className="text-gray-600">
                        {module.moduleDescription}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{module.estimatedTime}</span>
                    </div>
                    <ArrowRight
                      className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Module Content */}
              {isExpanded && (
                <div className="px-6 pb-6">
                  <div className="grid gap-4">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const lessonKey = `${moduleIndex}-${lessonIndex}`;
                      const isStudied = studiedLessons.has(lessonKey);

                      return (
                        <div
                          key={lessonIndex}
                          className={cn(
                            "border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md",
                            isStudied
                              ? "border-green-300 bg-green-50"
                              : "border-gray-200 hover:border-blue-300",
                          )}
                          onClick={() =>
                            handleLessonStudy(moduleIndex, lessonIndex)
                          }
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900">
                                  {lesson.title}
                                </h4>
                                {isStudied && (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mb-3">
                                {lesson.summary}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <span
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1",
                                  getDifficultyColor(lesson.difficultyLevel),
                                )}
                              >
                                {getDifficultyIcon(lesson.difficultyLevel)}
                                <span>{lesson.difficultyLevel}</span>
                              </span>
                              <div className="flex items-center space-x-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                  {lesson.estimatedTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Learning Objectives */}
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-800 mb-2">
                              Learning Objectives:
                            </h5>
                            <ul className="space-y-1">
                              {lesson.learningObjectives.map(
                                (objective, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start space-x-2 text-sm text-gray-600"
                                  >
                                    <Target className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                    <span>{objective}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>

                          {/* Key Topics */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-800 mb-2">
                              Key Topics:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {lesson.keyTopics.map((topic, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      {allModulesCompleted && (
        <div className="text-center mt-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Award className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-green-800">
                Roadmap Complete!
              </span>
            </div>
            <p className="text-green-700">
              Excellent progress! You've mastered all the foundational concepts.
              Ready for visual learning?
            </p>
          </div>
          <button
            onClick={onContinue}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <BookOpen className="w-6 h-6 mr-2" />
            Continue to Visual Diagrams
            <ArrowRight className="w-6 h-6 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}
