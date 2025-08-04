interface EnhanceAnswerRequest {
  question: string;
  hints: string;
  user_input: string;
  enhancement_style?: "professional" | "technical" | "academic";
}

interface EnhanceAnswerResponse {
  enhanced_text: string;
  original_text: string;
  enhancement_style: string;
  confidence: number;
  improvements: string[];
}

interface GetSuggestionsRequest {
  question: string;
  hints: string;
  num_suggestions?: number;
}

interface GetSuggestionsResponse {
  suggestions: string[];
  question: string;
  context: string;
  count: number;
}

interface AnalyzeComplianceRequest {
  question: string;
  answer: string;
}

interface AnalyzeComplianceResponse {
  analysis: string;
  question: string;
  answer: string;
  timestamp: string;
}

class AIRiskAssessmentService {
  private baseUrl: string;

  constructor() {
    // Use local backend URL since running locally
    this.baseUrl = "http://localhost:8000";
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: unknown
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Get authentication token
      const accessToken = localStorage.getItem("access_token");

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`AI Risk Assessment Service Error:`, error);
      throw error;
    }
  }

  async enhanceAnswer(
    request: EnhanceAnswerRequest
  ): Promise<EnhanceAnswerResponse> {
    return this.makeRequest<EnhanceAnswerResponse>(
      "/risk-assessment-ai/enhance-answer",
      "POST",
      request
    );
  }

  async getSuggestions(
    request: GetSuggestionsRequest
  ): Promise<GetSuggestionsResponse> {
    return this.makeRequest<GetSuggestionsResponse>(
      "/risk-assessment-ai/get-suggestions",
      "POST",
      request
    );
  }

  async analyzeCompliance(
    request: AnalyzeComplianceRequest
  ): Promise<AnalyzeComplianceResponse> {
    return this.makeRequest<AnalyzeComplianceResponse>(
      "/risk-assessment-ai/analyze-compliance",
      "POST",
      request
    );
  }

  async healthCheck(): Promise<{
    status: string;
    service: string;
    test_result: string;
  }> {
    return this.makeRequest<{
      status: string;
      service: string;
      test_result: string;
    }>("/risk-assessment-ai/health", "GET");
  }
}

export const aiRiskAssessmentService = new AIRiskAssessmentService();
export type {
  EnhanceAnswerRequest,
  EnhanceAnswerResponse,
  GetSuggestionsRequest,
  GetSuggestionsResponse,
  AnalyzeComplianceRequest,
  AnalyzeComplianceResponse,
};
