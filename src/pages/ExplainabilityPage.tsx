import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Breadcrumb } from "../components/ui/breadcrumb";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LabelList,
} from "recharts";
import { useState, useEffect } from "react";
import { InfoTooltip } from "../components/InfoTooltip";
import { supabase } from "../lib/supabase";
// Add API data interface
interface ExplainabilityApiResponse {
  project_id?: number;
  model_id?: number;
  dataset_id?: number;
  user_id?: number;
  audit_type?: string;
  status?: string;
  id?: number;
  created_at?: string;
  updated_at?: string;
  model_name?: string;
  model_version?: string;
  timestamp?: string;
  
  // Updated structure with results wrapper
  results?: {
    summary?: {
      audit_type: string;
      key_findings: string[];
      test_dataset_id?: number;
      analysis_approach: string;
      test_dataset_used?: boolean;
      test_samples_analyzed?: number;
      total_features_analyzed: number;
      validation_dataset_used: boolean;
      training_samples_analyzed: number;
      enhanced_analysis_performed?: boolean;
    };
    shap_analysis?: {
      error?: string;
      status: string;
      shap_values?: number[][];
      shap_importance?: {
        importances: number[];
        feature_names: string[];
        explainer_type: string;
        data_source: string;
        sample_size: number;
      };
      training_comparison?: {
        importances: number[];
        feature_names: string[];
        sample_size: number;
      };
      shap_differences?: {
        validation_minus_training: number[];
        feature_names: string[];
        interpretation: string;
      };
    };
    enhanced_analysis?: {
      test_samples: number;
      test_dataset_id: number;
      test_dataset_used: boolean;
      stability_metrics: {
        datasets_available: {
          test: boolean;
          training: boolean;
          validation: boolean;
          total_datasets: number;
        };
        explanation_reliability_score: number;
      };
      behavior_consistency: {
        prediction_confidence: {
          test_mean_confidence: number;
          validation_mean_confidence: number;
          confidence_distribution_similarity: {
            p_value: number;
            ks_statistic: number;
            distributions_similar: boolean;
          };
        };
        prediction_distribution: {
          test_mean_prediction: number;
          validation_mean_prediction: number;
          distribution_similarity: {
            p_value: number;
            ks_statistic: number;
            distributions_similar: boolean;
          };
        };
      };
      cross_dataset_consistency: {
        permutation_importance_consistency: {
          correlation: number;
          consistency_score: number;
          correlation_p_value: number;
          test_importance: Record<string, number>;
          validation_importance: Record<string, number>;
        };
      };
    };
    lime_explanations?: {
      data_source: string;
      sample_size: number;
      explanations: {
        [key: string]: {
          prediction: number;
          feature_names: string[];
          feature_importance: [string, number][];
        };
      };
      average_importance: {
        [key: string]: number;
      };
    };
    feature_importance?: {
      error?: string;
      status: string;
      importances?: number[];
      feature_names?: string[];
      method?: string;
    };
    validation_analysis?: {
      data_source: string;
      test_samples: number;
      training_samples: number;
      validation_dataset_id: number;
      validation_dataset_used: boolean;
      shap_vs_proxy_ethics?: {
        ethics_assessment: {
          recommendations: string[];
          has_ethical_concerns: boolean;
          overall_ethics_score: number;
          high_concern_features: string[];
          medium_concern_features: string[];
        };
        total_proxies_detected: number;
        proxy_influence_analysis: Record<string, any>;
        detected_potential_proxies: Array<{
          proxy_type: string;
          feature_name: string;
          feature_index: number;
        }>;
      };
    };
  };

  // Legacy structure for backward compatibility
  metrics?: {
    validation_analysis?: {
      data_source: string;
      test_samples: number;
      training_samples: number;
      validation_dataset_id: number;
      validation_dataset_used: boolean;
      shap_vs_proxy_ethics?: {
        ethics_assessment: {
          recommendations: string[];
          has_ethical_concerns: boolean;
          overall_ethics_score: number;
          high_concern_features: string[];
          medium_concern_features: string[];
        };
        total_proxies_detected: number;
        proxy_influence_analysis: Record<string, any>;
        detected_potential_proxies: Array<{
          proxy_type: string;
          feature_name: string;
          feature_index: number;
        }>;
      };
      performance_comparison?: {
        performance_drop: {
          f1_drop: number;
          recall_drop: number;
          accuracy_drop: number;
          precision_drop: number;
        };
        training_performance: {
          recall: number;
          accuracy: number;
          f1_score: number;
          precision: number;
        };
        validation_performance: {
          recall: number;
          accuracy: number;
          f1_score: number;
          precision: number;
        };
      };
    };
    enhanced_analysis?: {
      test_samples: number;
      test_dataset_id: number;
      test_dataset_used: boolean;
      stability_metrics: {
        datasets_available: {
          test: boolean;
          training: boolean;
          validation: boolean;
          total_datasets: number;
        };
        explanation_reliability_score: number;
      };
      behavior_consistency: {
        prediction_confidence: {
          test_mean_confidence: number;
          validation_mean_confidence: number;
          confidence_distribution_similarity: {
            p_value: number;
            ks_statistic: number;
            distributions_similar: boolean;
          };
        };
        prediction_distribution: {
          test_mean_prediction: number;
          validation_mean_prediction: number;
          distribution_similarity: {
            p_value: number;
            ks_statistic: number;
            distributions_similar: boolean;
          };
        };
      };
      cross_dataset_consistency: {
        permutation_importance_consistency: {
          correlation: number;
          consistency_score: number;
          correlation_p_value: number;
          test_importance: Record<string, number>;
          validation_importance: Record<string, number>;
        };
      };
    };
    feature_importance?: {
      error?: string;
      status: string;
      importances?: number[];
      importances_std?: number[];
      feature_names?: string[];
      method?: string;
      data_source?: string;
      training_comparison?: {
        importances: number[];
        importances_std: number[];
        feature_names: string[];
      };
      importance_differences?: {
        validation_minus_training: number[];
        feature_names: string[];
        interpretation: string;
      };
    };
    shap_analysis?: {
      error?: string;
      status: string;
      shap_values?: number[][];
      shap_importance?: {
        importances: number[];
        feature_names: string[];
        explainer_type: string;
        data_source: string;
        sample_size: number;
      };
      training_comparison?: {
        importances: number[];
        feature_names: string[];
        sample_size: number;
      };
      shap_differences?: {
        validation_minus_training: number[];
        feature_names: string[];
        interpretation: string;
      };
    };
    lime_explanations?: {
      data_source: string;
      sample_size: number;
      explanations: {
        [key: string]: {
          prediction: number;
          feature_names: string[];
          feature_importance: [string, number][];
        };
      };
      average_importance: {
        [key: string]: number;
      };
    };
    summary?: {
      audit_type: string;
      key_findings: string[];
      analysis_approach: string;
      total_features_analyzed: number;
      validation_dataset_used: boolean;
      training_samples_analyzed: number;
      validation_samples_analyzed: number;
    };
  };
  
