import React, { useState } from "react";
import { Button } from "./ui/button";
import { aiRiskAssessmentService } from "../services/AIRiskAssessmentService";

const AITestComponent: React.FC = () => {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testEnhancement = async () => {
    setIsLoading(true);
    try {
      const result = await aiRiskAssessmentService.enhanceAnswer({
        question: "Describe your AI system's purpose and functionality",
        hints: "Focus on technical details and compliance aspects",
        user_input: "Our AI helps with customer service by answering questions",
        enhancement_style: "professional",
      });

      setTestResult(`Enhanced: ${result.enhanced_text}`);
    } catch (error) {
      setTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await aiRiskAssessmentService.getSuggestions({
        question: "What security measures are in place for your AI system?",
        hints: "Consider technical, organizational, and compliance aspects",
        num_suggestions: 2,
      });

      setTestResult(`Suggestions: ${result.suggestions.join(" | ")}`);
    } catch (error) {
      setTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testHealth = async () => {
    setIsLoading(true);
    try {
      const result = await aiRiskAssessmentService.healthCheck();
      setTestResult(`Health: ${JSON.stringify(result)}`);
    } catch (error) {
      setTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">AI Risk Assessment Test</h3>

      <div className="space-y-2 mb-4">
        <Button
          onClick={testHealth}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? "Testing..." : "Test Health Check"}
        </Button>

        <Button
          onClick={testEnhancement}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? "Testing..." : "Test Text Enhancement"}
        </Button>

        <Button
          onClick={testSuggestions}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {isLoading ? "Testing..." : "Test Suggestions"}
        </Button>
      </div>

      {testResult && (
        <div className="p-3 bg-white border rounded">
          <h4 className="font-medium mb-2">Test Result:</h4>
          <p className="text-sm text-gray-700">{testResult}</p>
        </div>
      )}
    </div>
  );
};

export default AITestComponent;
