import React, { useState, useRef, useEffect } from "react";
import { Wand2, Sparkles, ChevronDown, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiRiskAssessmentService } from "../services/AIRiskAssessmentService";
import type {
  EnhanceAnswerResponse,
  GetSuggestionsResponse,
} from "../services/AIRiskAssessmentService";

interface AIEnhancedTextAreaProps {
  label: string;
  field: keyof any;
  placeholder: string;
  tip?: string;
  questionContext: string;
  onValueChange: (value: string) => void;
  value: string;
  rows?: number;
}

const AIEnhancedTextArea: React.FC<AIEnhancedTextAreaProps> = ({
  label,
  field,
  placeholder,
  tip,
  questionContext,
  onValueChange,
  value,
  rows = 4,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [enhancementStyle, setEnhancementStyle] = useState<
    "professional" | "technical" | "academic"
  >("professional");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [lastEnhancement, setLastEnhancement] = useState<string>("");
  const [canUndo, setCanUndo] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowStyleMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnhance = async () => {
    if (!value.trim()) return;

    setIsEnhancing(true);
    try {
      const response = await aiRiskAssessmentService.enhanceAnswer({
        question: label,
        hints: questionContext,
        user_input: value,
        enhancement_style: enhancementStyle,
      });

      setLastEnhancement(value);
      onValueChange(response.enhanced_text);
      setCanUndo(true);

      // Auto-hide undo option after 30 seconds
      setTimeout(() => setCanUndo(false), 30000);
    } catch (error) {
      console.error("Error enhancing text:", error);
      // You could show a toast notification here
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndo = () => {
    if (lastEnhancement) {
      onValueChange(lastEnhancement);
      setCanUndo(false);
    }
  };

  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const response = await aiRiskAssessmentService.getSuggestions({
        question: label,
        hints: questionContext,
        num_suggestions: 3,
      });

      setSuggestions(response.suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error getting suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onValueChange(suggestion);
    setShowSuggestions(false);
  };

  const handleCopySuggestion = async (suggestion: string) => {
    try {
      await navigator.clipboard.writeText(suggestion);
      // You could show a toast notification here
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {tip && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">{tip}</p>
        </div>
      )}

      <div className="relative" ref={textareaRef}>
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
          rows={rows}
        />

        {/* AI Enhancement Controls */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {/* Enhancement Style Menu */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="p-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              title="Enhancement Style"
            >
              {enhancementStyle.charAt(0).toUpperCase() +
                enhancementStyle.slice(1)}
              <ChevronDown className="w-3 h-3 inline ml-1" />
            </button>

            <AnimatePresence>
              {showStyleMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]"
                >
                  {(["professional", "technical", "academic"] as const).map(
                    (style) => (
                      <button
                        key={style}
                        onClick={() => {
                          setEnhancementStyle(style);
                          setShowStyleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          enhancementStyle === style
                            ? "bg-teal-50 text-teal-700"
                            : "text-gray-700"
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhance Button */}
          <button
            onClick={handleEnhance}
            disabled={isEnhancing || !value.trim()}
            className="p-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded transition-colors"
            title="Enhance with AI"
          >
            <Wand2 className={`w-4 h-4 ${isEnhancing ? "animate-spin" : ""}`} />
          </button>

          {/* Get Suggestions Button */}
          <button
            onClick={handleGetSuggestions}
            disabled={isLoadingSuggestions}
            className="p-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded transition-colors"
            title="Get AI Suggestions"
          >
            <Sparkles
              className={`w-4 h-4 ${
                isLoadingSuggestions ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        {/* Undo Button */}
        <AnimatePresence>
          {canUndo && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={handleUndo}
              className="absolute bottom-2 right-2 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
            >
              Undo
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto"
          >
            <div className="p-2 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-700">
                AI Suggestions
              </h4>
            </div>
            <div className="p-2 space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 border border-gray-100 rounded hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                  <div className="flex justify-end space-x-1">
                    <button
                      onClick={() => handleCopySuggestion(suggestion)}
                      className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs rounded transition-colors"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIEnhancedTextArea;