  feature_importance?: {
    importances: number[];
    feature_names: string[];
    method: string;
  };
  shap_values?: number[][][];
  shap_importance?: {
    importances: number[][];
    feature_names: string[];
    explainer_type: string;
  };
  lime_explanations?: {
    [key: string]: {
      prediction: number;
      feature_importance: [string, number][];
      feature_names: string[];
    };
  };
  transparency_analysis?: {
    model_complexity: string;
    interpretability_level: string;
    transparency_score: number;
    explanation_methods_available: string[];
    model_characteristics: any;
  };
  explanation_consistency?: {
    global_local_correlation: number;
    feature_importance_consistency: string;
    explanation_stability: string;
    top_features_agreement: number;
    analysis_status: string;
    error?: string;
  };
  attribution_analysis?: {
    significant_features: string[];
    feature_contribution_distribution: any;
    attribution_concentration: number;
    feature_interaction_detected: boolean;
    top_positive_features: string[];
    top_negative_features: string[];
    analysis_status: string;
    error?: string;
  };
  explainability_summary?: {
    overall_explainability_score: number;
    explainability_status: string;
    key_insights: string[];
    recommendations: string[];
    method_availability: {
      feature_importance: boolean;
      shap_explanations: boolean;
      lime_explanations: boolean;
      transparency_analysis: boolean;
    };
    explanation_quality: {
      consistency_level: string;
      stability_level: string;
      attribution_concentration: number;
      significant_features_count: number;
    };
    risk_assessment: {
      explanation_reliability: string;
      regulatory_compliance: string;
      business_trustworthiness: string;
    };
  };
}

// Add hook to fetch data
const useExplainabilityData = (
  projectId: string,
  modelId: string,
  version: string = "1.0.0"
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ExplainabilityApiResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Skip API call if no projectId provided (for dummy projects)
      if (!projectId) {
        console.log("Skipping API call - no projectId provided");
        setLoading(false);
        return;
      }

      console.log("Starting explainability data fetch for:", { projectId, modelId, version });
      setLoading(true);

      try {
        const accessToken = localStorage.getItem("access_token");
        console.log("Access token check:", { 
          hasToken: !!accessToken, 
          tokenLength: accessToken?.length || 0 
        });

        const { data, error } = await supabase
          .from("modeldetails")
          .select("model_id, project_id, dataset_id, model_version")
          .eq("project_id", projectId);

        console.log("Supabase query result:", { data, error, projectId });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.error("No model details found for project:", projectId);
          throw new Error("No model details found for this project");
        }

        const modelId = data[0].model_id;
        const model_version = data[0].model_version;
        
        console.log("Model details found:", { modelId, model_version, projectId });

        const apiUrl = `http://localhost:8000/ml/explainability/${projectId}/${modelId}/${model_version}`;
        console.log("Making API call to:", apiUrl);

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        console.log("API response status:", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API error response:", { 
            status: response.status, 
            statusText: response.statusText,
            errorText 
          });
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const apiData = await response.json();
        console.log("API Response received:", apiData);
        console.log("New metrics structure detected:", {
          hasMetrics: !!apiData.metrics,
          metricsKeys: apiData.metrics ? Object.keys(apiData.metrics) : null,
          hasShapAnalysis: !!apiData.metrics?.shap_analysis,
          hasLimeExplanations: !!apiData.metrics?.lime_explanations,
          hasValidationAnalysis: !!apiData.metrics?.validation_analysis
        });
        setData(apiData);
      } catch (err) {
        console.error("Failed to fetch explainability data:", err);
        console.error("Error stack:", err instanceof Error ? err.stack : 'No stack trace');
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, modelId, version]);

  return { data, loading, error };
};

// Adapted data processing functions for API response
const processFeatureImportance = (data: ExplainabilityApiResponse | null) => {
  console.log("processFeatureImportance called with:", data);

  if (!data) {
    console.log("No data provided to processFeatureImportance");
    return [];
  }

  // Handle new metrics structure first, then results structure, then legacy
  const featureData =
    data.metrics?.feature_importance ||
    data.metrics?.shap_analysis?.shap_importance ||
    data.results?.feature_importance ||
    data.feature_importance ||
    data.shap_importance;
  
  console.log("Feature data:", featureData);
  console.log("Full data structure:", JSON.stringify(data, null, 2));

  // If standard feature importance is available and successful, use it
  if (featureData && featureData.importances && featureData.feature_names && !('status' in featureData && featureData.status === 'failed')) {
    const { importances, feature_names } = featureData;

    // Check the structure of importances and handle accordingly
    const meanImportances = feature_names.map((feature: string, idx: number) => {
      // Check if importances[idx] is an array before calling reduce
      const imp = importances[idx];
      const mean = Array.isArray(imp)
        ? imp.reduce((sum, val) => sum + Math.abs(val), 0) / imp.length
        : Math.abs(imp); // Handle if it's a single value

      return {
        feature: feature,
        importance: mean,
        color: "#3182CE",
      };
    });

    const result = meanImportances.sort(
      (a: any, b: any) => b.importance - a.importance
    );
    console.log("processFeatureImportance result:", result);
    return result;
  }

  // Fallback to LIME explanations if feature importance failed or is unavailable
  const limeData = data.metrics?.lime_explanations || data.results?.lime_explanations || data.lime_explanations;
  
  if (limeData && limeData.average_importance) {
    console.log("Using LIME data as fallback for feature importance");
    
    // Extract actual feature names from LIME explanations
    const featureNamesFromLime = limeData.explanations ? 
      Object.values(limeData.explanations)[0]?.feature_names || [] : [];
    
    // Create a mapping of clean feature names to their average importance
    const featureImportanceMap = new Map<string, number>();
    
    // Process each LIME condition to extract base feature names
    Object.entries(limeData.average_importance).forEach(([condition, importance]) => {
      // Extract base feature name from condition (e.g., "credit_score <= -0.86" -> "credit_score")
      const baseFeature = condition.split(/[<>=]/)[0].trim();
      const currentImportance = featureImportanceMap.get(baseFeature) || 0;
      featureImportanceMap.set(baseFeature, currentImportance + Math.abs(importance as number));
    });
    
    // Convert to array format
    const limeImportances = Array.from(featureImportanceMap.entries()).map(([feature, importance]) => ({
      feature: feature,
      importance: importance,
      color: "#10B981", // Green color for LIME data
    }));

    const result = limeImportances.sort((a: any, b: any) => b.importance - a.importance);
    console.log("processFeatureImportance LIME result:", result);
    return result;
  }

  console.log("Missing feature data structure:", {
    hasFeatureData: !!featureData,
    hasImportances: !!featureData?.importances,
    hasFeatureNames: !!featureData?.feature_names,
    featureDataStatus: featureData && 'status' in featureData ? featureData.status : 'N/A',
    hasLimeData: !!limeData,
    hasLimeAvgImportance: !!limeData?.average_importance,
    hasResults: !!data.results,
    hasMetrics: !!(data as any).metrics,
    resultsKeys: data.results ? Object.keys(data.results) : [],
    metricsKeys: (data as any).metrics ? Object.keys((data as any).metrics) : [],
  });
  return [];
};

const processShapDependence = (data: ExplainabilityApiResponse | null) => {
  if (!data) return [];

  // Handle new metrics structure first, then results structure, then legacy
  const shap_values = data.metrics?.shap_analysis?.shap_values || data.shap_values;
  const shapImportance =
    data.metrics?.shap_analysis?.shap_importance ||
    data.shap_importance;

  if (!shap_values || !shapImportance || !shapImportance.feature_names) {
    console.log("Missing SHAP data:", {
      hasShapValues: !!shap_values,
      hasShapImportance: !!shapImportance,
      hasFeatureNames: !!shapImportance?.feature_names,
      hasResults: !!data.results,
      hasMetrics: !!(data as any).metrics,
    });
    return [];
  }

  const { feature_names } = shapImportance;

  // For simplicity, we'll just use the first few features
  const result = [];

  // Only process if we have data
  if (shap_values.length > 0 && shap_values[0].length > 0) {
    // Use first 3 features for demo
    const featuresToUse = feature_names.slice(
      0,
      Math.min(3, feature_names.length)
    );

    for (let featureIdx = 0; featureIdx < featuresToUse.length; featureIdx++) {
      for (let i = 0; i < shap_values.length; i++) {
        // Create a normalized feature value (just for demonstration)
        const featureValue = (i / shap_values.length) * 100;

        // Check if shap_values[i][featureIdx] is an array before calling reduce
        const shapValues = shap_values[i][featureIdx];
        let shapValue;

        if (Array.isArray(shapValues)) {
          // Average SHAP values across classes for this feature
          shapValue = shapValues.reduce((a, b) => a + b, 0) / shapValues.length;
        } else {
          // Handle if it's a single value
          shapValue = Number(shapValues);
        }

        result.push({
          featureValue,
          shapValue,
          feature: feature_names[featureIdx],
        });
      }
    }
  }

  return result;
};

