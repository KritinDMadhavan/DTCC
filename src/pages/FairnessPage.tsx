import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { FileUp as FileUpload2 } from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppLayout from "../components/AppLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// Define interface for new API response structure
interface FairnessApiResponse {
  project_id: number;
  model_name: string;
  model_version: string;
  timestamp: string;
  metrics: {
    data_info: {
      validation_dataset_used: boolean;
      validation_dataset_id: number;
      validation_samples: number;
      training_samples: number;
      feature_count: number;
      feature_names: string[];
      test_set_source: string;
    };
    sensitive_features: string[];
    metrics: {
      [feature: string]: {
        demographic_parity: { [key: string]: number };
        equal_opportunity: { [key: string]: number };
        equalized_odds: { [key: string]: {
          fpr: number;
          fnr: number;
          tpr: number;
        } };
        disparate_impact: { [key: string]: number };
        treatment_equality: { [key: string]: {
          fp: number;
          fn: number;
          ratio: number | null;
        } };
        statistical_parity: { [key: string]: number };
        statistical_tests: { [key: string]: {
          chi2_statistic: number | null;
          p_value: number | null;
          sample_size?: number;
          contingency_shape?: number[];
          error?: string;
        } };
        interpretation: {
          demographic_parity_threshold: number;
          equal_opportunity_threshold: number;
          disparate_impact_threshold: number;
          statistical_parity_threshold: number;
        };
      };
    };
    enhanced_analysis: {
      test_dataset_used: boolean;
      test_dataset_id: number;
      test_samples: number;
      cross_dataset_comparison: any;
      advanced_bias_detection: {
        significance_tests: {
          [feature: string]: {
            significant_violations: Array<{
              group: string;
              p_value: number;
              chi2_statistic: number;
              effect_size: string;
            }>;
            total_groups_tested: number;
            violation_rate: number;
          };
        };
      };
      intersectional_fairness: {
        features_analyzed: string[];
        group_metrics: any;
        total_intersectional_groups: number;
      };
      temporal_stability: {
        validation_test_consistency: string;
        stability_score: number;
      };
    };
    overall_assessment: {
      features_analyzed: number;
      problematic_features: string[];
      bias_detected: boolean;
      fairness_score: number;
      validation_dataset_reliability: boolean;
      test_dataset_used: boolean;
      test_dataset_id: number;
      datasets_available: {
        training: boolean;
        validation: boolean;
        test: boolean;
        total_datasets: number;
      };
      enhanced_analysis_performed: boolean;
      recommendation: string;
    };
    statistical_tests: any;
    interpretation: any;
  };
}

const UploadModal = () => (
  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-12 shadow-xl border border-gray-100">
    <div className="text-center max-w-2xl mx-auto">
      <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileUpload2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Upload Your Model for Fairness Analysis
      </h2>
      <p className="text-gray-600 mb-8">
        Upload your trained model to assess fairness metrics across different
        demographic groups.
      </p>
      <Button className="bg-primary text-white hover:bg-primary/90 px-8 py-6 text-lg shadow-lg">
        Upload Model
      </Button>
      <p className="mt-4 text-sm text-gray-500">Supported formats: .pkl</p>
    </div>
  </div>
);

const FairnessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fairnessAPIData, setFairnessAPIData] =
    useState<FairnessApiResponse | null>(null);

  // New state for selected model
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<{
    model_id: string;
    model_version: string;
    display_name: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingFairness, setLoadingFairness] = useState(false);

  // Function to fetch fairness data for a specific model
  const fetchFairnessData = async (modelId: string, modelVersion: string) => {
    setLoadingFairness(true);
    try {
        const accessToken = localStorage.getItem("access_token");
      
      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      console.log("🌐 Making API call to fairness endpoint");
      const response = await axios.get(
        `http://localhost:8000/ml/fairness/${id}/${modelId}/${modelVersion}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Fairness API Response:", response.data);
      setFairnessAPIData(response.data);
      setHasAnalysis(true);
    } catch (error) {
      console.error("Error fetching fairness data:", error);
      console.error("Request details:", {
        url: `http://localhost:8000/ml/fairness/${id}/${modelId}/${modelVersion}`,
        projectId: id,
        modelId,
        modelVersion,
        hasToken: !!localStorage.getItem("access_token")
      });
      setHasAnalysis(false);
    } finally {
      setLoadingFairness(false);
    }
  };

  // Model Selector Dropdown Component
  const ModelSelectorDropdown = () => (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center justify-between w-64 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        disabled={models.length === 0}
      >
        <span className="truncate">
          {selectedModel
            ? selectedModel.display_name
            : models.length > 0
            ? "Select a model..."
            : "No models available"}
        </span>
        <svg
          className="w-5 h-5 ml-2 -mr-1"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {dropdownOpen && models.length > 0 && (
        <div className="absolute right-0 z-10 w-64 mt-2 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1" role="menu">
            {models.map((model, index) => {
              const displayName = `Model ${model.model_id} v${model.model_version}`;
              return (
                <button
                  key={`${model.model_id}-${model.model_version}`}
                  onClick={() => {
                    const modelData = {
                      model_id: model.model_id,
                      model_version: model.model_version,
                      display_name: displayName,
                    };
                    setSelectedModel(modelData);
                    setDropdownOpen(false);
                    fetchFairnessData(model.model_id, model.model_version);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                    selectedModel?.model_id === model.model_id &&
                    selectedModel?.model_version === model.model_version
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-700"
                  }`}
                  role="menuitem"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{displayName}</span>
                    <span className="text-xs text-gray-500">
                      Dataset ID: {model.dataset_id}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    console.log("🚀 FairnessPage useEffect triggered with ID:", id);
    setLoading(true);
    
    // Fetch models from Supabase
    const fetchModels = async () => {
      try {
        const { data, error } = await supabase
          .from("modeldetails")
          .select("model_id, project_id, dataset_id, model_version")
          .eq("project_id", id);

        if (error) {
          throw error;
        }

        console.log("📊 Models fetched:", data);
        setModels(data || []);
        
        // Set hasAnalysis to true if we have models, but don't auto-fetch fairness data
        setHasAnalysis(data && data.length > 0);
      } catch (error) {
        console.error("Error fetching models:", error);
        setHasAnalysis(false);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [id]);

  // Helper functions for data processing and visualization
  const hasMetricData = (metrics: any) => {
    return metrics && (
      (metrics.demographic_parity && Object.keys(metrics.demographic_parity).length > 0) ||
      (metrics.equal_opportunity && Object.keys(metrics.equal_opportunity).length > 0) ||
      (metrics.disparate_impact && Object.keys(metrics.disparate_impact).length > 0) ||
      (metrics.statistical_parity && Object.keys(metrics.statistical_parity).length > 0) ||
      (metrics.equalized_odds && Object.keys(metrics.equalized_odds).length > 0) ||
      (metrics.treatment_equality && Object.keys(metrics.treatment_equality).length > 0)
    );
  };

  const processMetricDataForChart = (
    metricObj: { [key: string]: number } | {},
    metricName: string
  ) => {
    if (Object.keys(metricObj).length === 0) return [];

    return Object.entries(metricObj)
      .map(([threshold, value]) => ({
        threshold: parseFloat(threshold).toFixed(2),
        value: typeof value === "number" ? value : 0,
        metric: metricName,
      }))
      .sort((a, b) => parseFloat(a.threshold) - parseFloat(b.threshold));
  };

  const getMetricSummary = (metricObj: { [key: string]: number } | {}) => {
    if (Object.keys(metricObj).length === 0)
      return { avg: 0, min: 0, max: 0, count: 0 };

    const values = Object.values(metricObj).filter(
      (v) => typeof v === "number"
    ) as number[];
    if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 };

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  };

  const getMetricStatus = (
    summary: { avg: number; min: number; max: number; count: number },
    metricName: string,
    thresholds: any
  ): "good" | "warning" | "poor" => {
    if (!thresholds || summary.count === 0) return "good";

    const threshold = thresholds[`${metricName}_threshold`];
    if (!threshold) return "good";

    // Different metrics have different ideal ranges
    if (metricName === "disparate_impact") {
      if (summary.avg >= 0.8 && summary.avg <= 1.25) return "good";
      if (summary.avg >= 0.7 && summary.avg <= 1.5) return "warning";
      return "poor";
    } else {
      const absValue = Math.abs(summary.avg);
      if (absValue <= threshold) return "good";
      if (absValue <= threshold * 1.5) return "warning";
      return "poor";
    }
  };

  const getBiasStatusColor = (isProblematic: boolean) => {
    return isProblematic 
      ? "bg-red-100 text-red-800" 
      : "bg-green-100 text-green-800";
  };

  const getFairnessScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const content = (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-xl font-medium text-gray-600">Loading models...</div>
            </div>
          </div>
        ) : hasAnalysis ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Fairness Analysis
              </h1>
              <p className="text-gray-500 mt-1">
                Evaluating model fairness across demographic groups
              </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Model:
                </label>
                <ModelSelectorDropdown />
              </div>
            </div>

            {/* Loading state for fairness data */}
            {loadingFairness && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                  <span className="text-gray-600">Loading fairness analysis...</span>
                </div>
              </div>
            )}

            {/* Message when no model is selected */}
            {!selectedModel && !loadingFairness && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Select a Model</h3>
                <p className="text-blue-700">
                  Please select a model from the dropdown above to view its fairness analysis.
                </p>
              </div>
            )}

            {/* Fairness analysis content - only show when model is selected and not loading */}
            {selectedModel && !loadingFairness && fairnessAPIData && fairnessAPIData.metrics && (
              <>
                {/* Basic Data Display */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Fairness Analysis Results
                  </h2>
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {fairnessAPIData.metrics.overall_assessment.features_analyzed}
                      </div>
                      <div className="text-sm text-gray-600">Features Analyzed</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${fairnessAPIData.metrics.overall_assessment.bias_detected ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {fairnessAPIData.metrics.overall_assessment.bias_detected ? "Bias Detected" : "No Bias"}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Bias Status</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(fairnessAPIData.metrics.overall_assessment.fairness_score * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Fairness Score</div>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {fairnessAPIData.metrics.sensitive_features.length}
                      </div>
                      <div className="text-sm text-gray-600">Sensitive Features</div>
                    </div>
                  </div>

                  {/* Sensitive Features */}
                  <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Sensitive Features Analyzed</h3>
                    <div className="flex flex-wrap gap-2">
                      {fairnessAPIData.metrics.sensitive_features.map((feature: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Problematic Features */}
                  {fairnessAPIData.metrics.overall_assessment.problematic_features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-2">Problematic Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {fairnessAPIData.metrics.overall_assessment.problematic_features.map((feature: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Recommendation</h3>
                    <p className="text-blue-800 text-sm">
                      {fairnessAPIData.metrics.overall_assessment.recommendation}
                    </p>
                  </div>
                </div>

                {/* Enhanced Analysis Dashboard */}
                {fairnessAPIData.metrics.enhanced_analysis && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Enhanced Analysis Dashboard
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-900">
                          {fairnessAPIData.metrics.enhanced_analysis.test_samples}
                        </div>
                        <div className="text-sm text-blue-700">Test Samples</div>
                        <div className="text-xs text-blue-600 mt-1">
                          Dataset ID: {fairnessAPIData.metrics.enhanced_analysis.test_dataset_id}
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                          {(fairnessAPIData.metrics.enhanced_analysis.temporal_stability.stability_score * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-green-700">Stability Score</div>
                        <div className="text-xs text-green-600 mt-1">
                          Status: {fairnessAPIData.metrics.enhanced_analysis.temporal_stability.validation_test_consistency}
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="text-2xl font-bold text-purple-900">
                          {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.total_intersectional_groups}
                        </div>
                        <div className="text-sm text-purple-700">Intersectional Groups</div>
                        <div className="text-xs text-purple-600 mt-1">
                          Features: {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.features_analyzed.join(", ")}
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-900">
                          {fairnessAPIData.metrics.overall_assessment.datasets_available.total_datasets}
                        </div>
                        <div className="text-sm text-orange-700">Datasets Available</div>
                        <div className="text-xs text-orange-600 mt-1">
                          Training, Validation, Test
                        </div>
                      </div>
                    </div>

                    {/* Dataset Status Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Training Dataset</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${fairnessAPIData.metrics.overall_assessment.datasets_available.training ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-600">
                            {fairnessAPIData.metrics.overall_assessment.datasets_available.training ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Validation Dataset</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${fairnessAPIData.metrics.overall_assessment.datasets_available.validation ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-600">
                            {fairnessAPIData.metrics.overall_assessment.datasets_available.validation ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Test Dataset</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${fairnessAPIData.metrics.overall_assessment.datasets_available.test ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-gray-600">
                            {fairnessAPIData.metrics.overall_assessment.datasets_available.test ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistical Significance Analysis */}
                {fairnessAPIData.metrics.enhanced_analysis?.advanced_bias_detection && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Advanced Bias Detection & Statistical Significance
                    </h2>
                    <div className="space-y-4">
                      {Object.entries(fairnessAPIData.metrics.enhanced_analysis.advanced_bias_detection.significance_tests).map(
                        ([feature, testResults]: [string, any]) => (
                          <div key={feature} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="text-lg font-medium text-gray-900 capitalize">
                                {feature.replace('_', ' ')}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  testResults.violation_rate > 0.7 ? 'bg-red-100 text-red-800' :
                                  testResults.violation_rate > 0.3 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {(testResults.violation_rate * 100).toFixed(0)}% Violation Rate
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Groups Tested:</span>
                                <span className="font-medium">{testResults.total_groups_tested}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Significant Violations:</span>
                                <span className="font-medium text-red-600">{testResults.significant_violations.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Violation Rate:</span>
                                <span className="font-medium">{(testResults.violation_rate * 100).toFixed(1)}%</span>
                              </div>
                            </div>

                            {testResults.significant_violations.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Significant Violations Details:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {testResults.significant_violations.slice(0, 6).map((violation: any, index: number) => (
                                    <div key={index} className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200">
                                      <div className="font-medium">{violation.group}</div>
                                      <div className="text-xs text-red-600">
                                        p-value: {violation.p_value.toExponential(2)} | 
                                        χ²: {violation.chi2_statistic.toFixed(2)} | 
                                        Effect: {violation.effect_size}
                                      </div>
                                    </div>
                                  ))}
                                  {testResults.significant_violations.length > 6 && (
                                    <div className="text-xs bg-gray-100 text-gray-600 p-2 rounded flex items-center justify-center">
                                      +{testResults.significant_violations.length - 6} more violations
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Cross-Dataset Consistency Analysis */}
                {fairnessAPIData.metrics.enhanced_analysis?.cross_dataset_comparison && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Cross-Dataset Consistency Analysis
                    </h2>
                    
                    {/* Validation vs Test Comparison */}
                    {fairnessAPIData.metrics.enhanced_analysis.cross_dataset_comparison.consistency_analysis && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Validation vs Test Dataset Consistency</h3>
                        <div className="space-y-4">
                          {Object.entries(fairnessAPIData.metrics.enhanced_analysis.cross_dataset_comparison.consistency_analysis).map(
                            ([feature, groups]: [string, any]) => (
                              <div key={feature} className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3 capitalize">
                                  {feature.replace('_', ' ')} Consistency
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {Object.entries(groups).map(([group, data]: [string, any]) => (
                                    <div key={group} className="bg-gray-50 p-3 rounded-lg">
                                      <div className="font-medium text-sm text-gray-900 mb-2">{group}</div>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Validation Rate:</span>
                                          <span className="font-medium">{(data.validation_selection_rate * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Test Rate:</span>
                                          <span className="font-medium">{(data.test_selection_rate * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Abs. Difference:</span>
                                          <span className={`font-medium ${data.absolute_difference > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(data.absolute_difference * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Rel. Difference:</span>
                                          <span className={`font-medium ${Math.abs(data.relative_difference) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(data.relative_difference * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Test vs Validation Fairness Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fairnessAPIData.metrics.enhanced_analysis.cross_dataset_comparison.validation_fairness && (
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-3">Validation Dataset Fairness</h4>
                          {Object.entries(fairnessAPIData.metrics.enhanced_analysis.cross_dataset_comparison.validation_fairness).map(
                            ([feature, groups]: [string, any]) => (
                              <div key={feature} className="mb-4">
                                <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">{feature}</h5>
                                <div className="space-y-2">
                                  {Object.entries(groups).map(([group, data]: [string, any]) => (
                                    <div key={group} className="flex justify-between text-xs">
                                      <span className="text-gray-600">{group}:</span>
                                      <div className="text-right">
                                        <div>Rate: {(data.selection_rate * 100).toFixed(1)}%</div>
                                        <div>Acc: {(data.accuracy * 100).toFixed(1)}%</div>
                                        <div className="text-gray-500">n={data.sample_size}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Test Dataset Fairness Summary</h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Test Dataset Used:</span>
                            <span className={`font-medium ${fairnessAPIData.metrics.enhanced_analysis.test_dataset_used ? 'text-green-600' : 'text-red-600'}`}>
                              {fairnessAPIData.metrics.enhanced_analysis.test_dataset_used ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Test Dataset ID:</span>
                            <span className="font-medium">{fairnessAPIData.metrics.enhanced_analysis.test_dataset_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Test Samples:</span>
                            <span className="font-medium">{fairnessAPIData.metrics.enhanced_analysis.test_samples}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stability Score:</span>
                            <span className={`font-medium ${fairnessAPIData.metrics.enhanced_analysis.temporal_stability.stability_score >= 0.7 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {(fairnessAPIData.metrics.enhanced_analysis.temporal_stability.stability_score * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Intersectional Fairness Analysis */}
                {fairnessAPIData.metrics.enhanced_analysis?.intersectional_fairness && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Intersectional Fairness Analysis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="col-span-1">
                        <h3 className="font-medium text-gray-900 mb-3">Analysis Overview</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Features Analyzed:</span>
                            <span className="font-medium">{fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.features_analyzed.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Intersectional Groups:</span>
                            <span className="font-medium">{fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.total_intersectional_groups}</span>
                          </div>
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Features Included:</h4>
                            <div className="flex flex-wrap gap-2">
                              {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.features_analyzed.map((feature: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <h3 className="font-medium text-gray-900 mb-3">Group Metrics Analysis</h3>
                        {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.group_metrics?.error ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <h4 className="text-sm font-medium text-yellow-800">Analysis Limitation</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                  {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.group_metrics.error}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-600 text-sm">
                              Intersectional analysis examines fairness across combinations of sensitive attributes 
                              (e.g., gender × age interactions) to detect compound biases that might not be visible 
                              when examining individual attributes separately.
                            </p>
                            {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.total_intersectional_groups > 1 && (
                              <div className="mt-3 p-3 bg-white rounded border">
                                <div className="text-sm font-medium text-gray-900">
                                  {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.total_intersectional_groups} intersectional groups identified
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Analysis covers interactions between {fairnessAPIData.metrics.enhanced_analysis.intersectional_fairness.features_analyzed.join(' and ')}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dataset Info */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Dataset Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {fairnessAPIData.metrics.data_info.validation_samples}
                      </div>
                      <div className="text-sm text-gray-600">Validation Samples</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {fairnessAPIData.metrics.data_info.training_samples}
                      </div>
                      <div className="text-sm text-gray-600">Training Samples</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">
                        {fairnessAPIData.metrics.data_info.feature_count}
                      </div>
                      <div className="text-sm text-gray-600">Total Features</div>
                    </div>
                  </div>
                </div>

                {/* Metrics Summary */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Fairness Metrics by Feature
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(fairnessAPIData.metrics.metrics).map(([feature, metrics]: [string, any]) => (
                      <div key={feature} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                          {feature.replace('_', ' ')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Demographic Parity Groups:</span>
                            <span className="ml-2 font-medium">
                              {Object.keys(metrics.demographic_parity || {}).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Equal Opportunity Groups:</span>
                            <span className="ml-2 font-medium">
                              {Object.keys(metrics.equal_opportunity || {}).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Disparate Impact Groups:</span>
                            <span className="ml-2 font-medium">
                              {Object.keys(metrics.disparate_impact || {}).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Statistical Tests:</span>
                            <span className="ml-2 font-medium">
                              {Object.keys(metrics.statistical_tests || {}).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Metrics Analysis */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Detailed Fairness Metrics Analysis
                  </h2>
                  <div className="space-y-6">
                    {Object.entries(fairnessAPIData.metrics.metrics).slice(0, 3).map(([feature, metrics]: [string, any]) => (
                      <div key={feature} className="border border-gray-300 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize bg-gray-50 p-3 rounded">
                          📊 {feature.replace('_', ' ')} Analysis
                        </h3>
                        
                        {/* Demographic Parity */}
                        {metrics.demographic_parity && Object.keys(metrics.demographic_parity).length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-800 mb-2">Demographic Parity</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(metrics.demographic_parity).map(([group, value]: [string, any]) => (
                                <div key={group} className="bg-blue-50 p-2 rounded text-xs border border-blue-200">
                                  <div className="font-medium text-blue-800">{group}</div>
                                  <div className="text-blue-600">{(value * 100).toFixed(1)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Equal Opportunity */}
                        {metrics.equal_opportunity && Object.keys(metrics.equal_opportunity).length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-800 mb-2">Equal Opportunity</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(metrics.equal_opportunity).map(([group, value]: [string, any]) => (
                                <div key={group} className="bg-green-50 p-2 rounded text-xs border border-green-200">
                                  <div className="font-medium text-green-800">{group}</div>
                                  <div className="text-green-600">{(value * 100).toFixed(1)}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Disparate Impact */}
                        {metrics.disparate_impact && Object.keys(metrics.disparate_impact).length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-800 mb-2">Disparate Impact</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.entries(metrics.disparate_impact).map(([group, value]: [string, any]) => (
                                <div key={group} className={`p-2 rounded text-xs border ${
                                  value >= 0.8 && value <= 1.25 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                                }`}>
                                  <div className={`font-medium ${value >= 0.8 && value <= 1.25 ? 'text-green-800' : 'text-red-800'}`}>
                                    {group}
                                  </div>
                                  <div className={`${value >= 0.8 && value <= 1.25 ? 'text-green-600' : 'text-red-600'}`}>
                                    {value.toFixed(3)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Statistical Tests */}
                        {metrics.statistical_tests && Object.keys(metrics.statistical_tests).length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-800 mb-2">Statistical Significance Tests</h4>
                            <div className="space-y-2">
                              {Object.entries(metrics.statistical_tests).slice(0, 3).map(([group, test]: [string, any]) => (
                                <div key={group} className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium text-gray-900">{group}</div>
                                    {test.error ? (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                        Error
                                      </span>
                                    ) : (
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        test.p_value && test.p_value < 0.05 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                      }`}>
                                        {test.p_value && test.p_value < 0.05 ? 'Significant' : 'Not Significant'}
                                      </span>
                                    )}
                                  </div>
                                  {test.error ? (
                                    <div className="text-xs text-yellow-700 mt-1">{test.error}</div>
                                  ) : (
                                    <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                                      <div>
                                        <span className="text-gray-600">χ² Statistic: </span>
                                        <span className="font-medium">{test.chi2_statistic?.toFixed(2) || "N/A"}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">P-value: </span>
                                        <span className="font-medium">{test.p_value ? test.p_value.toExponential(3) : "N/A"}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                              {Object.keys(metrics.statistical_tests).length > 3 && (
                                <div className="text-xs text-gray-500 text-center p-2">
                                  ... and {Object.keys(metrics.statistical_tests).length - 3} more statistical tests
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Fairness Thresholds */}
                        {metrics.interpretation && (
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2">Fairness Thresholds</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-blue-700">Demographic Parity: </span>
                                <span className="font-medium">{metrics.interpretation.demographic_parity_threshold}</span>
                              </div>
                              <div>
                                <span className="text-blue-700">Equal Opportunity: </span>
                                <span className="font-medium">{metrics.interpretation.equal_opportunity_threshold}</span>
                              </div>
                              <div>
                                <span className="text-blue-700">Disparate Impact: </span>
                                <span className="font-medium">{metrics.interpretation.disparate_impact_threshold}</span>
                              </div>
                              <div>
                                <span className="text-blue-700">Statistical Parity: </span>
                                <span className="font-medium">{metrics.interpretation.statistical_parity_threshold}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {Object.keys(fairnessAPIData.metrics.metrics).length > 3 && (
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600">
                          📊 Showing detailed analysis for 3 features. Total of {Object.keys(fairnessAPIData.metrics.metrics).length} features analyzed.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Additional features: {Object.keys(fairnessAPIData.metrics.metrics).slice(3).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Information */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Analysis Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project ID:</span>
                      <span className="font-medium">{fairnessAPIData.project_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model Name:</span>
                      <span className="font-medium">{fairnessAPIData.model_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model Version:</span>
                      <span className="font-medium">{fairnessAPIData.model_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Analysis Timestamp:</span>
                      <span className="font-medium">{fairnessAPIData.timestamp || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Enhanced Analysis Completed</h4>
                        <p className="text-sm text-green-700">
                          Comprehensive fairness analysis including advanced bias detection, cross-dataset comparison, and intersectional analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Fallback: Show debug content if fairnessAPIData exists but metrics doesn't */}
            {selectedModel && !loadingFairness && fairnessAPIData && !fairnessAPIData.metrics && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  ⚠️ Unexpected Data Structure
                </h3>
                <p className="text-orange-700 text-sm">
                  The API returned data, but it doesn't have the expected 'metrics' property structure.
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          // No Analysis Available Section - Updated to match performance page design
          <div className="text-center py-16">
            <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg
                className="h-12 w-12 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No Fairness Analysis Available
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Upload your model to analyze its fairness metrics across different
              demographic groups. Our system will evaluate bias and
              discrimination patterns to help ensure equitable AI decisions.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(`/projects/${id}`)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
              >
                Return to Overview
              </button>
            </div>

            {/* Features Preview Section */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Fairness Assessment Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Demographic Analysis
                  </h4>
                  <p className="text-gray-600">
                    Evaluate model fairness across gender, age, ethnicity, and
                    other sensitive attributes.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-pink-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Bias Detection
                  </h4>
                  <p className="text-gray-600">
                    Identify and quantify potential biases in your model's
                    predictions and decision boundaries.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-cyan-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Mitigation Strategies
                  </h4>
                  <p className="text-gray-600">
                    Receive recommendations for addressing and mitigating
                    identified fairness issues in your model.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional information section */}
            <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Why Fairness Analysis Matters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-700 mb-4">
                    Fairness analysis ensures your AI system treats all groups
                    equitably and doesn't perpetuate harmful biases. By
                    evaluating fairness metrics, you can:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-teal-500 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Detect discrimination across demographic groups
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-teal-500 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Ensure equal opportunity and treatment
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-teal-500 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Meet regulatory compliance requirements
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="h-5 w-5 text-teal-500 mr-2 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">
                        Build trust through transparent AI practices
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-700 mb-4">
                    Our comprehensive fairness assessment includes multiple
                    metrics:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">
                        <strong>Demographic Parity:</strong> Equal positive
                        prediction rates
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">
                        <strong>Equal Opportunity:</strong> Equal true positive
                        rates
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">
                        <strong>Disparate Impact:</strong> Ratio of selection
                        rates
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">
                        <strong>Statistical Tests:</strong> Significance testing
                        for bias
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout showSidebar={false} showHeader={false}>
      {content}
    </AppLayout>
  );
};

export default FairnessPage;
