import React, { useState, useRef, useEffect } from "react";
import { Wand2, Sparkles, Copy, X, Send } from "lucide-react";
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
  questionContext: string;
  validationContext?: string; // New: specific requirements for validation
  onValueChange: (value: string) => void;
  value: string;
  rows?: number;
}

const AIEnhancedTextArea: React.FC<AIEnhancedTextAreaProps> = ({
  label,
  field,
  placeholder,
  questionContext,
  validationContext,
  onValueChange,
  value,
  rows = 4,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [lastEnhancement, setLastEnhancement] = useState<string>("");
  const [canUndo, setCanUndo] = useState(false);
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingFromChat, setIsGeneratingFromChat] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEnhance = async () => {
    if (!value.trim()) {
      setShowChatPopup(true);
      return;
    }

    setIsEnhancing(true);
    try {
      // Create enhanced context with validation requirements
      const enhancedContext = validationContext
        ? `${questionContext}\n\nVALIDATION REQUIREMENTS: ${validationContext}\n\nIMPORTANT: If the user's response is vague or missing required information, ask them to provide the specific details mentioned in the validation requirements before enhancing.`
        : questionContext;

      const response = await aiRiskAssessmentService.enhanceAnswer({
        question: label,
        hints: enhancedContext,
        user_input: value,
        enhancement_style: "professional",
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
      // Create enhanced context with validation requirements for suggestions
      const enhancedContext = validationContext
        ? `${questionContext}\n\nREQUIRED INFORMATION: ${validationContext}\n\nProvide suggestions that help users include all the required information mentioned above.`
        : questionContext;

      const response = await aiRiskAssessmentService.getSuggestions({
        question: label,
        hints: enhancedContext,
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setIsGeneratingFromChat(true);
    try {
      const enhancedContext = validationContext
        ? `${questionContext}\n\nVALIDATION REQUIREMENTS: ${validationContext}\n\nUSER ADDITIONAL INFORMATION: ${chatInput}\n\nGenerate a comprehensive response based on the user's additional information.`
        : `${questionContext}\n\nUSER ADDITIONAL INFORMATION: ${chatInput}\n\nGenerate a comprehensive response based on the user's additional information.`;

      const response = await aiRiskAssessmentService.enhanceAnswer({
        question: label,
        hints: enhancedContext,
        user_input: chatInput,
        enhancement_style: "professional",
      });

      onValueChange(response.enhanced_text);
      setShowChatPopup(false);
      setChatInput("");
    } catch (error) {
      console.error("Error generating from chat:", error);
    } finally {
      setIsGeneratingFromChat(false);
    }
  };

  const handleCloseChat = () => {
    setShowChatPopup(false);
    setChatInput("");
  };

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative" ref={textareaRef}>
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
          rows={rows}
        />

        {/* AI Enhancement Controls */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-1">
          {/* Enhance Button */}
          <button
            onClick={handleEnhance}
            disabled={isEnhancing}
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
              className="absolute bottom-2 left-2 px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
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

      {/* Chat Popup for Empty Fields */}
      <AnimatePresence>
        {showChatPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCloseChat}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generate AI Text
                </h3>
                <button
                  onClick={handleCloseChat}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Question Context */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Question:</p>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                {validationContext && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs text-blue-700">
                      <strong>Required:</strong> {validationContext}
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provide additional information:
                  </label>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Tell me more about your AI system, requirements, context, etc..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                    rows={3}
                    disabled={isGeneratingFromChat}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseChat}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isGeneratingFromChat}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isGeneratingFromChat}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {isGeneratingFromChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIEnhancedTextArea;