const processShapFeatureImportance = (
  data: ExplainabilityApiResponse | null
) => {
  if (!data) return [];

  // Handle new metrics structure first, then results structure, then legacy
  const shapImportance =
    data.metrics?.shap_analysis?.shap_importance ||
    data.shap_importance;

  if (
    !shapImportance ||
    !shapImportance.importances ||
    !shapImportance.feature_names
  ) {
    console.log("Missing SHAP Feature Importance data:", {
      hasShapImportance: !!shapImportance,
      hasImportances: !!shapImportance?.importances,
      hasFeatureNames: !!shapImportance?.feature_names,
      hasResults: !!data.results,
      hasMetrics: !!(data as any).metrics,
    });
    return [];
  }

  const { importances, feature_names } = shapImportance;

  return feature_names
    .map((feature: string, idx: number) => {
      const imp = importances[idx];

      // Check if imp is an array before calling reduce
      const mean = Array.isArray(imp)
        ? imp.reduce((sum, val) => sum + Math.abs(val), 0) / imp.length
        : Math.abs(imp);

      const stdev = Array.isArray(imp)
        ? Math.sqrt(
            imp.reduce(
              (sum, val) => sum + Math.pow(Math.abs(val) - mean, 2),
              0
            ) / imp.length
          ) * 0.5
        : 0.1; // Default value for single values

      return {
        feature: feature,
        mean,
        stdev,
        color: "#3182CE",
      };
    })
    .sort((a: any, b: any) => b.mean - a.mean);
};

// Demo data for the explainability analysis
const explainabilityData = {
  metrics: {
    interpretability: 87,
    robustness: 92,
    stability: 89,
    status: {
      interpretability: "Good",
      robustness: "Excellent",
      stability: "Good",
    },
  },
  featureImportance: [
    { feature: "Market Volatility", importance: 0.28, color: "#3182CE" },
    { feature: "Debt-Equity Ratio", importance: 0.22, color: "#3182CE" },
    { feature: "Return on Assets", importance: 0.17, color: "#3182CE" },
    { feature: "Earnings Growth", importance: 0.14, color: "#3182CE" },
    { feature: "Price-Earnings Ratio", importance: 0.08, color: "#3182CE" },
    { feature: "Current Ratio", importance: 0.05, color: "#3182CE" },
    { feature: "Dividend Yield", importance: 0.04, color: "#3182CE" },
    { feature: "Market Cap", importance: 0.02, color: "#3182CE" },
  ].sort((a, b) => b.importance - a.importance),
  shapDependence: [
    // Market Volatility
    ...Array.from({ length: 50 }, (_, i) => ({
      featureValue: i * 2,
      shapValue: i * 0.013 - 0.3 + (Math.random() * 0.1 - 0.05),
      feature: "Market Volatility",
    })),
    // Debt-Equity Ratio
    ...Array.from({ length: 50 }, (_, i) => ({
      featureValue: i * 0.1 + 0.5,
      shapValue: -0.25 + i * 0.01 + (Math.random() * 0.1 - 0.05),
      feature: "Debt-Equity Ratio",
    })),
    // Return on Assets
    ...Array.from({ length: 50 }, (_, i) => ({
      featureValue: i * 0.2 + 1,
      shapValue: 0.1 + i * 0.004 + (Math.random() * 0.1 - 0.05),
      feature: "Return on Assets",
    })),
  ],
  shapFeatureImportance: [
    { feature: "Market Volatility", mean: 0.32, stdev: 0.15, color: "#3182CE" },
    { feature: "Debt-Equity Ratio", mean: 0.26, stdev: 0.12, color: "#3182CE" },
    { feature: "Return on Assets", mean: 0.18, stdev: 0.08, color: "#3182CE" },
    { feature: "Earnings Growth", mean: 0.13, stdev: 0.06, color: "#3182CE" },
    {
      feature: "Price-Earnings Ratio",
      mean: 0.06,
      stdev: 0.03,
      color: "#3182CE",
    },
    { feature: "Current Ratio", mean: 0.03, stdev: 0.02, color: "#3182CE" },
    { feature: "Dividend Yield", mean: 0.02, stdev: 0.01, color: "#3182CE" },
  ].sort((a, b) => b.mean - a.mean),
};

