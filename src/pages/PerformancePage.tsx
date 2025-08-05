import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FileUp as FileUpload2, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Breadcrumb } from "../components/ui/breadcrumb";
import { apiUrl } from "../lib/api-config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InfoTooltip } from "../components/InfoTooltip";
import { supabase } from "../lib/supabase";

// Thinking steps array for reuse
const thinkingSteps = [
  "Analyzing model architecture",
  "Extracting performance metrics", 
  "Computing confusion matrix",
  "Generating ROC curves",
  "Calculating cross-validation scores",
  "Processing learning curves",
  "Evaluating residual patterns",
  "Assessing feature importance",
  "Validating generalization ability",
  "Compiling comprehensive analysis",
];

// Type for model info
interface ModelInfo {
  type: string;
  name: string;
  version: string;
}

// Type for data info
interface DataInfo {
  total_samples: number;
  feature_count: number;
  feature_names: string[];
  class_distribution: Record<string, number>;
  validation_dataset_used?: boolean;
  validation_dataset_id?: number;
  validation_samples?: number;
  test_dataset_used?: boolean;
  test_dataset_id?: number;
  test_samples?: number;
  class_weights?: Record<string, number>;
}

// Type for metrics
interface PerformanceMetrics {
  metrics: {
    accuracy: number;
    f1Score: number;
    precision: number;
    recall: number;
    aucRoc: number;
    status: {
      accuracy: string;
      f1Score: string;
      precision: string;
      recall: string;
      aucRoc: string;
    };
  };
  confusionMatrix: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  precisionRecall: Array<{
    recall: number;
    precision: number;
  }>;
  rocCurve: Array<{
    fpr: number;
    tpr: number;
    random: number;
  }>;
  learningCurve: {
    trainSizes: number[];
    trainScores: number[];
    testScores: number[];
  };
  modelInfo: ModelInfo;
  dataInfo: DataInfo;
  cross_validation: {
    mean_score: number;
    std_score: number;
    scores: number[];
  };
  isRegression: boolean;
  regression_metrics: {
    mse: number;
    rmse: number;
    mae: number;
    r2: number;
  };
  residual_analysis: {
    mean_residual: number;
    std_residual: number;
    residuals: number[];
  };
  feature_importance?: {
    importances: number[];
    feature_names: string[];
    method: string;
  };
  validation_comparison?: {
    training_metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
    };
    validation_metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
    };
    performance_gaps: {
      accuracy_gap: number;
      precision_gap: number;
      recall_gap: number;
      f1_gap: number;
    };
    overfitting_indicators: {
      accuracy_overfitting: boolean;
      f1_overfitting: boolean;
      overall_overfitting_score: number;
    };
    generalization_assessment: {
      good_generalization: boolean;
      acceptable_generalization: boolean;
      poor_generalization: boolean;
    };
  };
  // New fields from API
  detailed_classification_report?: {
    [key: string]: {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    } | number;
    'macro avg': {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    };
    'weighted avg': {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    };
  };
  advanced_metrics?: {
    balanced_accuracy: number;
    matthews_correlation_coefficient: number;
    cohen_kappa: number;
    log_loss: number;
    brier_score: number;
  };
  class_wise_analysis?: {
    [key: string]: {
      support: number;
      predicted_count: number;
      precision: number;
      recall: number;
      f1_score: number;
    };
  };
  dataset_comparison?: {
    validation_metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
    };
    test_metrics: {
      accuracy: number;
      precision: number;
      recall: number;
      f1: number;
    };
    performance_gap: {
      accuracy_diff: number;
      f1_diff: number;
    };
  };
}



const MetricCard = ({
  title,
  value,
  status,
  description,
  infoData,
}: {
  title: string;
  value: number;
  status: string;
  description: string;
  infoData: any;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-medium text-gray-900 truncate pr-2">
        {title}
      </h3>
      <InfoTooltip
        title={title}
        entityType="metric"
        entityName={title}
        data={{
          value: value,
          status: status,
          description: description,
        }}
      />
    </div>
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-3xl font-bold text-gray-900 break-all">
        {value.toFixed(1)}%
      </span>
      <span
        className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          status === "Excellent"
            ? "bg-green-100 text-green-800"
            : status === "Good"
            ? "bg-emerald-100 text-emerald-800"
            : status === "Needs Improvement"
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {status}
      </span>
    </div>
    <p
      className="mt-2 text-sm text-gray-500 overflow-hidden text-ellipsis"
      title={description}
    >
      {description}
    </p>
  </div>
);

const UploadModal = () => (
  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-12 shadow-xl border border-gray-100">
    <div className="text-center max-w-2xl mx-auto">
      <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileUpload2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Upload Your Model for Analysis
      </h2>
      <p className="text-gray-600 mb-8">
        Upload your trained model to start analyzing its performance metrics,
        fairness indicators, and explainability factors.
      </p>
      <Button className="bg-primary text-white hover:bg-primary/90 px-8 py-6 text-lg shadow-lg">
        Upload Model
      </Button>
      <p className="mt-4 text-sm text-gray-500">Supported formats: .pkl</p>
    </div>
  </div>
);

// Update ConfusionMatrixChart for better responsiveness
const ConfusionMatrixChart = ({ data }: { data: any[] }) => (
  <div className="w-full h-full">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-700">
        Classification Results
      </h3>
      <InfoTooltip
        title="About Confusion Matrix"
        entityType="chart"
        entityName="Confusion Matrix"
        data={{ chartData: data }}
      />
    </div>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 25, left: 25, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            tickFormatter={(value) => value.toLocaleString()}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip
            formatter={(value) => [
              `${value.toLocaleString()} samples`,
              "Count",
            ]}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "8px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB",
            }}
          />
          <Legend
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: "10px" }}
          />
          <Bar
            dataKey="value"
            name="Number of Samples"
            animationDuration={1500}
            minPointSize={5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Similar updates for other chart components
const PrecisionRecallChart = ({ data }: { data: any[] }) => (
  <div className="w-full h-full">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-700">Trade-off Analysis</h3>
      <InfoTooltip
        title="About Precision-Recall Curve"
        entityType="chart"
        entityName="Precision-Recall Curve"
        data={{ chartData: data }}
      />
    </div>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 20, bottom: 30 }}
        >
          <defs>
            <linearGradient id="colorPrecision" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="recall"
            tickFormatter={(value) => value.toFixed(1)}
            label={{ value: "Recall", position: "insideBottom", offset: -10 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[0.4, 1]}
            tickFormatter={(value) => value.toFixed(1)}
            label={{ value: "Precision", angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: any) => [value.toFixed(2), "Precision"]}
            labelFormatter={(value) => `Recall: ${value}`}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "8px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB",
            }}
          />
          <Area
            type="monotone"
            dataKey="precision"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorPrecision)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Fix ROCCurveChart implementation to display AUC value properly
