import React, { useState, useRef, useEffect } from "react";
import { Wand2, Sparkles, Copy, X, Send, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { aiRiskAssessmentService } from "../services/AIRiskAssessmentService";

interface AIEnhancedTextAreaProps {
  label: string;
  field: string;
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
  suggestions?: string[];
  choices?: { label: string; value: string }[];
}

const AIEnhancedTextArea: React.FC<AIEnhancedTextAreaProps> = ({
  label,
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
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close popup if click is outside both textarea and popup, and not on the enhance button
      const target = event.target as Node;
      const isInsideTextarea = textareaRef.current?.contains(target);
      const isInsidePopup = document
        .querySelector(".chat-popup")
        ?.contains(target);

      // Don't close if clicking on the enhance button or textarea
      const isEnhanceButton = (target as Element)?.closest?.(
        'button[title="Enhance with AI"]'
      );

      if (
        !isInsideTextarea &&
        !isInsidePopup &&
        !isEnhanceButton &&
        showChatPopup
      ) {
        // Only close after a delay to allow for intentional interactions
        setTimeout(() => {
          setShowChatPopup(false);
        }, 100);
      }
    };

    if (showChatPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showChatPopup]);

  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (chatContainerRef.current) {
          const lastMessage = chatMessages[chatMessages.length - 1];

          // If the last message is from AI, scroll to show the start of that message
          if (lastMessage.type === "ai") {
            // Find the last AI message element using the data attribute
            const lastMessageElement = chatContainerRef.current.querySelector(
              `[data-message-index="${chatMessages.length - 1}"]`
            );

            if (lastMessageElement) {
              // Get the position of the message relative to the container
              const messageTop = (lastMessageElement as HTMLElement).offsetTop;

              // Scroll to show the top of the AI message with some padding
              chatContainerRef.current.scrollTo({
                top: messageTop - 20, // 20px padding from top
                behavior: "smooth",
              });
            }
          } else {
            // For user messages, scroll to bottom as usual
            chatContainerRef.current.scrollTo({
              top: chatContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }
      }, 200);
    }
  }, [chatMessages]);

  // Initialize chat with AI greeting when popup opens
  const initializeChat = () => {
    if (!hasInitialized) {
      const initialMessage: ChatMessage = {
        type: "ai",
        content: `Hello! I'm ConveyAI, your personal assistant. I can help you with "${label}". 

Here's what you can do:
• Tell me about your current situation or implementation
• Ask me to explain what information is needed
• Request specific examples or templates
• Get suggestions for best practices

What would you like to know or discuss about this topic?`,
        timestamp: new Date(),
        suggestions: [
          "What information should I include here?",
          "Can you give me examples?",
          "Help me get started with this question",
          "What are the best practices for this?",
        ],
      };
      setChatMessages([initialMessage]);
      setHasInitialized(true);
    }
  };

  const handleEnhance = async () => {
    if (!value.trim()) {
      setShowChatPopup(true);
      initializeChat();
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
      // Create more conversational and helpful response
      const conversationalContext = `You are a friendly, knowledgeable AI assistant helping with risk assessment questions. 
      
Question context: ${label}
Additional context: ${questionContext}
${validationContext ? `Requirements: ${validationContext}` : ""}

User said: "${userMessage}"

Respond in a natural, conversational way. Be helpful and provide:
1. A friendly acknowledgment of their input
2. Specific, actionable guidance
3. Relevant examples if helpful
4. Follow-up suggestions or choices they can pick from

Keep your tone warm and professional, like you're talking to a colleague who needs help.`;

      const response = await aiRiskAssessmentService.enhanceAnswer({
        question: label,
        hints: conversationalContext,
        user_input: userMessage,
        enhancement_style: "professional",
      });

      // Generate contextual suggestions based on user input
      let suggestions: string[] = [];
      const lowerMessage = userMessage.toLowerCase();

      if (
        lowerMessage.includes("help") ||
        lowerMessage.includes("start") ||
        lowerMessage.includes("don't know")
      ) {
        suggestions = [
          "Can you give me a template to work with?",
          "What are some common examples?",
          "What specific details should I include?",
          "Are there any regulatory requirements I should know about?",
        ];
      } else if (
        lowerMessage.includes("example") ||
        lowerMessage.includes("template")
      ) {
        suggestions = [
          "Can you review what I have so far?",
          "Is this comprehensive enough?",
          "What else should I add?",
          "How can I make this more detailed?",
        ];
      } else if (
        lowerMessage.includes("complete") ||
        lowerMessage.includes("done") ||
        lowerMessage.includes("finished")
      ) {
        suggestions = [
          "Can you review and enhance this?",
          "Is there anything I'm missing?",
          "How can I improve this response?",
          "Does this meet compliance requirements?",
        ];
      } else {
        suggestions = [
          "Can you elaborate on this further?",
          "What specific examples would work here?",
          "How does this relate to compliance?",
          "What are the next steps?",
        ];
      }

      const aiResponse = response.enhanced_text;
      setCurrentGeneratedText(aiResponse);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: aiResponse,
          timestamp: new Date(),
          suggestions: suggestions,
        },
      ]);
    } catch (error) {
      console.error("Error generating from chat:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content:
            "I apologize, but I'm having trouble connecting right now. Could you try rephrasing your question? I'm here to help you with this risk assessment topic.",
          timestamp: new Date(),
          suggestions: [
            "Let me try a different approach",
            "Can you give me basic guidance?",
            "What should I focus on first?",
            "Help me understand the requirements",
          ],
        },
      ]);
    } finally {
      setIsGeneratingFromChat(false);
    }
  };

  const handleGetSuggestions = async () => {
    setIsGeneratingFromChat(true);
    try {
      const conversationalContext = `You are a helpful AI assistant providing guidance on: ${label}

Context: ${questionContext}
${validationContext ? `Requirements: ${validationContext}` : ""}

Provide helpful, conversational suggestions in a friendly tone. Start with a warm greeting and explain what kind of information would be valuable here. Give specific, actionable suggestions that help the user understand what to include.`;

      const response = await aiRiskAssessmentService.getSuggestions({
        question: label,
        hints: conversationalContext,
        num_suggestions: 4,
      });

      const friendlyResponse = `Great! I'd be happy to help you with this. Here are some specific suggestions for what you might want to include:

${response.suggestions
  .map((suggestion, index) => `${index + 1}. ${suggestion}`)
  .join("\n\n")}

Feel free to ask me about any of these points, or let me know if you'd like me to elaborate on something specific!`;

      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: friendlyResponse,
          timestamp: new Date(),
          suggestions: [
            "Can you give me a template for this?",
            "What's the most important point to focus on?",
            "How detailed should my response be?",
            "Are there any common mistakes to avoid?",
          ],
        },
      ]);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content:
            "I'd love to help you with suggestions, but I'm having a connection issue right now. Let me know what specific aspect you'd like guidance on, and I'll do my best to help!",
          timestamp: new Date(),
          suggestions: [
            "What should I focus on first?",
            "Can you explain the requirements?",
            "Help me understand what's needed",
            "Give me some examples to work with",
          ],
        },
      ]);
    } finally {
      setIsGeneratingFromChat(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
  };

  const handleCloseChat = () => {
    setShowChatPopup(false);
    setChatInput("");
    setChatMessages([]);
    setCurrentGeneratedText("");
    setHasInitialized(false);
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
            initial={{ opacity: 0, x: 400, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 400, scale: 0.9 }}
            transition={{
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col chat-popup overflow-hidden z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex items-center justify-between p-4 border-b border-gray-200 bg-white"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    ConveyAI
                  </h3>
                  <p className="text-sm text-green-500 font-medium">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseChat}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>

            {/* Chat Messages */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/30 to-white/30 scroll-smooth"
            >
              {chatMessages.length === 0 && !hasInitialized && (
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
                    onClick={() => {
                      initializeChat();
                      handleGetSuggestions();
                    }}
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
                    data-message-index={index}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                      delay: index * 0.1,
                    }}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        message.type === "ai" ? "space-y-3" : ""
                      }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className={`rounded-2xl p-4 shadow-sm ${
                          message.type === "user"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto"
                            : "bg-white text-gray-800 border border-gray-100"
                        }`}
                      >
                        {message.type === "ai" && (
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              ConveyAI
                            </span>
                          </div>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>
                        <div
                          className={`text-xs mt-3 ${
                            message.type === "user"
                              ? "text-blue-100"
                              : "text-gray-400"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </motion.div>

                      {/* Suggestion buttons for AI messages */}
                      {message.type === "ai" &&
                        message.suggestions &&
                        message.suggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="flex flex-wrap gap-2"
                          >
                            {message.suggestions.map(
                              (suggestion, suggestionIndex) => (
                                <motion.button
                                  key={suggestionIndex}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    handleSuggestionClick(suggestion)
                                  }
                                  className="px-3 py-2 text-sm bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-100 hover:to-purple-100 text-gray-700 hover:text-blue-700 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  {suggestion}
                                </motion.button>
                              )
                            )}
                          </motion.div>
                        )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Input Area */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="p-6 border-t border-gray-100/50 bg-white/50 backdrop-blur-sm"
            >
              <form onSubmit={handleChatSubmit} className="relative">
                <motion.div className="relative" whileFocus={{ scale: 1.01 }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Message ConveyAI..."
                    className="w-full p-4 pr-16 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200 text-gray-800 placeholder-gray-500"
                    disabled={isGeneratingFromChat}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    {isGeneratingFromChat ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center space-x-2 px-3 py-2"
                      >
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        <span className="text-sm text-gray-500">
                          Thinking...
                        </span>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="submit"
                        disabled={!chatInput.trim()}
                        className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </form>

              {/* Footer text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="text-xs text-gray-400 text-center mt-3"
              >
                ConveyAI can make mistakes. Consider checking important
                information.
              </motion.p>
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIEnhancedTextArea;