const MetricCard = ({
  title,
  value,
  status,
  description,
}: {
  title: string;
  value: number;
  status: string;
  description: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <InfoTooltip title={title} entityType="metric" entityName={title} />
    </div>
    <div className="flex items-baseline space-x-2">
      <span className="text-4xl font-bold text-gray-900">{value}%</span>
      <span
        className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
          status === "Excellent"
            ? "bg-green-100 text-green-800"
            : status === "Good"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {status}
      </span>
    </div>
    <p className="mt-2 text-sm text-gray-500">{description}</p>
  </div>
);

// Feature Importance Chart
const FeatureImportanceChart = ({ data }: { data: any[] }) => (
  <div className="w-full h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 10, right: 45, left: 100, bottom: 10 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          opacity={0.3}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          domain={[0, "dataMax"]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="feature"
          tick={{ fontSize: 12 }}
          width={90}
        />
        <Tooltip
          formatter={(value: number) => [
            `${(value * 100).toFixed(0)}%`,
            "Importance",
          ]}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #E5E7EB",
          }}
        />
        <Bar
          dataKey="importance"
          fill="#3182CE"
          animationDuration={1500}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="importance"
            position="right"
            formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
            style={{ fontSize: "11px" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

// SHAP Dependence Plot
const ShapDependencePlot = ({ data }: { data: any[] }) => {
  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">SHAP analysis failed</p>
        <p className="text-gray-400 text-xs">Check LIME explanations for feature insights</p>
      </div>
    );
  }

  // Get unique feature names from the data
  const uniqueFeatures = Array.from(new Set(data.map((d) => d.feature)));
  const feature1 = uniqueFeatures[0] || "Market Volatility";
  const feature2 = uniqueFeatures[1] || "Debt-Equity Ratio";
  const feature3 = uniqueFeatures[2] || "Return on Assets";

  const feature1Data = data.filter((d) => d.feature === feature1);
  const feature2Data = data.filter((d) => d.feature === feature2);
  const feature3Data = data.filter((d) => d.feature === feature3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-3 h-[250px]">
        <div className="flex items-center mb-1">
          <h3 className="text-sm font-medium text-gray-700">{feature1}</h3>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <ScatterChart margin={{ top: 5, right: 10, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="featureValue"
              name={feature1}
              label={{
                value: "Value",
                position: "insideBottom",
                offset: -5,
                fontSize: 11,
              }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="shapValue"
              name="SHAP Value"
              label={{
                value: "SHAP Impact",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                offset: 5,
              }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(value: number) => [value.toFixed(3), ""]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #E5E7EB",
                fontSize: "11px",
              }}
            />
            <Scatter
              data={feature1Data}
              fill="#3182CE"
              animationDuration={1500}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg p-3 h-[250px]">
        <div className="flex items-center mb-1">
          <h3 className="text-sm font-medium text-gray-700">{feature2}</h3>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <ScatterChart margin={{ top: 5, right: 10, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="featureValue"
              name={feature2}
              label={{
                value: "Value",
                position: "insideBottom",
                offset: -5,
                fontSize: 11,
              }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="shapValue"
              name="SHAP Value"
              label={{
                value: "SHAP Impact",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                offset: 5,
              }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(value: number) => [value.toFixed(3), ""]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #E5E7EB",
                fontSize: "11px",
              }}
            />
            <Scatter
              data={feature2Data}
              fill="#3182CE"
              animationDuration={1500}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg p-3 h-[250px]">
        <div className="flex items-center mb-1">
          <h3 className="text-sm font-medium text-gray-700">{feature3}</h3>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <ScatterChart margin={{ top: 5, right: 10, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="featureValue"
              name={feature3}
              label={{
                value: "Value",
                position: "insideBottom",
                offset: -5,
                fontSize: 11,
              }}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="shapValue"
              name="SHAP Value"
              label={{
                value: "SHAP Impact",
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                offset: 5,
              }}
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              formatter={(value: number) => [value.toFixed(3), ""]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #E5E7EB",
                fontSize: "11px",
              }}
            />
            <Scatter
              data={feature3Data}
              fill="#3182CE"
              animationDuration={1500}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Suggestion Card Component
const SuggestionCard = ({
  data,
}: {
  data: ExplainabilityApiResponse | null;
}) => {
  // Check for explainability summary in legacy structure
  const explainability_summary =
    data?.explainability_summary ||
    (data as any)?.metrics?.explainability_summary;

  // If we have the new results or metrics structure but no explainability_summary, create a basic summary
  if (!explainability_summary && (data?.results || data?.metrics)) {
    const hasFeatureImportance = !!(data.metrics?.feature_importance || data.results?.feature_importance || data.metrics?.shap_analysis?.shap_importance);
    const hasLimeExplanations = !!(data.metrics?.lime_explanations || data.results?.lime_explanations);
    const shapStatus = data.metrics?.shap_analysis?.status || data.results?.shap_analysis?.status;
    const isCompleted = data.status === 'completed';

    return (
      <motion.div
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Explainability Analysis Status
          </h2>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Methods */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Available Methods
            </h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  hasFeatureImportance ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <p className="text-sm text-gray-700">
                  Feature Importance Analysis {hasFeatureImportance ? '(Available)' : '(Not Available)'}
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  hasLimeExplanations ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <p className="text-sm text-gray-700">
                  LIME Explanations {hasLimeExplanations ? '(Available)' : '(Not Available)'}
                </p>
              </div>
              
            </div>
          </div>

          {/* Key Findings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Key Findings
            </h3>
            <div className="space-y-2">
              {(data.metrics?.summary?.key_findings || data.results?.summary?.key_findings)?.map((finding: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{finding}</p>
                </div>
              )) || (
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">
                    Analysis completed with {(data.metrics?.summary?.total_features_analyzed || data.results?.summary?.total_features_analyzed) || 'multiple'} features
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {(() => {
          const performanceData = data.metrics?.validation_analysis?.performance_comparison;
          return performanceData?.validation_performance && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Model Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="font-medium text-gray-900">
                    {(performanceData.validation_performance!.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Precision</p>
                  <p className="font-medium text-gray-900">
                    {(performanceData.validation_performance!.precision * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Recall</p>
                  <p className="font-medium text-gray-900">
                    {(performanceData.validation_performance!.recall * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">F1 Score</p>
                  <p className="font-medium text-gray-900">
                    {(performanceData.validation_performance!.f1_score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </motion.div>
    );
  }

  // If no explainability summary available, don't show the card
  if (!explainability_summary) return null;

  const score = explainability_summary.overall_explainability_score;
  const status = explainability_summary.explainability_status;

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100";
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div
      whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Explainability Analysis Summary
        </h2>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              status
            )}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(
              score
            )}`}
          >
            {Math.round(score * 100)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Insights */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Key Insights
          </h3>
          <div className="space-y-2">
            {explainability_summary.key_insights?.map(
              (insight: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              )
            ) || (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">No insights available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {explainability_summary.recommendations?.map(
              (recommendation: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              )
            ) || (
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">No recommendations available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Explainability Assessment
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Explanation Reliability</p>
            <p className="font-medium text-gray-900 capitalize">
              {explainability_summary.risk_assessment?.explanation_reliability || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Regulatory Compliance</p>
            <p className="font-medium text-gray-900 capitalize">
              {explainability_summary.risk_assessment?.regulatory_compliance || 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Business Trust</p>
            <p className="font-medium text-gray-900 capitalize">
              {explainability_summary.risk_assessment?.business_trustworthiness || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// SHAP Feature Importance
const ShapFeatureImportanceChart = ({ data }: { data: any[] }) => {
  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">SHAP feature importance unavailable</p>
        <p className="text-gray-400 text-xs">Refer to Feature Importance section above</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 10, right: 45, left: 100, bottom: 10 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          opacity={0.3}
          horizontal={true}
          vertical={false}
        />
        <XAxis
          type="number"
          domain={[0, "dataMax"]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <YAxis
          type="category"
          dataKey="feature"
          tick={{ fontSize: 12 }}
          width={90}
        />
        <Tooltip
          formatter={(value: number) => [
            `${(value * 100).toFixed(0)}%`,
            "SHAP Value",
          ]}
          contentStyle={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #E5E7EB",
          }}
        />
        <Bar
          dataKey="mean"
          fill="#3182CE"
          animationDuration={1500}
          radius={[0, 4, 4, 0]}
        >
          <LabelList
            dataKey="mean"
            position="right"
            formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
            style={{ fontSize: "11px" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
  );
};

// New component for Enhanced Analysis metrics
const EnhancedAnalysisCard = ({ data }: { data: ExplainabilityApiResponse | null }) => {
  const enhancedAnalysis = data?.results?.enhanced_analysis || data?.metrics?.enhanced_analysis;
  
  if (!enhancedAnalysis) return null;

  return (
    <motion.div
      whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Enhanced Analysis</h2>
      
      {/* Dataset Availability */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dataset Availability</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Test Dataset</p>
            <p className="text-lg font-semibold text-blue-900">
              {enhancedAnalysis.stability_metrics.datasets_available.test ? '✓ Available' : '✗ Not Available'}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Training Dataset</p>
            <p className="text-lg font-semibold text-green-900">
              {enhancedAnalysis.stability_metrics.datasets_available.training ? '✓ Available' : '✗ Not Available'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Validation Dataset</p>
            <p className="text-lg font-semibold text-purple-900">
              {enhancedAnalysis.stability_metrics.datasets_available.validation ? '✓ Available' : '✗ Not Available'}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">Total Datasets</p>
            <p className="text-lg font-semibold text-orange-900">
              {enhancedAnalysis.stability_metrics.datasets_available.total_datasets}
            </p>
          </div>
        </div>
      </div>

      {/* Explanation Reliability Score */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Explanation Reliability</h3>
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {(enhancedAnalysis.stability_metrics.explanation_reliability_score * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600">Reliability Score</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Behavior Consistency */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Behavior Consistency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prediction Confidence */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-blue-900 mb-3">Prediction Confidence</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Test Mean:</span>
                <span className="text-sm font-semibold text-blue-900">
                  {(enhancedAnalysis.behavior_consistency.prediction_confidence.test_mean_confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Validation Mean:</span>
                <span className="text-sm font-semibold text-blue-900">
                  {(enhancedAnalysis.behavior_consistency.prediction_confidence.validation_mean_confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Similarity:</span>
                <span className={`text-sm font-semibold ${
                  enhancedAnalysis.behavior_consistency.prediction_confidence.confidence_distribution_similarity.distributions_similar
                    ? 'text-green-700' : 'text-red-700'
                }`}>
                  {enhancedAnalysis.behavior_consistency.prediction_confidence.confidence_distribution_similarity.distributions_similar 
                    ? 'Similar' : 'Different'}
                </span>
              </div>
            </div>
          </div>

          {/* Prediction Distribution */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-green-900 mb-3">Prediction Distribution</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Test Mean:</span>
                <span className="text-sm font-semibold text-green-900">
                  {enhancedAnalysis.behavior_consistency.prediction_distribution.test_mean_prediction.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Validation Mean:</span>
                <span className="text-sm font-semibold text-green-900">
                  {enhancedAnalysis.behavior_consistency.prediction_distribution.validation_mean_prediction.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-700">Similarity:</span>
                <span className={`text-sm font-semibold ${
                  enhancedAnalysis.behavior_consistency.prediction_distribution.distribution_similarity.distributions_similar
                    ? 'text-green-700' : 'text-red-700'
                }`}>
                  {enhancedAnalysis.behavior_consistency.prediction_distribution.distribution_similarity.distributions_similar 
                    ? 'Similar' : 'Different'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Dataset Consistency */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cross-Dataset Consistency</h3>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-purple-900">
                {(enhancedAnalysis.cross_dataset_consistency.permutation_importance_consistency.correlation * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-purple-600">Correlation Score</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-purple-900">
                {(enhancedAnalysis.cross_dataset_consistency.permutation_importance_consistency.consistency_score * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-purple-600">Consistency Score</p>
            </div>
          </div>
          <p className="text-xs text-purple-700">
            P-value: {enhancedAnalysis.cross_dataset_consistency.permutation_importance_consistency.correlation_p_value.toExponential(2)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// New component for Ethics Assessment
const EthicsAssessmentCard = ({ data }: { data: ExplainabilityApiResponse | null }) => {
  const ethicsData = data?.results?.validation_analysis?.shap_vs_proxy_ethics || data?.metrics?.validation_analysis?.shap_vs_proxy_ethics;
  
  if (!ethicsData) return null;

  const getEthicsScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEthicsScoreBg = (score: number) => {
    if (score >= 0.8) return 'bg-green-50 border-green-200';
    if (score >= 0.6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <motion.div
      whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Ethics Assessment</h2>
      
      {/* Overall Ethics Score */}
      <div className={`p-6 rounded-lg border-2 mb-6 ${getEthicsScoreBg(ethicsData.ethics_assessment.overall_ethics_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-3xl font-bold ${getEthicsScoreColor(ethicsData.ethics_assessment.overall_ethics_score)}`}>
              {ethicsData.ethics_assessment.overall_ethics_score.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">Overall Ethics Score</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${
              ethicsData.ethics_assessment.has_ethical_concerns ? 'text-red-600' : 'text-green-600'
            }`}>
              {ethicsData.ethics_assessment.has_ethical_concerns ? 'Concerns Detected' : 'No Concerns'}
            </p>
            <p className="text-sm text-gray-600">Ethical Assessment</p>
          </div>
        </div>
      </div>

      {/* Proxy Features Detection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proxy Features Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Proxies Detected</p>
            <p className="text-2xl font-bold text-blue-900">{ethicsData.total_proxies_detected}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 font-medium">High Concern Features</p>
            <p className="text-2xl font-bold text-red-900">{ethicsData.ethics_assessment.high_concern_features.length}</p>
          </div>
        </div>
      </div>

      {/* Detected Proxy Features */}
      {ethicsData.detected_potential_proxies.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detected Potential Proxies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ethicsData.detected_potential_proxies.map((proxy, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg border">
                <p className="font-medium text-gray-900">{proxy.feature_name}</p>
                <p className="text-sm text-gray-600 capitalize">{proxy.proxy_type} proxy</p>
                <p className="text-xs text-gray-500">Index: {proxy.feature_index}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {ethicsData.ethics_assessment.recommendations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-2">
            {ethicsData.ethics_assessment.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// New component for LIME Average Importance Chart
const LimeAverageImportanceChart = ({ data }: { data: any }) => {
  if (!data || Object.keys(data).length === 0) return null;

  // Convert average importance to chart data
  const chartData = Object.entries(data)
    .map(([feature, importance]) => ({
      feature: feature.length > 30 ? `${feature.substring(0, 30)}...` : feature,
      importance: Number(importance),
      fullFeature: feature
    }))
    .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
    .slice(0, 15); // Show top 15 features

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">LIME Average Feature Importance</h3>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="feature" 
              width={200}
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number, name: string, props: any) => [
                value.toFixed(4), 
                'Importance'
              ]}
              labelFormatter={(label: string, payload: any) => 
                payload?.[0]?.payload?.fullFeature || label
              }
            />
                       <Bar 
               dataKey="importance" 
               fill="#3B82F6"
             />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ExplainabilityPage: React.FC = () => {
  const { id, modelId } = useParams<{ id: string; modelId: string }>();
  const isDummyProject = id === "dummy-1" || id === "dummy-2";

  // Set default modelId for dummy project
  const effectiveModelId = isDummyProject ? "demo-model" : modelId;

  // New state for selected model
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<{
    model_id: string;
    model_version: string;
    display_name: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingExplainability, setLoadingExplainability] = useState(false);
  const [apiExplainabilityData, setApiExplainabilityData] = useState<ExplainabilityApiResponse | null>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [loading, setLoading] = useState(true);

  // Function to fetch explainability data for a specific model
  const fetchExplainabilityData = async (modelId: string, modelVersion: string) => {
    setLoadingExplainability(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      
      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      console.log("🌐 Making API call to explainability endpoint");
      const response = await fetch(
        `http://localhost:8000/ml/explainability/${id}/${modelId}/${modelVersion}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const apiData = await response.json();
        console.log("✅ Explainability API Response:", apiData);
        setApiExplainabilityData(apiData);
        setHasAnalysis(true);
      } else {
        console.error("Explainability API error:", response.statusText);
        setHasAnalysis(false);
      }
    } catch (error) {
      console.error("Error fetching explainability data:", error);
      console.error("Request details:", {
        url: `http://localhost:8000/ml/explainability/${id}/${modelId}/${modelVersion}`,
        projectId: id,
        modelId,
        modelVersion,
        hasToken: !!localStorage.getItem("access_token")
      });
      setHasAnalysis(false);
    } finally {
      setLoadingExplainability(false);
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
                    fetchExplainabilityData(model.model_id, model.model_version);
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
    if (isDummyProject) {
      setLoading(false);
      setHasAnalysis(true);
      return;
    }

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
        
        // Set hasAnalysis to true if we have models, but don't auto-fetch explainability data
        setHasAnalysis(data && data.length > 0);
      } catch (error) {
        console.error("Error fetching models:", error);
        setHasAnalysis(false);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [id, isDummyProject]);

  // Skip API call for dummy projects
  const { data, loading: legacyLoading, error } = useExplainabilityData(
    isDummyProject ? "" : "",
    isDummyProject ? "" : ""
  );

  // Debug the actual parameters being used
  console.log("ExplainabilityPage Parameters:", {
    id,
    modelId,
    effectiveModelId,
    isDummyProject,
    loading,
    error,
    hasData: !!data,
    projectIdForAPI: isDummyProject ? "" : id || "",
    modelIdForAPI: isDummyProject ? "" : effectiveModelId || ""
  });

  // Use demo data for dummy projects, API data for selected models, or fallback
  const featureImportanceData = isDummyProject
    ? explainabilityData.featureImportance
    : selectedModel && apiExplainabilityData
    ? processFeatureImportance(apiExplainabilityData)
    : data
    ? processFeatureImportance(data)
    : explainabilityData.featureImportance;

  const shapDependenceData = isDummyProject
    ? explainabilityData.shapDependence
    : selectedModel && apiExplainabilityData
    ? processShapDependence(apiExplainabilityData)
    : data
    ? processShapDependence(data)
    : explainabilityData.shapDependence;

  const shapFeatureImportanceData = isDummyProject
    ? explainabilityData.shapFeatureImportance
    : selectedModel && apiExplainabilityData
    ? processShapFeatureImportance(apiExplainabilityData)
    : data
    ? processShapFeatureImportance(data)
    : explainabilityData.shapFeatureImportance;

  // Debug logging with more details
  console.log("ExplainabilityPage Debug:", {
    isDummyProject,
    hasData: !!data,
    dataStatus: data?.status,
    dataResults: data?.results ? Object.keys(data.results) : null,
    dataMetrics: data?.metrics ? Object.keys(data.metrics) : null,
    hasMetricsShapAnalysis: !!(data?.metrics?.shap_analysis),
    hasMetricsLimeExplanations: !!(data?.metrics?.lime_explanations),
    hasMetricsValidationAnalysis: !!(data?.metrics?.validation_analysis),
    featureImportanceDataLength: featureImportanceData?.length,
    shapDependenceDataLength: shapDependenceData?.length,
    shapFeatureImportanceDataLength: shapFeatureImportanceData?.length,
    rawData: data,
    currentURL: window.location.href,
    localStorage: {
      hasAccessToken: !!localStorage.getItem("access_token"),
      accessTokenLength: localStorage.getItem("access_token")?.length || 0
    }
  });

  const breadcrumbSegments = [
    { title: "Projects", href: "/home" },
    { title: "Investment Portfolio Analysis", href: `/projects/${id}` },
    { title: "Explainability", href: `/projects/${id}/explainability` },
  ];

  // If loading, show loading state
  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Loading models...
          </h2>
        </div>
      </div>
    );
  }

  // If no analysis available for non-dummy project, show premium empty state  
  if (!hasAnalysis && !isDummyProject) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">
              Model Explainability
            </h1>
            <p className="mt-2 text-gray-600">
              Understand how your model makes decisions and interprets data
            </p>
          </div>

          {/* Premium Empty State */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="h-10 w-10 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Explainability Analysis Not Available
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto mb-6">
                {error
                  ? `Error loading data: ${error}`
                  : "No model has been uploaded yet for this project. Please upload a model in the Project Overview page to begin analyzing how your model makes decisions."}
              </p>

              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <svg
                  className="mr-3 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
                  />
                </svg>
                Return to Project Overview
              </button>
            </div>

            {/* Feature explanations section */}
            <div className="bg-gradient-to-r from-gray-50 to-indigo-50 p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Explainability Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Feature Importance
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Identify which features have the greatest impact on your
                    model's predictions.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Local Explanations
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Understand specific predictions with instance-level
                    explanation techniques.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="h-6 w-6 text-red-600"
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
                  <h4 className="text-base font-medium text-gray-900 mb-2">
                    Concept Visualization
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Visualize how your model interprets abstract concepts and
                    represents knowledge.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional information section */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="h-5 w-5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Why Explainability Matters
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                AI explainability is becoming increasingly important for
                regulatory compliance, building user trust, and debugging model
                behavior. Explainable AI helps you:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-indigo-500 mr-2 mt-0.5"
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
                    Meet regulatory requirements for high-risk AI systems
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-indigo-500 mr-2 mt-0.5"
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
                    Identify and mitigate unintended behaviors
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-indigo-500 mr-2 mt-0.5"
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
                    Build stakeholder trust and confidence in your AI
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="h-5 w-5 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Explainability Methods
                </h3>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    SHAP (SHapley Additive exPlanations)
                  </h4>
                  <p className="text-xs text-gray-600">
                    Provides feature importance values for each prediction using
                    game theory concepts.
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    LIME (Local Interpretable Model-agnostic Explanations)
                  </h4>
                  <p className="text-xs text-gray-600">
                    Creates locally faithful approximations to explain
                    individual predictions.
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">
                    Integrated Gradients
                  </h4>
                  <p className="text-xs text-gray-600">
                    Assigns importance scores to features by integrating
                    gradients along a path.
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <span className="text-sm text-indigo-600 font-medium">
                    Upload your model to access these explainability tools
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If we have data or it's a dummy project, show the visualization
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-8 bg-gray-50 min-h-screen"
    >
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Explainability Analysis
            </h1>
            <p className="text-gray-500 mt-1">
              {apiExplainabilityData?.results || apiExplainabilityData?.metrics?.summary
                ? `Analysis completed • ${(apiExplainabilityData.results?.summary || apiExplainabilityData.metrics?.summary)?.total_features_analyzed || 'N/A'} features analyzed • ${
                    (apiExplainabilityData.results?.summary || apiExplainabilityData.metrics?.summary)?.training_samples_analyzed || 'N/A'
                  } samples processed`
                : apiExplainabilityData
                ? `Model: ${apiExplainabilityData.model_name || "Unknown"} (v${
                    apiExplainabilityData.model_version || "1.0.0"
                  })`
                : data?.results || data?.metrics?.summary
                ? `Analysis completed • ${(data.results?.summary || data.metrics?.summary)?.total_features_analyzed || 'N/A'} features analyzed • ${
                    (data.results?.summary || data.metrics?.summary)?.training_samples_analyzed || 'N/A'
                  } samples processed`
                : data
                ? `Model: ${data.model_name || "Unknown"} (v${
                    data.model_version || "1.0.0"
                  })`
                : isDummyProject
                ? "Demo Explainability Analysis"
                : "Understanding model decisions and feature importance"}
            </p>
          </div>
          {!isDummyProject && (
            <div className="flex flex-col items-end space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Model:
              </label>
              <ModelSelectorDropdown />
            </div>
          )}
          {(() => {
            const validationData = data?.metrics?.validation_analysis?.performance_comparison;
            if (validationData) {
              return (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Model Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(validationData.validation_performance.accuracy * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    Training: {(validationData.training_performance.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
              );
            } else if (data?.explainability_summary || (data as any)?.metrics?.explainability_summary) {
              return (
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Overall Explainability Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      (
                        data?.explainability_summary ||
                        (data as any)?.metrics?.explainability_summary
                      )?.overall_explainability_score * 100
                    )}%
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </div>
        {error && <p className="mt-2 text-sm text-red-500"></p>}
      </div>

      {/* Loading state for explainability data */}
      {!isDummyProject && loadingExplainability && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-gray-600">Loading explainability analysis...</span>
          </div>
        </div>
      )}

      {/* Message when no model is selected */}
      {!isDummyProject && !selectedModel && !loadingExplainability && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">Select a Model</h3>
          <p className="text-blue-700">
            Please select a model from the dropdown above to view its explainability analysis.
          </p>
        </div>
      )}

      {/* Explainability analysis content - only show when model is selected and not loading, or for dummy projects */}
      {(isDummyProject || (selectedModel && !loadingExplainability)) && (
        <>
          {/* Audit Summary Section - New */}
      {(data?.results || data?.metrics) && (
        <motion.div
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Explainability Audit Summary
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : data.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {data.status ? `${data.status.charAt(0).toUpperCase()}${data.status.slice(1)}` : 'Unknown'}
            </span>
          </div>

          {/* Summary Overview */}
          {(data.results?.summary || data.metrics?.summary) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Analysis Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Analysis Type</p>
                  <p className="text-lg font-semibold text-blue-900 capitalize">
                    {(data.results?.summary || data.metrics?.summary)?.audit_type || 'Explainability'}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Features Analyzed</p>
                  <p className="text-lg font-semibold text-green-900">
                    {(data.results?.summary || data.metrics?.summary)?.total_features_analyzed || 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Approach</p>
                  <p className="text-lg font-semibold text-purple-900 capitalize">
                    {(data.results?.summary || data.metrics?.summary)?.analysis_approach?.replace(/_/g, ' ') || 'Standard Analysis'}
                  </p>
                </div>
              </div>

              {/* Key Findings */}
              {(data.results?.summary?.key_findings || data.metrics?.summary?.key_findings) && (data.results?.summary?.key_findings || data.metrics?.summary?.key_findings)?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Key Findings</h4>
                  <div className="space-y-2">
                    {(data.results?.summary?.key_findings || data.metrics?.summary?.key_findings)?.map((finding: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-gray-700">{finding}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Performance Comparison - Only for legacy data structure */}
          {data.metrics?.validation_analysis?.performance_comparison && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Model Performance Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Training Performance */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-green-900 mb-3">
                    Training Performance
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Accuracy:</span>
                      <span className="text-sm font-semibold text-green-900">
                        {(data.metrics.validation_analysis.performance_comparison.training_performance.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Precision:</span>
                      <span className="text-sm font-semibold text-green-900">
                        {(data.metrics.validation_analysis.performance_comparison.training_performance.precision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Recall:</span>
                      <span className="text-sm font-semibold text-green-900">
                        {(data.metrics.validation_analysis.performance_comparison.training_performance.recall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">F1 Score:</span>
                      <span className="text-sm font-semibold text-green-900">
                        {(data.metrics.validation_analysis.performance_comparison.training_performance.f1_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Performance */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-blue-900 mb-3">
                    Validation Performance
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Accuracy:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {(data.metrics.validation_analysis.performance_comparison.validation_performance.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Precision:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {(data.metrics.validation_analysis.performance_comparison.validation_performance.precision * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Recall:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {(data.metrics.validation_analysis.performance_comparison.validation_performance.recall * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">F1 Score:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {(data.metrics.validation_analysis.performance_comparison.validation_performance.f1_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Drop Analysis */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  Performance Drop Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Accuracy Drop</p>
                    <p className={`text-lg font-semibold ${
                      data.metrics.validation_analysis.performance_comparison.performance_drop.accuracy_drop === 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(data.metrics.validation_analysis.performance_comparison.performance_drop.accuracy_drop * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Precision Drop</p>
                    <p className={`text-lg font-semibold ${
                      data.metrics.validation_analysis.performance_comparison.performance_drop.precision_drop === 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(data.metrics.validation_analysis.performance_comparison.performance_drop.precision_drop * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Recall Drop</p>
                    <p className={`text-lg font-semibold ${
                      data.metrics.validation_analysis.performance_comparison.performance_drop.recall_drop === 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(data.metrics.validation_analysis.performance_comparison.performance_drop.recall_drop * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">F1 Drop</p>
                    <p className={`text-lg font-semibold ${
                      data.metrics.validation_analysis.performance_comparison.performance_drop.f1_drop === 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {(data.metrics.validation_analysis.performance_comparison.performance_drop.f1_drop * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Method Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Feature Importance Status */}
            {(data.results?.feature_importance || data.metrics?.feature_importance) && (
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-medium text-emerald-900">
                    Feature Importance
                  </h4>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                    Available
                  </span>
                </div>
                <p className="text-sm text-emerald-700 mb-1">
                  Method: {(data.results?.feature_importance || data.metrics?.feature_importance)?.method}
                </p>
                <p className="text-xs text-emerald-600">
                  {(data.results?.feature_importance || data.metrics?.feature_importance)?.feature_names?.length || 0} features analyzed
                </p>
              </div>
            )}

            {/* SHAP Analysis Status */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-md font-medium text-red-900">
                  SHAP Analysis
                </h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  (data.results?.shap_analysis || data.metrics?.shap_analysis)?.status === 'completed' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(data.results?.shap_analysis || data.metrics?.shap_analysis)?.status || 'Failed'}
                </span>
              </div>
              {(data.results?.shap_analysis || data.metrics?.shap_analysis)?.error && (
                <p className="text-xs text-red-600">
                  {((data.results?.shap_analysis || data.metrics?.shap_analysis)?.error?.length || 0) > 80 
                    ? ((data.results?.shap_analysis || data.metrics?.shap_analysis)?.error?.substring(0, 80) + '...') || ''
                    : (data.results?.shap_analysis || data.metrics?.shap_analysis)?.error || ''
                  }
                </p>
              )}
            </div>

            {/* LIME Analysis Status */}
            {(data.metrics?.lime_explanations || data.results?.lime_explanations) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-medium text-blue-900">
                    LIME Explanations
                  </h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Available
                  </span>
                </div>
                <p className="text-sm text-blue-700 mb-1">
                  Sample Size: {(data.metrics?.lime_explanations || data.results?.lime_explanations)?.sample_size}
                </p>
                <p className="text-xs text-blue-600">
                  Source: {(data.metrics?.lime_explanations || data.results?.lime_explanations)?.data_source?.replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced Analysis Card */}
      {(data?.results?.enhanced_analysis || data?.metrics?.enhanced_analysis) && (
        <EnhancedAnalysisCard data={data} />
      )}

      {/* Ethics Assessment Card */}
      {(data?.results?.validation_analysis?.shap_vs_proxy_ethics || data?.metrics?.validation_analysis?.shap_vs_proxy_ethics) && (
        <EthicsAssessmentCard data={data} />
      )}

      {/* LIME Average Importance Chart */}
      {(data?.results?.lime_explanations?.average_importance || data?.metrics?.lime_explanations?.average_importance) && (
        <motion.div
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              LIME Average Feature Importance
            </h2>
            <InfoTooltip
              title="About LIME Average Importance"
              entityType="chart"
              entityName="LIME Average Importance"
            />
          </div>
          <LimeAverageImportanceChart 
            data={data.results?.lime_explanations?.average_importance || data.metrics?.lime_explanations?.average_importance} 
          />
        </motion.div>
      )}

      {/* Suggestion Card */}
      <SuggestionCard data={data} />

      {/* Feature Importance */}
      <motion.div
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Feature Importance
            </h2>
          </div>
          <InfoTooltip
            title="About Feature Importance"
            entityType="chart"
            entityName="Feature Importance"
          />
        </div>
        <FeatureImportanceChart data={featureImportanceData} />
        
        {/* Training vs Validation Comparison */}
        {(data?.metrics?.feature_importance?.training_comparison || data?.results?.feature_importance?.training_comparison) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Training vs Validation Feature Importance Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="text-md font-medium text-blue-900 mb-2">Data Sources</h4>
                <p className="text-sm text-gray-600">
                  <strong>Validation:</strong> {(data.metrics?.feature_importance || data.results?.feature_importance)?.data_source?.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Method:</strong> {(data.metrics?.feature_importance || data.results?.feature_importance)?.method}
                </p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="text-md font-medium text-green-900 mb-2">Sample Sizes</h4>
                <p className="text-sm text-gray-600">
                  <strong>Training:</strong> {data.metrics?.validation_analysis?.training_samples || 'N/A'} samples
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Validation:</strong> {data.metrics?.validation_analysis?.test_samples || 'N/A'} samples
                </p>
              </div>
            </div>
            {(data.metrics?.feature_importance?.importance_differences || data.results?.feature_importance?.importance_differences) && (
              <div className="mt-4 bg-white p-4 rounded border">
                <h4 className="text-md font-medium text-purple-900 mb-2">Interpretation</h4>
                <p className="text-sm text-gray-700">
                  {(data.metrics?.feature_importance?.importance_differences || data.results?.feature_importance?.importance_differences)?.interpretation}
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* SHAP Dependence Plot */}
      <motion.div
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              SHAP Dependence Plot
            </h2>
          </div>
          <InfoTooltip
            title="About SHAP Dependence Plot"
            entityType="chart"
            entityName="SHAP Dependence Plot"
          />
        </div>
        <ShapDependencePlot data={shapDependenceData} />
      </motion.div>

      {/* SHAP Feature Importance */}
      <motion.div
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              SHAP Feature Importance
            </h2>
          </div>
          <InfoTooltip
            title="About SHAP Feature Importance"
            entityType="chart"
            entityName="SHAP Feature Importance"
          />
        </div>
        <ShapFeatureImportanceChart data={shapFeatureImportanceData} />
        
        {/* SHAP Training vs Validation Analysis */}
        {(data?.metrics?.shap_analysis?.shap_differences || data?.results?.shap_analysis?.shap_differences) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              SHAP Analysis: Training vs Validation Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border">
                <h4 className="text-md font-medium text-blue-900 mb-2">Analysis Details</h4>
                <p className="text-sm text-gray-600">
                  <strong>Explainer Type:</strong> {(data.metrics?.shap_analysis?.shap_importance || data.results?.shap_analysis?.shap_importance)?.explainer_type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Data Source:</strong> {(data.metrics?.shap_analysis?.shap_importance || data.results?.shap_analysis?.shap_importance)?.data_source?.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Sample Size:</strong> {(data.metrics?.shap_analysis?.shap_importance || data.results?.shap_analysis?.shap_importance)?.sample_size}
                </p>
              </div>
              <div className="bg-white p-4 rounded border">
                <h4 className="text-md font-medium text-green-900 mb-2">Training Comparison</h4>
                <p className="text-sm text-gray-600">
                  <strong>Training Samples:</strong> {(data.metrics?.shap_analysis?.training_comparison || data.results?.shap_analysis?.training_comparison)?.sample_size}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Features Analyzed:</strong> {(data.metrics?.shap_analysis?.shap_differences || data.results?.shap_analysis?.shap_differences)?.feature_names?.length || 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-4 bg-white p-4 rounded border">
              <h4 className="text-md font-medium text-purple-900 mb-2">Interpretation</h4>
              <p className="text-sm text-gray-700">
                {(data.metrics?.shap_analysis?.shap_differences || data.results?.shap_analysis?.shap_differences)?.interpretation}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* LIME Explanations */}
      <motion.div
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              LIME Instance Explanations
            </h2>
          </div>
          <InfoTooltip
            title="About LIME Explanations"
            entityType="chart"
            entityName="LIME Explanations"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data &&
          (data.metrics?.lime_explanations ||
            data.results?.lime_explanations ||
            data.lime_explanations) ? (
            Object.entries(
              data.metrics?.lime_explanations?.explanations ||
                data.results?.lime_explanations?.explanations ||
                data.lime_explanations ||
                {}
            )
              .slice(0, 4)
              .map(([instanceKey, instance]: [string, any]) => (
                <div
                  key={instanceKey}
                  className="bg-gray-50 p-4 rounded-lg h-[220px]"
                >
                  <h3 className="text-md font-medium mb-2">
                    {instanceKey.replace("_", " ")}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Prediction: {(instance.prediction * 100).toFixed(1)}%
                  </p>
                  <div className="space-y-3">
                    {instance.feature_importance && Array.isArray(instance.feature_importance) 
                      ? instance.feature_importance
                        .slice(0, 3)
                        .map(([feature, importance]: [string, number], idx: number) => {
                          const isPositive = importance > 0;
                          const absImportance = Math.abs(importance);
                          const maxWidth = 60; // Maximum width in pixels
                          const barWidth = Math.max(
                            10,
                            absImportance * maxWidth * 10
                          ); // Scale for visibility

                          return (
                            <div
                              key={idx}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm truncate flex-1 mr-2">
                                {feature}
                              </span>
                              <div className="flex items-center">
                                <div
                                  className={`h-2 rounded-full ${
                                    isPositive ? "bg-green-500" : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(barWidth, maxWidth)}px`,
                                  }}
                                ></div>
                                <span
                                  className={`text-xs ml-2 ${
                                    isPositive ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {importance.toFixed(3)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      : (
                        <div className="text-sm text-gray-500">
                          No feature importance data available
                        </div>
                      )}
                  </div>
                </div>
              ))
          ) : (
            // Fallback display for dummy projects or when no LIME data is available
            <>
              <div className="bg-gray-50 p-4 rounded-lg h-[220px]">
                <h3 className="text-md font-medium mb-2">Instance 0</h3>
                <p className="text-sm text-gray-600 mb-3">Prediction: 49.65%</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">age &lt;= -0.84</span>
                    <div className="flex items-center">
                      <div
                        className="h-2 bg-red-500 rounded-full"
                        style={{ width: "30px" }}
                      ></div>
                      <span className="text-xs ml-2 text-red-500">-0.01</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      -1.00 &lt; purchased &lt;= 1.00
                    </span>
                    <div className="flex items-center">
                      <div
                        className="h-2 bg-red-500 rounded-full"
                        style={{ width: "15px" }}
                      ></div>
                      <span className="text-xs ml-2 text-red-500">-0.00</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">income &lt;= -0.78</span>
                    <div className="flex items-center">
                      <div
                        className="h-2 bg-red-500 rounded-full"
                        style={{ width: "10px" }}
                      ></div>
                      <span className="text-xs ml-2 text-red-500">-0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg h-[220px]">
                <h3 className="text-md font-medium mb-2">Instance 1</h3>
                <p className="text-sm text-gray-600 mb-3">Prediction: 49.54%</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">age &lt;= -0.84</span>
                    <div className="flex items-center">
                      <div
                        className="h-2 bg-red-500 rounded-full"
                        style={{ width: "30px" }}
                      ></div>
                      <span className="text-xs ml-2 text-red-500">-0.01</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">purchased &lt;= -1.00</span>
                    <div className="flex items-center">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: "15px" }}
                      ></div>
                      <span className="text-xs ml-2 text-green-500">0.00</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">0.13 &lt; income &lt;= 0.87</span>
                    <div className="flex items-center">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: "10px" }}
                      ></div>
                      <span className="text-xs ml-2 text-green-500">0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Only show the overview section if we don't have API data */}
      {!data && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Explainability Overview
          </h3>
          <p className="text-gray-600 mb-8">
            Identify which features have the greatest impact on your model's
            predictions and outcomes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Local Explanations
              </h4>
              <p className="text-gray-600">
                Understand specific predictions with instance-level explanation
                techniques like LIME and SHAP.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
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
                Concept Visualization
              </h4>
              <p className="text-gray-600">
                Visualize how your model interprets abstract concepts and
                represents knowledge internally.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Model Transparency
              </h4>
              <p className="text-gray-600">
                Gain insights into your model's decision-making process to build
                trust and meet regulatory requirements.
              </p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </motion.div>
  );
};

export default ExplainabilityPage;
