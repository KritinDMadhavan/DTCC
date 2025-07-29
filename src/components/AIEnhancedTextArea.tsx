import React, { useState, useRef, useEffect } from "react";
import { Wand2, Sparkles, Copy, X, Send, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiRiskAssessmentService } from "../services/AIRiskAssessmentService";

interface AIEnhancedTextAreaProps {
  label: string;
  field: keyof any;
  placeholder: string;
  questionContext: string;
  validationContext?: string;
  onValueChange: (value: string) => void;
  value: string;
  rows?: number;
}

interface ChatMessage {
  type: "user" | "ai";
  content: string;
  timestamp: Date;
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
  const [canUndo, setCanUndo] = useState(false);
  const [previousValue, setPreviousValue] = useState("");
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingFromChat, setIsGeneratingFromChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentGeneratedText, setCurrentGeneratedText] = useState("");
  const textareaRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close popup if click is outside both textarea and popup
      const target = event.target as Node;
      const isInsideTextarea = textareaRef.current?.contains(target);
      const isInsidePopup = document
        .querySelector(".chat-popup")
        ?.contains(target);

      if (!isInsideTextarea && !isInsidePopup) {
        setShowChatPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleEnhance = async () => {
    if (!value.trim()) {
      setShowChatPopup(true);
      return;
    }

    setPreviousValue(value);
    setIsEnhancing(true);
    try {
      const enhancedContext = validationContext
        ? `${questionContext}\n\nVALIDATION REQUIREMENTS: ${validationContext}\n\nGenerate a comprehensive response based on the user's input.`
        : questionContext;

      const response = await aiRiskAssessmentService.enhanceAnswer({
        question: label,
        hints: enhancedContext,
        user_input: value,
        enhancement_style: "professional",
      });

      onValueChange(response.enhanced_text);
      setCanUndo(true);
    } catch (error) {
      console.error("Error enhancing text:", error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndo = () => {
    onValueChange(previousValue);
    setCanUndo(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { type: "user", content: userMessage, timestamp: new Date() },
    ]);
    setChatInput("");
    setIsGeneratingFromChat(true);

    try {
      const enhancedContext = validationContext
        ? `${questionContext}\n\nVALIDATION REQUIREMENTS: ${validationContext}\n\nUSER ADDITIONAL INFORMATION: ${userMessage}\n\nGenerate a comprehensive response based on the user's additional information.`
        : `${questionContext}\n\nUSER ADDITIONAL INFORMATION: ${userMessage}\n\nGenerate a comprehensive response based on the user's additional information.`;

      const response = await aiRiskAssessmentService.enhanceAnswer({
        question: label,
        hints: enhancedContext,
        user_input: userMessage,
        enhancement_style: "professional",
      });

      const aiResponse = response.enhanced_text;
      setCurrentGeneratedText(aiResponse);
      setChatMessages((prev) => [
        ...prev,
        { type: "ai", content: aiResponse, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error("Error generating from chat:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGeneratingFromChat(false);
    }
  };

  const handleGetSuggestions = async () => {
    setIsGeneratingFromChat(true);
    try {
      const enhancedContext = validationContext
        ? `${questionContext}\n\nREQUIRED INFORMATION: ${validationContext}\n\nProvide suggestions that help users include all the required information mentioned above.`
        : questionContext;

      const response = await aiRiskAssessmentService.getSuggestions({
        question: label,
        hints: enhancedContext,
        num_suggestions: 3,
      });

      const suggestionsText = response.suggestions.join("\n\n");
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: `Here are some suggestions:\n\n${suggestionsText}`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "Sorry, I couldn't generate suggestions. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGeneratingFromChat(false);
    }
  };

  const handleCloseChat = () => {
    setShowChatPopup(false);
    setChatInput("");
    setChatMessages([]);
    setCurrentGeneratedText("");
  };

  const handleCopyGeneratedText = async () => {
    if (currentGeneratedText) {
      try {
        await navigator.clipboard.writeText(currentGeneratedText);
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }
  };

  const handleUseGeneratedText = () => {
    if (currentGeneratedText) {
      onValueChange(currentGeneratedText);
      handleCloseChat();
    }
  };

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="relative" ref={textareaRef}>
        <motion.textarea
          whileFocus={{ scale: 1.01 }}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white/90 backdrop-blur-sm"
          rows={rows}
        />

        {/* AI Enhancement Controls */}
        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
          {/* Enhance Button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEnhance}
            disabled={isEnhancing}
            className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            title="Enhance with AI"
          >
            <Wand2 className={`w-4 h-4 ${isEnhancing ? "animate-spin" : ""}`} />
          </motion.button>
        </div>

        {/* Undo Button */}
        <AnimatePresence>
          {canUndo && (
            <motion.button
              initial={{ opacity: 0, x: 20, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndo}
              className="absolute bottom-3 left-3 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Undo
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Popup */}
      <AnimatePresence>
        {showChatPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100/50 w-full max-w-4xl h-[80vh] flex flex-col chat-popup overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center justify-between p-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Assistant
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseChat}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.div>

              {/* Chat Messages */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/30 to-white/30"
              >
                {chatMessages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center text-gray-500 py-12"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="mb-6 text-lg font-medium">
                      I can help you generate content for this question.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGetSuggestions}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Get Suggestions
                    </motion.button>
                  </motion.div>
                )}
                <AnimatePresence>
                  {chatMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                        delay: index * 0.1,
                      }}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-white text-gray-800 border border-gray-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                        <div
                          className={`text-xs mt-2 ${
                            message.type === "user"
                              ? "text-blue-100"
                              : "text-gray-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Input Area */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="p-6 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-white/30"
              >
                <form onSubmit={handleChatSubmit} className="flex space-x-3">
                  <motion.div
                    className="flex-1 relative"
                    whileFocus={{ scale: 1.02 }}
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full p-4 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                      disabled={isGeneratingFromChat}
                    />
                    {isGeneratingFromChat && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      >
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                      </motion.div>
                    )}
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!chatInput.trim() || isGeneratingFromChat}
                    className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
              </motion.div>

              {/* Action Buttons */}
              <AnimatePresence>
                {currentGeneratedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 border-t border-gray-100/50 bg-gradient-to-r from-green-50/30 to-blue-50/30"
                  >
                    <div className="flex space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyGeneratedText}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="font-medium">Copy</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUseGeneratedText}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Check className="w-4 h-4" />
                        <span className="font-medium">Use This Text</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIEnhancedTextArea;