const ROCCurveChart = ({
  data,
  aucValue,
}: {
  data: any[];
  aucValue?: number;
}) => {
  // Ensure aucValue is properly formatted - transform to 0-1 scale if needed
  const normalizedAucValue =
    aucValue !== undefined && aucValue > 1 ? aucValue / 100 : aucValue;

  // Dynamically create the name for the legend to include the AUC value if available
  const curveLabel = `ROC Curve ${
    normalizedAucValue ? `(AUC=${normalizedAucValue.toFixed(3)})` : ""
  }`;

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">ROC Analysis</h3>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
          >
            <defs>
              <linearGradient id="colorRoc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="fpr"
              type="number"
              tickFormatter={(value) => value.toFixed(1)}
              domain={[0, 1]}
              label={{
                value: "False Positive Rate",
                position: "insideBottomRight",
                offset: -5,
                dy: 10,
                fontSize: 11,
              }}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(value) => value.toFixed(1)}
              label={{
                value: "True Positive Rate",
                angle: -90,
                position: "insideLeft",
                offset: -20,
                fontSize: 11,
              }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: any) => [value.toFixed(2), "Value"]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #E5E7EB",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Area
              type="monotone"
              name={curveLabel}
              dataKey="tpr"
              stroke="#6366F1"
              fillOpacity={1}
              fill="url(#colorRoc)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
              animationDuration={1500}
            />
            <Line
              type="monotone"
              dataKey="random"
              name="Random Classifier"
              stroke="#D1D5DB"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const LearningCurveChart = ({ data }: { data: any }) => (
  <div className="w-full h-full">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-700">Learning Curve</h3>
    </div>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data.trainSizes.map((size: number, index: number) => ({
            size,
            trainScore: data.trainScores[index] * 100 || 0,
            testScore: data.testScores[index] * 100 || 0,
          }))}
          margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="size"
            label={{
              value: "Training Examples",
              position: "insideBottomRight",
              offset: -5,
              dy: 10,
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <YAxis
            domain={[0, 100]}
            label={{
              value: "Score (%)",
              angle: -90,
              position: "insideLeft",
              offset: -20,
              fontSize: 11,
            }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: any) => [`${value.toFixed(1)}%`, "Score"]}
            labelFormatter={(value) =>
              `Training Examples: ${value.toLocaleString()}`
            }
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "8px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Line
            type="monotone"
            dataKey="trainScore"
            name="Training Score"
            stroke="#8884d8"
            strokeWidth={2}
            animationDuration={1500}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="testScore"
            name="Validation Score"
            stroke="#82ca9d"
            strokeWidth={2}
            animationDuration={1500}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ClassDistributionChart = ({ data }: { data: any }) => {
  const classData = Object.entries(data).map(
    ([className, count]: [string, any]) => ({
      name: `Class ${className}`,
      value: count,
      fill: getClassColor(parseInt(className)),
    })
  );

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Class Distribution
        </h3>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={classData}
            margin={{ top: 20, right: 25, left: 25, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value: any) => [
                `${value.toLocaleString()} samples`,
                "Count",
              ]}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: "8px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                border: "1px solid #E5E7EB",
              }}
            />
            <Bar dataKey="value" name="Samples" animationDuration={1500}>
              {classData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Helper function to get colors for different classes
const getClassColor = (classIndex: number) => {
  const colors = [
    "#3182CE",
    "#10B981",
    "#F59E0B",
    "#6366F1",
    "#EC4899",
    "#8B5CF6",
  ];
  return colors[classIndex % colors.length];
};

// Helper function to format confusion matrix data
const formatConfusionMatrix = (confusionMatrix: any) => {
  if (!confusionMatrix) {
    return [
      { name: "True Negative", value: 0, fill: "#3182CE" },
      { name: "False Positive", value: 0, fill: "#F56565" },
      { name: "False Negative", value: 0, fill: "#ED8936" },
      { name: "True Positive", value: 0, fill: "#38A169" },
    ];
  }

  // For binary classification, use the provided values
  if (confusionMatrix.true_negatives !== undefined) {
    return [
      {
        name: "True Negative",
        value: confusionMatrix.true_negatives || 0,
        fill: "#3182CE",
      },
      {
        name: "False Positive",
        value: confusionMatrix.false_positives || 0,
        fill: "#F56565",
      },
      {
        name: "False Negative",
        value: confusionMatrix.false_negatives || 0,
        fill: "#ED8936",
      },
      {
        name: "True Positive",
        value: confusionMatrix.true_positives || 0,
        fill: "#38A169",
      },
    ];
  }

  // If matrix array is provided (for multi-class), extract the values from the matrix
  if (confusionMatrix.matrix && Array.isArray(confusionMatrix.matrix)) {
    const matrix = confusionMatrix.matrix;

    // This is a simplification for visualization - for multi-class, we're showing aggregated values
    // For a true multi-class confusion matrix, a heatmap would be better
    const classCount = matrix.length;

    let tp = 0,
      fp = 0,
      fn = 0,
      tn = 0;

    // Calculate TP, FP, FN, TN from the matrix
    for (let i = 0; i < classCount; i++) {
      for (let j = 0; j < classCount; j++) {
        if (i === j) {
          // True positives (diagonal elements)
          tp += matrix[i][j];
        } else {
          // Off-diagonal elements
          fp += matrix[i][j]; // From perspective of class i, these are false positives
          fn += matrix[j][i]; // From perspective of class i, these are false negatives
        }
      }
    }

    // For multi-class, TN is less meaningful, but we calculate it to complete the matrix
    // TN for class i would be all correctly classified instances of other classes
    const total = matrix
      .flat()
      .reduce((sum: number, val: number) => sum + val, 0);
    tn = total - (tp + fp + fn);

    return [
      { name: "True Negative", value: tn, fill: "#3182CE" },
      { name: "False Positive", value: fp / classCount, fill: "#F56565" },
      { name: "False Negative", value: fn / classCount, fill: "#ED8936" },
      { name: "True Positive", value: tp, fill: "#38A169" },
    ];
  }

  return [
    { name: "True Negative", value: 0, fill: "#3182CE" },
    { name: "False Positive", value: 0, fill: "#F56565" },
    { name: "False Negative", value: 0, fill: "#ED8936" },
    { name: "True Positive", value: 0, fill: "#38A169" },
  ];
};

// Helper function to format ROC curve data
const formatRocCurve = (rocCurve: any) => {
  if (!rocCurve || !Object.keys(rocCurve).length) {
    return Array.from({ length: 11 }, (_, i) => ({
      fpr: i * 0.1,
      tpr: i * 0.1,
      random: i * 0.1,
    }));
  }

  // Check if rocCurve has direct fpr, tpr arrays (new API structure)
  if (Array.isArray(rocCurve.fpr) && Array.isArray(rocCurve.tpr)) {
    return rocCurve.fpr.map((fpr: number, index: number) => ({
      fpr: fpr,
      tpr: rocCurve.tpr[index] || 0,
      random: fpr, // Random baseline (diagonal line)
    }));
  }

  // Get the first class key (usually 'class_0', 'class_1', etc.) for legacy structure
  const classKeys = Object.keys(rocCurve).filter(key => key !== 'auc'); // Exclude auc field

  // If there are no class keys, use default values
  if (classKeys.length === 0) {
    return Array.from({ length: 11 }, (_, i) => ({
      fpr: i * 0.1,
      tpr: i * 0.1,
      random: i * 0.1,
    }));
  }

  // Prefer class_1 if available (typically the positive class)
  const selectedClass = classKeys.includes("class_1")
    ? "class_1"
    : classKeys[0];

  const fprArray = rocCurve[selectedClass]?.fpr || [];
  const tprArray = rocCurve[selectedClass]?.tpr || [];

  if (!fprArray.length || !tprArray.length) {
    return Array.from({ length: 11 }, (_, i) => ({
      fpr: i * 0.1,
      tpr: i * 0.1,
      random: i * 0.1,
    }));
  }

  // Combine FPR and TPR into data points for the chart
  return fprArray.map((fpr: number, index: number) => ({
    fpr: fpr,
    tpr: tprArray[index] || 0,
    random: fpr, // Random baseline (diagonal line)
  }));
};

// Format learning curve data
const formatLearningCurve = (learningCurve: any) => {
  if (
    !learningCurve ||
    !learningCurve.train_sizes ||
    !learningCurve.train_scores ||
    !learningCurve.test_scores
  ) {
    return {
      trainSizes: [],
      trainScores: [],
      testScores: [],
    };
  }

  // Average the scores across all cross-validation folds for each training size
  const trainScores = learningCurve.train_scores.map((scores: number[]) =>
    Array.isArray(scores)
      ? scores.reduce((sum: number, score: number) => sum + score, 0) /
        scores.length
      : scores
  );

  const testScores = learningCurve.test_scores.map((scores: number[]) =>
    Array.isArray(scores)
      ? scores.reduce((sum: number, score: number) => sum + score, 0) /
        scores.length
      : scores
  );

  return {
    trainSizes: learningCurve.train_sizes,
    trainScores: trainScores,
    testScores: testScores,
  };
};

// Helper function to calculate average AUC across all classes
const calculateAverageAUC = (rocCurve: any) => {
  if (!rocCurve) return 0;

  // First check if there's a direct AUC value in the new structure
  if (rocCurve.auc !== undefined) {
    return rocCurve.auc;
  }

  let total = 0;
  let count = 0;

  // Try to extract direct auc values if available from class-based structure
  for (const className in rocCurve) {
    if (rocCurve[className]?.auc !== undefined) {
      total += rocCurve[className].auc;
      count++;
    }
  }

  return count > 0 ? total / count : 0;
};

// Define a function to validate and format the performance data
const formatPerformanceData = (data: any): PerformanceMetrics => {
  // Create a default structure that matches what the UI expects
  const defaultData: PerformanceMetrics = {
    metrics: {
      accuracy: 0,
      f1Score: 0,
      precision: 0,
      recall: 0,
      aucRoc: 0,
      status: {
        accuracy: "Not Available",
        f1Score: "Not Available",
        precision: "Not Available",
        recall: "Not Available",
        aucRoc: "Not Available",
      },
    },
    confusionMatrix: [
      { name: "True Negative", value: 0, fill: "#3182CE" },
      { name: "False Positive", value: 0, fill: "#F56565" },
      { name: "False Negative", value: 0, fill: "#ED8936" },
      { name: "True Positive", value: 0, fill: "#38A169" },
    ],
    precisionRecall: Array.from({ length: 11 }, (_, i) => ({
      recall: i * 0.1,
      precision: 0.5,
    })),
    rocCurve: Array.from({ length: 11 }, (_, i) => ({
      fpr: i * 0.1,
      tpr: i * 0.1,
      random: i * 0.1,
    })),
    learningCurve: {
      trainSizes: [],
      trainScores: [],
      testScores: [],
    },
    modelInfo: {
      type: "unknown",
      name: "unknown",
      version: "0.0.0",
    },
    dataInfo: {
      total_samples: 0,
      feature_count: 0,
      feature_names: [],
      class_distribution: {},
      validation_dataset_used: false,
      validation_dataset_id: undefined,
      validation_samples: 0,
      test_dataset_used: false,
      test_dataset_id: undefined,
      test_samples: 0,
      class_weights: {},
    },
    cross_validation: {
      mean_score: 0,
      std_score: 0,
      scores: [],
    },
    isRegression: false,
    regression_metrics: {
      mse: 0,
      rmse: 0,
      mae: 0,
      r2: 0,
    },
    residual_analysis: {
      mean_residual: 0,
      std_residual: 0,
      residuals: [],
    },
    feature_importance: undefined,
    validation_comparison: undefined,
  };

  // If data is null or undefined, return default data
  if (!data) {
    return defaultData;
  }

  try {
    // Handle new API structure where data is under metrics
    const resultsData = data.metrics || data.results || data;
    
    // Check if this is a regression model
    const isRegression = resultsData.model_info?.type === "regression";

    if (isRegression) {
      // Extract regression metrics
      const regression_metrics = {
        mse: resultsData.basic_metrics?.mse || 0,
        rmse: resultsData.basic_metrics?.rmse || 0,
        mae: resultsData.basic_metrics?.mae || 0,
        r2: resultsData.basic_metrics?.r2 || 0,
      };

      // Extract residual analysis data
      const residual_analysis = resultsData.residual_analysis || {
        mean_residual: 0,
        std_residual: 0,
        residuals: [],
      };

      return {
        // Include other common properties
        metrics: defaultData.metrics,
        confusionMatrix: defaultData.confusionMatrix,
        precisionRecall: defaultData.precisionRecall,
        rocCurve: defaultData.rocCurve,
        modelInfo: {
          type: resultsData.model_info?.type || "regression",
          name: resultsData.model_info?.name || "unknown",
          version: resultsData.model_info?.version || "0.0.0",
        },
        dataInfo: resultsData.data_info || defaultData.dataInfo,
        learningCurve: formatLearningCurve(resultsData.learning_curve),
        cross_validation: {
          mean_score: resultsData.cross_validation?.mean_score || 0,
          std_score: resultsData.cross_validation?.std_score || 0,
          scores: resultsData.cross_validation?.scores || [],
        },
        // Add regression-specific properties
        regression_metrics,
        residual_analysis,
        // Flag to indicate this is regression data
        isRegression: true,
        feature_importance: resultsData.feature_importance,
        validation_comparison: resultsData.validation_comparison,
      };
    } else {
      // Extract AUC-ROC value from the new API structure
      let aucRocValue = 0;

      // Try to get AUC from roc_curve.auc (new structure)
      if (resultsData.roc_curve?.auc !== undefined) {
        aucRocValue = resultsData.roc_curve.auc;
      }
      // Fallback to basic_metrics.auc
      else if (resultsData.basic_metrics?.auc !== undefined) {
        aucRocValue = resultsData.basic_metrics.auc;
      }
      // Fallback to basic_metrics.roc_auc
      else if (resultsData.basic_metrics?.roc_auc !== undefined) {
        aucRocValue = resultsData.basic_metrics.roc_auc;
      }
      // Calculate from ROC curve data
      else {
        aucRocValue = calculateAverageAUC(resultsData.roc_curve);
      }

      // Convert to percentage (0-100 scale)
      aucRocValue = aucRocValue * 100;

      // Handle classification metrics with new structure
      const metrics = {
        accuracy: (resultsData.basic_metrics?.accuracy || 0) * 100,
        f1Score: (resultsData.basic_metrics?.f1 || 0) * 100,
        precision: (resultsData.basic_metrics?.precision || 0) * 100,
        recall: (resultsData.basic_metrics?.recall || 0) * 100,
        aucRoc: aucRocValue,
        status: {
          accuracy: getMetricStatus((resultsData.basic_metrics?.accuracy || 0) * 100),
          f1Score: getMetricStatus((resultsData.basic_metrics?.f1 || 0) * 100),
          precision: getMetricStatus((resultsData.basic_metrics?.precision || 0) * 100),
          recall: getMetricStatus((resultsData.basic_metrics?.recall || 0) * 100),
          aucRoc: getMetricStatus(aucRocValue),
        },
      };

      return {
        metrics,
        confusionMatrix: formatConfusionMatrix(resultsData.confusion_matrix),
        precisionRecall: defaultData.precisionRecall,
        rocCurve: formatRocCurve(resultsData.roc_curve),
        learningCurve: formatLearningCurve(resultsData.learning_curve),
        modelInfo: {
          type: resultsData.model_info?.type || "classification",
          name: resultsData.model_info?.name || "unknown",
          version: resultsData.model_info?.version || "0.0.0",
        },
        dataInfo: resultsData.data_info || defaultData.dataInfo,
        cross_validation: {
          mean_score: resultsData.cross_validation?.mean_score || 0,
          std_score: resultsData.cross_validation?.std_score || 0,
          scores: resultsData.cross_validation?.scores || [],
        },
        isRegression: false,
        regression_metrics: defaultData.regression_metrics,
        residual_analysis: defaultData.residual_analysis,
        feature_importance: resultsData.feature_importance,
        validation_comparison: resultsData.validation_comparison,
        // New fields from API
        detailed_classification_report: resultsData.detailed_classification_report,
        advanced_metrics: resultsData.advanced_metrics,
        class_wise_analysis: resultsData.class_wise_analysis,
        dataset_comparison: resultsData.dataset_comparison,
      };
    }
  } catch (error: any) {
    console.error("Error formatting performance data:", error);
    return defaultData;
  }
};

// Helper function to determine status based on metric value
const getMetricStatus = (value: number) => {
  if (value >= 95) return "Excellent";
  if (value >= 90) return "Good";
  if (value >= 80) return "Above Target";
  if (value >= 70) return "On Target";
  return "Needs Improvement";
};

// New component: Model Info Card
const ModelInfoCard = ({ data }: { data: any }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
    <h3 className="text-lg font-medium text-gray-900 mb-3">
      Model Information
    </h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm text-gray-500 min-w-[90px]">Model Type:</span>
        <span
          className="text-sm font-medium capitalize ml-2 text-right truncate max-w-[65%]"
          title={data.type}
        >
          {data.type}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-500 min-w-[90px]">Model Name:</span>
        <span
          className="text-sm font-medium ml-2 text-right truncate max-w-[65%]"
          title={data.name}
        >
          {data.name}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-500 min-w-[90px]">Version:</span>
        <span
          className="text-sm font-medium ml-2 text-right truncate max-w-[65%]"
          title={data.version}
        >
          {data.version}
        </span>
      </div>
    </div>
  </div>
);

// New component: Data Info Card
const DataInfoCard = ({
  data,
  isRegression,
}: {
  data: any;
  isRegression: boolean;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
    <h3 className="text-lg font-medium text-gray-900 mb-3">
      Dataset Information
    </h3>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span className="text-sm text-gray-500 min-w-[100px]">
          Total Samples:
        </span>
        <span
          className="text-sm font-medium ml-2 text-right truncate max-w-[60%]"
          title={data.total_samples.toString()}
        >
          {data.total_samples}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-sm text-gray-500 min-w-[100px]">Features:</span>
        <span
          className="text-sm font-medium ml-2 text-right truncate max-w-[60%]"
          title={data.feature_count.toString()}
        >
          {data.feature_count}
        </span>
      </div>
      {!isRegression && (
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[100px]">Classes:</span>
          <span
            className="text-sm font-medium ml-2 text-right truncate max-w-[60%]"
            title={Object.keys(data.class_distribution || {}).length.toString()}
          >
            {Object.keys(data.class_distribution || {}).length}
          </span>
        </div>
      )}
      {data.validation_dataset_used && (
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[100px]">
            Validation Samples:
          </span>
          <span
            className="text-sm font-medium ml-2 text-right truncate max-w-[60%]"
            title={data.validation_samples?.toString() || "0"}
          >
            {data.validation_samples || 0}
          </span>
        </div>
      )}
      {data.test_dataset_used && (
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[100px]">
            Test Samples:
          </span>
          <span
            className="text-sm font-medium ml-2 text-right truncate max-w-[60%]"
            title={data.test_samples?.toString() || "0"}
          >
            {data.test_samples || 0}
          </span>
        </div>
      )}
    </div>
  </div>
);

// Add this utility function
const formatMetricValue = (
  value: number,
  decimalPlaces: number = 1
): string => {
  return value.toFixed(decimalPlaces);
};

// Advanced Metrics Card Component
const AdvancedMetricsCard = ({ data }: { data: any }) => {
  if (!data) return null;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-3">
        Advanced Metrics
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[120px]">
            Balanced Accuracy:
          </span>
          <span className="text-sm font-medium ml-2 text-right">
            {(data.balanced_accuracy * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[120px]">
            MCC:
          </span>
          <span className="text-sm font-medium ml-2 text-right">
            {data.matthews_correlation_coefficient.toFixed(3)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[120px]">
            Cohen's Kappa:
          </span>
          <span className="text-sm font-medium ml-2 text-right">
            {data.cohen_kappa.toFixed(3)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[120px]">
            Log Loss:
          </span>
          <span className="text-sm font-medium ml-2 text-right">
            {data.log_loss.toFixed(4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500 min-w-[120px]">
            Brier Score:
          </span>
          <span className="text-sm font-medium ml-2 text-right">
            {data.brier_score.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

// Class-wise Analysis Card Component
const ClassWiseAnalysisCard = ({ data }: { data: any }) => {
  if (!data) return null;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Class-wise Analysis
      </h3>
      <div className="space-y-4">
        {Object.entries(data).map(([className, metrics]: [string, any]) => (
          <div key={className} className="border-b border-gray-100 pb-3 last:border-b-0">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              Class {className}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Support:</span>
                <span className="font-medium">{metrics.support}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Predicted:</span>
                <span className="font-medium">{metrics.predicted_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Precision:</span>
                <span className="font-medium">{(metrics.precision * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recall:</span>
                <span className="font-medium">{(metrics.recall * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-gray-500">F1-Score:</span>
                <span className="font-medium">{(metrics.f1_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Dataset Comparison Card Component
const DatasetComparisonCard = ({ data }: { data: any }) => {
  if (!data) return null;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Dataset Performance Comparison
      </h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">Validation vs Test</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500 block mb-1">Validation</span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium">{(data.validation_metrics.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>F1-Score:</span>
                  <span className="font-medium">{(data.validation_metrics.f1 * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-gray-500 block mb-1">Test</span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium">{(data.test_metrics.accuracy * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>F1-Score:</span>
                  <span className="font-medium">{(data.test_metrics.f1 * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Performance Gaps</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Accuracy Difference:</span>
              <span className="font-medium">{Math.abs(data.performance_gap.accuracy_diff * 100).toFixed(3)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">F1 Difference:</span>
              <span className="font-medium">{Math.abs(data.performance_gap.f1_diff * 100).toFixed(3)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Detailed Classification Report Component
const DetailedClassificationReportCard = ({ data }: { data: any }) => {
  if (!data) return null;
  
  // Filter out non-class entries and overall metrics
  const classEntries = Object.entries(data).filter(([key, value]) => 
    !['accuracy', 'macro avg', 'weighted avg'].includes(key) && 
    typeof value === 'object'
  );
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Detailed Classification Report
      </h3>
      
      {/* Overall Accuracy */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">Overall Accuracy:</span>
          <span className="text-lg font-bold text-blue-900">
            {typeof data.accuracy === 'number' ? (data.accuracy * 100).toFixed(1) : 'N/A'}%
          </span>
        </div>
      </div>
      
      {/* Class-specific metrics */}
      <div className="space-y-4">
        {classEntries.map(([className, metrics]: [string, any]) => (
          <div key={className} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Class {className}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="text-center">
                <div className="text-gray-500 mb-1">Precision</div>
                <div className="font-semibold text-lg">
                  {(metrics.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 mb-1">Recall</div>
                <div className="font-semibold text-lg">
                  {(metrics.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 mb-1">F1-Score</div>
                <div className="font-semibold text-lg">
                  {(metrics['f1-score'] * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 mb-1">Support</div>
                <div className="font-semibold text-lg">{metrics.support}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary statistics */}
      {(data['macro avg'] || data['weighted avg']) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data['macro avg'] && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Macro Average</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Precision:</span>
                    <span className="font-medium">{(data['macro avg'].precision * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recall:</span>
                    <span className="font-medium">{(data['macro avg'].recall * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>F1-Score:</span>
                    <span className="font-medium">{(data['macro avg']['f1-score'] * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
            {data['weighted avg'] && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Weighted Average</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Precision:</span>
                    <span className="font-medium">{(data['weighted avg'].precision * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recall:</span>
                    <span className="font-medium">{(data['weighted avg'].recall * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>F1-Score:</span>
                    <span className="font-medium">{(data['weighted avg']['f1-score'] * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RegressionMetricCard = ({
  title,
  value,
  status,
  description,
  unit = "",
  isPercentage = false,
  infoData,
}: {
  title: string;
  value: number;
  status: string;
  description: string;
  unit?: string;
  isPercentage?: boolean;
  infoData: any;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <InfoTooltip
        title={title}
        entityType="metric"
        entityName={title}
        data={{
          value: value,
          status: status,
          description: description,
          isPercentage: isPercentage,
        }}
      />
    </div>
    <div className="flex items-end justify-between">
      <div>
        <p className="text-2xl font-bold text-gray-900">
          {isPercentage
            ? `${(value * 100).toFixed(1)}%`
            : value.toFixed(3)}
          {unit}
        </p>
        <p
          className={`text-sm font-medium ${
            status === "Excellent"
              ? "text-green-600"
              : status === "Good"
              ? "text-blue-600"
              : status === "Fair"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {status}
        </p>
      </div>
    </div>

    <p
      className="text-xs text-gray-500 mt-2 line-clamp-2"
      title={description}
    >
      {description}
    </p>
  </div>
);

// Get status for R² (higher is better)
const getR2Status = (value: number) => {
  if (value >= 0.95) return "Excellent";
  if (value >= 0.9) return "Good";
  if (value >= 0.8) return "Above Target";
  if (value >= 0.7) return "On Target";
  return "Needs Improvement";
};

// Get status for error metrics (lower is better)
const getErrorMetricStatus = (value: number, metricType: string) => {
  // These thresholds would ideally be dynamic based on the dataset
  // Using placeholder values that should be adjusted for specific use cases

  // For MSE
  if (metricType === "MSE") {
    if (value < 50) return "Excellent";
    if (value < 100) return "Good";
    if (value < 200) return "Above Target";
    if (value < 400) return "On Target";
    return "Needs Improvement";
  }

  // For RMSE
  if (metricType === "RMSE") {
    if (value < 5) return "Excellent";
    if (value < 10) return "Good";
    if (value < 15) return "Above Target";
    if (value < 20) return "On Target";
    return "Needs Improvement";
  }

  // For MAE
  if (metricType === "MAE") {
    if (value < 4) return "Excellent";
    if (value < 8) return "Good";
    if (value < 12) return "Above Target";
    if (value < 16) return "On Target";
    return "Needs Improvement";
  }

  return "Not Available";
};

const ResidualPlot = ({ residuals }: { residuals: number[] }) => (
  <div className="w-full h-full">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-700">Residual Analysis</h3>
      <InfoTooltip
        title="About Residual Analysis"
        entityType="chart"
        entityName="Residual Analysis"
        data={{
          chartData: residuals.map((residual, index) => ({ index, residual })),
        }}
      />
    </div>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="index"
            name="Sample Index"
            label={{
              value: "Sample Index",
              position: "insideBottomRight",
              offset: -10,
            }}
          />
          <YAxis
            type="number"
            dataKey="residual"
            name="Residual"
            label={{ value: "Residual", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(value: any) => [value.toFixed(2), "Residual"]}
            labelFormatter={(value) => `Sample: ${value}`}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "8px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
              border: "1px solid #E5E7EB",
            }}
          />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <Scatter
            name="Residuals"
            data={residuals.map((residual, index) => ({ index, residual }))}
            fill="#8884d8"
            opacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const PerformancePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);

  // New state to track if analysis exists
  const [hasAnalysis, setHasAnalysis] = useState(false);
  
  // New state for selected model
  const [selectedModel, setSelectedModel] = useState<{
    model_id: string;
    model_version: string;
    display_name: string;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Function to fetch performance data for a specific model
  const fetchPerformanceData = async (modelId: string, modelVersion: string) => {
    setLoadingPerformance(true);
    console.log("Fetching performance data for:", { projectId: id, modelId, modelVersion });
    
    const performanceApiUrl = apiUrl(`ml/performance/${id}/${modelId}/${modelVersion}`);
    
    try {
      const accessToken = localStorage.getItem("access_token");
      
      if (!accessToken) {
        console.error("No access token found");
        return;
      }

      if (!id) {
        console.error("No project ID found");
        return;
      }

      if (!modelId || !modelVersion) {
        console.error("Missing modelId or modelVersion:", { modelId, modelVersion });
        return;
      }

      console.log("Making API request to:", performanceApiUrl);

      const response = await fetch(
        performanceApiUrl,
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
        console.log("Performance API Response:", apiData);
        
        const formattedData = formatPerformanceData(apiData);
        setPerformanceMetrics(formattedData);
        setHasAnalysis(true);
      } else {
        const errorText = await response.text().catch(() => "Unable to read error response");
        console.error("Performance API error:", {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          url: response.url
        });
        setHasAnalysis(false);
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      console.error("Request details:", {
        url: performanceApiUrl,
        projectId: id,
        modelId,
        modelVersion,
        hasToken: !!localStorage.getItem("access_token")
      });
      setHasAnalysis(false);
    } finally {
      setLoadingPerformance(false);
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
              const displayName = `Model v${model.model_version}`;
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
                    fetchPerformanceData(model.model_id, model.model_version);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                    selectedModel?.model_id === model.model_id &&
                    selectedModel?.model_version === model.model_version
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-700"
                  }`}
                  role="menuitem"
                >
                  <span className="font-medium">{displayName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);



        // Get access token from localStorage
        const accessToken = localStorage.getItem("access_token");

        if (!accessToken) {
          console.error("No access token found in localStorage");
          setLoading(false);
          return;
        }

        // Use the id from useParams instead of undefined projectId
        // Query Supabase for models
        const { data, error } = await supabase
          .from("modeldetails")
          .select("model_id, project_id, dataset_id, model_version")
          .eq("project_id", id);

        if (error) {
          throw error;
        }
        console.log("hellllllllllllllll");
        console.log("data", data);

        setModels(data || []);
        console.log("projectid", id);
        console.log("data", data);
        
        // Set hasAnalysis to true if we have models, but don't auto-fetch performance data
        setHasAnalysis(data && data.length > 0);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
      }, [id]);

  const breadcrumbSegments = [
    { title: "Projects", href: "/home" },
    { title: "Investment Portfolio Analysis", href: `/projects/${id}` },
    { title: "Performance", href: `/projects/${id}/performance` },
  ];

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

  // If no analysis exists, show premium empty state
  if (!hasAnalysis) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900">
              Performance Analysis
            </h1>
            <p className="mt-2 text-gray-600">
              Evaluate your model's accuracy and performance metrics
            </p>
          </div>

          {/* Premium Empty State */}
          <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mb-6">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              No Performance Analysis Available
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Upload your model to analyze its performance metrics including
              accuracy, precision, recall, and F1 score. Our system will
              generate comprehensive visualizations to help you understand your
              model's strengths and weaknesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(`/projects/${id}`)}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
              >
                Return to Overview
              </button>
            </div>
          </div>

          {/* Features Preview Section */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Performance Analysis Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Comprehensive Metrics
                </h4>
                <p className="text-gray-600">
                  Track accuracy, precision, recall, F1 score, and AUC-ROC
                  across different thresholds and data segments.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Interactive Visualizations
                </h4>
                <p className="text-gray-600">
                  Explore dynamic charts and plots to understand performance
                  patterns and identify areas for improvement.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="h-6 w-6 text-amber-600"
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
                  Actionable Insights
                </h4>
                <p className="text-gray-600">
                  Receive recommendations based on model performance to help
                  optimize and improve your AI system.
                </p>
              </div>
            </div>
          </div>

          {/* Additional information section */}
          <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Why Performance Analysis Matters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-700 mb-4">
                  A comprehensive performance analysis helps you understand how
                  well your model works across different scenarios and data
                  distributions. By evaluating key metrics, you can:
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
                      Identify prediction strengths and weaknesses
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
                      Compare model versions to track improvements
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
                      Optimize decision thresholds for your use case
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
                      Ensure reliability before deployment
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <h4 className="text-base font-medium text-gray-900 mb-3">
                  Performance Report Preview
                </h4>
                <div className="flex flex-col space-y-3">
                  <div className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Accuracy Score
                    </span>
                    <div className="h-4 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-700">
                      Precision Score
                    </span>
                    <div className="h-4 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-700">Recall Score</span>
                    <div className="h-4 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200 flex justify-between items-center">
                    <span className="text-sm text-gray-700">F1 Score</span>
                    <div className="h-4 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-300 rounded-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                  Upload your model to generate a full performance report
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Use properly formatted performance data or default empty data
  const dataToDisplay = performanceMetrics || formatPerformanceData(null);

  // Return just the content without wrapping in AppLayout
  // This assumes that this page is rendered within a layout at the router level
  const content = false ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Performance Analysis
        </h1>
        <p className="text-gray-500 mt-1">
          Monitor and analyze model performance metrics
        </p>
      </div>

      {/* Model and Data Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModelInfoCard data={dataToDisplay.modelInfo} />
        <DataInfoCard
          data={dataToDisplay.dataInfo}
          isRegression={dataToDisplay.isRegression}
        />
      </div>

      {/* Advanced Analytics Cards - Only for classification */}
      {!dataToDisplay.isRegression && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {dataToDisplay.advanced_metrics && (
            <AdvancedMetricsCard data={dataToDisplay.advanced_metrics} />
          )}
          {dataToDisplay.class_wise_analysis && (
            <ClassWiseAnalysisCard data={dataToDisplay.class_wise_analysis} />
          )}
          {dataToDisplay.dataset_comparison && (
            <DatasetComparisonCard data={dataToDisplay.dataset_comparison} />
          )}
        </div>
      )}

      {/* Key Metrics Section - Conditional rendering based on model type */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {dataToDisplay.isRegression ? (
          // Regression Metrics
          <>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <RegressionMetricCard
                title="MSE"
                value={dataToDisplay.regression_metrics.mse}
                status={getErrorMetricStatus(
                  dataToDisplay.regression_metrics.mse,
                  "MSE"
                )}
                description="Mean Squared Error - Average of squared differences between predicted and actual values"
                infoData={dataToDisplay.regression_metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <RegressionMetricCard
                title="RMSE"
                value={dataToDisplay.regression_metrics.rmse}
                status={getErrorMetricStatus(
                  dataToDisplay.regression_metrics.rmse,
                  "RMSE"
                )}
                description="Root Mean Squared Error - Square root of MSE"
                infoData={dataToDisplay.regression_metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <RegressionMetricCard
                title="MAE"
                value={dataToDisplay.regression_metrics.mae}
                status={getErrorMetricStatus(
                  dataToDisplay.regression_metrics.mae,
                  "MAE"
                )}
                description="Mean Absolute Error - Average of absolute differences between predicted and actual values"
                infoData={dataToDisplay.regression_metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <RegressionMetricCard
                title="R²"
                value={dataToDisplay.regression_metrics.r2}
                status={getR2Status(dataToDisplay.regression_metrics.r2)}
                description="Coefficient of determination - Proportion of variance explained by the model"
                isPercentage={true}
                infoData={dataToDisplay.regression_metrics}
              />
            </motion.div>
          </>
        ) : (
          // Classification Metrics (existing code)
          <>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MetricCard
                title="Accuracy"
                value={dataToDisplay.metrics?.accuracy || 0}
                status={
                  dataToDisplay.metrics?.status?.accuracy || "Not Available"
                }
                description="Overall prediction accuracy"
                infoData={dataToDisplay.metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MetricCard
                title="Precision"
                value={dataToDisplay.metrics?.precision || 0}
                status={
                  dataToDisplay.metrics?.status?.precision || "Not Available"
                }
                description="Positive predictive value"
                infoData={dataToDisplay.metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MetricCard
                title="Recall"
                value={dataToDisplay.metrics?.recall || 0}
                status={
                  dataToDisplay.metrics?.status?.recall || "Not Available"
                }
                description="True positive rate"
                infoData={dataToDisplay.metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MetricCard
                title="F1 Score"
                value={dataToDisplay.metrics?.f1Score || 0}
                status={
                  dataToDisplay.metrics?.status?.f1Score || "Not Available"
                }
                description="Harmonic mean of precision and recall"
                infoData={dataToDisplay.metrics}
              />
            </motion.div>
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <MetricCard
                title="AUC-ROC"
                value={dataToDisplay.metrics?.aucRoc || 0}
                status={
                  dataToDisplay.metrics?.status?.aucRoc || "Not Available"
                }
                description="Area under ROC curve"
                infoData={dataToDisplay.metrics}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* Replace Confusion Matrix and Class Distribution with Residual Plot for regression */}
      {dataToDisplay.isRegression ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Residual Plot */}
          <motion.div
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Residual Analysis
                </h2>
                <p className="text-sm text-gray-500">
                  Difference between predicted and actual values
                </p>
              </div>
            </div>
            <ResidualPlot
              residuals={dataToDisplay.residual_analysis.residuals}
            />
          </motion.div>

          {/* Residual Statistics */}
          <motion.div
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Residual Statistics
                </h2>
                <p className="text-sm text-gray-500">
                  Statistical properties of model residuals
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Mean Residual
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {dataToDisplay.residual_analysis.mean_residual.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ideally close to zero for unbiased models
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Residual Standard Deviation
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {dataToDisplay.residual_analysis.std_residual.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Measure of residual dispersion
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Number of Samples
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  {dataToDisplay.residual_analysis.residuals.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        // Original Classification charts (Confusion Matrix, etc.)
        // ... existing code ...
        <>
          {/* Confusion Matrix */}
          <motion.div
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Confusion Matrix
                </h2>
                <p className="text-sm text-gray-500">
                  Model prediction correctness
                </p>
              </div>
            </div>
            <ConfusionMatrixChart data={dataToDisplay.confusionMatrix || []} />
          </motion.div>

          {/* Class Distribution */}
          <motion.div
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Class Distribution
                </h2>
                <p className="text-sm text-gray-500">
                  Distribution of target classes
                </p>
              </div>
              <InfoTooltip
                title="Class Distribution"
                entityType="chart"
                entityName="Class Distribution"
                data={{
                  chartData: Object.entries(
                    dataToDisplay.dataInfo?.class_distribution || {}
                  ).map(([key, value]) => ({ name: key, value })),
                }}
              />
            </div>
            <ClassDistributionChart
              data={dataToDisplay.dataInfo?.class_distribution || {}}
            />
          </motion.div>
        </>
      )}

      {/* Performance Curves */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ROC Curve - Only show for classification models */}
        {!dataToDisplay.isRegression && (
          <motion.div
            whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  ROC Curve
                </h2>
                <p className="text-sm text-gray-500">
                  True positive rate vs false positive rate
                </p>
              </div>
              <InfoTooltip
                title="ROC Curve"
                entityType="chart"
                entityName="ROC Curve"
                data={{
                  chartData: dataToDisplay.rocCurve || [],
                }}
              />
            </div>
            <ROCCurveChart
              data={dataToDisplay.rocCurve || []}
              aucValue={dataToDisplay.metrics?.aucRoc}
            />
          </motion.div>
        )}

        {/* Learning Curve - Always show */}
        <motion.div
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
          className={`bg-white rounded-xl p-6 shadow-md border border-gray-100 ${
            dataToDisplay.isRegression ? "md:col-span-2" : ""
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Learning Curves
              </h2>
              <p className="text-sm text-gray-500">
                Training vs validation performance
              </p>
            </div>
            <InfoTooltip
              title="Learning Curves"
              entityType="chart"
              entityName="Learning Curves"
              data={{
                chartData: (dataToDisplay.learningCurve?.trainSizes || []).map(
                  (size, index) => ({
                    size,
                    trainScore:
                      (dataToDisplay.learningCurve?.trainScores || [])[index] ||
                      0,
                    testScore:
                      (dataToDisplay.learningCurve?.testScores || [])[index] ||
                      0,
                  })
                ),
              }}
            />
          </div>
          <LearningCurveChart
            data={
              dataToDisplay.learningCurve || {
                trainSizes: [],
                trainScores: [],
                testScores: [],
              }
            }
          />
        </motion.div>
      </div>

      {/* Cross-Validation Results */}
      <motion.div
        whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Cross-Validation Results
            </h2>
            <p className="text-sm text-gray-500">
              Model Stability Across Folds
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Mean Score
            </h3>
            <p className="text-2xl font-bold text-gray-900 break-words">
              {formatMetricValue(
                (dataToDisplay.cross_validation?.mean_score || 0) * 100
              )}
              %
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Standard Deviation
            </h3>
            <p className="text-2xl font-bold text-gray-900 break-words">
              {formatMetricValue(
                (dataToDisplay.cross_validation?.std_score || 0) * 100
              )}
              %
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Folds</h3>
            <p className="text-2xl font-bold text-gray-900 break-words">
              {dataToDisplay.cross_validation?.scores?.length || 0}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Validation Comparison Section */}
      {dataToDisplay.validation_comparison && (
        <motion.div
          whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Training vs Validation Comparison
              </h2>
              <p className="text-sm text-gray-500">
                Model Generalization Analysis
              </p>
            </div>
          </div>
          
          {/* Training vs Validation Metrics */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Training Metrics */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-3">Training Set</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Accuracy:</span>
                    <span className="font-medium text-blue-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.accuracy || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Precision:</span>
                    <span className="font-medium text-blue-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.precision || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Recall:</span>
                    <span className="font-medium text-blue-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.recall || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">F1 Score:</span>
                    <span className="font-medium text-blue-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.f1 || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Metrics */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-md font-semibold text-green-800 mb-3">Validation Set</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Accuracy:</span>
                    <span className="font-medium text-green-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.accuracy || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Precision:</span>
                    <span className="font-medium text-green-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.precision || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Recall:</span>
                    <span className="font-medium text-green-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.recall || 0) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">F1 Score:</span>
                    <span className="font-medium text-green-800">
                      {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.f1 || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Gaps */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Gaps</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Accuracy Gap</h4>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue(Math.abs((dataToDisplay.validation_comparison?.performance_gaps.accuracy_gap || 0) * 100))}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(dataToDisplay.validation_comparison?.performance_gaps.accuracy_gap || 0) >= 0 ? 'Training higher' : 'Validation higher'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Precision Gap</h4>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue(Math.abs((dataToDisplay.validation_comparison?.performance_gaps.precision_gap || 0) * 100))}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(dataToDisplay.validation_comparison?.performance_gaps.precision_gap || 0) >= 0 ? 'Training higher' : 'Validation higher'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recall Gap</h4>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue(Math.abs((dataToDisplay.validation_comparison?.performance_gaps.recall_gap || 0) * 100))}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(dataToDisplay.validation_comparison?.performance_gaps.recall_gap || 0) >= 0 ? 'Training higher' : 'Validation higher'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">F1 Gap</h4>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue(Math.abs((dataToDisplay.validation_comparison?.performance_gaps.f1_gap || 0) * 100))}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(dataToDisplay.validation_comparison?.performance_gaps.f1_gap || 0) >= 0 ? 'Training higher' : 'Validation higher'}
                </p>
              </div>
            </div>
          </div>

          {/* Overfitting Indicators */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Overfitting Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Accuracy Overfitting</h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison?.overfitting_indicators.accuracy_overfitting ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className={`font-medium ${dataToDisplay.validation_comparison?.overfitting_indicators.accuracy_overfitting ? 'text-red-600' : 'text-green-600'}`}>
                    {dataToDisplay.validation_comparison?.overfitting_indicators.accuracy_overfitting ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">F1 Overfitting</h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison?.overfitting_indicators.f1_overfitting ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className={`font-medium ${dataToDisplay.validation_comparison?.overfitting_indicators.f1_overfitting ? 'text-red-600' : 'text-green-600'}`}>
                    {dataToDisplay.validation_comparison?.overfitting_indicators.f1_overfitting ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Overfitting Score</h4>
                <p className="text-xl font-bold text-gray-900">
                  {formatMetricValue((dataToDisplay.validation_comparison?.overfitting_indicators.overall_overfitting_score || 0) * 100)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Lower is better</p>
              </div>
            </div>
          </div>

          {/* Generalization Assessment */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Generalization Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Good Generalization</h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison?.generalization_assessment.good_generalization ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-medium ${dataToDisplay.validation_comparison?.generalization_assessment.good_generalization ? 'text-green-600' : 'text-gray-600'}`}>
                    {dataToDisplay.validation_comparison?.generalization_assessment.good_generalization ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Acceptable Generalization</h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison?.generalization_assessment.acceptable_generalization ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-medium ${dataToDisplay.validation_comparison?.generalization_assessment.acceptable_generalization ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {dataToDisplay.validation_comparison?.generalization_assessment.acceptable_generalization ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Poor Generalization</h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison?.generalization_assessment.poor_generalization ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-medium ${dataToDisplay.validation_comparison?.generalization_assessment.poor_generalization ? 'text-red-600' : 'text-gray-600'}`}>
                    {dataToDisplay.validation_comparison?.generalization_assessment.poor_generalization ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detailed Classification Report */}
      {!dataToDisplay.isRegression && dataToDisplay.detailed_classification_report && (
        <DetailedClassificationReportCard data={dataToDisplay.detailed_classification_report} />
      )}
    </motion.div>
  ) : (
    <div className="p-8">
      <div className="mt-8">
        {models.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Performance Analysis
                </h1>
                <p className="text-gray-500 mt-1">
                  Monitor and analyze model performance metrics
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Model:
                </label>
                <ModelSelectorDropdown />
              </div>
            </div>

            {/* Loading state for performance data */}
            {loadingPerformance && (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                  <span className="text-gray-600">Loading performance data...</span>
                </div>
              </div>
            )}

            {/* Message when no model is selected */}
            {!selectedModel && !loadingPerformance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">Select a Model</h3>
                <p className="text-blue-700">
                  Please select a model from the dropdown above to view its performance analysis.
                </p>
              </div>
            )}

            {/* Performance metrics content - only show when model is selected and not loading */}
            {selectedModel && !loadingPerformance && performanceMetrics && (
              <>
                {/* Model and Data Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ModelInfoCard data={dataToDisplay.modelInfo} />
              <DataInfoCard
                data={dataToDisplay.dataInfo}
                isRegression={dataToDisplay.isRegression}
              />
            </div>

            {/* Advanced Analytics Cards - Only for classification */}
            {!dataToDisplay.isRegression && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dataToDisplay.advanced_metrics && (
                  <AdvancedMetricsCard data={dataToDisplay.advanced_metrics} />
                )}
                {dataToDisplay.class_wise_analysis && (
                  <ClassWiseAnalysisCard data={dataToDisplay.class_wise_analysis} />
                )}
                {dataToDisplay.dataset_comparison && (
                  <DatasetComparisonCard data={dataToDisplay.dataset_comparison} />
                )}
              </div>
            )}

            {/* Key Metrics Section - Conditional rendering based on model type */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {dataToDisplay.isRegression ? (
                // Regression Metrics
                <>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <RegressionMetricCard
                      title="MSE"
                      value={dataToDisplay.regression_metrics.mse}
                      status={getErrorMetricStatus(
                        dataToDisplay.regression_metrics.mse,
                        "MSE"
                      )}
                      description="Mean Squared Error - Average of squared differences between predicted and actual values"
                      infoData={dataToDisplay.regression_metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <RegressionMetricCard
                      title="RMSE"
                      value={dataToDisplay.regression_metrics.rmse}
                      status={getErrorMetricStatus(
                        dataToDisplay.regression_metrics.rmse,
                        "RMSE"
                      )}
                      description="Root Mean Squared Error - Square root of MSE"
                      infoData={dataToDisplay.regression_metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <RegressionMetricCard
                      title="MAE"
                      value={dataToDisplay.regression_metrics.mae}
                      status={getErrorMetricStatus(
                        dataToDisplay.regression_metrics.mae,
                        "MAE"
                      )}
                      description="Mean Absolute Error - Average of absolute differences between predicted and actual values"
                      infoData={dataToDisplay.regression_metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <RegressionMetricCard
                      title="R²"
                      value={dataToDisplay.regression_metrics.r2}
                      status={getR2Status(dataToDisplay.regression_metrics.r2)}
                      description="Coefficient of determination - Proportion of variance explained by the model"
                      isPercentage={true}
                      infoData={dataToDisplay.regression_metrics}
                    />
                  </motion.div>
                </>
              ) : (
                // Classification Metrics (existing code)
                <>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <MetricCard
                      title="Accuracy"
                      value={dataToDisplay.metrics?.accuracy || 0}
                      status={
                        dataToDisplay.metrics?.status?.accuracy ||
                        "Not Available"
                      }
                      description="Overall prediction accuracy"
                      infoData={dataToDisplay.metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <MetricCard
                      title="Precision"
                      value={dataToDisplay.metrics?.precision || 0}
                      status={
                        dataToDisplay.metrics?.status?.precision ||
                        "Not Available"
                      }
                      description="Positive predictive value"
                      infoData={dataToDisplay.metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <MetricCard
                      title="Recall"
                      value={dataToDisplay.metrics?.recall || 0}
                      status={
                        dataToDisplay.metrics?.status?.recall || "Not Available"
                      }
                      description="True positive rate"
                      infoData={dataToDisplay.metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <MetricCard
                      title="F1 Score"
                      value={dataToDisplay.metrics?.f1Score || 0}
                      status={
                        dataToDisplay.metrics?.status?.f1Score ||
                        "Not Available"
                      }
                      description="Harmonic mean of precision and recall"
                      infoData={dataToDisplay.metrics}
                    />
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <MetricCard
                      title="AUC-ROC"
                      value={dataToDisplay.metrics?.aucRoc || 0}
                      status={
                        dataToDisplay.metrics?.status?.aucRoc || "Not Available"
                      }
                      description="Area under ROC curve"
                      infoData={dataToDisplay.metrics}
                    />
                  </motion.div>
                </>
              )}
            </div>

            {/* Replace Confusion Matrix and Class Distribution with Residual Plot for regression */}
            {dataToDisplay.isRegression ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Residual Plot */}
                <motion.div
                  whileHover={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Residual Analysis
                      </h2>
                      <p className="text-sm text-gray-500">
                        Difference between predicted and actual values
                      </p>
                    </div>
                  </div>
                  <ResidualPlot
                    residuals={dataToDisplay.residual_analysis.residuals}
                  />
                </motion.div>

                {/* Residual Statistics */}
                <motion.div
                  whileHover={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Residual Statistics
                      </h2>
                      <p className="text-sm text-gray-500">
                        Statistical properties of model residuals
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Mean Residual
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {dataToDisplay.residual_analysis.mean_residual.toFixed(
                          4
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Ideally close to zero for unbiased models
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Residual Standard Deviation
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {dataToDisplay.residual_analysis.std_residual.toFixed(
                          4
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Measure of residual dispersion
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Number of Samples
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {dataToDisplay.residual_analysis.residuals.length}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              // Original Classification charts (Confusion Matrix, etc.)
              // ... existing code ...
              <>
                {/* Confusion Matrix */}
                <motion.div
                  whileHover={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Confusion Matrix
                      </h2>
                      <p className="text-sm text-gray-500">
                        Model prediction correctness
                      </p>
                    </div>
                  </div>
                  <ConfusionMatrixChart
                    data={dataToDisplay.confusionMatrix || []}
                  />
                </motion.div>

                {/* Class Distribution */}
                <motion.div
                  whileHover={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Class Distribution
                      </h2>
                      <p className="text-sm text-gray-500">
                        Distribution of target classes
                      </p>
                    </div>
                    <InfoTooltip
                      title="Class Distribution"
                      entityType="chart"
                      entityName="Class Distribution"
                      data={{
                        chartData: Object.entries(
                          dataToDisplay.dataInfo?.class_distribution || {}
                        ).map(([key, value]) => ({ name: key, value })),
                      }}
                    />
                  </div>
                  <ClassDistributionChart
                    data={dataToDisplay.dataInfo?.class_distribution || {}}
                  />
                </motion.div>
              </>
            )}

            {/* Performance Curves */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ROC Curve - Only show for classification models */}
              {!dataToDisplay.isRegression && (
                <motion.div
                  whileHover={{
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        ROC Curve
                      </h2>
                      <p className="text-sm text-gray-500">
                        True positive rate vs false positive rate
                      </p>
                    </div>
                    <InfoTooltip
                      title="ROC Curve"
                      entityType="chart"
                      entityName="ROC Curve"
                      data={{
                        chartData: dataToDisplay.rocCurve || [],
                      }}
                    />
                  </div>
                  <ROCCurveChart
                    data={dataToDisplay.rocCurve}
                    aucValue={dataToDisplay.metrics?.aucRoc}
                  />
                </motion.div>
              )}

              {/* Learning Curve - Always show */}
              <motion.div
                whileHover={{
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
                transition={{ duration: 0.3 }}
                className={`bg-white rounded-xl p-6 shadow-md border border-gray-100 ${
                  dataToDisplay.isRegression ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Learning Curves
                    </h2>
                    <p className="text-sm text-gray-500">
                      Training vs validation performance
                    </p>
                  </div>
                  <InfoTooltip
                    title="Learning Curves"
                    entityType="chart"
                    entityName="Learning Curves"
                    data={{
                      chartData: (
                        dataToDisplay.learningCurve?.trainSizes || []
                      ).map((size, index) => ({
                        size,
                        trainScore:
                          (dataToDisplay.learningCurve?.trainScores || [])[
                            index
                          ] || 0,
                        testScore:
                          (dataToDisplay.learningCurve?.testScores || [])[
                            index
                          ] || 0,
                      })),
                    }}
                  />
                </div>
                <LearningCurveChart
                  data={
                    dataToDisplay.learningCurve || {
                      trainSizes: [],
                      trainScores: [],
                      testScores: [],
                    }
                  }
                />
              </motion.div>
            </div>

            {/* Cross-Validation Results */}
            <motion.div
              whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Cross-Validation Results
                  </h2>
                  <p className="text-sm text-gray-500">
                    Model Stability Across Folds
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Mean Score
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 break-words">
                    {formatMetricValue(
                      (dataToDisplay.cross_validation?.mean_score || 0) * 100
                    )}
                    %
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Standard Deviation
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 break-words">
                    {formatMetricValue(
                      (dataToDisplay.cross_validation?.std_score || 0) * 100
                    )}
                    %
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Folds
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 break-words">
                    {dataToDisplay.cross_validation?.scores?.length || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Validation Comparison Section */}
            {dataToDisplay.validation_comparison && (
              <motion.div
                whileHover={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Training vs Validation Comparison
                    </h2>
                    <p className="text-sm text-gray-500">
                      Model Generalization Analysis
                    </p>
                  </div>
                </div>
                
                {/* Training vs Validation Metrics */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Training Metrics */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-md font-semibold text-blue-800 mb-3">Training Set</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Accuracy:</span>
                          <span className="font-medium text-blue-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.accuracy || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Precision:</span>
                          <span className="font-medium text-blue-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.precision || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Recall:</span>
                          <span className="font-medium text-blue-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.recall || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">F1 Score:</span>
                          <span className="font-medium text-blue-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.training_metrics.f1 || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Validation Metrics */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="text-md font-semibold text-green-800 mb-3">Validation Set</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Accuracy:</span>
                          <span className="font-medium text-green-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.accuracy || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Precision:</span>
                          <span className="font-medium text-green-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.precision || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Recall:</span>
                          <span className="font-medium text-green-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.recall || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">F1 Score:</span>
                          <span className="font-medium text-green-800">
                            {formatMetricValue((dataToDisplay.validation_comparison?.validation_metrics.f1 || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Gaps */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Gaps</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Accuracy Gap</h4>
                      <p className="text-xl font-bold text-gray-900">
                        {formatMetricValue(Math.abs(dataToDisplay.validation_comparison.performance_gaps.accuracy_gap * 100))}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataToDisplay.validation_comparison.performance_gaps.accuracy_gap >= 0 ? 'Training higher' : 'Validation higher'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Precision Gap</h4>
                      <p className="text-xl font-bold text-gray-900">
                        {formatMetricValue(Math.abs(dataToDisplay.validation_comparison.performance_gaps.precision_gap * 100))}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataToDisplay.validation_comparison.performance_gaps.precision_gap >= 0 ? 'Training higher' : 'Validation higher'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recall Gap</h4>
                      <p className="text-xl font-bold text-gray-900">
                        {formatMetricValue(Math.abs(dataToDisplay.validation_comparison.performance_gaps.recall_gap * 100))}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataToDisplay.validation_comparison.performance_gaps.recall_gap >= 0 ? 'Training higher' : 'Validation higher'}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">F1 Gap</h4>
                      <p className="text-xl font-bold text-gray-900">
                        {formatMetricValue(Math.abs(dataToDisplay.validation_comparison.performance_gaps.f1_gap * 100))}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dataToDisplay.validation_comparison.performance_gaps.f1_gap >= 0 ? 'Training higher' : 'Validation higher'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overfitting Indicators */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Overfitting Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Accuracy Overfitting</h4>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison.overfitting_indicators.accuracy_overfitting ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className={`font-medium ${dataToDisplay.validation_comparison.overfitting_indicators.accuracy_overfitting ? 'text-red-600' : 'text-green-600'}`}>
                          {dataToDisplay.validation_comparison.overfitting_indicators.accuracy_overfitting ? 'Detected' : 'Not Detected'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">F1 Overfitting</h4>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison.overfitting_indicators.f1_overfitting ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className={`font-medium ${dataToDisplay.validation_comparison.overfitting_indicators.f1_overfitting ? 'text-red-600' : 'text-green-600'}`}>
                          {dataToDisplay.validation_comparison.overfitting_indicators.f1_overfitting ? 'Detected' : 'Not Detected'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Overfitting Score</h4>
                      <p className="text-xl font-bold text-gray-900">
                        {formatMetricValue(dataToDisplay.validation_comparison.overfitting_indicators.overall_overfitting_score * 100)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Lower is better</p>
                    </div>
                  </div>
                </div>

                {/* Generalization Assessment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Generalization Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Good Generalization</h4>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison.generalization_assessment.good_generalization ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className={`font-medium ${dataToDisplay.validation_comparison.generalization_assessment.good_generalization ? 'text-green-600' : 'text-gray-600'}`}>
                          {dataToDisplay.validation_comparison.generalization_assessment.good_generalization ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Acceptable Generalization</h4>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison.generalization_assessment.acceptable_generalization ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                        <span className={`font-medium ${dataToDisplay.validation_comparison.generalization_assessment.acceptable_generalization ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {dataToDisplay.validation_comparison.generalization_assessment.acceptable_generalization ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Poor Generalization</h4>
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${dataToDisplay.validation_comparison.generalization_assessment.poor_generalization ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                        <span className={`font-medium ${dataToDisplay.validation_comparison.generalization_assessment.poor_generalization ? 'text-red-600' : 'text-gray-600'}`}>
                          {dataToDisplay.validation_comparison.generalization_assessment.poor_generalization ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detailed Classification Report */}
            {!dataToDisplay.isRegression && dataToDisplay.detailed_classification_report && (
              <DetailedClassificationReportCard data={dataToDisplay.detailed_classification_report} />
            )}
              </>
            )}
          </motion.div>
        ) : (
          <UploadModal />
        )}
      </div>
    </div>
  );

  return content;
};

export default PerformancePage;
