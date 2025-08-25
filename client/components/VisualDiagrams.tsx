import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  FileText,
  GitBranch,
  Workflow,
} from "lucide-react";
import { cn } from "../lib/utils";
import mermaid from "mermaid";

interface Diagram {
  topic: string;
  type: string;
  description: string;
  diagramCode: string;
  altText: string;
}

interface VisualDiagramsProps {
  diagrams: Diagram[];
  currentDiagram: number;
  onDiagramChange: (index: number) => void;
  onContinue: () => void;
}

export function VisualDiagrams({
  diagrams,
  currentDiagram,
  onDiagramChange,
  onContinue,
}: VisualDiagramsProps) {
  const [viewedDiagrams, setViewedDiagrams] = useState<Set<number>>(
    new Set([0]),
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setViewedDiagrams((prev) => new Set([...prev, currentDiagram]));
  }, [currentDiagram]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "flowchart":
        return <Workflow className="w-5 h-5" />;
      case "concept-map":
        return <GitBranch className="w-5 h-5" />;
      case "process-diagram":
        return <FileText className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "flowchart":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "concept-map":
        return "bg-green-100 text-green-800 border-green-200";
      case "process-diagram":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Initialize mermaid once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      securityLevel: "loose",
      fontFamily: "Inter, sans-serif",
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      sequence: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
    });
  }, []);

  const MermaidDiagram = ({ code, id }: { code: string; id: string }) => {
    const diagramRef = useRef<HTMLDivElement>(null);
    const [diagramSvg, setDiagramSvg] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
      const renderDiagram = async () => {
        if (!diagramRef.current || !code) return;

        setIsLoading(true);
        setError("");

        try {
          // Clear previous content
          diagramRef.current.innerHTML = "";

          // Generate unique ID for this diagram
          const diagramId = `mermaid-${id}-${Date.now()}`;

          // Render the diagram
          const { svg } = await mermaid.render(diagramId, code);
          setDiagramSvg(svg);
          setIsLoading(false);
        } catch (err) {
          console.error("Mermaid rendering error:", err);
          setError("Failed to render diagram");
          setIsLoading(false);
        }
      };

      renderDiagram();
    }, [code, id]);

    if (error) {
      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h3 className="text-xl font-semibold text-red-800">Diagram Error</h3>
            <p className="text-red-600">{error}</p>
            <div className="bg-red-100 rounded-lg p-4 max-w-lg">
              <p className="text-sm text-red-700 mb-2">Original Code:</p>
              <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
                {code}
              </pre>
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin text-6xl">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-800">Loading Diagram...</h3>
            <p className="text-gray-600">Rendering interactive visualization</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 min-h-[400px] overflow-auto">
        <div
          ref={diagramRef}
          className="mermaid-diagram flex justify-center items-center"
          dangerouslySetInnerHTML={{ __html: diagramSvg }}
        />
      </div>
    );
  };

  const currentDiagramData = diagrams[currentDiagram];
  const allDiagramsViewed = viewedDiagrams.size === diagrams.length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎨 Visual Learning Diagrams
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Explore key concepts through interactive visual representations
        </p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {diagrams.map((_, index) => (
            <button
              key={index}
              onClick={() => onDiagramChange(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                index === currentDiagram && "bg-blue-600 scale-125",
                index !== currentDiagram &&
                  viewedDiagrams.has(index) &&
                  "bg-green-500",
                index !== currentDiagram &&
                  !viewedDiagrams.has(index) &&
                  "bg-gray-300",
              )}
            />
          ))}
        </div>
      </div>

      {/* Main Diagram View */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        {/* Diagram Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium border flex items-center space-x-2",
                  getTypeColor(currentDiagramData.type),
                )}
              >
                {getTypeIcon(currentDiagramData.type)}
                <span className="capitalize">
                  {currentDiagramData.type.replace("-", " ")}
                </span>
              </span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentDiagramData.topic}
                </h2>
                <p className="text-gray-600">
                  {currentDiagramData.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Diagram Content */}
        <div className="p-6">
          {renderMermaidDiagram(
            currentDiagramData.diagramCode,
            currentDiagramData.topic,
          )}
        </div>

        {/* Diagram Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">{currentDiagramData.altText}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => onDiagramChange(Math.max(0, currentDiagram - 1))}
          disabled={currentDiagram === 0}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-center">
          <span className="text-sm text-gray-500">
            Diagram {currentDiagram + 1} of {diagrams.length}
          </span>
        </div>

        <button
          onClick={() =>
            onDiagramChange(Math.min(diagrams.length - 1, currentDiagram + 1))
          }
          disabled={currentDiagram === diagrams.length - 1}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Diagram Grid Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {diagrams.map((diagram, index) => (
          <button
            key={index}
            onClick={() => onDiagramChange(index)}
            className={cn(
              "text-left p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md",
              index === currentDiagram && "border-blue-500 bg-blue-50",
              index !== currentDiagram &&
                viewedDiagrams.has(index) &&
                "border-green-300 bg-green-50",
              index !== currentDiagram &&
                !viewedDiagrams.has(index) &&
                "border-gray-200 hover:border-blue-300",
            )}
          >
            <div className="flex items-center space-x-2 mb-2">
              {getTypeIcon(diagram.type)}
              <span className="font-medium text-gray-900">{diagram.topic}</span>
            </div>
            <p className="text-sm text-gray-600">{diagram.description}</p>
            <div className="mt-2 flex items-center space-x-2">
              <span
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  getTypeColor(diagram.type),
                )}
              >
                {diagram.type.replace("-", " ")}
              </span>
              {viewedDiagrams.has(index) && (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Studied
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Continue Button */}
      {allDiagramsViewed && (
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Eye className="w-6 h-6 text-green-600" />
              <span className="text-lg font-semibold text-green-800">
                Visual Learning Complete!
              </span>
            </div>
            <p className="text-green-700">
              Great job! You've studied all the visual diagrams. Ready for the
              interactive video experience?
            </p>
          </div>
          <button
            onClick={onContinue}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <Eye className="w-6 h-6 mr-2" />
            Continue to Learning Video
            <ArrowRight className="w-6 h-6 ml-2" />
          </button>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-full overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {currentDiagramData.topic}
              </h3>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {renderMermaidDiagram(
                currentDiagramData.diagramCode,
                currentDiagramData.topic,
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
