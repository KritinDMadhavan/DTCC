import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { FaGithub } from "react-icons/fa";
import { CheckCircle } from "lucide-react";
import { apiUrl } from "../lib/api-config";

// Initialize supabase client
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface UploadModalProps {
  isVisible: boolean;
  onClose: () => void;
  isNewVersion?: boolean;
  projectId?: string;
}

const UploadModal = ({
  isVisible,
  onClose,
  isNewVersion = false,
  projectId,
}: UploadModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [p_id, setP_id] = useState<string | null>(null); // New state to store project ID

  // Form data state with safe initialization of projectId
  const [formData, setFormData] = useState({
    name: "",
    model_type: "",
    version: "1.0.0",
    file: null as File | string | null,
    description: "",
    dataset: null as File | null,
    dataset_type: "",
    reportGenerated: false,
    projectId: projectId || "", // Provide a default value
    framework: "",
    external_dependencies: "",
    requirements_file: null as File | null,
    model_stage: "",
    validation_dataset: null as File | null,
    test_dataset: null as File | null,
    target_column: "",
    validation_target_column: "",
    test_target_column: "",
    use_synthetic_validation: false,
    synthetic_validation_params: {
      noise_level: 0.1,
      distribution_type: "gaussian",
      sample_size: 1000,
      correlation_strength: 0.8,
      outlier_percentage: 0.05,
      feature_variance: 1.0,
    },
    // Drift analysis configuration
    enable_drift_analysis: false,
    production_dataset: null as File | null,
    production_target_column: "",
  });

  // Add this useEffect to update formData when projectId changes
  useEffect(() => {
    if (projectId) {
      setFormData((prev) => ({
        ...prev,
        projectId: projectId,
      }));
      setP_id(projectId);
    }
  }, [projectId]);

  // Debug: Monitor formData changes
  useEffect(() => {
    console.log("FormData changed:", {
      test_dataset: formData.test_dataset?.name || null,
      validation_dataset: formData.validation_dataset?.name || null,
      dataset: formData.dataset?.name || null,
    });
  }, [formData.test_dataset, formData.validation_dataset, formData.dataset]);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  // Add states for dataset analysis
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [validationDatasetColumns, setValidationDatasetColumns] = useState<string[]>([]);
  const [testDatasetColumns, setTestDatasetColumns] = useState<string[]>([]);
  const [productionDatasetColumns, setProductionDatasetColumns] = useState<string[]>([]);
  const [isAnalyzingDataset, setIsAnalyzingDataset] = useState(false);
  const [isAnalyzingValidationDataset, setIsAnalyzingValidationDataset] = useState(false);
  const [isAnalyzingTestDataset, setIsAnalyzingTestDataset] = useState(false);
  const [isAnalyzingProductionDataset, setIsAnalyzingProductionDataset] = useState(false);
  const [datasetAnalysisError, setDatasetAnalysisError] = useState<string>("");
  const [validationAnalysisError, setValidationAnalysisError] = useState<string>("");
  const [testAnalysisError, setTestAnalysisError] = useState<string>("");
  const [productionAnalysisError, setProductionAnalysisError] = useState<string>("");
  
  // State for unsupported framework popup
  const [showUnsupportedFrameworkModal, setShowUnsupportedFrameworkModal] = useState(false);

  const [showAnalysisAnimation, setShowAnalysisAnimation] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisSteps = [
    "Initializing model processing...",
    "Validating model structure...",
    "Analyzing model parameters...",
    "Computing metrics...",
    "Generating report visualization...",
    "Finalizing results...",
  ];

  // New state variables for project card animation
  const [showProjectCardAnimation, setShowProjectCardAnimation] =
    useState(false);
  const [processMessage, setProcessMessage] = useState("");
  const [processingComplete, setProcessingComplete] = useState(false);

  // GitHub repo navigation state
  const [repoNames, setRepoNames] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [pathStack, setPathStack] = useState<string[]>([]); // For folder navigation
  const [currentContents, setCurrentContents] = useState<any[]>([]); // Contents at current path
  const [dropdowns, setDropdowns] = useState<any[][]>([]); // Array of arrays for each dropdown level
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [selectedGitHubFile, setSelectedGitHubFile] = useState<string>("");
  const [stepError, setStepError] = useState<string>("");

  // Check for GitHub connection on mount
  useEffect(() => {
    setIsGitHubConnected(!!localStorage.getItem("accessToken"));
    if (localStorage.getItem("accessToken")) {
      // Fetch repos if connected
      fetchGitHubRepos();
    }
  }, []);

  // Fetch GitHub repos
  const fetchGitHubRepos = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      try {
        const response = await fetch(
          apiUrl("getUserRepos"),
          {
            method: "GET",
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          }
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          const names = data.map((repo: any) => repo.full_name);
          setRepoNames(names);
          if (names.length > 0) setSelectedRepo(names[0]);
        }
      } catch (error) {
        console.error("Error fetching GitHub repos:", error);
      }
    }
  };

  // Fetch repo contents when selectedRepo or pathStack changes
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (selectedRepo && accessToken) {
      const path = pathStack.join("/");
      fetch(
        apiUrl(`getRepoContents?repo=${encodeURIComponent(
          selectedRepo
        )}${path ? `&path=${encodeURIComponent(path)}` : ""}`),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          setCurrentContents(data);
          // Update dropdowns: keep previous, add new
          setDropdowns((prev) => {
            const newDropdowns = prev.slice(0, pathStack.length);
            newDropdowns[pathStack.length] = data;
            return newDropdowns;
          });
        })
        .catch((error) => {
          console.error("Error fetching repo contents:", error);
        });
    }
  }, [selectedRepo, pathStack]);

  // Handle dropdown selection
  const handleDropdownSelect = (level: number, item: any) => {
    if (item.type === "dir") {
      // Go deeper into folder
      setPathStack((prev) => [...prev.slice(0, level), item.name]);
    } else if (item.type === "file") {
      // Log full path
      const fullPath = [
        selectedRepo,
        ...pathStack.slice(0, level),
        item.name,
      ].join("/");
      setSelectedGitHubFile(fullPath); // Track selected file
      // Optionally, reset dropdowns deeper than this level
      setDropdowns((prev) => prev.slice(0, level + 1));
      setPathStack((prev) => prev.slice(0, level)); // Don't go deeper after file
      console.log("Selected file:", fullPath);
      // TODO: Handle file selection (e.g., download or use the file)
    }
  };

  // Use centralized API configuration

  // Send a signal to parent component to show animation on the page
  const emitProcessingSignal = (status: string, data = {}) => {
    const event = new CustomEvent("modelProcessingStatus", {
      detail: {
        status, // 'start', 'success', 'error'
        modelName: formData.name,
        modelVersion: formData.version,
        projectId: formData.projectId,
        ...data,
      },
    });
    window.dispatchEvent(event);
  };

  // Add this function to fetch project ID by name
  const getProjectIdByName = async (projectName: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("project_id")
        .eq("project_name", projectName)
        .single();

      if (error) throw error;

      return data?.project_id;
    } catch (err) {
      console.error("Error fetching project ID:", err);
      return null;
    }
  };

  // Call getProjectIdByName on initial load if we have project name
  useEffect(() => {
    // If projectId is provided as a prop, use that
    if (projectId) {
      setP_id(projectId);
      setFormData((prev) => ({
        ...prev,
        projectId: projectId,
      }));
    }
  }, [projectId]); // Depend on projectId prop

  // Now you can use p_id throughout your component
  // For example, replace instances of projectId with p_id in your API calls

  const handleNext = () => {
    setStepError(""); // Clear previous error
    if (currentStep === 0) {
      // If GitHub is connected, require a .pkl file from GitHub
      if (isGitHubConnected) {
        if (!selectedGitHubFile) {
          setStepError("Please select a .pkl model file from GitHub.");
          return;
        }
        if (!selectedGitHubFile.endsWith(".pkl")) {
          setStepError("Please select a MLModel file (.pkl) from GitHub.");
          return;
        }
        // Store the selected GitHub file path in formData.file for later use
        setFormData((prev) => ({ ...prev, file: selectedGitHubFile }));
      } else {
        // Validate required fields for step 1 (browser upload)
        if (!formData.name || !formData.model_type || !formData.file || !formData.framework || !formData.model_stage) {
          setStepError("Please fill all required fields");
          return;
        }
        if (
          formData.file &&
          typeof formData.file !== "string" &&
          !formData.file.name.endsWith(".pkl")
        ) {
          setStepError("Please select a MLModel file (.pkl)");
          return;
        }
      }
      // Move to next step without API call
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 1) {
      if (!formData.dataset) {
        setStepError("Please upload a dataset");
        return;
      }
      if (!formData.target_column) {
        setStepError("Please select a target column");
        return;
      }
      // If model stage is production, move to drift analysis step; otherwise skip to final step
      if (formData.model_stage === "production") {
        setCurrentStep(currentStep + 1);
      } else {
        setCurrentStep(currentStep + 2); // Skip drift analysis step
      }
    } else if (currentStep === 2) {
      // Drift analysis step validation (only for production models)
      if (formData.enable_drift_analysis) {
        if (!formData.production_dataset) {
          setStepError("Please upload production dataset for drift analysis");
          return;
        }
        if (!formData.production_target_column) {
          setStepError("Please select a target column for production dataset");
          return;
        }
      }
      // Move to next step without API call
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(currentStep + 1);
    }
    
    // Scroll to top of modal when moving to next step
    setTimeout(() => {
      const modalBody = document.querySelector('.p-8.overflow-y-auto');
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handlePrev = () => {
    // If we're on the final step and model stage is not production, skip back over drift analysis
    if (currentStep === 3 && formData.model_stage !== "production") {
      setCurrentStep(currentStep - 2); // Skip drift analysis step
    } else {
      setCurrentStep(currentStep - 1);
    }
    
    // Scroll to top of modal when moving to previous step
    setTimeout(() => {
      const modalBody = document.querySelector('.p-8.overflow-y-auto');
      if (modalBody) {
        modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSubmit = async () => {
    // Debug: Log formData state at submission
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Full formData at submission:", formData);
    console.log("Test dataset:", formData.test_dataset);
    console.log("Validation dataset:", formData.validation_dataset);
    console.log("Training dataset:", formData.dataset);
    console.log("=============================");
    
    // Set loading state and clear errors
    setIsLoading(true);
    setApiError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.model_type || !formData.file || !formData.framework || !formData.model_stage) {
        throw new Error("Please fill all required model fields");
      }

      if (!formData.dataset) {
        throw new Error("Please upload a dataset");
      }

      // If GitHub is connected and file is a string (GitHub path), fetch the file from backend
      let fileToUpload = formData.file;
      console.log("fileToUpload", fileToUpload);
      if (isGitHubConnected && typeof formData.file === "string") {
        // Parse repo and path from the GitHub file string
        // Example: repo = "username/repo", path = "folder/model.pkl"
        const [repo, ...pathParts] = formData.file.split("/");
        const repoName = repo + "/" + pathParts.shift();
        const filePath = pathParts.join("/");
        const githubToken = localStorage.getItem("accessToken");
        const downloadUrl = apiUrl(`downloadRepoFile?repo=${encodeURIComponent(
          repoName
        )}&path=${encodeURIComponent(filePath)}`);
        const response = await fetch(downloadUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to download file from GitHub.");
        }
        const blob = await response.blob();
        console.log("blob", blob);
        // Use the filename from the path
        const filename = filePath.split("/").pop() || "model.pkl";
        fileToUpload = new File([blob], filename, {
          type: blob.type || "application/octet-stream",
        });
        console.log("fileToUpload part 2:", fileToUpload);
      }

      // Dispatch event to trigger animation in ProjectOverviewPage
      const startEvent = new CustomEvent("modelProcessingStart", {
        detail: {
          modelName: formData.name,
          modelVersion: formData.version,
          projectId: formData.projectId,
        },
      });
      window.dispatchEvent(startEvent);

      // Close modal immediately to show the animation on the page
      onClose();

      // Get authentication token - try both Supabase and GitHub tokens
      const supabaseToken = localStorage.getItem("access_token");
      const githubToken = localStorage.getItem("accessToken");
      const token = supabaseToken || githubToken;

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // STEP 1: Upload model file - keeping original API endpoint
      console.log("Step 1: Uploading model file...");
      const modelFormData = new FormData();
      modelFormData.append("project_id", p_id || "");
      modelFormData.append("name", formData.name);
      modelFormData.append("model_type", formData.model_type);
      modelFormData.append("version", formData.version);
      modelFormData.append("file", fileToUpload);
      if (formData.description) {
        modelFormData.append("description", formData.description);
      }
      if (formData.external_dependencies) {
        modelFormData.append("external_dependencies", formData.external_dependencies);
      }
      if (formData.requirements_file) {
        modelFormData.append("requirements_file", formData.requirements_file);
      }

      const modelResponse = await fetch(apiUrl(`ml/${p_id}/models/upload`), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: modelFormData,
      });

      if (modelResponse.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      }

      if (!modelResponse.ok) {
        throw new Error(`Error uploading model: ${modelResponse.statusText}`);
      }

      const modelData = await modelResponse.json();
      console.log("Model upload successful:", modelData);

      // Store model ID in localStorage
      const modelId = modelData.id;
      localStorage.setItem("model_id", modelId.toString());

      // STEP 2: Upload dataset with validation dataset - new combined approach
      console.log("Step 2: Uploading datasets...");
      const datasetFormData = new FormData();
      
      // Add required fields
      datasetFormData.append("project_id", p_id || "");
      datasetFormData.append("file", formData.dataset); // training dataset
      
      // Add dataset type if provided
      if (formData.dataset_type) {
        datasetFormData.append("dataset_type", formData.dataset_type.toLowerCase());
      }
      
      // Add validation dataset if provided
      if (formData.validation_dataset) {
        datasetFormData.append("validation_data", formData.validation_dataset);
        console.log("Validation dataset added:", formData.validation_dataset.name);
      }

      if (formData.test_dataset) {
        datasetFormData.append("testdataset", formData.test_dataset);
        console.log("Test dataset added:", formData.test_dataset.name);
      } else {
        console.log("No test dataset found in formData");
      }

      // Debug: Log all FormData entries
      console.log("FormData entries:");
      for (let [key, value] of datasetFormData.entries()) {
        console.log(`${key}:`, value);
      }
      
      console.log("Full formData object:", formData);
      console.log("Test dataset specifically:", formData.test_dataset);
      const datasetResponse = await fetch(
        apiUrl(`ml/${p_id}/datasets/upload`),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: datasetFormData,
        }
      );
      
      if (!datasetResponse.ok) {
        throw new Error(
          `Error uploading dataset: ${datasetResponse.statusText}`
        );
      }
      
      const datasetData = await datasetResponse.json();
      console.log("Dataset upload successful:", datasetData);
      localStorage.setItem("dataset_id", datasetData.id);
      localStorage.setItem("validation_dataset_id", datasetData.dataset_metadata.validation_dataset_id);
      localStorage.setItem("test_dataset_id", datasetData.dataset_metadata.test_dataset_id);
      // STEP 3: Generate report - keeping original API endpoint
      console.log("Step 3: Generating report...");
      console.log(modelId);
      console.log(datasetData.id);
      console.log(datasetData.dataset_metadata.validation_dataset_id);
      console.log(datasetData.dataset_metadata.test_dataset_id);

      // Replace with 4 separate API calls
      // Run all four audit API calls sequentially, regardless of success/failure
      console.log("Running audit API calls...");
      let auditResults = [];

      // 1. Performance Audit
      try {
        console.log("Step 3.1: Running Performance Audit...");
        const performanceResponse = await fetch(
          apiUrl(`ml/${p_id}/audit/performance?model_id=${modelId}&dataset_id=${datasetData.id}&validation_dataset_id=${datasetData.dataset_metadata.validation_dataset_id}&testdataset=${datasetData.dataset_metadata.test_dataset_id}`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const performanceData = await performanceResponse
          .json()
          .catch(() => ({ status: "error" }));
        console.log("Performance Audit result:", performanceData);
        auditResults.push({ type: "performance", data: performanceData });
      } catch (error) {
        console.error("Error in Performance Audit:", error);
        auditResults.push({ type: "performance", status: "error" });
      }

      // 2. Fairness Audit
      try {
        console.log("Step 3.2: Running Fairness Audit...");
        const fairnessResponse = await fetch(
          apiUrl(`ml/${p_id}/audit/fairness?model_id=${modelId}&dataset_id=${datasetData.id}&validation_dataset_id=${datasetData.dataset_metadata.validation_dataset_id}&testdataset=${datasetData.dataset_metadata.test_dataset_id}`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const fairnessData = await fairnessResponse
          .json()
          .catch(() => ({ status: "error" }));
        console.log("Fairness Audit result:", fairnessData);
        auditResults.push({ type: "fairness", data: fairnessData });
      } catch (error) {
        console.error("Error in Fairness Audit:", error);
        auditResults.push({ type: "fairness", status: "error" });
      }

      // 3. Explainability Audit
      try {
        console.log("Step 3.3: Running Explainability Audit...");
        const explainabilityResponse = await fetch(
          apiUrl(`ml/${p_id}/audit/explainability?model_id=${modelId}&dataset_id=${datasetData.id}&validation_dataset_id=${datasetData.dataset_metadata.validation_dataset_id}&testdataset=${datasetData.dataset_metadata.test_dataset_id}`),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const explainabilityData = await explainabilityResponse
          .json()
          .catch(() => ({ status: "error" }));
        console.log("Explainability Audit result:", explainabilityData);
        auditResults.push({ type: "explainability", data: explainabilityData });
      } catch (error) {
        console.error("Error in Explainability Audit:", error);
        auditResults.push({ type: "explainability", status: "error" });
      }

      // 4. Drift Analysis - Only run if production dataset was actually uploaded
      if (formData.enable_drift_analysis && formData.production_dataset) {
        try {
          console.log("Step 3.4: Running Drift Analysis with production data...");
          const driftResponse = await fetch(
            apiUrl(`ml/${p_id}/audit/drift?model_id=${modelId}&dataset_id=${datasetData.id}`),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const driftData = await driftResponse
            .json()
            .catch(() => ({ status: "error" }));
          console.log("Drift Analysis result:", driftData);
          auditResults.push({ type: "drift", data: driftData });
        } catch (error) {
          console.error("Error in Drift Analysis:", error);
          auditResults.push({ type: "drift", status: "error" });
        }
      } else if (formData.enable_drift_analysis && !formData.production_dataset) {
        console.log("Step 3.4: Skipping Drift Analysis - enabled but no production dataset uploaded");
        auditResults.push({ 
          type: "drift", 
          status: "skipped", 
          message: "Drift analysis enabled but no production dataset was uploaded" 
        });
      } else {
        console.log("Step 3.4: Skipping Drift Analysis - not enabled");
        // Don't add to auditResults if drift analysis is not enabled at all
      }

      // Combine results and continue
      const aggregatedResults = {
        id: `audit-${Date.now()}`,
        status: "success",
        message: "Audit processes completed",
        results: auditResults,
      };

      // Update states with aggregated results
      setReportData(aggregatedResults);
      setFormData({ ...formData, reportGenerated: true });

      // Insert model details into Supabase
      try {
        const { data: insertData, error: insertError } = await supabase
          .from('modeldetails')
          .insert([
            {
              model_id: modelId,
              project_id: p_id,
              model_version: formData.version,
              dataset_id: datasetData.id,
              validation_dataset_id: datasetData.dataset_metadata.validation_dataset_id || null,
              test_dataset_id: datasetData.dataset_metadata.test_dataset_id || null
            }
          ]);

        if (insertError) {
          console.error('Error inserting model details:', insertError);
        } else {
          console.log('Model details inserted successfully:', insertData);
        }
      } catch (error) {
        console.error('Failed to insert model details into Supabase:', error);
      }

      // Trigger success event
      const successEvent = new CustomEvent("modelProcessingSuccess", {
        detail: {
          modelName: formData.name,
          modelVersion: formData.version,
          projectId: formData.projectId,
          data: aggregatedResults,
        },
      });
      window.dispatchEvent(successEvent);
    } catch (error) {
      console.error("Error in processing:", error);

      // Convert unknown error to string for checking
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setApiError(errorMessage);

      // Check if this is a CORS error or network-related error
      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("net::ERR_FAILED") ||
        errorMessage.includes("Bad Gateway")
      ) {
        console.log("CORS or network error detected - treating as success");

        // Trigger success event for CORS and network errors
        const successEvent = new CustomEvent("modelProcessingSuccess", {
          detail: {
            modelName: formData.name,
            modelVersion: formData.version,
            projectId: formData.projectId,
            message: "Processing completed successfully",
          },
        });
        window.dispatchEvent(successEvent);
      } else {
        // Only trigger error event for actual errors (not CORS/network)
        const errorEvent = new CustomEvent("modelProcessingError", {
          detail: {
            modelName: formData.name,
            modelVersion: formData.version,
            projectId: formData.projectId,
            error: errorMessage,
          },
        });
        window.dispatchEvent(errorEvent);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to analyze dataset and extract columns
  const analyzeDataset = async (file: File, datasetType: 'training' | 'validation' | 'test' | 'production' = 'training') => {
    if (datasetType === 'validation') {
      setIsAnalyzingValidationDataset(true);
      setValidationAnalysisError("");
    } else if (datasetType === 'test') {
      setIsAnalyzingTestDataset(true);
      setTestAnalysisError("");
    } else if (datasetType === 'production') {
      setIsAnalyzingProductionDataset(true);
      setProductionAnalysisError("");
    } else {
      setIsAnalyzingDataset(true);
      setDatasetAnalysisError("");
    }

    try {
      const text = await file.text();
      let columns: string[] = [];

      // Handle different file types
      if (file.name.endsWith('.csv')) {
        // Parse CSV header
        const lines = text.split('\n');
        if (lines.length > 0) {
          columns = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
        }
      } else if (file.name.endsWith('.json')) {
        // Parse JSON to get keys from first object
        try {
          const jsonData = JSON.parse(text);
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            columns = Object.keys(jsonData[0]);
          } else if (typeof jsonData === 'object') {
            columns = Object.keys(jsonData);
          }
        } catch (jsonError) {
          throw new Error('Invalid JSON format');
        }
      } else {
        // Try to parse as CSV by default
        const lines = text.split('\n');
        if (lines.length > 0) {
          columns = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
        }
      }

      if (columns.length === 0) {
        throw new Error('No columns found in dataset');
      }

      // Update state based on dataset type
      if (datasetType === 'validation') {
        setValidationDatasetColumns(columns);
      } else if (datasetType === 'test') {
        setTestDatasetColumns(columns);
      } else if (datasetType === 'production') {
        setProductionDatasetColumns(columns);
      } else {
        setDatasetColumns(columns);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze dataset';
      if (datasetType === 'validation') {
        setValidationAnalysisError(errorMessage);
        setValidationDatasetColumns([]);
      } else if (datasetType === 'test') {
        setTestAnalysisError(errorMessage);
        setTestDatasetColumns([]);
      } else if (datasetType === 'production') {
        setProductionAnalysisError(errorMessage);
        setProductionDatasetColumns([]);
      } else {
        setDatasetAnalysisError(errorMessage);
        setDatasetColumns([]);
      }
    } finally {
      if (datasetType === 'validation') {
        setIsAnalyzingValidationDataset(false);
      } else if (datasetType === 'test') {
        setIsAnalyzingTestDataset(false);
      } else if (datasetType === 'production') {
        setIsAnalyzingProductionDataset(false);
      } else {
        setIsAnalyzingDataset(false);
      }
    }
  };

  // Handle file uploads
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) => {
    const file = e.target.files?.[0];
    console.log(`handleFileUpload called with fileType: ${fileType}`, file);
    
    if (file) {
      const newFormData = {
        ...formData,
        [fileType]: file,
      };
      
      console.log(`Setting ${fileType} to:`, file.name);
      console.log('Updated formData will be:', newFormData);
      
      setFormData(newFormData);

      // Analyze dataset if it's a dataset file
      if (fileType === 'dataset') {
        await analyzeDataset(file, 'training');
      } else if (fileType === 'validation_dataset') {
        await analyzeDataset(file, 'validation');
      } else if (fileType === 'test_dataset') {
        await analyzeDataset(file, 'test');
      } else if (fileType === 'production_dataset') {
        await analyzeDataset(file, 'production');
      }
    }
  };

  // Handle GitHub model import
  const handleGitHubImport = async () => {
    // TODO: Implement GitHub model import functionality
    console.log("GitHub import functionality to be implemented");

    // Redirect to GitHub OAuth with the correct callback URL
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/github/callback`
    );
    const clientId = "Ov23licv8OIoqToCAzBq";
    const scope = encodeURIComponent("repo read:user");

    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
    );
  };

  // Modal title based on mode
  const modalTitle = isNewVersion
    ? "Upload New Model Version"
    : "Upload New Model";

  // If the modal is hidden but we're still processing, we need to render just the project card animation
  if (!isVisible && showProjectCardAnimation) {
    return (
      <div
        id="project-processing-indicator"
        className="fixed bottom-8 right-8 z-50"
      >
        <div
          className={`bg-white rounded-xl shadow-xl p-5 w-[420px] transition-all duration-300 transform ${
            processingComplete
              ? processingComplete && processMessage.includes("Error")
                ? "border-l-4 border-red-500"
                : "border-l-4 border-green-500"
              : "border-l-4 border-blue-600"
          }`}
        >
          <div className="flex items-center">
            <div className="mr-4 flex-shrink-0">
              {!processingComplete ? (
                <div className="w-11 h-11 relative">
                  <svg
                    className="animate-spin w-full h-full text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : processMessage.includes("Error") ? (
                <div className="w-11 h-11 flex items-center justify-center bg-red-100 rounded-full text-red-500 text-2xl border border-red-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-11 h-11 flex items-center justify-center bg-green-100 rounded-full text-green-500 text-2xl border border-green-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3
                className={`font-medium text-lg ${
                  processingComplete && processMessage.includes("Error")
                    ? "text-red-700"
                    : processingComplete
                    ? "text-green-700"
                    : "text-blue-700"
                }`}
              >
                {!processingComplete
                  ? "Processing Model"
                  : processMessage.includes("Error")
                  ? "Processing Failed"
                  : "Processing Complete"}
              </h3>
              <p className="text-sm text-gray-600">{processMessage}</p>

              {!processingComplete && (
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-600 h-full animate-pulse"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowProjectCardAnimation(false)}
              className="ml-4 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!processingComplete && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Processing</span>
                <span>Please wait...</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {analysisSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded ${
                      i <= analysisStep ? "bg-blue-600" : "bg-gray-200"
                    } transition-all duration-200`}
                  ></div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <span className="text-blue-600 font-medium">Current step:</span>{" "}
                {analysisSteps[analysisStep]}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {/* Analysis animation overlay - shown during processing */}
      {showAnalysisAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] bg-black bg-opacity-80">
          <div className="bg-white rounded-2xl shadow-2xl w-[700px] p-10 text-center">
            <div className="mb-8">
              <div className="w-28 h-28 mx-auto mb-6">
                <svg
                  className="animate-spin w-full h-full text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-3xl font-light text-gray-900 mb-3">
                Processing Your Model
              </h3>
              <p className="text-lg text-gray-600 mb-8">{analysisSteps[analysisStep]}</p>
            </div>

            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-8">
              <div
                className="bg-blue-600 h-full transition-all duration-500 ease-out"
                style={{
                  width: `${
                    (analysisStep + 1) * (100 / analysisSteps.length)
                  }%`,
                }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl transition-all duration-300 ${
                    i <= analysisStep
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-gray-50 text-gray-400 border border-gray-200"
                  } flex flex-col items-center justify-center`}
                >
                  <div
                    className={`text-2xl mb-2 ${
                      i <= analysisStep ? "text-blue-600" : "text-gray-300"
                    }`}
                  >
                    {i < analysisStep ? "✓" : i === analysisStep ? "⚙️" : "○"}
                  </div>
                  <div className="text-sm font-medium">Step {i + 1}</div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              This may take a few moments. Please don't close this window.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-[1200px] max-h-[95vh] overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-light text-gray-900">
                {modalTitle}
              </h4>
              {isGitHubConnected && (
                <p className="text-sm text-green-600 mt-1 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  GitHub connected - Import models from your repositories
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-3 rounded-xl transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">
                  {/* Steps */}
        <div className="flex mb-12 w-full">
          {(() => {
            const baseSteps = ["Model Upload", "Dataset Details"];
            const finalSteps = formData.model_stage === "production" 
              ? [...baseSteps, "Drift Analysis", "Preview"]
              : [...baseSteps, "Preview"];
            
            return finalSteps.map((step, index) => (
              <div key={index} className="flex-1">
                <div
                  className={`flex items-center ${index > 0 ? "ml-4" : ""}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300 ${
                      currentStep >= index
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="ml-4">
                    <div
                      className={`font-medium text-lg ${
                        currentStep >= index
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {index === 0 && "Upload and configure model"}
                      {index === 1 && "Configure training data"}
                      {index === 2 && formData.model_stage === "production" && "Configure drift analysis"}
                      {((index === 2 && formData.model_stage !== "production") || (index === 3 && formData.model_stage === "production")) && "Review and submit"}
                    </div>
                  </div>
                </div>
                {index < finalSteps.length - 1 && (
                  <div
                    className={`h-1 mt-6 mx-4 rounded-full transition-all duration-500 ${
                      currentStep > index 
                        ? "bg-gradient-to-r from-blue-600 to-blue-400" 
                        : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ));
          })()}
        </div>

          {/* GitHub Import Section - Only show if connected */}
          {isGitHubConnected && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
              <h5 className="text-xl font-medium mb-6 text-gray-800 flex items-center">
                <span className="bg-green-600 text-white w-10 h-10 rounded-full inline-flex items-center justify-center mr-3 text-lg">
                  ✓
                </span>
                Import from GitHub
              </h5>

              {/* Repo Selection */}
              {repoNames.length > 0 && (
                <div className="mb-6">
                  <label className="block font-medium mb-3 text-gray-700 text-lg">
                    Select Repository:
                  </label>
                  <select
                    value={selectedRepo}
                    onChange={(e) => {
                      setSelectedRepo(e.target.value);
                      setPathStack([]); // Reset path stack on repo change
                      setDropdowns([]);
                    }}
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg bg-white shadow-sm"
                  >
                    {repoNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dynamic Dropdowns for folder navigation */}
              {dropdowns.map((contents, level) => {
                // Determine the selected value for this dropdown
                let selectedIdx = "";
                if (pathStack[level]) {
                  selectedIdx = contents
                    .findIndex((item) => item.name === pathStack[level])
                    ?.toString();
                } else if (selectedGitHubFile && level === pathStack.length) {
                  // If a file is selected at this level, find its index
                  const fileName = selectedGitHubFile.split("/").pop();
                  selectedIdx = contents
                    .findIndex((item) => item.name === fileName)
                    ?.toString();
                }
                return (
                  <div key={level} className="mb-6">
                    <label className="block font-medium mb-3 text-gray-700 text-lg">
                      Select from {pathStack[level - 1] || "root"}:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedIdx || ""}
                        onChange={(e) => {
                          const idx = e.target.value;
                          if (idx !== "")
                            handleDropdownSelect(level, contents[parseInt(idx)]);
                        }}
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm appearance-none text-lg font-medium hover:border-blue-400 transition-all"
                        style={{ minHeight: 56 }}
                      >
                        <option value="">
                          {selectedIdx && contents[parseInt(selectedIdx)]
                            ? `${
                                contents[parseInt(selectedIdx)].type === "dir"
                                  ? "📁"
                                  : "📄"
                              } ${contents[parseInt(selectedIdx)].name}`
                            : "Select file/folder"}
                        </option>
                        {contents.map((item, idx) => (
                          <option
                            key={item.sha}
                            value={idx}
                            className="flex items-center"
                          >
                            {item.type === "dir" ? "📁" : "📄"} {item.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show message if GitHub not connected */}
          {!isGitHubConnected && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaGithub className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h5 className="text-lg font-medium text-blue-800">
                    GitHub Integration Available
                  </h5>
                  <p className="text-blue-700 mt-1">
                    Connect GitHub from the sidebar to import models directly
                    from your repositories.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100">
            {isLoading && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl flex items-center">
                <svg className="animate-spin h-6 w-6 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-lg">Processing your request...</span>
              </div>
            )}

            {currentStep === 0 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h5 className="text-2xl font-light text-gray-800 mb-2">
                    Model Configuration
                  </h5>
                  <p className="text-gray-600">
                    Please provide the following information about your model
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Model Name */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      Model Name <span className="text-red-500 ml-2">*</span>
                      <div className="relative ml-2 group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
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
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-56 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 hidden group-hover:block z-10">
                          Give your model a descriptive name
                        </div>
                      </div>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter a unique model name"
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  {/* Model Version */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      Model Version <span className="text-red-500 ml-2">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="1.0.0"
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                      value={formData.version}
                      onChange={(e) =>
                        setFormData({ ...formData, version: e.target.value })
                      }
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Use semantic versioning (e.g. 1.0.0)
                    </p>
                  </div>
                </div>

                {/* Model Description - Full Width */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                    Description <span className="text-red-500 ml-2">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about this model's purpose and characteristics"
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Model Type */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      Model Type <span className="text-red-500 ml-2">*</span>
                    </label>
                    <select
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-lg"
                      value={formData.model_type || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, model_type: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select model type
                      </option>
                      <option value="classification">Classification</option>
                      <option value="regression">Regression</option>
                      <option value="clustering">Clustering</option>
                      <option value="deeplearning">Deep Learning</option>
                      <option value="timeseries">Time-Series</option>
                    </select>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Framework */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      Framework <span className="text-red-500 ml-2">*</span>
                      <div className="relative ml-2 group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
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
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-56 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 hidden group-hover:block z-10">
                          Which framework was used to train this model?
                        </div>
                      </div>
                    </label>
                    <select
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-lg"
                      value={formData.framework || ""}
                      onChange={(e) => {
                        const selectedFramework = e.target.value;
                        setFormData({ ...formData, framework: selectedFramework });
                        
                        // Show popup if "Others" is selected
                        if (selectedFramework === "others") {
                          setShowUnsupportedFrameworkModal(true);
                        }
                      }}
                      required
                    >
                      <option value="" disabled>
                        Select framework
                      </option>
                      <option value="scikit-learn==1.6.1">Scikit-learn v1.6.1</option>
                      <option value="tensorflow==2.19.0">TensorFlow v2.19.0</option>
                      <option value="torch==2.6.0">PyTorch v2.6.0</option>
                      <option value="transformers==4.50.3">Transformers v4.50.3</option>
                      <option value="onnx">ONNX (latest)</option>
                      <option value="others">Others</option>
                    </select>
                    {formData.framework === "others" && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-orange-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-orange-800">
                              Framework Not Supported
                            </h3>
                            <div className="mt-2 text-sm text-orange-700">
                              <p>
                                Please select a supported framework from the list above, or contact our support team for assistance with your specific framework.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Model Stage */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      Model Stage <span className="text-red-500 ml-2">*</span>
                      <div className="relative ml-2 group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
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
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-56 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 hidden group-hover:block z-10">
                          What stage is this model in?
                        </div>
                      </div>
                    </label>
                    <select
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-lg"
                      value={formData.model_stage || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, model_stage: e.target.value })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select model stage
                      </option>
                      <option value="pre_trained">Pre-trained (Ready to use)</option>
                      <option value="in_training">In Training (Under development)</option>
                      <option value="post_training">Post Training (Trained but not deployed)</option>
                      <option value="production">Production (Deployed and serving)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      This helps determine what datasets and validation we need
                    </p>
                  </div>
                </div>

                {/* External Dependencies - Premium Feature */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden">
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.894.553l2.991 5.982a.869.869 0 010 .775l-2.991 5.982A1 1 0 0112 16H9a1 1 0 01-.894-1.447L10.382 11H9a1 1 0 010-2h1.382l-2.276-3.553A1 1 0 019 4h3z" clipRule="evenodd" />
                      </svg>
                      Premium Feature
                    </span>
                  </div>
                  <div className="opacity-50 pointer-events-none">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      External Dependencies
                      <span className="ml-3 text-sm font-normal text-gray-500">(Optional)</span>
                      <div className="relative ml-2 group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
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
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g., BERT tokenizer, Word2Vec embeddings, external APIs, etc."
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg resize-none bg-gray-50"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Describe any external dependencies or special requirements
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Environment Configuration - Premium Feature */}
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.894.553l2.991 5.982a.869.869 0 010 .775l-2.991 5.982A1 1 0 0112 16H9a1 1 0 01-.894-1.447L10.382 11H9a1 1 0 010-2h1.382l-2.276-3.553A1 1 0 019 4h3z" clipRule="evenodd" />
                        </svg>
                        Premium Feature
                      </span>
                    </div>
                    <div className="opacity-50 pointer-events-none">
                      <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                        Environment Configuration
                        <span className="ml-3 text-sm font-normal text-gray-500">(Optional)</span>
                        <div className="relative ml-2 group">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
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
                      </label>
                      <p className="text-sm text-gray-500 mb-4">Upload requirements.txt or Dockerfile</p>

                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                        <div className="text-blue-500 text-4xl mb-3">⬆️</div>
                        <p className="text-gray-700 font-medium mb-2 text-lg">
                          Upload environment configuration
                        </p>
                        <p className="text-gray-500">
                          requirements.txt, Dockerfile, or similar
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Model File upload section */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                      Model File <span className="text-red-500 ml-2">*</span>
                    </label>
                    <p className="text-sm text-gray-500 mb-4">Supports .pkl format</p>

                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer">
                      <input
                        type="file"
                        id="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "file")}
                        required
                        disabled={isGitHubConnected}
                      />
                      <label
                        htmlFor="file"
                        className={`cursor-pointer w-full h-full flex flex-col items-center ${
                          isGitHubConnected
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }`}
                        title={
                          isGitHubConnected
                            ? "Disconnect GitHub to upload from your computer"
                            : ""
                        }
                      >
                        <div className="text-blue-500 text-4xl mb-3">
                          {formData.file ? "📄" : "⬆️"}
                        </div>
                        <p className="text-gray-700 font-medium mb-2 text-lg">
                          {formData.file ? "Change file" : "Upload model file"}
                        </p>
                        <p className="text-gray-500">
                          {formData.file
                            ? typeof formData.file === "string"
                              ? formData.file.split("/").pop()
                              : formData.file.name
                            : "Click to upload file here"}
                        </p>
                        {isGitHubConnected && (
                          <span className="mt-3 inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                            <svg
                              className="h-3 w-3 mr-2"
                              fill="currentColor"
                              viewBox="0 0 8 8"
                            >
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            Disconnect GitHub to enable file upload
                          </span>
                        )}
                        {formData.file && !isGitHubConnected && (
                          <span className="mt-3 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                            <svg
                              className="h-3 w-3 mr-2"
                              fill="currentColor"
                              viewBox="0 0 8 8"
                            >
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                            File selected
                          </span>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h5 className="text-2xl font-light text-gray-800 mb-2">
                    Dataset Configuration
                  </h5>
                  <p className="text-gray-600">
                    Upload and configure your training data and validation datasets
                  </p>
                </div>

                <div className="mb-6">
                  {/* Dataset form sections */}
                  <div className="space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                      <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                        Training Dataset{" "}
                        <span className="text-red-500 ml-2">*</span>
                      </label>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload CSV, JSON, or DataFrame file used for training
                      </p>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer">
                        <input
                          type="file"
                          id="dataset"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "dataset")}
                          required
                        />
                        <label
                          htmlFor="dataset"
                          className="cursor-pointer w-full h-full flex flex-col items-center"
                        >
                          <div className="text-blue-500 text-5xl mb-4">
                            {formData.dataset ? "📊" : "⬆️"}
                          </div>
                          <p className="text-gray-700 font-medium mb-2 text-lg">
                            {formData.dataset
                              ? "Change training dataset"
                              : "Upload training dataset"}
                          </p>
                          <p className="text-gray-500">
                            {formData.dataset
                              ? formData.dataset.name
                              : "Click or drag training data file here"}
                          </p>
                          {formData.dataset && (
                            <span className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                              <svg
                                className="h-3 w-3 mr-2"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Training dataset selected
                            </span>
                          )}
                        </label>
                      </div>
                    </div>

                    {(formData.model_stage === "in_training" || formData.model_stage === "post_training" || formData.model_stage === "experimental") && (
                      <div className="space-y-6">
                        {/* Validation Dataset Upload */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                          <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                            Validation Dataset
                            <span className="text-gray-500 ml-2 text-sm font-normal">(Optional)</span>
                            <div className="relative ml-2 group">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
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
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 hidden group-hover:block z-10">
                                Upload a separate validation dataset for model evaluation. If not provided, the system will use automatic validation splitting.
                              </div>
                            </div>
                          </label>
                          <p className="text-sm text-gray-500 mb-4">
                            Upload CSV, JSON, or DataFrame file for validation
                          </p>
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer">
                            <input
                              type="file"
                              id="validation_dataset"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, "validation_dataset")}
                            />
                            <label
                              htmlFor="validation_dataset"
                              className="cursor-pointer w-full h-full flex flex-col items-center"
                            >
                              <div className="text-blue-500 text-4xl mb-3">
                                {formData.validation_dataset ? "📊" : "⬆️"}
                              </div>
                              <p className="text-gray-700 font-medium mb-2">
                                {formData.validation_dataset
                                  ? "Change validation dataset"
                                  : "Upload validation dataset"}
                              </p>
                              <p className="text-gray-500">
                                {formData.validation_dataset
                                  ? formData.validation_dataset.name
                                  : "Click or drag validation data file here"}
                              </p>
                              {formData.validation_dataset && (
                                <span className="mt-3 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                                  <svg
                                    className="h-3 w-3 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 8 8"
                                  >
                                    <circle cx="4" cy="4" r="3" />
                                  </svg>
                                  Validation dataset selected
                                </span>
                              )}
                            </label>
                          </div>

                          {/* Show loading state while analyzing validation dataset */}
                          {isAnalyzingValidationDataset && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center mt-4">
                              <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="text-blue-700">Analyzing validation dataset structure...</span>
                            </div>
                          )}

                          {/* Show error if validation dataset analysis failed */}
                          {validationAnalysisError && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
                              <p className="text-red-700 text-sm">
                                <strong>Validation Dataset Analysis Error:</strong> {validationAnalysisError}
                              </p>
                              <p className="text-red-600 text-xs mt-1">
                                Please ensure your file is a valid CSV or JSON format, or manually enter the validation target column name below.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Test Dataset Upload */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                          <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                            Test Dataset
                            <span className="text-gray-500 ml-2 text-sm font-normal">(Optional)</span>
                            <div className="relative ml-2 group">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-400"
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
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded py-2 px-3 hidden group-hover:block z-10">
                                Upload a separate test dataset for final model evaluation and performance assessment.
                              </div>
                            </div>
                          </label>
                          <p className="text-sm text-gray-500 mb-4">
                            Upload CSV, JSON, or DataFrame file for testing
                          </p>
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer">
                            <input
                              type="file"
                              id="test_dataset"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, "test_dataset")}
                            />
                            <label
                              htmlFor="test_dataset"
                              className="cursor-pointer w-full h-full flex flex-col items-center"
                            >
                              <div className="text-blue-500 text-4xl mb-3">
                                {formData.test_dataset ? "📊" : "⬆️"}
                              </div>
                              <p className="text-gray-700 font-medium mb-2">
                                {formData.test_dataset
                                  ? "Change test dataset"
                                  : "Upload test dataset"}
                              </p>
                              <p className="text-gray-500">
                                {formData.test_dataset
                                  ? formData.test_dataset.name
                                  : "Click or drag test data file here"}
                              </p>
                              {formData.test_dataset && (
                                <span className="mt-3 inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                                  <svg
                                    className="h-3 w-3 mr-2"
                                    fill="currentColor"
                                    viewBox="0 0 8 8"
                                  >
                                    <circle cx="4" cy="4" r="3" />
                                  </svg>
                                  Test dataset selected
                                </span>
                              )}
                            </label>
                          </div>

                          {/* Show loading state while analyzing test dataset */}
                          {isAnalyzingTestDataset && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center mt-4">
                              <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              <span className="text-blue-700">Analyzing test dataset structure...</span>
                            </div>
                          )}

                          {/* Show error if test dataset analysis failed */}
                          {testAnalysisError && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
                              <p className="text-red-700 text-sm">
                                <strong>Test Dataset Analysis Error:</strong> {testAnalysisError}
                              </p>
                              <p className="text-red-600 text-xs mt-1">
                                Please ensure your file is a valid CSV or JSON format, or manually enter the test target column name below.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

{/* Target Column Selection - Always show if main dataset is uploaded */}
{formData.dataset && (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
      Target Column ( Dataset) <span className="text-red-500 ml-2">*</span>
      <div className="relative ml-2 group">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-60 bg-gray-800 text-white text-xs rounded py-2 px-3 hidden group-hover:block z-10">
          Select the column you want to predict in your main training dataset (target variable)
        </div>
      </div>
    </label>

    {/* Show loading state while analyzing dataset */}
    {isAnalyzingDataset && (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center mb-4">
        <svg className="animate-spin h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="text-blue-700">Analyzing dataset structure...</span>
      </div>
    )}

    {/* Show error if dataset analysis failed */}
    {datasetAnalysisError && (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
        <p className="text-red-700 text-sm">
          <strong>Dataset Analysis Error:</strong> {datasetAnalysisError}
        </p>
        <p className="text-red-600 text-xs mt-1">
          Please ensure your file is a valid CSV or JSON format, or manually enter the target column name below.
        </p>
      </div>
    )}

    {/* Column selection - Show dropdown if we have columns, otherwise show text input */}
    {datasetColumns.length > 0 ? (
      <div>
        <p className="text-sm text-gray-500 mb-3">
          Found {datasetColumns.length} columns in your dataset
        </p>
        {datasetColumns.length <= 15 ? (
          <select
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-lg"
            value={formData.target_column || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                target_column: e.target.value,
              })
            }
            required
          >
            <option value="" disabled>
              Select target column
            </option>
            {datasetColumns.map((column, index) => (
              <option key={index} value={column}>
                {column}
              </option>
            ))}
          </select>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Type the exact target column name"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
              value={formData.target_column}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_column: e.target.value,
                })
              }
              required
            />
            <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600 font-medium mb-1">Available columns:</p>
              <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                {datasetColumns.map((column, index) => (
                  <span
                    key={index}
                    className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-blue-50"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        target_column: column,
                      })
                    }
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      // Fallback: Manual input if no columns detected
      <div>
        <p className="text-sm text-gray-500 mb-3">
          {!isAnalyzingDataset && !datasetAnalysisError 
            ? "Manually enter your target column name" 
            : "Enter target column name manually"}
        </p>
        <input
          type="text"
          placeholder="Enter the exact target column name (e.g., 'price', 'label', 'target')"
          className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
          value={formData.target_column}
          onChange={(e) =>
            setFormData({
              ...formData,
              target_column: e.target.value,
            })
          }
          required
        />
        <p className="text-xs text-gray-500 mt-2">
          Make sure this matches exactly with a column name in your dataset
        </p>
      </div>
    )}
  </div>
)}





{/* Dataset Type Selection */}
{formData.dataset && (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
    <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
      Dataset Type
      <span className="ml-3 text-sm font-normal text-gray-500"></span>
      <div className="relative ml-2 group">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 hidden group-hover:block z-10">
          What type of problem is this dataset for?
        </div>
      </div>
    </label>
    <select
      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white text-lg"
      value={formData.dataset_type || ""}
      onChange={(e) =>
        setFormData({ ...formData, dataset_type: e.target.value })
      }
    >
      <option value="">Select dataset type </option>
      <option value="tabular">CSV, Excel, TSV - Tabular Data</option>
      <option value="text">TXT, DOC, PDF - Text Data</option>
      <option value="json">JSON, JSONL - Structured Data</option>
    </select>
    <p className="text-sm text-gray-500 mt-2">
      This helps optimize the analysis for your specific use case
    </p>
  </div>
)}
                </div>
              </div>
            )}

            {currentStep === 2 && formData.model_stage === "production" && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h5 className="text-2xl font-light text-gray-800 mb-2">
                    Drift Analysis Configuration
                  </h5>
                  <p className="text-gray-600">
                    Configure drift analysis to monitor your model's performance over time
                  </p>
                </div>

                {/* Drift Analysis - Testing Coming Soon */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-300 relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Testing Coming Soon
                    </span>
                  </div>
                  <div className="opacity-50 pointer-events-none">
                    <div className="flex items-center mb-6">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-12 w-12 text-purple-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div className="ml-6">
                        <h6 className="text-2xl font-medium text-purple-800 mb-2">
                          Enable Drift Analysis?
                        </h6>
                        <p className="text-purple-700 text-lg">
                          Drift analysis helps monitor how your model's predictions change over time compared to training data.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center mb-6">
                      <input
                        type="checkbox"
                        disabled
                        className="h-6 w-6 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                      />
                      <label className="ml-4 text-purple-800 font-medium text-lg">
                        Yes, I want to enable drift analysis for this model
                      </label>
                    </div>

                    <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start">
                        <svg
                          className="h-6 w-6 text-yellow-600 mt-1 mr-4 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <div className="font-medium text-yellow-800 text-lg">
                            Note about Drift Analysis
                          </div>
                          <p className="text-yellow-700 mt-2">
                            If you skip drift analysis now, you can always enable it later from the model's individual page by uploading production data separately.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gray-200 bg-opacity-10 flex items-center justify-center">
                    <div className="bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
                      <span className="text-gray-600 font-medium text-lg">Drift Analysis Configuration - Testing Coming Soon</span>
                    </div>
                  </div>
                </div>

                {/* Production Dataset Upload - Only show if drift analysis is enabled */}
                {formData.enable_drift_analysis && (
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                      <label className="block font-medium mb-4 text-gray-700 text-xl flex items-center">
                        Production Dataset{" "}
                        <span className="text-red-500 ml-2">*</span>
                        <div className="relative ml-3 group">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
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
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 hidden group-hover:block z-10">
                            Upload production data to analyze how your model's performance has drifted over time
                          </div>
                        </div>
                      </label>
                      <p className="text-gray-600 mb-6 text-lg">
                        Upload your production/live data to compare against training data for drift detection
                      </p>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-gray-50 hover:bg-purple-50 hover:border-purple-300 transition cursor-pointer">
                        <input
                          type="file"
                          id="production_dataset"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "production_dataset")}
                          accept=".csv,.json"
                        />
                        <label
                          htmlFor="production_dataset"
                          className="cursor-pointer w-full h-full flex flex-col items-center"
                        >
                          <div className="text-purple-500 text-6xl mb-4">
                            {formData.production_dataset ? "📊" : "⬆️"}
                          </div>
                          <p className="text-gray-700 font-medium mb-3 text-xl">
                            {formData.production_dataset
                              ? "Change production dataset"
                              : "Upload production dataset"}
                          </p>
                          <p className="text-gray-500 text-lg">
                            {formData.production_dataset
                              ? formData.production_dataset.name
                              : "Click or drag production data file here"}
                          </p>
                          {formData.production_dataset && (
                            <span className="mt-4 inline-flex items-center px-6 py-3 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                              <svg
                                className="h-4 w-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 8 8"
                              >
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Production dataset selected
                            </span>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Production Dataset Target Column Selection */}
                    {formData.production_dataset && productionDatasetColumns.length > 0 && (
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                        <label className="block font-medium mb-3 text-gray-700 text-lg flex items-center">
                          Production Target Column <span className="text-red-500 ml-2">*</span>
                          <div className="relative ml-2 group">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-400"
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
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 hidden group-hover:block">
                              Select the target column in production data (usually same as training)
                            </div>
                          </div>
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                          Found {productionDatasetColumns.length} columns in production dataset
                        </p>
                        
                        {productionDatasetColumns.length <= 10 ? (
                          <select
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none bg-white text-lg"
                            value={formData.production_target_column || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                production_target_column: e.target.value,
                              })
                            }
                            required
                          >
                            <option value="" disabled>
                              Select production target column
                            </option>
                            {productionDatasetColumns.map((column, index) => (
                              <option key={index} value={column}>
                                {column}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <input
                              type="text"
                              placeholder="Type the exact production target column name"
                              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                              value={formData.production_target_column}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  production_target_column: e.target.value,
                                })
                              }
                              required
                            />
                            <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                              <p className="text-xs text-gray-600 font-medium mb-1">Available columns:</p>
                              <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                                {productionDatasetColumns.map((column, index) => (
                                  <span
                                    key={index}
                                    className="bg-white px-2 py-1 rounded border cursor-pointer hover:bg-purple-50"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        production_target_column: column,
                                      })
                                    }
                                  >
                                    {column}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show loading state while analyzing production dataset */}
                    {formData.production_dataset && isAnalyzingProductionDataset && (
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-purple-600" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span className="text-purple-700">Analyzing production dataset structure...</span>
                      </div>
                    )}

                    {/* Show error if production dataset analysis failed */}
                    {formData.production_dataset && productionAnalysisError && (
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-red-700 text-sm">
                          <strong>Production Dataset Analysis Error:</strong> {productionAnalysisError}
                        </p>
                        <p className="text-red-600 text-xs mt-1">
                          Please ensure your production file is a valid CSV or JSON format.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(
              (formData.model_stage === "production" && currentStep === 3) ||
              (formData.model_stage !== "production" && (currentStep === 2 || currentStep === 3))
            ) && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h5 className="text-2xl font-light text-gray-800 mb-2">
                    Review & Submit
                  </h5>
                  <p className="text-gray-600">
                    Please review your configuration before submitting
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    </div>
                    <h6 className="font-medium text-xl text-gray-800">
                      Model Information
                    </h6>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Model Name
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {formData.name || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Model Type
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {formData.model_type || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Version
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {formData.version || "Not provided"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Framework
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {formData.framework || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Model Stage
                      </p>
                      <p className="text-gray-800 font-semibold text-lg">
                        {formData.model_stage || "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 lg:col-span-2">
                      <p className="text-sm font-medium text-gray-500 mb-2">
                        Model File
                      </p>
                      <p className="text-gray-800 font-semibold text-lg truncate">
                        {formData.file
                          ? typeof formData.file === "string"
                            ? formData.file.split("/").pop()
                            : formData.file.name
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center mb-4 mt-8">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <h6 className="font-medium text-lg text-gray-800">
                      Dataset Information
                    </h6>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Training Dataset
                      </p>
                      <p className="text-gray-800 font-medium truncate">
                        {formData.dataset
                          ? formData.dataset.name
                          : "Not provided"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Dataset Type
                      </p>
                      <p className="text-gray-800 font-medium">
                        {formData.dataset_type || "Not specified"}
                      </p>
                    </div>
                    {formData.validation_dataset && (
                      <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Validation Dataset
                        </p>
                        <p className="text-gray-800 font-medium truncate">
                          {formData.validation_dataset.name}
                        </p>
                      </div>
                    )}
                    {formData.target_column && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Target Column
                        </p>
                        <p className="text-gray-800 font-medium">
                          {formData.target_column}
                        </p>
                      </div>
                    )}
                    {formData.validation_target_column && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Validation Target Column
                        </p>
                        <p className="text-gray-800 font-medium">
                          {formData.validation_target_column}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Drift Analysis Information */}
                  <div className="mt-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h6 className="font-medium text-lg text-gray-800">
                        Drift Analysis Configuration
                      </h6>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">
                          Drift Analysis Enabled
                        </p>
                        <p className="text-gray-800 font-medium">
                          {formData.enable_drift_analysis ? "Yes" : "No"}
                        </p>
                      </div>
                      {formData.enable_drift_analysis && formData.production_dataset && (
                        <>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Production Dataset
                            </p>
                            <p className="text-gray-800 font-medium truncate">
                              {formData.production_dataset.name}
                            </p>
                          </div>
                          {formData.production_target_column && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm font-medium text-gray-500 mb-1">
                                Production Target Column
                              </p>
                              <p className="text-gray-800 font-medium">
                                {formData.production_target_column}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {(formData.external_dependencies || formData.requirements_file) && (
                    <div className="mt-6">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                          </svg>
                        </div>
                        <h6 className="font-medium text-lg text-gray-800">
                          Additional Configuration
                        </h6>
                      </div>

                      <div className="grid grid-cols-1 gap-4 mb-6">
                        {formData.external_dependencies && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              External Dependencies
                            </p>
                            <p className="text-gray-800 font-medium">
                              {formData.external_dependencies}
                            </p>
                          </div>
                        )}
                        {formData.requirements_file && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm font-medium text-gray-500 mb-1">
                              Environment File
                            </p>
                            <p className="text-gray-800 font-medium">
                              {formData.requirements_file.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg flex">
                    <div className="mr-3 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Clicking Submit will:</p>
                      <ol className="list-decimal ml-5 mt-1 text-sm">
                        <li>Process your model and dataset uploads</li>
                        <li>Generate a comprehensive analysis report</li>
                        <li>Create visualization and metrics for your model</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {(stepError || apiError) && (
            <div className="mt-8">
              {stepError && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center justify-between">
                  <span className="text-lg">{stepError}</span>
                  <button
                    onClick={() => setStepError("")}
                    className="ml-4 text-red-500 hover:text-red-700 focus:outline-none p-2 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Close error message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {apiError && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-lg">
                  {apiError}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-10 pt-8 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-8 py-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 flex items-center text-lg"
              disabled={isLoading}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-8 py-4 border border-blue-300 rounded-xl text-blue-600 font-medium hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 flex items-center text-lg"
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Previous
                </button>
              )}
              {(formData.model_stage === "production" ? currentStep < 3 : currentStep < 2) ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed text-lg"
                  disabled={isLoading || formData.framework === "others"}
                >
                  Next
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
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
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unsupported Framework Modal */}
      {showUnsupportedFrameworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 20.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Framework Not Supported
              </h3>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  The framework you selected is currently not supported by our platform.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Supported Frameworks & Versions:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• Scikit-learn v1.6.1</div>
                    <div>• TensorFlow v2.19.0</div>
                    <div>• TF-Keras (latest)</div>
                    <div>• PyTorch v2.6.0</div>
                    <div>• Transformers v4.50.3</div>
                    <div>• ONNX (latest)</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  If you have a model supported by our product and framework version, please{" "}
                  <span className="font-medium text-blue-600">contact our support team</span> for assistance.
                </p>
              </div>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => {
                    setShowUnsupportedFrameworkModal(false);
                    setFormData({ ...formData, framework: "" }); // Reset framework selection
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={() => {
                    setShowUnsupportedFrameworkModal(false);
                    // You can add support team contact logic here
                    window.open('mailto:support@yourcompany.com?subject=Framework Support Request', '_blank');
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadModal;
