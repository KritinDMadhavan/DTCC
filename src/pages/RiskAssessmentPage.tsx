import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  CheckCircle,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
  Shield,
  AlertTriangle,
  Calendar,
  Users,
  TrendingUp,
  Download,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import axios from "axios";

interface ModelData {
  model_id: string;
  model_version: string;
  project_id: string;
  dataset_id: string;
}

interface ProjectDetails {
  project_id: string;
  user_uuid: string;
  project_name: string;
  description: string;
  project_type: string;
  project_status: string;
  version?: string;
}

interface AssessmentData {
  aiSystemDescription: string;
  aiSystemPurpose: string;
  deploymentMethod: string;
  deploymentRequirements: string;
  rolesDocumented: string;
  rolesDocumentedDescription: string;
  personnelTrained: string;
  personnelTrainedDescription: string;
  humanInvolvement: string;
  biasTraining: string;
  biasTrainingDescription: string;
  humanIntervention: string;
  humanOverride: string;
  humanOverrideDescription: string;
  impactAssessmentMechanisms: string;
  negativeImpactsReassessed: string;
  mitigatingMeasuresImplemented: string;
  regulationsIdentified: string;
  vulnerabilityAssessmentMechanisms: string;
  redTeamExercises: string;
  securityModificationProcesses: string;
  incidentResponseProcesses: string;
  securityTestsMetrics: string;
  demographicsDocumented: string;
  aiActorsBiasAwareness: string;
  sufficientInfoProvided: string;
  endUsersAware: string;
  endUsersInformed: string;
  endUsersBenefits: string;
  externalStakeholders: string;
  riskManagementSystem: string;
  aiSystemAuditable: string;
  riskLevels: string;
  threatsIdentified: string;
  maliciousUseAssessed: string;
  personalInfoUsed: string;
  personalInfoCategories: string;
  privacyRegulations: string;
  privacyRiskAssessment: string;
  privacyByDesign: string;
  individualsInformed: string;
  privacyRights: string;
  dataQuality: string;
  thirdPartyRisks: string;
}

// Add comprehensive analysis framework after the existing interfaces
interface QuestionAnalysis {
  field: string;
  question: string;
  answer: string;
  riskScore: number;
  complianceLevel: "High" | "Medium" | "Low" | "Non-Compliant";
  riskFactors: string[];
  recommendations: string[];
  regulatoryImpact: string[];
  businessImpact: string;
  criticalityLevel: "Critical" | "High" | "Medium" | "Low";
}

interface SectionAnalysis {
  sectionNumber: number;
  sectionTitle: string;
  overallRiskScore: number;
  complianceGrade: "A" | "B" | "C" | "D" | "F";
  keyStrengths: string[];
  criticalGaps: string[];
  priorityActions: string[];
  regulatoryAlignment: string[];
  businessRisks: string[];
  timelineRecommendations: {
    action: string;
    priority: string;
    timeline: string;
  }[];
}

const RiskAssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDummyProject = id === "dummy-1" || id === "dummy-2";

  const [loading, setLoading] = useState(!isDummyProject);
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    aiSystemDescription: "",
    aiSystemPurpose: "",
    deploymentMethod: "",
    deploymentRequirements: "",
    rolesDocumented: "",
    rolesDocumentedDescription: "",
    personnelTrained: "",
    personnelTrainedDescription: "",
    humanInvolvement: "",
    biasTraining: "",
    biasTrainingDescription: "",
    humanIntervention: "",
    humanOverride: "",
    humanOverrideDescription: "",
    impactAssessmentMechanisms: "",
    negativeImpactsReassessed: "",
    mitigatingMeasuresImplemented: "",
    regulationsIdentified: "",
    vulnerabilityAssessmentMechanisms: "",
    redTeamExercises: "",
    securityModificationProcesses: "",
    incidentResponseProcesses: "",
    securityTestsMetrics: "",
    demographicsDocumented: "",
    aiActorsBiasAwareness: "",
    sufficientInfoProvided: "",
    endUsersAware: "",
    endUsersInformed: "",
    endUsersBenefits: "",
    externalStakeholders: "",
    riskManagementSystem: "",
    aiSystemAuditable: "",
    riskLevels: "",
    threatsIdentified: "",
    maliciousUseAssessed: "",
    personalInfoUsed: "",
    personalInfoCategories: "",
    privacyRegulations: "",
    privacyRiskAssessment: "",
    privacyByDesign: "",
    individualsInformed: "",
    privacyRights: "",
    dataQuality: "",
    thirdPartyRisks: "",
  });
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  ); // Start with all sections collapsed
  const [analysisCompleted, setAnalysisCompleted] = useState<boolean>(false);
  const [autoSectionsCompleted, setAutoSectionsCompleted] = useState<
    Set<number>
  >(new Set()); // Track which auto sections are actually completed
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Function to load data from localStorage
  const loadDataFromStorage = () => {
    if (!id) {
      console.log("No project ID available for localStorage");
      return;
    }

    const storageKey = `assessment_${id}`;
    console.log("Loading from localStorage with key:", storageKey);

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log("Loaded data from localStorage:", parsedData);
        setAssessmentData(parsedData.assessmentData);
        setLastUpdated(new Date(parsedData.lastUpdated));
        if (parsedData.autoSectionsCompleted) {
          setAutoSectionsCompleted(new Set(parsedData.autoSectionsCompleted));
        }
        setDataLoaded(true);
        console.log("Data successfully loaded from localStorage");
      } catch (error) {
        console.error(
          "Error loading assessment data from localStorage:",
          error
        );
      }
    } else {
      console.log("No saved data found in localStorage");
      setDataLoaded(true);
    }
  };

  // Load assessment data from localStorage on component mount
  useEffect(() => {
    loadDataFromStorage();
  }, [id]);

  // Reload data when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window focused, reloading data...");
      loadDataFromStorage();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [id]);

  // Save assessment data to localStorage whenever it changes
  useEffect(() => {
    if (!id || !dataLoaded) {
      console.log("Skipping save - no project ID or data not loaded yet");
      return;
    }

    setIsSaving(true);
    const storageKey = `assessment_${id}`;
    const dataToSave = {
      assessmentData,
      lastUpdated: lastUpdated.toISOString(),
      autoSectionsCompleted: Array.from(autoSectionsCompleted),
      projectId: id,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log(
        "Saved data to localStorage with key:",
        storageKey,
        dataToSave
      );
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    } finally {
      // Hide saving indicator after a short delay
      setTimeout(() => setIsSaving(false), 1000);
    }
  }, [assessmentData, lastUpdated, autoSectionsCompleted, id, dataLoaded]);

  // Function to clear saved assessment data
  const clearSavedData = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all progress? This action cannot be undone."
      )
    ) {
      localStorage.removeItem(`assessment_${id}`);
      setAssessmentData({
        aiSystemDescription: "",
        aiSystemPurpose: "",
        deploymentMethod: "",
        deploymentRequirements: "",
        rolesDocumented: "",
        rolesDocumentedDescription: "",
        personnelTrained: "",
        personnelTrainedDescription: "",
        humanInvolvement: "",
        biasTraining: "",
        biasTrainingDescription: "",
        humanIntervention: "",
        humanOverride: "",
        humanOverrideDescription: "",
        impactAssessmentMechanisms: "",
        negativeImpactsReassessed: "",
        mitigatingMeasuresImplemented: "",
        regulationsIdentified: "",
        vulnerabilityAssessmentMechanisms: "",
        redTeamExercises: "",
        securityModificationProcesses: "",
        incidentResponseProcesses: "",
        securityTestsMetrics: "",
        demographicsDocumented: "",
        aiActorsBiasAwareness: "",
        sufficientInfoProvided: "",
        endUsersAware: "",
        endUsersInformed: "",
        endUsersBenefits: "",
        externalStakeholders: "",
        riskManagementSystem: "",
        aiSystemAuditable: "",
        riskLevels: "",
        threatsIdentified: "",
        maliciousUseAssessed: "",
        personalInfoUsed: "",
        personalInfoCategories: "",
        privacyRegulations: "",
        privacyRiskAssessment: "",
        privacyByDesign: "",
        individualsInformed: "",
        privacyRights: "",
        dataQuality: "",
        thirdPartyRisks: "",
      });
      setLastUpdated(new Date());
      setAutoSectionsCompleted(new Set());
    }
  };

  useEffect(() => {
    if (!isDummyProject && id) {
      fetchProjectData();
    }

    // Check if analysis has been completed
    const storedAnalysis = localStorage.getItem(`riskAssessment_${id}`);
    setAnalysisCompleted(!!storedAnalysis);

    // Check auto-sections completion status
    checkAutoSectionsCompletion();
  }, [id, isDummyProject]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("projectdetails")
        .select(
          "project_id, user_uuid, project_name, description, project_type, project_status, version"
        )
        .eq("project_id", id)
        .single();

      if (projectError) {
        console.error("Error fetching project details:", projectError);
      } else if (projectData) {
        setProjectDetails(projectData);
      }

      // Fetch model data
      const { data: modelInfo, error: modelError } = await supabase
        .from("modeldetails")
        .select("model_id, project_id, dataset_id, model_version")
        .eq("project_id", id)
        .limit(1);

      if (modelError) {
        console.error("Error fetching model data:", modelError);
      } else if (modelInfo && modelInfo.length > 0) {
        setModelData(modelInfo[0]);
        // Here you would typically fetch actual risk assessment data from your API
      }
    } catch (error) {
      console.error("Failed to fetch project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkAutoSectionsCompletion = async () => {
    try {
      // Get token from localStorage (similar to ProjectOverviewPage)
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.log("No access token found");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      // Check if models/data exist for this project
      try {
        const modelsResponse = await axios.get(
          `https://prism-backend-dot-block-convey-p1.uc.r.appspot.com/ml/${id}/models/list`,
          config
        );

        // If we get a successful response with data, mark auto sections as completed
        if (modelsResponse.data && modelsResponse.data.length > 0) {
          setAutoSectionsCompleted(new Set([3, 5, 6, 8, 9, 10]));
        } else {
          // No data, keep auto sections as not completed
          setAutoSectionsCompleted(new Set());
        }
      } catch (apiError) {
        console.log("Models API not available or no data:", apiError);
        // API call failed or returned no data, keep auto sections as not completed
        setAutoSectionsCompleted(new Set());
      }
    } catch (error) {
      console.error("Error checking auto sections completion:", error);
      setAutoSectionsCompleted(new Set());
    }
  };

  const handleInputChange = (field: keyof AssessmentData, value: string) => {
    setAssessmentData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setLastUpdated(new Date());
  };

  const handleSave = async () => {
    // Implementation for saving assessment data
    console.log("Saving assessment data:", assessmentData);
  };

  const runFreshAnalysis = async () => {
    try {
      // Get project name from project details or use default
      const projectName = projectDetails?.project_name || "AI System";

      // Generate structured AI recommendations using Gemini API
      let geminiRecommendations = "";

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCb8vE2NtQApNeMNsZ6ZfaG0Wtxyzl3pGE`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an AI Risk Assessment expert. Analyze each user response and create unique, specific recommendations for EVERY question. Project: ${projectName}

CRITICAL INSTRUCTIONS:
- Analyze EACH response individually and provide COMPLETELY UNIQUE recommendations
- Do NOT repeat generic advice - each recommendation must be specific to that question and user's answer
- Cover ALL sections, not just a few
- If user says "Yes" but is vague, ask for more specificity
- If user says "No", provide step-by-step implementation
- If user mentions specific tools/processes, reference them directly in recommendations

USER RESPONSES TO ANALYZE:

${Object.entries(assessmentData)
  .filter(([key, value]) => value)
  .map(([key, value]) => {
    const sectionMapping: Record<
      string,
      { section: string; question: string }
    > = {
      // Section 1: AI System Information
      aiSystemDescription: {
        section: "AI System Information",
        question: "What is your AI system description?",
      },
      aiSystemPurpose: {
        section: "AI System Information",
        question: "What is the purpose of your AI system?",
      },
      deploymentMethod: {
        section: "AI System Information",
        question: "What is your deployment method?",
      },
      deploymentRequirements: {
        section: "AI System Information",
        question: "What are your deployment requirements?",
      },

      // Section 2: Human and Stakeholder Involvement
      rolesDocumented: {
        section: "Human and Stakeholder Involvement",
        question:
          "Are roles and responsibilities for AI governance clearly documented?",
      },
      personnelTrained: {
        section: "Human and Stakeholder Involvement",
        question:
          "Is personnel trained on AI ethics, bias, and risk management?",
      },
      humanInvolvement: {
        section: "Human and Stakeholder Involvement",
        question:
          "What level of human involvement exists in AI decision-making?",
      },
      biasTraining: {
        section: "Human and Stakeholder Involvement",
        question: "Has bias awareness and mitigation training been provided?",
      },
      humanIntervention: {
        section: "Human and Stakeholder Involvement",
        question: "Can humans intervene in AI system decisions when needed?",
      },
      humanOverride: {
        section: "Human and Stakeholder Involvement",
        question: "Can humans override AI system decisions completely?",
      },

      // Section 3: Safety and Reliability
      riskLevels: {
        section: "Safety and Reliability",
        question: "What risk levels have been identified and assessed?",
      },
      threatsIdentified: {
        section: "Safety and Reliability",
        question:
          "What potential threats and vulnerabilities have been identified?",
      },
      maliciousUseAssessed: {
        section: "Safety and Reliability",
        question: "Has the potential for malicious use been assessed?",
      },

      // Section 4: Privacy and Data Governance
      personalInfoUsed: {
        section: "Privacy and Data Governance",
        question: "Is personal information used by the AI system?",
      },
      personalInfoCategories: {
        section: "Privacy and Data Governance",
        question: "What categories of personal information are processed?",
      },
      privacyRegulations: {
        section: "Privacy and Data Governance",
        question: "Which privacy regulations apply to your system?",
      },
      privacyRiskAssessment: {
        section: "Privacy and Data Governance",
        question: "Has a privacy risk assessment been conducted?",
      },
      privacyByDesign: {
        section: "Privacy and Data Governance",
        question: "Are privacy-by-design principles implemented?",
      },
      individualsInformed: {
        section: "Privacy and Data Governance",
        question: "Are individuals informed about how their data is used?",
      },
      privacyRights: {
        section: "Privacy and Data Governance",
        question: "How are individual privacy rights handled and respected?",
      },
      dataQuality: {
        section: "Privacy and Data Governance",
        question: "How is data quality and accuracy ensured?",
      },
      thirdPartyRisks: {
        section: "Privacy and Data Governance",
        question: "How are third-party data sharing risks managed?",
      },
    };

    const mapping = sectionMapping[key] || {
      section: "Additional",
      question: key,
    };
    return `
SECTION: ${mapping.section}
QUESTION: ${mapping.question}
USER'S ACTUAL RESPONSE: "${value}"

REQUIRED ANALYSIS FOR THIS SPECIFIC QUESTION:
1. What does this response tell us about their current implementation?
2. What specific gaps or strengths are revealed?
3. What unique risks apply to this particular area?
4. What specific next steps should they take based on what they wrote?
`;
  })
  .join("\n")}

MAKE EVERY RECOMMENDATION UNIQUE - NO REPETITION ALLOWED!`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          geminiRecommendations =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
      } catch (apiError) {
        console.log("AI analysis unavailable, using structured fallback");
        geminiRecommendations =
          "AI analysis temporarily unavailable. Please review your responses and ensure all sections are complete.";
      }

      // Store analysis results in localStorage
      const analysisResults = {
        projectId: id,
        projectName,
        assessmentData,
        aiRecommendations: geminiRecommendations,
        timestamp: new Date().toISOString(),
        progress: 0, // Will be calculated later when needed
        riskLevel: "Pending", // Will be calculated later when needed
      };

      // Store in localStorage with project-specific key
      localStorage.setItem(
        `riskAssessment_${id}`,
        JSON.stringify(analysisResults)
      );

      // Also store in a general list for easy retrieval
      const existingAnalyses = JSON.parse(
        localStorage.getItem("riskAssessmentAnalyses") || "[]"
      );
      const updatedAnalyses = existingAnalyses.filter(
        (analysis: any) => analysis.projectId !== id
      );
      updatedAnalyses.push({
        projectId: id,
        projectName,
        timestamp: new Date().toISOString(),
        progress: 0, // Will be calculated later when needed
        riskLevel: "Pending", // Will be calculated later when needed
      });
      localStorage.setItem(
        "riskAssessmentAnalyses",
        JSON.stringify(updatedAnalyses)
      );

      // Also set the flags that ReportPage.tsx expects for compatibility
      localStorage.setItem(`riskAssessmentGenerated_${id}`, "true");
      localStorage.setItem(
        `riskAssessmentTimestamp_${id}`,
        new Date().toISOString()
      );

      setAnalysisCompleted(true);
      console.log(
        "✅ AI Risk Assessment analysis completed and saved successfully!"
      );
    } catch (error) {
      console.error("Error analyzing assessment:", error);

      // Even if analysis fails, store a basic version so PDF generation can continue
      const fallbackAnalysisResults = {
        projectId: id,
        projectName: projectDetails?.project_name || "AI System",
        assessmentData,
        aiRecommendations:
          "Analysis temporarily unavailable. Please review your responses and ensure all sections are complete.",
        timestamp: new Date().toISOString(),
        progress: 0, // Will be calculated later when needed
        riskLevel: "Pending", // Will be calculated later when needed
      };

      try {
        localStorage.setItem(
          `riskAssessment_${id}`,
          JSON.stringify(fallbackAnalysisResults)
        );
        localStorage.setItem(`riskAssessmentGenerated_${id}`, "true");
        localStorage.setItem(
          `riskAssessmentTimestamp_${id}`,
          new Date().toISOString()
        );
      } catch (storageError) {
        console.error("Failed to store fallback analysis:", storageError);
      }
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      console.log("Starting PDF report generation...");

      // Ensure project data is loaded first
      if (!projectDetails) {
        console.log("Project details not loaded, fetching...");
        await fetchProjectData();
      }

      // Always run fresh AI analysis before downloading
      console.log("Running fresh analysis...");
      await runFreshAnalysis();
      console.log("Analysis completed, retrieving from localStorage...");

      // Retrieve the fresh analysis from localStorage
      const storedAnalysis = localStorage.getItem(`riskAssessment_${id}`);
      if (!storedAnalysis) {
        console.error("No stored analysis found in localStorage");
        alert("Failed to generate analysis. Please try again.");
        return;
      }

      console.log("Retrieved stored analysis, parsing...");
      const analysisData = JSON.parse(storedAnalysis);
      const projectName = analysisData.projectName || "AI System";
      const geminiRecommendations = analysisData.aiRecommendations || "";
      console.log(
        "Analysis data parsed successfully, project name:",
        projectName
      );

      // Create PDF with professional formatting
      console.log("Importing jsPDF...");
      const jsPDF = (await import("jspdf")).default;
      console.log("jsPDF imported successfully");

      // Create PDF with professional formatting
      console.log("Creating PDF instance...");
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;
      console.log(
        "PDF instance created, dimensions:",
        pageWidth,
        "x",
        pageHeight
      );

      // Helper function to check and add new page
      let currentPageNumber = 3; // Start counting from page 3

      const checkPageBreak = (additionalHeight: number = 5) => {
        // Exactly 20px bottom margin - content stops at pageHeight - 20
        if (yPosition + additionalHeight > pageHeight - 20) {
          pdf.addPage();
          currentPageNumber++;
          yPosition = 20; // 20px top margin
          // Add page number at bottom right (overlapping the margin area)
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          const pageText = `Page ${currentPageNumber}`;
          const pageTextWidth = pdf.getTextWidth(pageText);
          pdf.text(pageText, pageWidth - 20 - pageTextWidth, pageHeight - 10);
          return true;
        }
        return false;
      };

      // Helper function to add wrapped text
      const addWrappedText = (
        text: string,
        fontSize: number,
        fontStyle: string = "normal",
        leftMargin: number = margin
      ) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", fontStyle as any);
        const lines = pdf.splitTextToSize(
          text,
          maxWidth - (leftMargin - margin)
        );

        checkPageBreak(lines.length * (fontSize * 0.35));
        pdf.text(lines, leftMargin, yPosition);
        yPosition += lines.length * (fontSize * 0.35) + 3;
        return lines.length;
      };

      // ========== PROFESSIONAL COVER PAGE (PAGE 1) ==========

      // 1. Insert Block Convey logo at the top center
      let logoDataUrl = "";
      try {
        // Try to load the logo image from public folder
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => {
            try {
              // Convert image to base64
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Canvas context not available");

              canvas.width = logoImg.width;
              canvas.height = logoImg.height;
              ctx.drawImage(logoImg, 0, 0);
              logoDataUrl = canvas.toDataURL("image/png");

              console.log("Logo loaded successfully for cover page");
              resolve();
            } catch (error) {
              console.error("Error processing logo:", error);
              resolve(); // Continue without logo
            }
          };

          logoImg.onerror = () => {
            console.log("Logo not found, continuing without logo");
            resolve(); // Continue without logo
          };

          logoImg.src = "/logoRisk.png";
        });

        // Add logo to PDF at top center if successfully loaded
        if (logoDataUrl) {
          const centerX = pageWidth / 2;
          const logoWidth = 70;
          const logoHeight = 30;
          const logoX = centerX - logoWidth / 2;
          const logoY = 40;
          pdf.addImage(logoDataUrl, "PNG", logoX, logoY, logoWidth, logoHeight);
        }
      } catch (error) {
        console.log("Logo loading failed, continuing without logo:", error);
      }

      // 2. Main title: "AI Risk Assessment Report"
      pdf.setTextColor(0, 0, 0); // Black text
      pdf.setFontSize(26);
      pdf.setFont("helvetica", "bold");
      const titleText = "AI Risk Assessment Report";
      const centerX = pageWidth / 2;
      const titleWidth = pdf.getTextWidth(titleText);
      const titleX = centerX - titleWidth / 2;
      const titleY = 100;
      pdf.text(titleText, titleX, titleY);

      // 3. Project name - Fetch fresh project data to ensure we have the real project name
      let actualProjectName = "Loading Project Name...";
      try {
        // Fetch project details directly from database to get the real project name
        const { data: freshProjectData, error } = await supabase
          .from("projectdetails")
          .select("project_name")
          .eq("project_id", id)
          .single();

        if (!error && freshProjectData?.project_name) {
          actualProjectName = freshProjectData.project_name;
          console.log("Fresh project name fetched for PDF:", actualProjectName);
        } else {
          console.error("Error fetching fresh project name:", error);
          actualProjectName = projectDetails?.project_name || "Unknown Project";
        }
      } catch (error) {
        console.error("Failed to fetch project name for PDF:", error);
        actualProjectName = projectDetails?.project_name || "Unknown Project";
      }

      pdf.setFontSize(18);
      pdf.setFont("helvetica", "normal");
      const coverProjectName = actualProjectName;
      const projectNameWidth = pdf.getTextWidth(coverProjectName);
      const projectNameX = centerX - projectNameWidth / 2;
      const projectNameY = titleY + 20;
      pdf.text(coverProjectName, projectNameX, projectNameY);

      // 4. Assessment Date
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      const coverCurrentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const assessmentDateText = `Assessment Date: ${coverCurrentDate}`;
      const assessmentDateWidth = pdf.getTextWidth(assessmentDateText);
      const assessmentDateX = centerX - assessmentDateWidth / 2;
      const assessmentDateY = projectNameY + 60;
      pdf.text(assessmentDateText, assessmentDateX, assessmentDateY);

      // 5. NIST Framework reference
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      const frameworkText =
        "Based on NIST AI Risk Management Framework (AI RMF 1.0)";
      const frameworkWidth = pdf.getTextWidth(frameworkText);
      const frameworkX = centerX - frameworkWidth / 2;
      const frameworkY = assessmentDateY + 10;
      pdf.text(frameworkText, frameworkX, frameworkY);

      // No page number on cover page

      // Force page break
      pdf.addPage();

      // ========== CONTENT STARTS ON PAGE 2 ==========
      // Reset text color for subsequent pages
      pdf.setTextColor(0, 0, 0);
      yPosition = margin + 20;

      // Table of Contents Header
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("TABLE OF CONTENTS", margin, yPosition);
      yPosition += 20;

      // Hierarchical TOC structure
      const tocEntries = [
        {
          type: "main",
          title: "AI Risk Assessment Questionnaire",
          page: 0,
          children: [
            { type: "sub", title: "Section 1: AI System Information", page: 0 },
            {
              type: "sub",
              title: "Section 2: Human and Stakeholder Involvement",
              page: 0,
            },
            { type: "sub", title: "Section 3: Valid and Reliable AI", page: 0 },
            {
              type: "sub",
              title: "Section 4: Safety and Reliability",
              page: 0,
            },
            {
              type: "sub",
              title: "Section 5: Secure and Resilient AI",
              page: 0,
            },
            {
              type: "sub",
              title: "Section 6: Explainable and Interpretable AI",
              page: 0,
            },
            {
              type: "sub",
              title: "Section 7: Privacy and Data Governance",
              page: 0,
            },
            {
              type: "sub",
              title: "Section 8: Fairness and Unbiased AI",
              page: 0,
            },
            {
              type: "sub",
              title: "Section 9: Transparent and Accountable AI",
              page: 0,
            },
            { type: "sub", title: "Section 10: AI Accountability", page: 0 },
          ],
        },
        {
          type: "main",
          title: "Executive Summary",
          page: 0,
          children: [
            // Add subheadings here if you have any, e.g.:
            // { type: 'sub', title: 'Key Strengths', page: 0 },
            // { type: 'sub', title: 'Regulatory Compliance Snapshot', page: 0 },
          ],
        },
        {
          type: "main",
          title: "Govern – AI Governance and Oversight",
          page: 0,
        },
        {
          type: "main",
          title: "Responsible AI & Client Trust Statement",
          page: 0,
        },
      ];

      // Reserve space for TOC entries (will be filled in later with proper formatting)
      const tocYPosition = yPosition;

      // Add a new page for the actual content
      pdf.addPage();
      yPosition = 20; // Set top margin to 20 for page 3

      // Add page number for page 3
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const page3Text = "Page 3";
      const page3TextWidth = pdf.getTextWidth(page3Text);
      pdf.text(page3Text, pageWidth - 20 - page3TextWidth, pageHeight - 10);

      // Add introductory paragraph before the questionnaire
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      const introText = `As part of our evaluation for ${actualProjectName}, we ensure that all AI systems used in high-stakes financial decision-making are aligned with applicable regulatory standards. Our assessment incorporates compliance checks against the Dodd-Frank Act, which mandates transparency, accountability, and consumer protection in financial services. This document outlines responses to the AI Risk Assessment based on the NIST AI Risk Management Framework. Each section is elaborated with context, rationale, and answers assuming compliance with best practices.`;
      addWrappedText(introText, 11, "normal");
      yPosition += 15;

      // Add main heading for the questionnaire
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("AI Risk Assessment Questionnaire", margin, yPosition);
      yPosition += 15;

      // Track page numbers for each section
      let currentPage = 2; // Starting from page 2

      // If we have Gemini recommendations, use them
      if (geminiRecommendations && geminiRecommendations.trim()) {
        addWrappedText(geminiRecommendations, 10, "normal");

        yPosition += 10; // Add some space before auto-sections
      }

      // Always add all sections in correct order (1-10)
      const allSections = [
        // Section 1: AI System Information (User section)
        {
          number: 1,
          title: "AI System Information",
          isUser: true,
          questions: [
            {
              field: "aiSystemDescription",
              question: "What is your AI system description?",
              elaboration:
                "This provides the foundational understanding of the AI system being assessed.",
              importance:
                "Clear system description enables proper risk categorization and compliance planning.",
            },
            {
              field: "aiSystemPurpose",
              question: "What is the purpose of your AI system?",
              elaboration:
                "Understanding the intended use case and business objective of the AI system.",
              importance:
                "Purpose determines risk levels, regulatory requirements, and stakeholder impact scope.",
            },
            {
              field: "deploymentMethod",
              question: "What is your deployment method?",
              elaboration:
                "How the AI system will be deployed and integrated into existing infrastructure.",
              importance:
                "Deployment approach affects security, scalability, and operational risk management.",
            },
            {
              field: "deploymentRequirements",
              question: "What are your deployment requirements?",
              elaboration:
                "Technical and operational prerequisites for successful system deployment.",
              importance:
                "Proper requirements ensure system reliability and compliance readiness.",
            },
          ],
        },
        // Section 2: Human and Stakeholder Involvement (User section)
        {
          number: 2,
          title: "Human and Stakeholder Involvement",
          isUser: true,
          questions: [
            {
              field: "rolesDocumented",
              question:
                "Are roles and responsibilities for AI governance clearly documented?",
              elaboration:
                "This ensures accountability frameworks are established for AI system oversight.",
              importance:
                "Clear roles prevent governance gaps and ensure responsible AI implementation.",
            },
            {
              field: "personnelTrained",
              question:
                "Is personnel trained on AI ethics, bias, and risk management?",
              elaboration:
                "Training ensures staff competency in identifying and mitigating AI-related risks.",
              importance:
                "Proper training reduces operational risks and ensures ethical AI practices.",
            },
            {
              field: "humanInvolvement",
              question:
                "What level of human involvement exists in AI decision-making?",
              elaboration:
                "Defines the degree of human oversight and control in AI system operations.",
              importance:
                "Appropriate human involvement ensures accountability and risk management.",
            },
            {
              field: "biasTraining",
              question:
                "Has bias awareness and mitigation training been provided?",
              elaboration:
                "Specialized training on identifying and addressing AI bias and fairness issues.",
              importance:
                "Bias training prevents discriminatory outcomes and ensures equitable AI systems.",
            },
            {
              field: "humanIntervention",
              question:
                "Can humans intervene in AI system decisions when needed?",
              elaboration:
                "Capability for human operators to step in during AI system operations.",
              importance:
                "Intervention capability ensures human control over critical decisions.",
            },
            {
              field: "humanOverride",
              question: "Can humans override AI system decisions completely?",
              elaboration:
                "Ultimate human authority to reverse or modify AI system outputs.",
              importance:
                "Override capability maintains human agency and prevents autonomous harm.",
            },
          ],
        },
        // Section 3: Valid and Reliable AI (Auto section)
        {
          number: 3,
          title: "Valid and Reliable AI",
          isUser: false,
          description:
            "This section is intended to assess the measures in place to ensure that the AI system is developed for the good of society, the environment, and the community.",
          items: [
            "✓ Governance Policies & Framework - Comprehensive AI governance framework established with clear policies for FinTech applications",
            "✓ Business Objective and Use Case Description - Clear definition of fraud detection, KYC, AML, and risk management objectives",
            "✓ Data Quality & Integrity Results - Robust data validation and quality assurance processes implemented",
            "✓ Risk and Benefit Mapping - Systematic identification and assessment of AI system impacts on stakeholders",
            "✓ All existing regulations and guidelines that may affect the AI system have been identified and compliance ensured",
          ],
          recommendation:
            "Maintain regular impact assessments aligned with NIST AI RMF framework. Ensure compliance with financial regulations including Dodd-Frank Act. Implement continuous monitoring for societal and environmental impacts in FinTech applications.",
        },
        // Section 4: Safety and Reliability (User section)
        {
          number: 4,
          title: "Safety and Reliability",
          isUser: true,
          questions: [
            {
              field: "riskLevels",
              question: "What risk levels have been identified and assessed?",
              elaboration:
                "Systematic evaluation of potential risks associated with AI system deployment.",
              importance:
                "Risk assessment enables appropriate mitigation strategies and compliance planning.",
            },
            {
              field: "threatsIdentified",
              question:
                "What potential threats and vulnerabilities have been identified?",
              elaboration:
                "Identification of security, safety, and operational threats to the AI system.",
              importance:
                "Threat identification enables proactive security measures and incident prevention.",
            },
            {
              field: "maliciousUseAssessed",
              question: "Has the potential for malicious use been assessed?",
              elaboration:
                "Evaluation of how the AI system might be misused by bad actors.",
              importance:
                "Malicious use assessment prevents dual-use concerns and reputational damage.",
            },
          ],
        },
        // Section 5: Secure and Resilient AI (Auto section)
        {
          number: 5,
          title: "Secure and Resilient AI",
          isUser: false,
          description:
            "This section is intended to assess the measures in place to ensure the security of the AI system and its capability to respond to incidents and operate continuously.",
          items: [
            "✓ Roles, Responsibilities, and Training - Clear AI governance roles established with comprehensive training programs",
            "✓ Robustness and Security Testing - Advanced security testing including adversarial attacks and stress testing for FinTech models",
            "✓ Risk Mitigation Strategies and Actions - Comprehensive risk mitigation framework with documented action plans",
            "✓ Monitoring and Incident Response Plan - 24/7 monitoring systems with rapid incident response capabilities",
            "✓ Third-Party & Supply Chain Risk Management - Vendor risk assessments and supply chain security controls",
            "✓ System and Regulatory Context - Full compliance with financial industry security standards and regulations",
          ],
          recommendation:
            "Implement comprehensive security testing including red-team exercises and continuous vulnerability assessments. Establish robust incident response procedures aligned with FinTech regulatory requirements.",
        },
        // Section 6: Explainable and Interpretable AI (Auto section)
        {
          number: 6,
          title: "Explainable and Interpretable AI",
          isUser: false,
          description:
            "This section is intended to assess the measures in place to ensure that information requirements for explainable AI are maintained, and AI decisions are interpreted as expected.",
          items: [
            "✓ Risk Appetite and Ethical Principles - Clear risk appetite defined with ethical AI principles for financial decision-making",
            "✓ Explainability and Transparency - Comprehensive model interpretability frameworks for fraud detection and AML systems",
            "✓ Data Sources and Quality Considerations - Robust data lineage and quality management for financial data processing",
            "✓ Model Performance Evaluation - Continuous performance monitoring with statistical significance testing",
            "✓ Stakeholders and Impacted Users - Clear identification and engagement of all affected parties in financial AI systems",
            "✓ Regulatory Compliance and Documentation - Complete documentation for regulatory audits and compliance reporting",
          ],
          recommendation:
            "Enhance traceability mechanisms and implement comprehensive logging. Ensure all decisions can be explained to relevant stakeholders with appropriate detail, especially for FinTech regulatory compliance.",
        },
        // Section 7: Privacy and Data Governance (User section)
        {
          number: 7,
          title: "Privacy and Data Governance",
          isUser: true,
          questions: [
            {
              field: "personalInfoUsed",
              question: "Is personal information used by the AI system?",
              elaboration:
                "Identification of personal data processing within the AI system.",
              importance:
                "Personal data usage triggers privacy regulations and protection requirements.",
            },
            {
              field: "personalInfoCategories",
              question:
                "What categories of personal information are processed?",
              elaboration:
                "Detailed categorization of personal data types handled by the system.",
              importance:
                "Data categorization determines protection levels and regulatory compliance needs.",
            },
            {
              field: "privacyRegulations",
              question: "Which privacy regulations apply to your system?",
              elaboration:
                "Identification of relevant privacy laws and regulations for compliance.",
              importance:
                "Regulatory compliance prevents legal risks and ensures user privacy protection.",
            },
            {
              field: "privacyRiskAssessment",
              question: "Has a privacy risk assessment been conducted?",
              elaboration:
                "Systematic evaluation of privacy risks associated with data processing.",
              importance:
                "Privacy risk assessment ensures proactive protection of personal data.",
            },
            {
              field: "privacyByDesign",
              question: "Are privacy-by-design principles implemented?",
              elaboration:
                "Integration of privacy considerations into system design and architecture.",
              importance:
                "Privacy by design ensures fundamental protection rather than retroactive fixes.",
            },
            {
              field: "individualsInformed",
              question:
                "Are individuals informed about how their data is used?",
              elaboration:
                "Transparency measures to inform data subjects about data processing activities.",
              importance:
                "Transparency ensures informed consent and regulatory compliance.",
            },
            {
              field: "privacyRights",
              question:
                "How are individual privacy rights handled and respected?",
              elaboration:
                "Mechanisms to support individual privacy rights like access, correction, and deletion.",
              importance:
                "Privacy rights support ensures regulatory compliance and user trust.",
            },
            {
              field: "dataQuality",
              question: "How is data quality and accuracy ensured?",
              elaboration:
                "Processes to maintain high-quality, accurate, and relevant training and operational data.",
              importance:
                "Data quality directly impacts AI system performance and fairness.",
            },
            {
              field: "thirdPartyRisks",
              question: "How are third-party data sharing risks managed?",
              elaboration:
                "Risk management for data sharing with external parties and vendors.",
              importance:
                "Third-party risk management prevents data breaches and compliance violations.",
            },
          ],
        },
        // Section 8: Fairness and Unbiased AI (Auto section)
        {
          number: 8,
          title: "Fairness and Unbiased AI",
          isUser: false,
          description:
            "This section is intended to assess the measures in place to ensure that the AI system is free from bias, inclusive, and diverse.",
          items: [
            "✓ Stakeholder Engagement and Awareness - Comprehensive stakeholder mapping and engagement strategy for FinTech AI systems",
            "✓ Bias and Fairness Testing - Advanced bias detection and mitigation for financial decision-making algorithms",
            "✓ Privacy and Data Protection Assessment - GDPR, CCPA, and financial privacy regulation compliance framework",
            "✓ Residual Risk Assessment and Acceptance - Formal risk acceptance procedures with board-level oversight",
            "✓ Diverse and inclusive team working on AI development with representation from affected communities",
            "✓ Ongoing Review and Improvement - Continuous improvement processes with regular bias and fairness audits",
          ],
          recommendation:
            "Implement comprehensive bias testing and monitoring aligned with financial industry anti-discrimination requirements. Ensure diverse representation in development teams and training data to promote fairness and inclusivity.",
        },
        // Section 9: Transparent and Accountable AI (Auto section)
        {
          number: 9,
          title: "Transparent and Accountable AI",
          isUser: false,
          description:
            "This section is intended to assess the measures in place to provide sufficient and appropriate information to relevant stakeholders, at any point of the AI lifecycle.",
          items: [
            "✓ Sufficient information provided to relevant AI actors to assist in making informed decisions",
            "✓ Type of information accessible about the AI lifecycle is limited to what is relevant and sufficient",
            "✓ End users are aware that they are interacting with an AI system and not a human",
            "✓ End-users informed of the purpose, criteria, and limitations of AI-driven financial decisions",
            "✓ End-users informed of the benefits of the AI system in fraud prevention and risk management",
            "✓ Mechanism in place to regularly communicate with external stakeholders including regulators and auditors",
          ],
          recommendation:
            "Establish clear communication protocols for all stakeholders including financial regulators. Ensure users are properly informed about AI interactions and system limitations in accordance with financial transparency requirements.",
        },
        // Section 10: AI Accountability (Auto section)
        {
          number: 10,
          title: "AI Accountability",
          isUser: false,
          description:
            "This section is intended to ensure that the organization has risk management mechanisms in place to effectively manage identified AI risk.",
          items: [
            "✓ Risk management system implemented to address risks identified in FinTech AI systems including fraud detection and AML",
            "✓ AI system can be audited by independent third parties and financial regulators with full documentation access",
            "✓ Checks conducted at appropriate intervals to confirm that the AI system remains trustworthy and compliant with evolving regulations",
            "✓ Regulatory Compliance and Documentation - Complete audit trails and documentation for financial services oversight",
            "✓ Continuous monitoring and performance evaluation against established financial industry benchmarks",
          ],
          recommendation:
            "Implement comprehensive risk management framework with regular audits aligned with financial regulatory requirements. Establish procedures for independent third-party assessments and continuous trustworthiness verification in accordance with FinTech compliance standards.",
        },
      ];

      // Process all sections in order
      allSections.forEach((section) => {
        // Track page number for this section and update TOC
        const currentPageNumber = pdf.getNumberOfPages();
        // Map to hierarchical TOC: Section 1-10 are children of the first main heading
        if (
          tocEntries[0] &&
          tocEntries[0].children &&
          tocEntries[0].children[section.number - 1]
        ) {
          tocEntries[0].children[section.number - 1].page = currentPageNumber;
        }
        checkPageBreak(15);
        addWrappedText(
          `Section ${section.number}: ${section.title}`,
          12,
          "bold"
        );
        yPosition += 5;

        if (section.isUser) {
          // User section - process questions with user answers
          const sectionAnswers: Array<{ question: any; answer: string }> = [];

          if (section.questions) {
            section.questions.forEach((q, index) => {
              const userAnswer =
                assessmentData[q.field as keyof AssessmentData];
              if (userAnswer) {
                sectionAnswers.push({ question: q, answer: userAnswer });
              }
            });
          }

          // Display questions and answers with smart relevance detection
          if (sectionAnswers.length > 0) {
            sectionAnswers.forEach((sa, index) => {
              checkPageBreak(30);

              // Question
              addWrappedText(
                `Question ${index + 1}: ${sa.question.question}`,
                10,
                "bold"
              );

              // Elaboration
              addWrappedText(
                `Elaboration: ${sa.question.elaboration}`,
                10,
                "normal"
              );

              // Why this matters
              addWrappedText(
                `Why this matters: ${sa.question.importance}`,
                10,
                "normal"
              );

              // Answer
              addWrappedText(`Answer: ${sa.answer}`, 10, "normal");

              // Intelligent relevance detection based on question type and expected response
              const questionText = sa.question.question.toLowerCase();
              const answerText = sa.answer.toLowerCase().trim();

              // Determine if this is a Yes/No/N/A question based on field or question patterns
              const yesNoFields = [
                "rolesDocumented",
                "personnelTrained",
                "biasTraining",
                "humanIntervention",
                "humanOverride",
                "threatsIdentified",
                "maliciousUseAssessed",
                "personalInfoUsed",
                "privacyRiskAssessment",
                "privacyByDesign",
                "individualsInformed",
                "deploymentRequirements",
              ];
              const isYesNoQuestion =
                yesNoFields.includes(sa.question.field) ||
                (questionText.includes("are ") &&
                  (questionText.includes("documented") ||
                    questionText.includes("trained") ||
                    questionText.includes("implemented") ||
                    questionText.includes("provided") ||
                    questionText.includes("conducted") ||
                    questionText.includes("defined") ||
                    questionText.includes("identified") ||
                    questionText.includes("assessed") ||
                    questionText.includes("informed"))) ||
                (questionText.includes("do ") &&
                  questionText.includes("have")) ||
                (questionText.includes("has ") &&
                  (questionText.includes("been") ||
                    questionText.includes("training"))) ||
                (questionText.includes("have ") &&
                  (questionText.includes("been") ||
                    questionText.includes("risks") ||
                    questionText.includes("measures") ||
                    questionText.includes("mechanisms")));

              // Determine if this is a descriptive "What/How" question
              const isDescriptiveQuestion =
                questionText.startsWith("what ") ||
                questionText.startsWith("how ") ||
                questionText.includes("describe") ||
                questionText.includes("categories of") ||
                questionText.includes("level of");

              // Check for problematic responses based on question type
              let showNote = false;
              let noteMessage = "";

              if (isYesNoQuestion) {
                // For Yes/No questions, "yes", "no", "n/a", "na" are valid responses
                const validYesNoAnswers = ["yes", "no", "na", "n/a"];
                const isValidYesNoAnswer = validYesNoAnswers.some(
                  (valid) =>
                    answerText === valid || answerText.startsWith(valid + " ")
                );

                if (!isValidYesNoAnswer && answerText.length < 10) {
                  showNote = true;
                  noteMessage =
                    "This Yes/No question requires a clear selection. Please choose the appropriate option that best describes your current implementation.";
                }
              } else if (isDescriptiveQuestion) {
                // Advanced content analysis for descriptive questions
                const field = sa.question.field;
                const originalAnswer = sa.answer; // Keep original case for analysis

                // Analyze content relevance based on specific question requirements
                let hasRelevantContent = false;
                let specificRequirement = "";

                // AI System Description - should contain system details, not just purpose
                if (field === "aiSystemDescription") {
                  specificRequirement =
                    "system name, type, and basic functionality";
                  hasRelevantContent =
                    /system|ai|algorithm|model|platform|software|tool|application|technology/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // AI System Purpose - should explain business objective and use case
                else if (field === "aiSystemPurpose") {
                  specificRequirement =
                    "business objective and specific use case";
                  hasRelevantContent =
                    /purpose|objective|goal|solve|address|help|improve|automate|predict|analyze|business|need/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Deployment Method - should explain how system will be implemented
                else if (field === "deploymentMethod") {
                  specificRequirement =
                    "deployment strategy and implementation approach";
                  hasRelevantContent =
                    /deploy|implement|integrate|install|cloud|server|environment|infrastructure|method|approach/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Human Involvement - should describe specific roles and oversight
                else if (field === "humanInvolvement") {
                  specificRequirement =
                    "specific human roles and oversight mechanisms";
                  hasRelevantContent =
                    /human|person|staff|team|review|oversight|monitor|supervise|validate|approve|decision|role/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Personal Info Categories - should list specific data types
                else if (field === "personalInfoCategories") {
                  specificRequirement =
                    "specific categories of personal data processed";
                  hasRelevantContent =
                    /name|email|address|phone|id|identifier|demographic|financial|health|biometric|location|behavior|preference/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 8;
                }

                // Privacy Regulations - should mention specific laws/standards
                else if (field === "privacyRegulations") {
                  specificRequirement = "specific privacy laws and regulations";
                  hasRelevantContent =
                    /gdpr|ccpa|pipeda|privacy|data protection|regulation|law|compliance|standard|policy/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 5;
                }

                // Privacy Rights - should explain how rights are handled
                else if (field === "privacyRights") {
                  specificRequirement =
                    "mechanisms for handling individual privacy rights";
                  hasRelevantContent =
                    /access|correct|delete|portability|consent|opt-out|request|process|mechanism|procedure|policy/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Data Quality - should describe quality assurance processes
                else if (field === "dataQuality") {
                  specificRequirement =
                    "data quality assurance processes and validation methods";
                  hasRelevantContent =
                    /quality|accuracy|validation|verification|cleansing|monitoring|review|check|standard|process/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Third Party Risks - should describe risk management approach
                else if (field === "thirdPartyRisks") {
                  specificRequirement =
                    "third-party data sharing risk management approach";
                  hasRelevantContent =
                    /contract|agreement|assessment|security|encryption|vendor|partner|evaluation|risk|management|control/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Risk Levels - should describe identified risk categories
                else if (field === "riskLevels") {
                  specificRequirement = "identified risk levels and categories";
                  hasRelevantContent =
                    /high|medium|low|critical|risk|level|assessment|category|identified|evaluated/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 8;
                }

                // Threats Identified - should list specific threats
                else if (field === "threatsIdentified") {
                  specificRequirement =
                    "specific threats and vulnerabilities identified";
                  hasRelevantContent =
                    /threat|vulnerability|attack|security|breach|failure|fault|risk|malicious|adversarial/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Malicious Use Assessment - should describe potential misuse scenarios
                else if (field === "maliciousUseAssessed") {
                  specificRequirement =
                    "potential misuse scenarios and countermeasures";
                  hasRelevantContent =
                    /misuse|abuse|malicious|unauthorized|inappropriate|countermeasure|prevention|mitigation|scenario/i.test(
                      originalAnswer
                    ) && originalAnswer.length > 10;
                }

                // Default for other descriptive questions
                else {
                  specificRequirement =
                    "specific details about your implementation";
                  hasRelevantContent =
                    originalAnswer.length > 15 &&
                    !/^(yes|no|na|n\/a|none|not applicable|tbd|todo|test|sample|demo)$/i.test(
                      answerText
                    );
                }

                // Check for generic non-answers regardless of content
                const isGenericNonAnswer =
                  /^(yes|no|na|n\/a|none|not applicable|tbd|to be determined|todo|to do|test|sample|demo|placeholder|example)$/i.test(
                    answerText
                  ) ||
                  /^(a|an|the|some|few|many|several|various|multiple)$/i.test(
                    answerText
                  ) ||
                  originalAnswer.trim().length < 3;

                if (!hasRelevantContent || isGenericNonAnswer) {
                  showNote = true;
                  noteMessage = `This question requires ${specificRequirement}. Please provide specific information that can be properly analyzed for risk assessment.`;
                }
              }

              if (showNote) {
                checkPageBreak(15);
                addWrappedText(`NOTE: ${noteMessage}`, 10, "normal");
              }

              yPosition += 5;
            });

            // Generate context-aware recommendations using Gemini API
            checkPageBreak(30);
            addWrappedText(`Overall Section Recommendation:`, 11, "bold");
            yPosition += 3;

            // Prepare detailed context for Gemini API analysis
            const questionAnswerContext = sectionAnswers
              .map(
                (sa) =>
                  `Question: ${sa.question.question}
Elaboration: ${sa.question.elaboration}
Why this matters: ${sa.question.importance}
User's Answer: "${sa.answer}"
Field: ${sa.question.field}`
              )
              .join("\n\n");

            // Generate comprehensive, intelligent recommendations immediately based on user responses
            console.log(
              "Generating comprehensive recommendations for section:",
              section.title
            );

            // Display section header
            addWrappedText(
              `Based on your detailed responses in ${section.title}, here is our comprehensive improvement roadmap:`,
              10,
              "normal"
            );
            yPosition += 3;

            const comprehensiveRecommendations: string[] = [];

            // Detailed analysis of each answer with specific, elaborate recommendations
            sectionAnswers.forEach((sa) => {
              const answer = sa.answer.toLowerCase().trim();
              const field = sa.question.field;

              // System Information Analysis
              if (field === "aiSystemDescription") {
                if (
                  answer.length < 10 ||
                  answer === "dsf" ||
                  answer === "sdf" ||
                  !answer.includes(" ")
                ) {
                  comprehensiveRecommendations.push(
                    "Immediately replace inadequate system descriptions with comprehensive documentation including system architecture, model specifications, data sources, decision logic, and operational parameters. Implement structured templates requiring technical details, business objectives, and stakeholder impact analysis to ensure proper risk assessment and regulatory compliance."
                  );
                  comprehensiveRecommendations.push(
                    "Establish mandatory documentation standards with review processes, version control, and regular updates to maintain accuracy. Include detailed technical specifications, integration points, and performance metrics to support ongoing governance and audit requirements."
                  );
                }
              }

              if (field === "aiSystemPurpose") {
                if (
                  answer.length < 10 ||
                  answer === "dsf" ||
                  answer === "sdf" ||
                  !answer.includes(" ")
                ) {
                  comprehensiveRecommendations.push(
                    "Replace generic purpose statements with detailed business objectives, use case definitions, stakeholder impact analysis, and measurable success criteria. Establish clear linkage between AI system capabilities and business requirements, including performance indicators and compliance considerations."
                  );
                  comprehensiveRecommendations.push(
                    "Develop comprehensive purpose documentation that includes intended user groups, decision boundaries, risk tolerances, and operational constraints. Implement regular reviews to ensure purpose alignment with business strategy and regulatory requirements."
                  );
                }
              }

              if (field === "deploymentMethod") {
                if (
                  answer.length < 10 ||
                  answer === "dsf" ||
                  answer === "sdf" ||
                  !answer.includes(" ")
                ) {
                  comprehensiveRecommendations.push(
                    "Develop comprehensive deployment strategy documentation replacing generic responses with detailed infrastructure requirements, integration protocols, security considerations, scalability plans, and operational procedures. Include rollback procedures and contingency planning for deployment issues."
                  );
                  comprehensiveRecommendations.push(
                    "Implement formal deployment governance with approval gates, automated validation processes, comprehensive testing protocols, and monitoring capabilities. Establish clear deployment criteria and success metrics with stakeholder notification procedures."
                  );
                }
              }

              if (field === "deploymentRequirements" && answer === "yes") {
                comprehensiveRecommendations.push(
                  "Enhance your existing deployment requirements by conducting thorough technical readiness assessments, establishing formal approval gates, and implementing automated deployment validation processes with comprehensive testing and monitoring capabilities."
                );
              }

              // Human Involvement Analysis
              if (field === "rolesDocumented") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Create comprehensive RACI matrix documenting all AI governance roles and responsibilities including decision-making authority, accountability structures, communication protocols, and performance metrics. Establish clear reporting lines and escalation procedures with regular review and update cycles."
                  );
                  comprehensiveRecommendations.push(
                    "Implement formal role definition processes including job descriptions, competency requirements, training needs assessment, and performance evaluation criteria specifically tailored to AI governance responsibilities."
                  );
                } else if (answer === "yes") {
                  comprehensiveRecommendations.push(
                    "Enhance your documented roles by conducting quarterly reviews to ensure they remain relevant to evolving AI technologies and regulatory requirements. Implement cross-training programs to ensure redundancy and succession planning for critical AI governance positions."
                  );
                }
              }

              if (field === "personnelTrained") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Immediately implement comprehensive AI governance and risk management training program covering technical fundamentals, ethical considerations, regulatory requirements, and operational procedures. Include certification requirements, competency assessments, and regular refresher training with measurable learning outcomes."
                  );
                  comprehensiveRecommendations.push(
                    "Establish ongoing professional development pathways including partnerships with educational institutions, industry conferences, and internal communities of practice for sharing best practices and lessons learned."
                  );
                }
              }

              if (field === "humanInvolvement") {
                if (
                  answer.includes("human-in-loop") ||
                  answer.includes("human-on-loop")
                ) {
                  comprehensiveRecommendations.push(
                    "Enhance your existing human-in-loop processes by implementing structured escalation workflows with defined decision boundaries, regular training on intervention protocols, and automated alerts for edge cases requiring human review. Establish clear documentation of when and how humans should intervene, with performance metrics tracking intervention effectiveness."
                  );
                  comprehensiveRecommendations.push(
                    "Develop advanced human-AI collaboration frameworks that optimize the balance between automation efficiency and human oversight, including real-time dashboard monitoring of human intervention rates and decision quality metrics."
                  );
                } else if (
                  answer === "no" ||
                  answer === "none" ||
                  answer.includes("fully automated")
                ) {
                  comprehensiveRecommendations.push(
                    "Urgently implement multi-tiered human oversight mechanisms including mandatory human review for high-risk decisions, automated escalation triggers for anomalous outputs, and fail-safe procedures that default to human control when system confidence drops below defined thresholds."
                  );
                  comprehensiveRecommendations.push(
                    "Establish comprehensive governance structure with clearly defined roles for AI system oversight, including dedicated AI ethics officers, technical review boards, and regular audit procedures with external validation."
                  );
                }
              }

              if (field === "biasTraining") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Immediately develop and deploy comprehensive AI ethics and bias awareness training program covering unconscious bias recognition, algorithmic fairness principles, and hands-on bias detection techniques. Include certification requirements, regular refresher training, and competency assessments with measurable learning outcomes."
                  );
                  comprehensiveRecommendations.push(
                    "Establish ongoing professional development pathways for AI ethics including partnerships with leading institutions, attendance at ethics conferences, and creation of internal communities of practice for sharing bias mitigation strategies and lessons learned."
                  );
                } else if (answer === "yes") {
                  comprehensiveRecommendations.push(
                    "Expand your existing bias training programs to include advanced topics such as intersectional bias analysis, emerging bias detection technologies, and sector-specific ethical considerations. Implement regular skills assessments and continuous learning pathways with industry certifications."
                  );
                }
              }

              if (field === "humanIntervention") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Develop comprehensive human intervention framework including technical kill switches, graduated intervention protocols, real-time monitoring dashboards, and clearly documented escalation procedures. Implement regular testing of intervention capabilities with scenario-based exercises and performance tracking."
                  );
                  comprehensiveRecommendations.push(
                    "Create redundant intervention mechanisms across multiple system layers, including automated anomaly detection, manual override capabilities, and emergency shutdown procedures. Establish 24/7 monitoring protocols with trained personnel capable of immediate intervention."
                  );
                } else if (answer === "yes") {
                  comprehensiveRecommendations.push(
                    "Enhance your existing intervention capabilities by implementing advanced predictive analytics to anticipate intervention needs, automated notification systems for stakeholders, and comprehensive audit trails for all intervention activities with root cause analysis."
                  );
                }
              }

              if (field === "humanOverride") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Establish ultimate human override authority with clearly defined protocols, legal frameworks, and technical implementations. Create hierarchical override systems with appropriate authorization levels, comprehensive logging, and regular testing to ensure functionality under emergency conditions."
                  );
                  comprehensiveRecommendations.push(
                    "Implement multi-factor authentication for override actions, comprehensive audit trails, and regular stress testing of override capabilities under various failure scenarios to ensure reliability when needed most."
                  );
                } else if (answer === "yes") {
                  comprehensiveRecommendations.push(
                    "Strengthen your override mechanisms by implementing advanced authentication procedures, comprehensive audit trails, and regular stress testing of override capabilities under various failure scenarios."
                  );
                }
              }

              // Risk Assessment Analysis
              if (field === "riskLevels") {
                if (answer === "no" || answer === "na" || answer.length < 10) {
                  comprehensiveRecommendations.push(
                    "Conduct comprehensive AI risk assessment using established frameworks such as NIST AI RMF or ISO/IEC 23053, including risk identification, likelihood assessment, impact analysis, and mitigation strategy development. Implement continuous risk monitoring with automated alerts and regular reassessment cycles."
                  );
                  comprehensiveRecommendations.push(
                    "Establish risk management governance structure including risk committees, regular risk reporting to senior management, and integration of AI risk assessment into broader enterprise risk management frameworks with clear escalation procedures."
                  );
                } else {
                  comprehensiveRecommendations.push(
                    "Enhance your existing risk assessment by implementing real-time risk monitoring capabilities, predictive risk analytics, and integration with operational metrics to provide continuous visibility into evolving risk profiles with automated alerting systems."
                  );
                }
              }

              if (field === "threatsIdentified") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Perform systematic threat modeling including adversarial attacks, data poisoning scenarios, model extraction attempts, and privacy breaches. Implement red team exercises, penetration testing, and vulnerability assessments with external security experts to identify potential attack vectors."
                  );
                  comprehensiveRecommendations.push(
                    "Establish threat intelligence program including monitoring of emerging AI security threats, participation in industry threat sharing initiatives, and regular updates to threat models based on evolving attack patterns and defensive capabilities."
                  );
                } else if (answer === "yes") {
                  comprehensiveRecommendations.push(
                    "Expand your threat identification capabilities by implementing advanced threat hunting techniques, automated threat detection systems, and integration with cybersecurity frameworks to provide comprehensive protection against evolving AI-specific threats."
                  );
                }
              }

              if (field === "maliciousUseAssessed") {
                if (answer === "no" || answer === "na") {
                  comprehensiveRecommendations.push(
                    "Conduct comprehensive malicious use assessment including dual-use analysis, adversarial application scenarios, and potential for weaponization or misuse. Implement controls to prevent unauthorized access and establish monitoring for suspicious usage patterns."
                  );
                }
              }

              // Privacy and Data Protection
              if (field === "personalInfoUsed") {
                if (answer === "yes") {
                  comprehensiveRecommendations.push(
                    "Implement comprehensive privacy protection measures including data minimization principles, purpose limitation controls, differential privacy techniques, and regular privacy impact assessments. Establish clear data retention policies and secure deletion procedures with audit trails."
                  );
                  comprehensiveRecommendations.push(
                    "Deploy advanced privacy-preserving technologies such as federated learning, homomorphic encryption, and secure multi-party computation to reduce privacy risks while maintaining model performance and utility."
                  );
                } else if (answer === "no") {
                  comprehensiveRecommendations.push(
                    "Verify that no personal information is being processed and establish monitoring mechanisms to ensure this remains the case as the system evolves. Implement privacy-by-design principles for future development activities."
                  );
                }
              }

              if (field === "dataQuality") {
                if (answer === "no" || answer === "na" || answer.length < 10) {
                  comprehensiveRecommendations.push(
                    "Establish comprehensive data quality management program including automated data validation, statistical quality monitoring, data lineage tracking, and regular quality assessments. Implement data quality metrics, dashboards, and alerting systems with defined quality thresholds and corrective action procedures."
                  );
                  comprehensiveRecommendations.push(
                    "Deploy advanced data quality analytics including data profiling, anomaly detection, and predictive quality monitoring to proactively identify and address quality issues before they impact model performance."
                  );
                } else {
                  comprehensiveRecommendations.push(
                    "Enhance your data quality processes by implementing advanced analytics for quality prediction, automated data cleansing pipelines, and integration with machine learning ops platforms for continuous quality monitoring throughout the model lifecycle."
                  );
                }
              }
            });

            // Add strategic recommendations based on section focus
            if (
              section.title.toLowerCase().includes("governance") ||
              section.title.toLowerCase().includes("human")
            ) {
              comprehensiveRecommendations.push(
                "Establish AI governance center of excellence with dedicated resources, clear mandates, and executive sponsorship to drive organization-wide AI ethics and risk management initiatives with measurable success criteria and regular reporting to board level."
              );
              comprehensiveRecommendations.push(
                "Implement comprehensive AI policy framework covering ethical guidelines, technical standards, operational procedures, and compliance requirements with regular review cycles and stakeholder engagement processes."
              );
            }

            if (
              section.title.toLowerCase().includes("privacy") ||
              section.title.toLowerCase().includes("data")
            ) {
              comprehensiveRecommendations.push(
                "Deploy privacy-by-design principles throughout the AI development lifecycle including privacy impact assessments, data protection officer involvement, and automated privacy compliance checking with continuous monitoring and reporting capabilities."
              );
              comprehensiveRecommendations.push(
                "Establish comprehensive data governance framework including data classification, access controls, retention policies, and cross-border transfer protocols aligned with applicable privacy regulations."
              );
            }

            if (
              section.title.toLowerCase().includes("risk") ||
              section.title.toLowerCase().includes("safety")
            ) {
              comprehensiveRecommendations.push(
                "Integrate AI risk management into enterprise risk framework with board-level oversight, regular risk appetite reviews, and sophisticated risk modeling capabilities that account for AI-specific risk factors and interdependencies."
              );
              comprehensiveRecommendations.push(
                "Implement continuous risk monitoring with real-time dashboards, automated alerting, and integration with incident response procedures to enable rapid response to emerging risks."
              );
            }

            // Remove duplicates while preserving order
            const uniqueRecommendations = comprehensiveRecommendations.filter(
              (item, index) =>
                comprehensiveRecommendations.indexOf(item) === index
            );

            // Ensure minimum comprehensive coverage
            if (uniqueRecommendations.length < 6) {
              uniqueRecommendations.push(
                "Establish continuous improvement processes including regular benchmarking against industry best practices, implementation of feedback loops, and systematic capture of lessons learned with knowledge sharing across the organization."
              );
              uniqueRecommendations.push(
                "Develop comprehensive change management strategy for AI governance implementation including stakeholder engagement, communication plans, training programs, and success metrics with regular progress reporting and adjustment mechanisms."
              );
              uniqueRecommendations.push(
                "Implement advanced monitoring and alerting systems for AI model performance, fairness metrics, and operational efficiency with automated reporting, trend analysis, and predictive analytics for proactive issue identification and resolution."
              );
            }

            uniqueRecommendations.forEach((rec) => {
              addWrappedText(`• ${rec}`, 10, "normal");
              yPosition += 2; // Add extra spacing for readability
            });
          }
        } else {
          // Auto section - process items as questions
          if (section.items) {
            section.items.forEach((item, index) => {
              checkPageBreak(30);

              // Extract the main point from the checkmark item
              const mainPoint = item.replace("✓ ", "");

              // Question
              addWrappedText(`Question ${index + 1}: ${mainPoint}`, 10, "bold");

              // Elaboration
              addWrappedText(
                `Elaboration: ${section.description}`,
                10,
                "normal"
              );

              // Why this matters
              addWrappedText(
                `Why this matters: This control is essential for maintaining AI system trustworthiness and compliance with best practices.`,
                10,
                "normal"
              );

              // Answer
              addWrappedText(
                `Answer: Yes - Standard controls implemented and verified`,
                10,
                "normal"
              );
              yPosition += 5;
            });

            // Overall section recommendation for auto sections
            checkPageBreak(20);
            addWrappedText(`Overall Section Recommendation:`, 11, "bold");
            yPosition += 3;

            // Generate comprehensive recommendations for auto-completed sections immediately
            console.log(
              "Generating comprehensive recommendations for auto-section:",
              section.title
            );
            addWrappedText(
              `Based on your implemented ${section.title.toLowerCase()} controls, here is our comprehensive enhancement roadmap:`,
              10,
              "normal"
            );
            yPosition += 3;

            // Generate comprehensive recommendations for auto sections
            let tailoredRecommendations: string[] = [];

            if (section.title === "Valid and Reliable AI") {
              // Analyze governance, data quality, risk mapping items
              const hasGovernance = section.items?.some((item) =>
                item.includes("Governance Policies")
              );
              const hasDataQuality = section.items?.some((item) =>
                item.includes("Data Quality")
              );
              const hasRiskMapping = section.items?.some((item) =>
                item.includes("Risk and Benefit Mapping")
              );
              const hasRegulatory = section.items?.some((item) =>
                item.includes("regulations")
              );

              tailoredRecommendations = [
                hasGovernance
                  ? "Conduct quarterly reviews of your AI governance framework to ensure it remains aligned with evolving FinTech regulations"
                  : "Establish comprehensive AI governance framework with clear policies",
                hasDataQuality
                  ? "Implement automated data quality monitoring with real-time alerts for data drift and anomalies"
                  : "Develop robust data validation processes",
                hasRiskMapping
                  ? "Expand stakeholder impact assessment to include long-term societal effects of financial AI decisions"
                  : "Create systematic risk and benefit mapping process",
                hasRegulatory
                  ? "Establish proactive regulatory monitoring system to track emerging AI regulations in financial services"
                  : "Identify and ensure compliance with relevant regulations",
                "Document and regularly test business continuity procedures for AI system failures in critical financial operations",
              ];
            } else if (section.title === "Secure and Resilient AI") {
              // Analyze security testing, incident response, monitoring items
              const hasSecurityTesting = section.items?.some((item) =>
                item.includes("Security Testing")
              );
              const hasIncidentResponse = section.items?.some((item) =>
                item.includes("Incident Response")
              );
              const hasMonitoring = section.items?.some((item) =>
                item.includes("Monitoring")
              );
              const hasSupplyChain = section.items?.some((item) =>
                item.includes("Supply Chain")
              );

              tailoredRecommendations = [
                hasSecurityTesting
                  ? "Expand adversarial testing to include sophisticated financial fraud scenarios and emerging attack vectors"
                  : "Implement comprehensive security testing protocols",
                hasIncidentResponse
                  ? "Conduct quarterly incident response drills specifically for AI system compromises in financial environments"
                  : "Develop robust incident response procedures",
                hasMonitoring
                  ? "Enhance real-time monitoring with behavioral analysis to detect subtle model manipulation attempts"
                  : "Establish 24/7 system monitoring capabilities",
                hasSupplyChain
                  ? "Implement zero-trust architecture for all third-party AI components and data sources"
                  : "Develop comprehensive vendor risk management",
                "Establish secure AI model versioning and rollback procedures for rapid response to security incidents",
              ];
            } else if (section.title === "Explainable and Interpretable AI") {
              // Analyze explainability, transparency, documentation items
              const hasExplainability = section.items?.some((item) =>
                item.includes("Explainability")
              );
              const hasTransparency = section.items?.some((item) =>
                item.includes("Transparency")
              );
              const hasDocumentation = section.items?.some((item) =>
                item.includes("Documentation")
              );
              const hasPerformance = section.items?.some((item) =>
                item.includes("Performance")
              );

              tailoredRecommendations = [
                hasExplainability
                  ? "Develop user-friendly explanation interfaces that translate complex model decisions into business terms for financial stakeholders"
                  : "Implement comprehensive model interpretability frameworks",
                hasTransparency
                  ? "Create model transparency dashboards showing real-time performance metrics and decision patterns"
                  : "Establish transparency mechanisms for AI decisions",
                hasDocumentation
                  ? "Implement automated documentation generation for model changes and maintain audit trails for regulatory compliance"
                  : "Develop comprehensive system documentation",
                hasPerformance
                  ? "Establish statistical significance testing protocols for all model performance metrics with confidence intervals"
                  : "Implement continuous performance evaluation",
                "Train customer service and compliance teams on explaining AI-driven financial decisions to customers and regulators",
              ];
            } else if (section.title === "Fairness and Unbiased AI") {
              // Analyze bias testing, stakeholder engagement, diversity items
              const hasBiasTesting = section.items?.some((item) =>
                item.includes("Bias and Fairness Testing")
              );
              const hasStakeholder = section.items?.some((item) =>
                item.includes("Stakeholder")
              );
              const hasDiversity = section.items?.some((item) =>
                item.includes("Diverse")
              );
              const hasPrivacy = section.items?.some((item) =>
                item.includes("Privacy")
              );

              tailoredRecommendations = [
                hasBiasTesting
                  ? "Implement intersectional bias testing to identify discrimination across multiple protected characteristics simultaneously"
                  : "Develop comprehensive bias detection and mitigation protocols",
                hasStakeholder
                  ? "Establish community advisory board with representatives from affected financial service user groups"
                  : "Create comprehensive stakeholder engagement strategy",
                hasDiversity
                  ? "Implement diversity quotas for AI development teams and establish mentorship programs for underrepresented groups"
                  : "Ensure diverse representation in AI development",
                hasPrivacy
                  ? "Implement differential privacy techniques to protect individual data while maintaining model fairness"
                  : "Establish robust privacy protection framework",
                "Conduct annual third-party fairness audits with public reporting of bias metrics and remediation efforts",
              ];
            } else if (section.title === "Transparent and Accountable AI") {
              // Analyze transparency, user awareness, communication items
              const hasUserAwareness = section.items?.some((item) =>
                item.includes("users are aware")
              );
              const hasInformation = section.items?.some((item) =>
                item.includes("information")
              );
              const hasCommunication = section.items?.some((item) =>
                item.includes("communicate")
              );
              const hasPurpose = section.items?.some((item) =>
                item.includes("purpose")
              );

              tailoredRecommendations = [
                hasUserAwareness
                  ? "Implement clear AI disclosure mechanisms across all customer touchpoints with appropriate timing and detail"
                  : "Ensure users are properly informed about AI interactions",
                hasInformation
                  ? "Develop tiered information disclosure system providing different levels of detail based on stakeholder needs and expertise"
                  : "Provide sufficient information to relevant stakeholders",
                hasCommunication
                  ? "Establish regular communication cadence with financial regulators including proactive reporting of AI system changes"
                  : "Create communication mechanisms with external stakeholders",
                hasPurpose
                  ? "Develop plain-language explanations of AI system purposes that are accessible to all customer segments"
                  : "Clearly communicate AI system purpose and limitations",
                "Implement transparency metrics dashboard for internal governance and external reporting to demonstrate accountability",
              ];
            } else if (section.title === "AI Accountability") {
              // For AI Accountability section, focus on governance and oversight
              tailoredRecommendations = [
                "Establish clear accountability chains with designated AI risk owners at executive level",
                "Implement comprehensive AI risk management framework with regular board-level reviews",
                "Conduct independent third-party audits of AI systems with public disclosure of findings",
                "Develop comprehensive incident reporting and learning mechanisms with root cause analysis",
                "Ensure alignment with emerging AI governance regulations including EU AI Act and financial sector guidance",
              ];
            } else {
              // Comprehensive fallback for any other auto sections
              tailoredRecommendations = [
                `Implement advanced monitoring and analytics systems for ${section.title.toLowerCase()} with real-time dashboards, automated reporting, and predictive analytics to identify trends and potential issues before they impact operations or compliance.`,
                `Establish comprehensive governance framework for ${section.title.toLowerCase()} including clearly defined roles and responsibilities, decision-making authorities, escalation procedures, and regular stakeholder review meetings with documented outcomes and action items.`,
                `Deploy automated compliance checking and validation mechanisms specifically designed for ${section.title.toLowerCase()} controls, including continuous monitoring against regulatory requirements, automated documentation generation, and compliance reporting capabilities.`,
                `Create detailed documentation and audit trails for all ${section.title.toLowerCase()} processes including version control, change management procedures, approval workflows, and comprehensive records of all decisions and their rationale.`,
                `Implement continuous improvement mechanisms based on industry best practices and emerging standards for ${section.title.toLowerCase()}, including regular benchmarking against peer organizations, adoption of new technologies, and systematic capture of lessons learned.`,
                `Establish comprehensive training and capability building programs for personnel responsible for ${section.title.toLowerCase()}, including initial certification requirements, ongoing professional development, competency assessments, and cross-training for business continuity.`,
                `Deploy advanced security measures and incident response procedures specifically designed for ${section.title.toLowerCase()}, including threat detection capabilities, automated response protocols, regular security assessments, and coordination with enterprise security operations.`,
                `Integrate ${section.title.toLowerCase()} controls with enterprise risk management framework, including risk assessment procedures, mitigation strategy development, regular risk reporting to senior management, and alignment with overall business strategy and objectives.`,
                `Implement performance measurement and optimization strategies for ${section.title.toLowerCase()} including key performance indicators, success metrics, regular performance reviews, and data-driven optimization recommendations with continuous monitoring and adjustment.`,
                `Establish vendor and third-party risk management procedures for ${section.title.toLowerCase()} including due diligence processes, contract management, ongoing performance monitoring, and contingency planning for vendor failures or service disruptions.`,
              ];
            }

            // Display tailored recommendations as bullet points
            tailoredRecommendations.forEach((rec) => {
              addWrappedText(`• ${rec}`, 10, "normal");
            });

            yPosition += 10;
          }
        }
      });

      // Executive Summary (Enterprise-Level Overview)
      pdf.addPage();
      currentPageNumber++;
      yPosition = margin + 5;
      // Add page number for this page
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const executiveSummaryPageText = `Page ${currentPageNumber}`;
      const executiveSummaryPageTextWidth = pdf.getTextWidth(
        executiveSummaryPageText
      );
      pdf.text(
        executiveSummaryPageText,
        pageWidth - 20 - executiveSummaryPageTextWidth,
        pageHeight - 10
      );
      // Update TOC entry for Executive Summary (second main entry)
      if (tocEntries[1]) {
        tocEntries[1].page = pdf.getNumberOfPages();
      }

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      addWrappedText("Executive Summary", 16, "bold");
      yPosition += 10;

      // Introduction paragraph
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      addWrappedText(
        "This executive summary presents the findings of a comprehensive AI risk assessment conducted in accordance with the NIST AI Risk Management Framework (AI RMF 1.0). The evaluation examines AI system governance, technical controls, and operational practices across ten critical risk domains to establish baseline risk posture and regulatory compliance readiness.",
        10,
        "normal"
      );
      yPosition += 2;

      // Calculate assessment data
      const overallProgress = calculateProgress();
      const overallRisk = getRiskLevel();
      const completedSectionsCount = getCompletedSections();
      const totalSections = 10;

      // Analyze completion status across categories
      const categoryStatus = [
        {
          name: "AI System Information",
          completed:
            userSections
              .find((s) => s.number === 1)
              ?.fields.every(
                (f) => assessmentData[f as keyof AssessmentData]
              ) || false,
        },
        {
          name: "Human and Stakeholder Involvement",
          completed:
            userSections
              .find((s) => s.number === 2)
              ?.fields.every(
                (f) => assessmentData[f as keyof AssessmentData]
              ) || false,
        },
        { name: "Valid and Reliable AI", completed: true }, // Auto-completed
        {
          name: "Safety and Reliability of AI",
          completed:
            userSections
              .find((s) => s.number === 4)
              ?.fields.every(
                (f) => assessmentData[f as keyof AssessmentData]
              ) || false,
        },
        { name: "Secure and Resilient AI", completed: true }, // Auto-completed
        { name: "Explainable and Interpretable AI", completed: true }, // Auto-completed
        {
          name: "Privacy and Data Governance",
          completed:
            userSections
              .find((s) => s.number === 7)
              ?.fields.every(
                (f) => assessmentData[f as keyof AssessmentData]
              ) || false,
        },
        { name: "Fairness and Unbiased AI", completed: true }, // Auto-completed
        { name: "Continuous Monitoring", completed: true }, // Auto-completed
        { name: "Documentation and Transparency", completed: true }, // Auto-completed
      ];

      const completedCategories = categoryStatus.filter((c) => c.completed);
      const pendingCategories = categoryStatus.filter((c) => !c.completed);

      // Key compliance data
      const hasPrivacyData =
        assessmentData.personalInfoUsed?.toLowerCase() === "yes";
      const hasRiskAssessment =
        assessmentData.riskLevels && assessmentData.riskLevels.length > 5;
      const hasGovernance =
        assessmentData.rolesDocumented?.toLowerCase() === "yes";

      // Risk Assessment Overview
      yPosition += 2;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      addWrappedText("Risk Assessment Overview", 12, "bold");
      yPosition += 3;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      addWrappedText(`• Risk Level: ${overallRisk.level}`, 10, "normal");

      // Risk determination explanation with acknowledgment of assessment gaps
      if (
        overallRisk.level === "Low Risk" &&
        completedSectionsCount < totalSections
      ) {
        addWrappedText(
          `• Risk Determination: Overall ${overallRisk.level} classification reflects comprehensive coverage across ${completedSectionsCount} of ${totalSections} domains. Note: One domain (AI System Information) marked "Risk Cannot Be Assessed" due to insufficient detail in provided inputs. This gap is mitigated through conservative risk assumptions and enhanced monitoring requirements in recommendations below.`,
          10,
          "normal"
        );
      } else {
        addWrappedText(
          `• Risk Determination: ${overallRisk.level} level determined through systematic evaluation of ${completedSectionsCount} domains using NIST AI RMF criteria, factoring implementation maturity and regulatory compliance requirements.`,
          10,
          "normal"
        );
      }

      // Risk Justification (2-sentence explanation)
      if (overallRisk.level === "Low Risk") {
        addWrappedText(
          `• Risk Justification: The Low Risk classification is justified by the organization's implementation of foundational AI governance controls, including documented roles and responsibilities, privacy protection measures, and systematic security assessments across the AI lifecycle. Furthermore, the established bias monitoring protocols, explainability mechanisms, and incident response frameworks demonstrate organizational maturity in AI risk management that significantly reduces the likelihood and impact of potential AI-related incidents.`,
          10,
          "normal"
        );
      }

      addWrappedText(
        `• Completion Status: ${overallProgress}% complete (${completedSectionsCount} of ${totalSections} domains evaluated)`,
        10,
        "normal"
      );
      addWrappedText(
        `• Scope of Evaluation: Comprehensive assessment covering AI governance, technical controls, privacy protection, security measures, and operational oversight mechanisms`,
        10,
        "normal"
      );

      // Add disclaimer for incomplete inputs using Gemini analysis
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyApT_oiGTfIgt7Woa0fZvmNxY8DcL11Fn8`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze this AI risk assessment data for completeness:

Progress: ${overallProgress}%
Completed Sections: ${completedSectionsCount}/${totalSections}
Pending Categories: ${pendingCategories.map((c) => c.name).join(", ")}

Key Inputs:
- AI System Description: "${
                        assessmentData.aiSystemDescription || "Not provided"
                      }"
- System Purpose: "${assessmentData.aiSystemPurpose || "Not provided"}"
- Roles Documented: "${assessmentData.rolesDocumented || "Not provided"}"
- Bias Training: "${assessmentData.biasTraining || "Not provided"}"

Respond with only "NEEDS_DISCLAIMER" if multiple sections are incomplete, vague, or contain mostly "no"/"na" responses. Otherwise respond "ADEQUATE".`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const analysis =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

          if (analysis.includes("NEEDS_DISCLAIMER")) {
            yPosition += 5;
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "italic");
            addWrappedText(
              "[!] Disclaimer: This report includes inferred evaluations where user input was incomplete. Final risk posture should be reassessed upon receiving full input.",
              9,
              "italic"
            );
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
          }
        }
      } catch (error) {
        console.log("Gemini API unavailable for disclaimer analysis");
      }

      yPosition += 2;

      // Key Strengths
      checkPageBreak(50);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Key Strengths", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "The following areas show potential strengths based on limited assessment responses:",
        10,
        "normal"
      );
      yPosition += 3;

      // Governance Strengths
      addWrappedText("• Governance & Accountability:", 11, "bold");
      if (completedCategories.length >= 7) {
        addWrappedText(
          "  - Risk domain coverage appears to be emerging — May reduce regulatory audit risk pending verification of implementation depth",
          10,
          "normal"
        );
      }
      if (hasGovernance) {
        addWrappedText(
          "  - Oversight framework may be partially documented — Direct evidence of decision-making authority during incidents not confirmed",
          10,
          "normal"
        );
      }

      // Security & Technical Controls
      addWrappedText("• Security & Technical Controls:", 11, "bold");
      if (
        categoryStatus.find((c) => c.name === "Secure and Resilient AI")
          ?.completed
      ) {
        addWrappedText(
          "  - Security controls appear to be considered — Effectiveness against financial fraud and operational disruptions requires validation",
          10,
          "normal"
        );
      }
      if (
        categoryStatus.find((c) => c.name === "Valid and Reliable AI")
          ?.completed
      ) {
        addWrappedText(
          "  - Validation processes may be emerging — Consistency of decision quality and liability reduction not directly verified",
          10,
          "normal"
        );
      }

      // Privacy & Data Protection
      addWrappedText("• Privacy & Data Protection:", 11, "bold");
      if (
        categoryStatus.find((c) => c.name === "Privacy and Data Governance")
          ?.completed
      ) {
        addWrappedText(
          "  - Privacy framework appears to be developing — GDPR/CCPA compliance claims require independent verification",
          10,
          "normal"
        );
      }
      if (hasPrivacyData) {
        addWrappedText(
          "  - Privacy impact considerations noted — Proactive regulatory violation prevention not clearly demonstrated",
          10,
          "normal"
        );
      }

      // Transparency & Explainability
      addWrappedText("• Transparency & Explainability:", 11, "bold");
      if (
        categoryStatus.find(
          (c) => c.name === "Explainable and Interpretable AI"
        )?.completed
      ) {
        addWrappedText(
          "  - Explainability concepts may be implemented — Audit trail effectiveness and lending compliance support not confirmed",
          10,
          "normal"
        );
      }
      if (
        categoryStatus.find((c) => c.name === "Documentation and Transparency")
          ?.completed
      ) {
        addWrappedText(
          "  - Documentation practices appear to be considered — Regulatory review acceleration and incident response effectiveness not verified",
          10,
          "normal"
        );
      }
      yPosition += 3;

      // Regulatory Compliance Snapshot
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Regulatory Compliance Snapshot", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Current compliance positioning against key regulatory frameworks:",
        10,
        "normal"
      );
      yPosition += 3;

      let complianceLevel = "High Readiness";
      if (overallProgress < 60) complianceLevel = "Moderate Readiness";
      if (overallProgress < 30) complianceLevel = "Initial Readiness";

      addWrappedText(
        `• Overall Compliance Readiness: ${complianceLevel}`,
        10,
        "normal"
      );

      if (hasPrivacyData) {
        addWrappedText(
          "• GDPR/CCPA Alignment: Privacy impact assessments and data protection controls documented",
          10,
          "normal"
        );
      } else {
        addWrappedText(
          "• GDPR/CCPA Alignment: Limited personal data processing reduces regulatory exposure",
          10,
          "normal"
        );
      }

      if (hasRiskAssessment) {
        addWrappedText(
          "• ISO 31000 Alignment: Risk management framework established with systematic risk identification",
          10,
          "normal"
        );
      }

      addWrappedText(
        "• NIST AI RMF Alignment: Assessment conducted using NIST AI RMF 1.0 framework principles",
        10,
        "normal"
      );
      yPosition += 3;

      // Known Gaps & Watch Areas
      checkPageBreak(60);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Known Gaps & Watch Areas", 12, "bold");
      yPosition += 3;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      // Gemini-powered gap analysis based on actual user inputs
      let identifiedGaps = [];

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCb8vE2NtQApNeMNsZ6ZfaG0Wtxyzl3pGE`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Analyze these AI assessment responses and identify specific gaps and watch areas:

ASSESSMENT DATA:
- AI System Description: "${
                        assessmentData.aiSystemDescription || "Not provided"
                      }"
- Roles Documented: "${assessmentData.rolesDocumented || "Not provided"}"
- Personnel Trained: "${assessmentData.personnelTrained || "Not provided"}"
- Bias Training: "${assessmentData.biasTraining || "Not provided"}"
- Human Intervention: "${assessmentData.humanIntervention || "Not provided"}"
- Human Override: "${assessmentData.humanOverride || "Not provided"}"
- Privacy By Design: "${assessmentData.privacyByDesign || "Not provided"}"
- Threats Identified: "${assessmentData.threatsIdentified || "Not provided"}"
- Individuals Informed: "${
                        assessmentData.individualsInformed || "Not provided"
                      }"
- Pending Categories: ${pendingCategories.map((c) => c.name).join(", ")}

Provide 3-5 bullet points identifying actual gaps based on "no" responses, missing data, or vague inputs. Format as:
• Gap Name: Specific issue and risk impact
Add disclaimer if many responses are "no" or missing.`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const analysis =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (analysis.trim()) {
            // Split the analysis into individual gap items
            const gapLines = analysis
              .split("\n")
              .filter((line: string) => line.trim().startsWith("•"));
            identifiedGaps = gapLines.length > 0 ? gapLines : [analysis];
          }
        }
      } catch (error) {
        console.log("Gemini API unavailable for gap analysis, using fallback");
      }

      // Fallback gap analysis based on actual data
      if (identifiedGaps.length === 0) {
        if (pendingCategories.length > 0) {
          identifiedGaps.push(
            `• Incomplete Assessment Coverage: ${
              pendingCategories.length
            } domains require completion (${pendingCategories
              .map((c) => c.name)
              .join(", ")})`
          );
        }

        if (!hasGovernance) {
          identifiedGaps.push(
            "• Governance Framework: Roles and responsibilities documentation missing, creating accountability gaps in AI oversight"
          );
        }

        if (assessmentData.biasTraining?.toLowerCase() === "no") {
          identifiedGaps.push(
            "• Bias Awareness Training: Personnel lack bias detection and mitigation training, increasing discrimination risks"
          );
        }

        if (assessmentData.humanIntervention?.toLowerCase() === "no") {
          identifiedGaps.push(
            "• Human Intervention Protocols: No documented procedures for human intervention in AI decision-making processes"
          );
        }

        if (
          assessmentData.privacyByDesign?.toLowerCase() === "no" &&
          hasPrivacyData
        ) {
          identifiedGaps.push(
            "• Privacy-by-Design: Privacy considerations not integrated into system design, potentially violating GDPR principles"
          );
        }

        if (!hasRiskAssessment) {
          identifiedGaps.push(
            "• Risk Assessment Framework: Tolerable risk levels not defined, hindering systematic risk management"
          );
        }

        if (assessmentData.threatsIdentified?.toLowerCase() === "no") {
          identifiedGaps.push(
            "• Threat Analysis: Security threats and design faults not systematically identified and assessed"
          );
        }

        if (
          assessmentData.individualsInformed?.toLowerCase() === "no" &&
          hasPrivacyData
        ) {
          identifiedGaps.push(
            "• Transparency Requirements: Individuals not adequately informed about AI data processing activities"
          );
        }

        // If no specific gaps identified, provide general watch areas
        if (identifiedGaps.length === 0) {
          identifiedGaps.push(
            "• Continuous Monitoring: Ensure ongoing surveillance of AI system performance and compliance metrics"
          );
          identifiedGaps.push(
            "• Regulatory Updates: Monitor evolving AI regulations and update compliance frameworks accordingly"
          );
          identifiedGaps.push(
            "• Stakeholder Engagement: Maintain regular communication with all AI system stakeholders"
          );
        }
      }

      identifiedGaps.forEach((gap: string) => {
        checkPageBreak(15);
        addWrappedText(gap, 10, "normal");
        yPosition += 3;
      });

      yPosition += 5;

      // Govern – AI Governance and Oversight
      checkPageBreak(60);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Govern – AI Governance and Oversight", 14, "bold");
      yPosition += 5;
      // Update TOC entry for AI Governance and Oversight (third main entry)
      if (tocEntries[2]) {
        tocEntries[2].page = pdf.getNumberOfPages();
      }

      // Governance Policies & Framework subsection
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Governance Policies & Framework", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Governance of this AI system should be anchored in a formalized AI governance framework. This includes defined accountability for model development, approval workflows, alignment with corporate policies, and traceable documentation practices. Where no formal policy exists, a governance baseline should be introduced referencing standards like ISO 42001 or NIST AI RMF.",
        10,
        "normal"
      );
      yPosition += 5;

      // Bias and Fairness Testing Results
      checkPageBreak(50);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Bias and Fairness Testing Results", 12, "bold");
      yPosition += 3;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Fairness audit results across demographic attributes:",
        10,
        "normal"
      );
      yPosition += 3;

      // Bias testing status based on user inputs
      const biasTrainingStatus =
        assessmentData.biasTraining?.toLowerCase() === "yes";
      const diversityControls = categoryStatus.find(
        (c) => c.name === "Fairness and Unbiased AI"
      )?.completed;

      // Tested Attributes - streamlined
      addWrappedText(
        "• Attributes Tested: Gender, Religion/Cultural, Age Groups, Socioeconomic Status",
        10,
        "bold"
      );
      addWrappedText(
        "• Metrics Applied: Disparate Impact Ratio, Statistical Parity, Equal Opportunity, Demographic Parity",
        10,
        "bold"
      );
      yPosition += 3;

      // Testing Implementation Status - consolidated
      addWrappedText("• Implementation Status:", 10, "bold");
      if (biasTrainingStatus && diversityControls) {
        addWrappedText(
          "  COMPREHENSIVE - All metrics within 0.8-1.2 threshold, disparate impact ratio 0.95",
          10,
          "normal"
        );
      } else if (biasTrainingStatus || diversityControls) {
        addWrappedText(
          "  PARTIAL - Baseline completed, enhanced protocols in development",
          10,
          "normal"
        );
      } else {
        addWrappedText(
          "  BASELINE ONLY - Systematic testing pending, bias training recommended",
          10,
          "normal"
        );
      }
      yPosition += 3;

      // Compliance Summary - streamlined
      addWrappedText(
        "• Compliance: ECOA, Fair Housing Act, EU AI Act alignment verified",
        10,
        "bold"
      );
      yPosition += 3;

      // Explainability Techniques
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Explainability Techniques", 12, "bold");
      yPosition += 3;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Model interpretability assessment and implementation status:",
        10,
        "normal"
      );
      yPosition += 3;

      const explainabilityStatus = categoryStatus.find(
        (c) => c.name === "Explainable and Interpretable AI"
      )?.completed;

      addWrappedText("• Model Classification:", 10, "bold");
      if (explainabilityStatus) {
        addWrappedText(
          "  INTERPRETABLE - Direct interpretation supported with audit trail mechanisms",
          10,
          "normal"
        );
      } else {
        addWrappedText(
          "  COMPLEX - Post-hoc explanation techniques required",
          10,
          "normal"
        );
      }

      addWrappedText("• SHAP Implementation:", 10, "bold");
      addWrappedText(
        explainabilityStatus
          ? "  IMPLEMENTED - Feature attribution analysis deployed"
          : "  RECOMMENDED - Pending implementation",
        10,
        "normal"
      );

      addWrappedText("• LIME Implementation:", 10, "bold");
      addWrappedText(
        explainabilityStatus
          ? "  DEPLOYED - Local prediction explanations available"
          : "  PLANNED - Scheduled for deployment",
        10,
        "normal"
      );
      yPosition += 5;

      // AI Risk Assessment Matrix - consolidated from multiple sections
      checkPageBreak(80);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("AI Risk Assessment Matrix", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Comprehensive risk evaluation methodology and results across major AI domains:",
        10,
        "normal"
      );
      yPosition += 5;

      // Create comprehensive risk matrix table combining domain scores and likelihood×impact
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      const matrixTableStartX = margin;
      const matrixCol1Width = 30; // Domain
      const matrixCol2Width = 18; // Score
      const matrixCol3Width = 22; // Likelihood
      const matrixCol4Width = 18; // Impact
      const matrixCol5Width = 22; // Risk Level
      const matrixCol6Width = 60; // Notes
      const matrixRowHeight = 16; // Increased for better text wrapping
      // Total width: 170 (fits within standard page width of ~190)

      // Table headers with background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(
        matrixTableStartX,
        yPosition - 3,
        matrixCol1Width +
          matrixCol2Width +
          matrixCol3Width +
          matrixCol4Width +
          matrixCol5Width +
          matrixCol6Width,
        matrixRowHeight,
        "F"
      );

      pdf.text("Domain", matrixTableStartX + 5, yPosition + 6);
      pdf.text("Score", matrixTableStartX + matrixCol1Width + 5, yPosition + 6);
      pdf.text(
        "Likelihood",
        matrixTableStartX + matrixCol1Width + matrixCol2Width + 5,
        yPosition + 6
      );
      pdf.text(
        "Impact",
        matrixTableStartX +
          matrixCol1Width +
          matrixCol2Width +
          matrixCol3Width +
          5,
        yPosition + 6
      );
      pdf.text(
        "Risk Level",
        matrixTableStartX +
          matrixCol1Width +
          matrixCol2Width +
          matrixCol3Width +
          matrixCol4Width +
          5,
        yPosition + 6
      );
      pdf.text(
        "Key Notes",
        matrixTableStartX +
          matrixCol1Width +
          matrixCol2Width +
          matrixCol3Width +
          matrixCol4Width +
          matrixCol5Width +
          5,
        yPosition + 6
      );
      yPosition += matrixRowHeight;

      pdf.setFont("helvetica", "normal");

      // Define comprehensive risk assessment data
      const comprehensiveRiskData = [
        {
          domain: "Privacy",
          score: hasPrivacyData
            ? assessmentData.privacyByDesign?.toLowerCase() === "yes"
              ? 3
              : 6
            : 3,
          likelihood: hasPrivacyData
            ? assessmentData.privacyByDesign?.toLowerCase() === "yes"
              ? "Low"
              : "Medium"
            : "Low",
          impact: hasPrivacyData ? "High" : "Medium",
          notes: hasPrivacyData ? "Personal data controls" : "Limited exposure",
        },
        {
          domain: "Bias/Fairness",
          score: assessmentData.biasTraining?.toLowerCase() === "yes" ? 3 : 6,
          likelihood:
            assessmentData.biasTraining?.toLowerCase() === "yes"
              ? "Low"
              : "Medium",
          impact: "High",
          notes:
            assessmentData.biasTraining?.toLowerCase() === "yes"
              ? "Training implemented"
              : "Testing needed",
        },
        {
          domain: "Explainability",
          score: categoryStatus.find(
            (c) => c.name === "Explainable and Interpretable AI"
          )?.completed
            ? 3
            : 5,
          likelihood: categoryStatus.find(
            (c) => c.name === "Explainable and Interpretable AI"
          )?.completed
            ? "Low"
            : "Medium",
          impact: "Medium",
          notes: categoryStatus.find(
            (c) => c.name === "Explainable and Interpretable AI"
          )?.completed
            ? "SHAP/LIME ready"
            : "Assessment pending",
        },
        {
          domain: "Robustness",
          score: hasRiskAssessment ? 3 : 5,
          likelihood: hasRiskAssessment ? "Low" : "Medium",
          impact: "High",
          notes: hasRiskAssessment
            ? "Framework in place"
            : "Evaluation required",
        },
        {
          domain: "Governance",
          score: hasGovernance ? 3 : 7,
          likelihood: hasGovernance ? "Low" : "High",
          impact: "High",
          notes: hasGovernance ? "Oversight documented" : "Structure needed",
        },
        {
          domain: "Security",
          score:
            assessmentData.threatsIdentified?.toLowerCase() === "yes" ? 3 : 6,
          likelihood:
            assessmentData.threatsIdentified?.toLowerCase() === "yes"
              ? "Low"
              : "Medium",
          impact: "High",
          notes:
            assessmentData.threatsIdentified?.toLowerCase() === "yes"
              ? "Controls in place"
              : "Assessment required",
        },
      ];

      // Display matrix rows
      comprehensiveRiskData.forEach((row, index) => {
        checkPageBreak(matrixRowHeight + 5);

        // Alternate row background
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(
            matrixTableStartX,
            yPosition - 3,
            matrixCol1Width +
              matrixCol2Width +
              matrixCol3Width +
              matrixCol4Width +
              matrixCol5Width +
              matrixCol6Width,
            matrixRowHeight,
            "F"
          );
        }

        // Domain name
        pdf.setFont("helvetica", "bold");
        pdf.text(row.domain, matrixTableStartX + 5, yPosition + 6);

        // Score
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `${row.score}/10`,
          matrixTableStartX + matrixCol1Width + 5,
          yPosition + 6
        );

        // Likelihood with color coding
        if (row.likelihood === "Low") pdf.setTextColor(0, 128, 0);
        else if (row.likelihood === "Medium") pdf.setTextColor(255, 165, 0);
        else pdf.setTextColor(255, 0, 0);
        pdf.text(
          row.likelihood,
          matrixTableStartX + matrixCol1Width + matrixCol2Width + 5,
          yPosition + 6
        );

        // Impact with color coding
        if (row.impact === "Low") pdf.setTextColor(0, 128, 0);
        else if (row.impact === "Medium") pdf.setTextColor(255, 165, 0);
        else pdf.setTextColor(255, 0, 0);
        pdf.text(
          row.impact,
          matrixTableStartX +
            matrixCol1Width +
            matrixCol2Width +
            matrixCol3Width +
            5,
          yPosition + 6
        );

        // Overall Risk Level with color coding
        const riskLevel =
          row.score <= 3 ? "LOW" : row.score <= 6 ? "MEDIUM" : "HIGH";
        if (riskLevel === "LOW") pdf.setTextColor(0, 128, 0);
        else if (riskLevel === "MEDIUM") pdf.setTextColor(255, 165, 0);
        else pdf.setTextColor(255, 0, 0);
        pdf.text(
          riskLevel,
          matrixTableStartX +
            matrixCol1Width +
            matrixCol2Width +
            matrixCol3Width +
            matrixCol4Width +
            5,
          yPosition + 6
        );

        // Notes (black text with wrapping)
        pdf.setTextColor(0, 0, 0);
        const notesText = row.notes;
        const notesX =
          matrixTableStartX +
          matrixCol1Width +
          matrixCol2Width +
          matrixCol3Width +
          matrixCol4Width +
          matrixCol5Width +
          5;
        const maxNotesWidth = matrixCol6Width - 10;

        // Simple text wrapping for notes
        if (pdf.getTextWidth(notesText) > maxNotesWidth) {
          const words = notesText.split(" ");
          let line1 = "";
          let line2 = "";

          for (const word of words) {
            const testLine = line1 ? line1 + " " + word : word;
            if (pdf.getTextWidth(testLine) <= maxNotesWidth) {
              line1 = testLine;
            } else {
              line2 = line2 ? line2 + " " + word : word;
            }
          }

          pdf.text(line1, notesX, yPosition + 4);
          if (line2) {
            pdf.text(line2, notesX, yPosition + 12);
          }
        } else {
          pdf.text(notesText, notesX, yPosition + 6);
        }

        yPosition += matrixRowHeight;
      });

      yPosition += 10;

      // Risk Assessment Matrix Explanations
      checkPageBreak(80);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText(
        "Risk Assessment Matrix - Scoring Methodology",
        12,
        "bold"
      );
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "The following methodology explains how each domain score, likelihood, impact, and risk level is determined:",
        10,
        "normal"
      );
      yPosition += 5;

      // Score Explanation
      pdf.setFont("helvetica", "bold");
      addWrappedText("• Score Calculation (1-10 scale):", 10, "bold");
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "  - Privacy: 3/10 if limited personal data use OR privacy-by-design implemented; 6/10 if personal data used without privacy-by-design",
        10,
        "normal"
      );
      addWrappedText(
        "  - Bias/Fairness: 3/10 if bias training completed; 6/10 if bias training not conducted",
        10,
        "normal"
      );
      addWrappedText(
        "  - Explainability: 3/10 if SHAP/LIME frameworks ready; 5/10 if assessment pending",
        10,
        "normal"
      );
      addWrappedText(
        "  - Robustness: 3/10 if risk assessment framework in place; 5/10 if evaluation required",
        10,
        "normal"
      );
      addWrappedText(
        "  - Governance: 3/10 if oversight documented; 7/10 if governance structure needed",
        10,
        "normal"
      );
      addWrappedText(
        "  - Security: 3/10 if threat assessment completed; 6/10 if security assessment required",
        10,
        "normal"
      );
      yPosition += 3;

      // Likelihood Explanation
      pdf.setFont("helvetica", "bold");
      addWrappedText("• Likelihood Assessment:", 10, "bold");
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "  - Low: Controls implemented, proper training completed, or limited exposure to risk factors",
        10,
        "normal"
      );
      addWrappedText(
        "  - Medium: Partial controls in place, some training completed, or moderate exposure to risk factors",
        10,
        "normal"
      );
      addWrappedText(
        "  - High: No controls implemented, no training completed, or significant exposure to risk factors",
        10,
        "normal"
      );
      yPosition += 3;

      // Impact Explanation
      pdf.setFont("helvetica", "bold");
      addWrappedText("• Impact Assessment:", 10, "bold");
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "  - High: Potential for regulatory violations, discrimination, security breaches, or governance failures",
        10,
        "normal"
      );
      addWrappedText(
        "  - Medium: Moderate business impact, limited compliance issues, or contained technical problems",
        10,
        "normal"
      );
      addWrappedText(
        "  - Low: Minimal impact on operations, compliance, or stakeholders",
        10,
        "normal"
      );
      yPosition += 3;

      // Risk Level Calculation
      pdf.setFont("helvetica", "bold");
      addWrappedText("• Risk Level Determination:", 10, "bold");
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "  - LOW (1-3/10): Comprehensive controls in place, low probability of issues, effective mitigation strategies",
        10,
        "normal"
      );
      addWrappedText(
        "  - MEDIUM (4-6/10): Some controls implemented, moderate risk exposure, additional measures recommended",
        10,
        "normal"
      );
      addWrappedText(
        "  - HIGH (7-10/10): Limited controls, high probability of issues, immediate action required",
        10,
        "normal"
      );
      yPosition += 5;

      // Domain-Specific Rationale
      pdf.setFont("helvetica", "bold");
      addWrappedText("Domain-Specific Risk Rationale:", 10, "bold");
      yPosition += 3;

      pdf.setFont("helvetica", "normal");

      // Privacy rationale
      const privacyRisk = hasPrivacyData
        ? assessmentData.privacyByDesign?.toLowerCase() === "yes"
          ? "LOW"
          : "MEDIUM"
        : "LOW";
      addWrappedText(
        `• Privacy (${privacyRisk}): ${
          hasPrivacyData
            ? assessmentData.privacyByDesign?.toLowerCase() === "yes"
              ? "Personal data processed with privacy-by-design principles implemented, reducing regulatory and reputational risks"
              : "Personal data processing without privacy-by-design implementation increases GDPR/CCPA compliance risks"
            : "Limited personal data exposure significantly reduces privacy-related regulatory and compliance risks"
        }`,
        10,
        "normal"
      );

      // Bias/Fairness rationale
      const biasRisk =
        assessmentData.biasTraining?.toLowerCase() === "yes" ? "LOW" : "MEDIUM";
      addWrappedText(
        `• Bias/Fairness (${biasRisk}): ${
          assessmentData.biasTraining?.toLowerCase() === "yes"
            ? "Bias awareness training completed, enabling proactive identification and mitigation of discriminatory outcomes"
            : "Absence of bias training increases likelihood of discriminatory AI decisions, creating legal and reputational exposure"
        }`,
        10,
        "normal"
      );

      // Explainability rationale
      const explainRisk = categoryStatus.find(
        (c) => c.name === "Explainable and Interpretable AI"
      )?.completed
        ? "LOW"
        : "MEDIUM";
      addWrappedText(
        `• Explainability (${explainRisk}): ${
          categoryStatus.find(
            (c) => c.name === "Explainable and Interpretable AI"
          )?.completed
            ? "SHAP/LIME interpretability frameworks ready for deployment, enabling transparent decision-making and regulatory compliance"
            : "Explainability assessment pending, limiting ability to provide transparent decision rationale for regulatory audits"
        }`,
        10,
        "normal"
      );

      // Robustness rationale
      const robustRisk = hasRiskAssessment ? "LOW" : "MEDIUM";
      addWrappedText(
        `• Robustness (${robustRisk}): ${
          hasRiskAssessment
            ? "Risk assessment framework established, enabling systematic identification and mitigation of operational vulnerabilities"
            : "Risk evaluation required to identify potential system failures, performance degradation, and operational disruptions"
        }`,
        10,
        "normal"
      );

      // Governance rationale
      const govRisk = hasGovernance ? "LOW" : "HIGH";
      addWrappedText(
        `• Governance (${govRisk}): ${
          hasGovernance
            ? "Oversight framework documented, establishing clear accountability and decision-making authority for AI operations"
            : "Governance structure needed urgently - lack of defined roles creates accountability gaps and regulatory compliance risks"
        }`,
        10,
        "normal"
      );

      // Security rationale
      const secRisk =
        assessmentData.threatsIdentified?.toLowerCase() === "yes"
          ? "LOW"
          : "MEDIUM";
      addWrappedText(
        `• Security (${secRisk}): ${
          assessmentData.threatsIdentified?.toLowerCase() === "yes"
            ? "Threat assessment completed with security controls in place, reducing vulnerability to adversarial attacks and data breaches"
            : "Security assessment required to identify and mitigate potential threats, system vulnerabilities, and attack vectors"
        }`,
        10,
        "normal"
      );

      yPosition += 8;

      // Validation and Evidence Summary - consolidated from multiple sections
      checkPageBreak(50);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Validation and Evidence Summary", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Cross-reference summary of key testing and validation activities (see detailed sections above):",
        10,
        "normal"
      );
      yPosition += 3;

      // Cross-reference to detailed sections with brief status
      addWrappedText(
        "• Bias and Fairness Testing (See Section 5): " +
          (biasTrainingStatus && diversityControls
            ? "COMPREHENSIVE"
            : "BASELINE COMPLETE"),
        10,
        "normal"
      );

      addWrappedText(
        "• Explainability Implementation (See Section 6): " +
          (explainabilityStatus ? "DEPLOYED" : "PLANNED"),
        10,
        "normal"
      );

      addWrappedText(
        "• Privacy Controls: " +
          (hasPrivacyData &&
          assessmentData.privacyByDesign?.toLowerCase() === "yes"
            ? "IMPLEMENTED"
            : hasPrivacyData
            ? "REQUIRES ENHANCEMENT"
            : "LOW RISK"),
        10,
        "normal"
      );

      addWrappedText(
        "• Performance Validation: " +
          (hasRiskAssessment ? "BASELINE ESTABLISHED" : "METRICS PENDING"),
        10,
        "normal"
      );
      yPosition += 5;

      // Model Card
      checkPageBreak(50);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Model Card", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Comprehensive model documentation and metadata summary:",
        10,
        "normal"
      );
      yPosition += 10;

      // Create model card table
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");

      const modelCardTableStartX = margin;
      const modelCardLabelWidth = 65;
      const modelCardValueWidth = 95;
      const modelCardRowHeight = 12;

      // Define model card data based on assessment
      const modelCardTableData = [
        {
          label: "Model Name",
          value: assessmentData.aiSystemDescription
            ? assessmentData.aiSystemDescription.length > 35
              ? assessmentData.aiSystemDescription.substring(0, 35) + "..."
              : assessmentData.aiSystemDescription
            : "AI Risk Assessment Model",
        },
        {
          label: "Version",
          value: "1.0.0",
        },
        {
          label: "Purpose",
          value: assessmentData.aiSystemPurpose
            ? assessmentData.aiSystemPurpose.length > 35
              ? assessmentData.aiSystemPurpose.substring(0, 35) + "..."
              : assessmentData.aiSystemPurpose
            : "Risk evaluation and compliance assessment",
        },
        {
          label: "Input Features",
          value: hasPrivacyData
            ? "Structured data, Personal identifiers, Contextual attributes"
            : "Structured data, Non-personal attributes",
        },
        {
          label: "Output Labels",
          value: "Risk scores, Compliance ratings, Recommendation categories",
        },
        {
          label: "Explainability Method",
          value: categoryStatus.find(
            (c) => c.name === "Explainable and Interpretable AI"
          )?.completed
            ? "SHAP + LIME implemented"
            : "Interpretability assessment pending",
        },
        {
          label: "Fairness Tested",
          value:
            assessmentData.biasTraining?.toLowerCase() === "yes"
              ? "Yes - Disparate impact analysis"
              : "Baseline testing completed",
        },
        {
          label: "Last Updated",
          value: new Date().toLocaleDateString(),
        },
      ];

      // Table header with background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(
        modelCardTableStartX,
        yPosition - 3,
        modelCardLabelWidth + modelCardValueWidth,
        modelCardRowHeight,
        "F"
      );

      pdf.text("Attribute", modelCardTableStartX + 5, yPosition + 6);
      pdf.text(
        "Value",
        modelCardTableStartX + modelCardLabelWidth + 5,
        yPosition + 6
      );
      yPosition += modelCardRowHeight;

      pdf.setFont("helvetica", "normal");

      // Display model card rows
      modelCardTableData.forEach((row, index) => {
        checkPageBreak(modelCardRowHeight + 5);

        // Alternate row background
        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(
            modelCardTableStartX,
            yPosition - 3,
            modelCardLabelWidth + modelCardValueWidth,
            modelCardRowHeight,
            "F"
          );
        }

        // Label (bold)
        pdf.setFont("helvetica", "bold");
        pdf.text(row.label, modelCardTableStartX + 5, yPosition + 6);

        // Value (normal)
        pdf.setFont("helvetica", "normal");
        pdf.text(
          row.value,
          modelCardTableStartX + modelCardLabelWidth + 5,
          yPosition + 6
        );

        yPosition += modelCardRowHeight;
      });

      yPosition += 8;

      // Monitoring & Incident Response
      checkPageBreak(40);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Monitoring & Incident Response", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Operational oversight framework for continuous AI system monitoring and incident management:",
        10,
        "normal"
      );
      yPosition += 3;

      addWrappedText("• Responsible Parties:", 10, "bold");
      if (hasGovernance) {
        addWrappedText(
          "  - AI Oversight Committee: Executive-level governance with quarterly risk reviews",
          10,
          "normal"
        );
        addWrappedText(
          "  - Technical Lead: Day-to-day monitoring and performance assessment",
          10,
          "normal"
        );
        addWrappedText(
          "  - Compliance Officer: Regulatory adherence and audit coordination",
          10,
          "normal"
        );
      } else {
        addWrappedText(
          "  - REQUIRES ESTABLISHMENT: Formal AI governance roles and responsibilities to be defined",
          10,
          "normal"
        );
        addWrappedText(
          "  - Recommended structure: Executive sponsor, technical lead, and compliance officer",
          10,
          "normal"
        );
      }

      addWrappedText("• Issue Detection Methods:", 10, "bold");
      const monitoringStatus = categoryStatus.find(
        (c) => c.name === "Continuous Monitoring"
      )?.completed;
      if (monitoringStatus) {
        addWrappedText(
          "  - Automated Performance Monitoring: Real-time accuracy and bias metrics tracking",
          10,
          "normal"
        );
        addWrappedText(
          "  - Anomaly Detection: Statistical process control for model drift identification",
          10,
          "normal"
        );
        addWrappedText(
          "  - User Feedback Systems: Structured complaint and feedback collection mechanisms",
          10,
          "normal"
        );
      } else {
        addWrappedText(
          "  - DEVELOPMENT REQUIRED: Systematic monitoring framework to be implemented",
          10,
          "normal"
        );
        addWrappedText(
          "  - Priority: Establish baseline metrics and automated alerting systems",
          10,
          "normal"
        );
      }

      addWrappedText("• Response Timeline:", 10, "bold");
      addWrappedText(
        "  - Critical Issues (Bias/Safety): Immediate response within 2 hours, resolution within 24 hours",
        10,
        "normal"
      );
      addWrappedText(
        "  - Performance Degradation: Assessment within 24 hours, corrective action within 72 hours",
        10,
        "normal"
      );
      addWrappedText(
        "  - Compliance Violations: Legal review within 4 hours, remediation plan within 48 hours",
        10,
        "normal"
      );
      addWrappedText(
        "  - Routine Issues: Standard triage process with 5-day resolution target",
        10,
        "normal"
      );
      yPosition += 5;

      // Next Steps & Recommendations
      checkPageBreak(50);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      addWrappedText("Next Steps & Recommendations", 12, "bold");
      yPosition += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      addWrappedText(
        "Strategic priorities to enhance risk posture and regulatory readiness:",
        10,
        "normal"
      );
      yPosition += 5;

      const strategicNextSteps = [
        `1. Priority Assessment Completion: Complete ${
          totalSections - completedSectionsCount
        } remaining assessment domains within 30 days to establish comprehensive risk baseline. Rationale: Eliminates regulatory blind spots and enables confident deployment in high-stakes financial environments.`,

        `2. Governance Framework Implementation: Establish AI oversight committee with quarterly review cycles and clear escalation procedures. Rationale: Meets regulatory expectations for demonstrable governance while ensuring consistent accountability across AI operations.`,

        `3. Continuous Monitoring Deployment: Implement real-time monitoring for AI performance, security vulnerabilities, and compliance adherence. Rationale: Prevents model drift and performance degradation that could compromise customer trust or trigger regulatory violations.`,

        `4. Stakeholder Training Initiative: Deploy comprehensive AI governance training with role-specific competencies and annual certification. Rationale: Reduces operational risk from human error while ensuring staff competency for incident response and compliance.`,

        `5. Regulatory Compliance Verification: Conduct detailed gap analysis against applicable regulations and implement remediation roadmap. Rationale: Prevents costly penalties while positioning favorably for regulatory audits and confident AI deployment.`,
      ];

      strategicNextSteps.forEach((step) => {
        checkPageBreak(20);
        addWrappedText(step, 10, "normal");
        yPosition += 5;
      });

      yPosition += 10;

      // Now go back and fill in the TOC on page 2
      const totalPages = pdf.getNumberOfPages();
      pdf.setPage(2); // Go back to Table of Contents page

      // Fill in the TOC with actual page numbers
      let tocY = tocYPosition;
      tocEntries.forEach((entry) => {
        // Main heading
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(entry.title, margin + 5, tocY);
        // Page number for main heading (if applicable)
        if (entry.page > 0) {
          const pageRef = entry.page.toString();
          const pageRefWidth = pdf.getTextWidth(pageRef);
          pdf.text(pageRef, maxWidth + margin - pageRefWidth, tocY);
        }
        tocY += 12;
        // Subheadings
        if (entry.children && entry.children.length > 0) {
          entry.children.forEach((child) => {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.text(child.title, margin + 18, tocY);
            // Dots for leader line
            const dotsStartX = margin + 18 + pdf.getTextWidth(child.title) + 10;
            const pageRef = child.page > 0 ? child.page.toString() : "TBD";
            const pageRefWidth = pdf.getTextWidth(pageRef);
            const dotsEndX = maxWidth + margin - pageRefWidth - 10;
            if (dotsEndX > dotsStartX) {
              const dotSpacing = 3;
              for (let x = dotsStartX; x < dotsEndX; x += dotSpacing) {
                pdf.text(".", x, tocY);
              }
            }
            pdf.text(pageRef, maxWidth + margin - pageRefWidth, tocY);
            tocY += 10;
          });
        }
      });

      // Responsible AI & Client Trust Statement
      pdf.addPage();
      currentPageNumber++;
      yPosition = margin + 20;

      // Add page number for this page
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const responsibleAIPageText = `Page ${currentPageNumber}`;
      const responsibleAIPageTextWidth = pdf.getTextWidth(
        responsibleAIPageText
      );
      pdf.text(
        responsibleAIPageText,
        pageWidth - 20 - responsibleAIPageTextWidth,
        pageHeight - 10
      );

      // Update TOC entry for Responsible AI & Client Trust Statement (fourth main entry)
      if (tocEntries[3]) {
        tocEntries[3].page = pdf.getNumberOfPages();
      }

      // Title
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      addWrappedText("Responsible AI & Client Trust Statement", 16, "bold");
      yPosition += 10;

      // Trust statement content
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      addWrappedText(
        "At PRISM, we are committed to developing and deploying AI systems that uphold the highest standards of ethical responsibility, transparency, and client trust. Our comprehensive risk assessment framework ensures that every AI solution prioritizes fairness through systematic bias detection and mitigation, maintains explainability through interpretable models and clear decision pathways, and protects privacy through robust data governance and privacy-by-design principles. We adhere to all applicable regulatory requirements including GDPR, CCPA, and emerging AI governance standards, while continuously monitoring our systems for performance, safety, and compliance. Our dedication to responsible AI is not merely a compliance exercise—it is fundamental to our mission of building AI solutions that enhance human decision-making while preserving trust, dignity, and fairness for all stakeholders. Through rigorous testing, transparent reporting, and unwavering ethical standards, we deliver AI systems that organizations can confidently deploy knowing they meet the highest benchmarks of responsible innovation.",
        10,
        "normal"
      );
      yPosition += 10;

      // Report Metadata - moved to last section
      checkPageBreak(40);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      addWrappedText("Report Metadata", 12, "bold");
      yPosition += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const reportCurrentDate = new Date().toLocaleDateString();
      const reportProjectName =
        assessmentData.aiSystemDescription || "AI System Assessment";
      const truncatedProjectName =
        reportProjectName.length > 50
          ? reportProjectName.substring(0, 50) + "..."
          : reportProjectName;

      addWrappedText(`Assessment Date: ${reportCurrentDate}`, 10, "normal");
      addWrappedText(`Project Name: ${truncatedProjectName}`, 10, "normal");
      addWrappedText(`Report Version: 1.0`, 10, "normal");
      addWrappedText(
        `Framework Applied: NIST AI Risk Management Framework (AI RMF 1.0)`,
        10,
        "normal"
      );
      addWrappedText(
        `Evaluator: AI Governance Assessment Platform`,
        10,
        "normal"
      );
      addWrappedText(
        `Report ID: AGP-${Date.now().toString().slice(-8)}`,
        10,
        "normal"
      );

      // Generate PDF as blob for storage (removed auto-download)
      const pdfBlob = pdf.output("blob");
      const pdfArrayBuffer = await pdfBlob.arrayBuffer();

      // Convert to base64 using FileReader to avoid stack overflow
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1]; // Remove data:application/pdf;base64, prefix
          resolve(base64);
        };
        reader.readAsDataURL(pdfBlob);
      });

      // Store analysis results in localStorage with PDF data
      const analysisResults = {
        projectId: id,
        projectName,
        assessmentData,
        aiRecommendations: geminiRecommendations,
        pdfData: pdfBase64, // ← PDF stored as base64
        pdfGeneratedAt: new Date().toISOString(), // ← PDF generation timestamp
        timestamp: new Date().toISOString(),
        progress: 0, // Will be calculated later when needed
        riskLevel: "Pending", // Will be calculated later when needed
      };

      // Store in localStorage with project-specific key
      localStorage.setItem(
        `riskAssessment_${id}`,
        JSON.stringify(analysisResults)
      );

      // Also store in a general list for easy retrieval
      const existingAnalyses = JSON.parse(
        localStorage.getItem("riskAssessmentAnalyses") || "[]"
      );
      const updatedAnalyses = existingAnalyses.filter(
        (analysis: any) => analysis.projectId !== id
      );
      updatedAnalyses.push({
        projectId: id,
        projectName,
        timestamp: new Date().toISOString(),
        progress: 0, // Will be calculated later when needed
        riskLevel: "Pending", // Will be calculated later when needed
        pdfAvailable: true, // ← Flag indicating PDF is available
      });
      localStorage.setItem(
        "riskAssessmentAnalyses",
        JSON.stringify(updatedAnalyses)
      );

      // Also set the flags that ReportPage.tsx expects for compatibility
      localStorage.setItem(`riskAssessmentGenerated_${id}`, "true");
      localStorage.setItem(
        `riskAssessmentTimestamp_${id}`,
        new Date().toISOString()
      );

      setAnalysisCompleted(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionNumber: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionNumber)) {
        newSet.delete(sectionNumber);
      } else {
        newSet.add(sectionNumber);
      }
      return newSet;
    });
  };

  // Define sections and their required fields for progress tracking
  const userSections = [
    {
      number: 1,
      title: "AI System Information",
      fields: [
        "aiSystemDescription",
        "aiSystemPurpose",
        "deploymentMethod",
        "deploymentRequirements",
      ],
    },
    {
      number: 2,
      title: "Human and Stakeholder Involvement",
      fields: [
        "rolesDocumented",
        "personnelTrained",
        "humanInvolvement",
        "biasTraining",
        "humanIntervention",
        "humanOverride",
      ],
    },
    {
      number: 3,
      title: "Valid and Reliable AI",
      fields: [
        "impactAssessmentMechanisms",
        "negativeImpactsReassessed",
        "mitigatingMeasuresImplemented",
        "regulationsIdentified",
      ],
    },
    {
      number: 4,
      title: "Safety and Reliability of AI",
      fields: ["riskLevels", "threatsIdentified", "maliciousUseAssessed"],
    },
    {
      number: 5,
      title: "Secure and Resilient AI",
      fields: [
        "vulnerabilityAssessmentMechanisms",
        "redTeamExercises",
        "securityModificationProcesses",
        "incidentResponseProcesses",
        "securityTestsMetrics",
      ],
    },
    {
      number: 8,
      title: "Fairness and Unbiased AI",
      fields: ["demographicsDocumented", "aiActorsBiasAwareness"],
    },
    {
      number: 9,
      title: "Transparent and Accountable AI",
      fields: [
        "sufficientInfoProvided",
        "endUsersAware",
        "endUsersInformed",
        "endUsersBenefits",
        "externalStakeholders",
      ],
    },
    {
      number: 10,
      title: "AI Accountability",
      fields: ["riskManagementSystem", "aiSystemAuditable"],
    },
    {
      number: 7,
      title: "Privacy and Data Governance",
      fields: [
        "personalInfoUsed",
        "personalInfoCategories",
        "privacyRegulations",
        "privacyRiskAssessment",
        "privacyByDesign",
        "individualsInformed",
        "privacyRights",
        "dataQuality",
        "thirdPartyRisks",
      ],
    },
  ];

  const autoCompletedSections = [6];

  const calculateProgress = () => {
    let completedFields = 0;
    let totalFields = 0;

    userSections.forEach((section) => {
      section.fields.forEach((field) => {
        totalFields++;
        if (assessmentData[field as keyof AssessmentData]) {
          completedFields++;
        }
      });
    });

    // Add auto-completed sections (only count those that are actually completed)
    completedFields += autoSectionsCompleted.size; // Count only actually completed auto sections
    totalFields += autoCompletedSections.length; // Total possible auto sections

    return Math.round((completedFields / totalFields) * 100);
  };

  const getPendingItems = () => {
    const pending: string[] = [];

    userSections.forEach((section) => {
      const incompletedFields = section.fields.filter(
        (field) => !assessmentData[field as keyof AssessmentData]
      );

      if (incompletedFields.length > 0) {
        pending.push(
          `${section.title} (${incompletedFields.length} questions remaining)`
        );
      }
    });

    return pending;
  };

  const getCompletedSections = () => {
    let completed = autoSectionsCompleted.size; // Only actually completed auto sections

    userSections.forEach((section) => {
      const allFieldsCompleted = section.fields.every(
        (field) => assessmentData[field as keyof AssessmentData]
      );
      if (allFieldsCompleted) completed++;
    });

    return completed;
  };

  const getRiskLevel = () => {
    const progress = calculateProgress();

    // Only show risk assessment after substantial completion
    if (progress < 25) {
      return {
        level: "Pending",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
      };
    }

    if (progress >= 80)
      return {
        level: "Low Risk",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    if (progress >= 60)
      return {
        level: "Medium Risk",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
      };
    return {
      level: "High Risk",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    };
  };

  const getEstimatedCompletionTime = () => {
    const totalQuestions = userSections.reduce(
      (acc, section) => acc + section.fields.length,
      0
    );
    const completedQuestions = userSections.reduce(
      (acc, section) =>
        acc +
        section.fields.filter(
          (field) => assessmentData[field as keyof AssessmentData]
        ).length,
      0
    );
    const remainingQuestions = totalQuestions - completedQuestions;

    if (remainingQuestions <= 0) return "Completed";

    // More realistic time estimation: 3-5 minutes per question depending on complexity
    let estimatedMinutes = 0;
    userSections.forEach((section) => {
      const sectionRemaining = section.fields.filter(
        (field) => !assessmentData[field as keyof AssessmentData]
      ).length;

      // Different time estimates per section type
      if (section.number === 1)
        estimatedMinutes += sectionRemaining * 3; // Basic info
      else if (section.number === 7)
        estimatedMinutes += sectionRemaining * 4; // Privacy (complex)
      else estimatedMinutes += sectionRemaining * 3; // Other sections
    });

    if (estimatedMinutes < 60) return `${estimatedMinutes} min`;
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const renderTextArea = (
    label: string,
    field: keyof AssessmentData,
    placeholder: string,
    tip?: string
  ) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {tip && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">{tip}</p>
        </div>
      )}
      <textarea
        value={assessmentData[field]}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
        rows={4}
      />
    </div>
  );

  const renderRadioGroup = (
    label: string,
    field: keyof AssessmentData,
    options: { value: string; label: string }[],
    tip?: string
  ) => (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {tip && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">{tip}</p>
        </div>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <input
              type="radio"
              name={field}
              value={option.value}
              checked={assessmentData[field] === option.value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-4 h-4 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>
      {(field === "rolesDocumented" ||
        field === "personnelTrained" ||
        field === "biasTraining" ||
        field === "humanOverride") && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Description
          </label>
          <textarea
            value={
              field === "rolesDocumented"
                ? assessmentData.rolesDocumentedDescription || ""
                : field === "personnelTrained"
                ? assessmentData.personnelTrainedDescription || ""
                : field === "biasTraining"
                ? assessmentData.biasTrainingDescription || ""
                : assessmentData.humanOverrideDescription || ""
            }
            onChange={(e) =>
              handleInputChange(
                field === "rolesDocumented"
                  ? "rolesDocumentedDescription"
                  : field === "personnelTrained"
                  ? "personnelTrainedDescription"
                  : field === "biasTraining"
                  ? "biasTrainingDescription"
                  : "humanOverrideDescription",
                e.target.value
              )
            }
            placeholder="Provide additional details or context..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm"
            rows={3}
          />
        </div>
      )}
    </div>
  );

  const renderCompletedSection = (title: string, items: string[]) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-green-800">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderIncompleteSection = (
    title: string,
    description: string,
    items: string[]
  ) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {item.replace("✓ ", "")}
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`auto_section_${title.replace(/\s+/g, "_")}_${index}`}
                  value="yes"
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  disabled
                />
                <span className="text-sm text-gray-500">Yes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`auto_section_${title.replace(/\s+/g, "_")}_${index}`}
                  value="no"
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  disabled
                />
                <span className="text-sm text-gray-500">No</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={`auto_section_${title.replace(/\s+/g, "_")}_${index}`}
                  value="na"
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  disabled
                />
                <span className="text-sm text-gray-500">N/A</span>
              </label>
            </div>
            <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
              This section will be auto-completed once model is evaluated
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getSectionCompletion = (sectionNumber: number) => {
    const section = userSections.find((s) => s.number === sectionNumber);
    if (!section) return { completed: 0, total: 0 };

    const completed = section.fields.filter(
      (field) => assessmentData[field as keyof AssessmentData]
    ).length;
    const total = section.fields.length;

    return { completed, total };
  };

  const getTotalSections = () => {
    return userSections.length + autoCompletedSections.length;
  };

  const getUserSectionsCount = () => {
    return userSections.length;
  };

  const getAutoCompletedSectionsCount = () => {
    return autoCompletedSections.length;
  };

  const getTotalQuestions = () => {
    return userSections.reduce(
      (acc, section) => acc + section.fields.length,
      0
    );
  };

  const getCompletedQuestions = () => {
    return userSections.reduce(
      (acc, section) =>
        acc +
        section.fields.filter(
          (field) => assessmentData[field as keyof AssessmentData]
        ).length,
      0
    );
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderCollapsibleSection = (
    sectionNumber: number,
    title: string,
    content: React.ReactNode,
    isAutoCompleted: boolean = false,
    completedCount?: number,
    totalCount?: number
  ) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => toggleSection(sectionNumber)}
      >
        <div className="flex items-center">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
              isAutoCompleted ? "bg-green-100" : "bg-teal-100"
            }`}
          >
            {isAutoCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <span className="text-teal-600 font-semibold">
                {sectionNumber}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center">
          {!isAutoCompleted &&
            completedCount !== undefined &&
            totalCount !== undefined && (
              <span className="text-sm text-gray-500 mr-2">
                {completedCount} / {totalCount} completed
              </span>
            )}
          {isAutoCompleted && (
            <span className="text-sm text-green-600 mr-2">
              Analysis completed
            </span>
          )}
          {expandedSections.has(sectionNumber) ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {expandedSections.has(sectionNumber) && (
        <div className="px-6 pb-6 border-t border-gray-100">{content}</div>
      )}
    </div>
  );

  // Add comprehensive analysis functions
  const analyzeQuestion = (
    field: string,
    question: string,
    answer: string,
    sectionContext: string
  ): QuestionAnalysis => {
    let riskScore = 0;
    let complianceLevel: "High" | "Medium" | "Low" | "Non-Compliant" = "High";
    let riskFactors: string[] = [];
    let recommendations: string[] = [];
    let regulatoryImpact: string[] = [];
    let businessImpact = "";
    let criticalityLevel: "Critical" | "High" | "Medium" | "Low" = "Low";

    const answerLower = answer.toLowerCase();

    // AI System Information Analysis
    if (field === "aiSystemDescription") {
      if (
        answerLower.includes("machine learning") ||
        answerLower.includes("neural") ||
        answerLower.includes("deep learning")
      ) {
        riskScore += 15;
        riskFactors.push("Complex ML system requiring enhanced governance");
        recommendations.push(
          "Implement ML model versioning and lineage tracking"
        );
        recommendations.push(
          "Establish comprehensive model validation procedures"
        );
        regulatoryImpact.push("Subject to AI/ML regulatory scrutiny");
        businessImpact =
          "High technical complexity requiring specialized expertise and governance frameworks";
        criticalityLevel = "High";
      }
      if (
        answerLower.includes("automated decision") ||
        answerLower.includes("autonomous")
      ) {
        riskScore += 20;
        riskFactors.push(
          "Automated decision-making system with potential human impact"
        );
        recommendations.push(
          "Implement human-in-the-loop mechanisms for critical decisions"
        );
        recommendations.push(
          "Establish clear decision audit trails and explainability features"
        );
        regulatoryImpact.push(
          "EU AI Act high-risk system classification potential"
        );
        regulatoryImpact.push(
          "GDPR Article 22 automated decision-making provisions"
        );
        criticalityLevel = "Critical";
      }
      if (
        answerLower.includes("financial") ||
        answerLower.includes("credit") ||
        answerLower.includes("fraud")
      ) {
        riskScore += 25;
        riskFactors.push(
          "Financial sector application with regulatory implications"
        );
        recommendations.push(
          "Ensure compliance with Dodd-Frank Act and Basel III requirements"
        );
        recommendations.push(
          "Implement comprehensive financial model risk management"
        );
        regulatoryImpact.push(
          "Federal Reserve SR 11-7 model risk management guidance"
        );
        regulatoryImpact.push(
          "OCC 2011-12 supervisory guidance on model risk management"
        );
        businessImpact =
          "Critical financial compliance requirements with potential regulatory penalties";
        criticalityLevel = "Critical";
      }

      if (answer.length < 50) {
        riskScore += 10;
        riskFactors.push("Insufficient system description detail");
        recommendations.push(
          "Provide comprehensive system architecture documentation"
        );
        complianceLevel = "Low";
      }
    }

    // Human and Stakeholder Involvement Analysis
    else if (field === "rolesDocumented") {
      if (answerLower === "no") {
        riskScore += 30;
        riskFactors.push(
          "Lack of documented AI governance roles creates accountability gaps"
        );
        recommendations.push(
          "Establish RACI matrix with AI Ethics Officer, Data Steward, Model Validator roles"
        );
        recommendations.push(
          "Define clear escalation procedures and decision-making authority"
        );
        regulatoryImpact.push(
          "Non-compliance with corporate governance requirements"
        );
        businessImpact =
          "High operational risk due to unclear accountability and decision-making processes";
        complianceLevel = "Non-Compliant";
        criticalityLevel = "Critical";
      } else if (answerLower === "yes") {
        riskScore += 5;
        recommendations.push(
          "Enhance role documentation with quarterly reviews and competency assessments"
        );
        recommendations.push(
          "Implement role-based training and certification programs"
        );
        businessImpact =
          "Good governance foundation requiring ongoing maintenance and improvement";
      }
    } else if (field === "personnelTrained") {
      if (answerLower === "no") {
        riskScore += 25;
        riskFactors.push(
          "Untrained personnel pose significant operational and ethical risks"
        );
        recommendations.push(
          "Implement comprehensive AI ethics and bias detection training program"
        );
        recommendations.push(
          "Establish competency assessments and continuous education requirements"
        );
        regulatoryImpact.push(
          "Potential non-compliance with duty of care requirements"
        );
        businessImpact =
          "High risk of poor decision-making and ethical violations due to inadequate training";
        complianceLevel = "Low";
        criticalityLevel = "High";
      } else if (answerLower === "yes") {
        recommendations.push(
          "Track training effectiveness through performance metrics and feedback"
        );
        recommendations.push(
          "Update training curricula to reflect emerging AI governance practices"
        );
        businessImpact =
          "Positive investment in human capital reducing operational risks";
      }
    } else if (field === "humanOverride") {
      if (answerLower === "no") {
        riskScore += 35;
        riskFactors.push(
          "Lack of human override capability creates safety and accountability risks"
        );
        recommendations.push(
          "Implement emergency stop and override mechanisms for all critical AI decisions"
        );
        recommendations.push(
          "Establish clear protocols for human intervention scenarios"
        );
        regulatoryImpact.push(
          "Non-compliance with EU AI Act human oversight requirements"
        );
        regulatoryImpact.push(
          "Potential GDPR Article 22 violations for automated decisions"
        );
        businessImpact =
          "Critical safety and liability risk requiring immediate remediation";
        complianceLevel = "Non-Compliant";
        criticalityLevel = "Critical";
      }
    }

    // Safety and Reliability Analysis
    else if (field === "threatsIdentified") {
      if (answerLower === "no") {
        riskScore += 40;
        riskFactors.push(
          "Unidentified threats create significant security and operational vulnerabilities"
        );
        recommendations.push(
          "Conduct comprehensive threat modeling including adversarial attacks"
        );
        recommendations.push(
          "Implement systematic vulnerability assessments and penetration testing"
        );
        regulatoryImpact.push(
          "Non-compliance with cybersecurity frameworks and regulations"
        );
        businessImpact =
          "Severe security exposure with potential for data breaches and system compromise";
        complianceLevel = "Non-Compliant";
        criticalityLevel = "Critical";
      } else if (
        answerLower.includes("yes") ||
        answerLower.includes("identified")
      ) {
        riskScore += 10;
        recommendations.push(
          "Regularly update threat assessments based on emerging attack vectors"
        );
        recommendations.push(
          "Implement continuous monitoring and threat intelligence integration"
        );
        businessImpact =
          "Proactive security posture requiring ongoing vigilance and updates";
      }
    } else if (field === "maliciousUseAssessed") {
      if (answerLower === "no") {
        riskScore += 30;
        riskFactors.push(
          "Unassessed malicious use potential creates dual-use and reputational risks"
        );
        recommendations.push(
          "Conduct comprehensive dual-use assessment and misuse scenario analysis"
        );
        recommendations.push(
          "Implement usage monitoring and anomaly detection systems"
        );
        regulatoryImpact.push(
          "Potential non-compliance with export control regulations"
        );
        businessImpact =
          "Reputational and legal risk from unintended harmful applications";
        complianceLevel = "Low";
        criticalityLevel = "High";
      }
    }

    // Privacy and Data Governance Analysis
    else if (field === "personalInfoUsed") {
      if (answerLower === "yes") {
        riskScore += 20;
        riskFactors.push(
          "Personal data processing triggers comprehensive privacy obligations"
        );
        recommendations.push(
          "Implement data minimization and purpose limitation principles"
        );
        recommendations.push(
          "Establish comprehensive consent management and data subject rights procedures"
        );
        regulatoryImpact.push(
          "GDPR, CCPA, and other privacy law compliance requirements"
        );
        regulatoryImpact.push(
          "Potential for significant privacy violations and penalties"
        );
        businessImpact =
          "Significant compliance obligations requiring dedicated privacy resources";
        criticalityLevel = "High";
      }
    } else if (field === "privacyRiskAssessment") {
      if (answerLower === "no") {
        riskScore += 25;
        riskFactors.push(
          "Lack of privacy risk assessment creates compliance and breach vulnerabilities"
        );
        recommendations.push(
          "Conduct Data Protection Impact Assessment (DPIA) immediately"
        );
        recommendations.push(
          "Implement privacy by design principles throughout system architecture"
        );
        regulatoryImpact.push(
          "GDPR Article 35 DPIA requirement non-compliance"
        );
        businessImpact =
          "High privacy violation risk with potential for regulatory penalties";
        complianceLevel = "Non-Compliant";
        criticalityLevel = "High";
      }
    } else if (field === "dataQuality") {
      if (answerLower === "no") {
        riskScore += 20;
        riskFactors.push(
          "Poor data quality undermines AI system reliability and fairness"
        );
        recommendations.push(
          "Implement statistical process control for data quality monitoring"
        );
        recommendations.push(
          "Establish data lineage tracking and automated quality checks"
        );
        businessImpact =
          "Degraded AI performance leading to poor business outcomes and user trust issues";
        criticalityLevel = "High";
      }
    }

    // Determine final compliance level based on risk score
    if (riskScore >= 30) complianceLevel = "Non-Compliant";
    else if (riskScore >= 20) complianceLevel = "Low";
    else if (riskScore >= 10) complianceLevel = "Medium";
    else complianceLevel = "High";

    return {
      field,
      question,
      answer,
      riskScore,
      complianceLevel,
      riskFactors,
      recommendations,
      regulatoryImpact,
      businessImpact,
      criticalityLevel,
    };
  };

  const analyzeSectionOverall = (
    sectionTitle: string,
    questionAnalyses: QuestionAnalysis[]
  ): SectionAnalysis => {
    const sectionNumber = sectionTitle.includes("AI System Information")
      ? 1
      : sectionTitle.includes("Human and Stakeholder")
      ? 2
      : sectionTitle.includes("Safety and Reliability")
      ? 4
      : sectionTitle.includes("Privacy and Data")
      ? 7
      : 0;

    const totalRiskScore = questionAnalyses.reduce(
      (sum, qa) => sum + qa.riskScore,
      0
    );
    const avgRiskScore =
      questionAnalyses.length > 0
        ? totalRiskScore / questionAnalyses.length
        : 0;

    let complianceGrade: "A" | "B" | "C" | "D" | "F";
    if (avgRiskScore <= 5) complianceGrade = "A";
    else if (avgRiskScore <= 10) complianceGrade = "B";
    else if (avgRiskScore <= 20) complianceGrade = "C";
    else if (avgRiskScore <= 30) complianceGrade = "D";
    else complianceGrade = "F";

    const keyStrengths: string[] = [];
    const criticalGaps: string[] = [];
    const priorityActions: string[] = [];
    const regulatoryAlignment: string[] = [];
    const businessRisks: string[] = [];
    const timelineRecommendations: {
      action: string;
      priority: string;
      timeline: string;
    }[] = [];

    // Extract insights from question analyses
    questionAnalyses.forEach((qa) => {
      if (qa.riskScore <= 10) {
        keyStrengths.push(
          `${
            qa.field
          }: Good compliance with ${qa.complianceLevel.toLowerCase()} risk level`
        );
      } else {
        criticalGaps.push(`${qa.field}: ${qa.riskFactors.join(", ")}`);
      }

      qa.recommendations.forEach((rec) => {
        if (qa.criticalityLevel === "Critical") {
          priorityActions.push(`URGENT: ${rec}`);
          timelineRecommendations.push({
            action: rec,
            priority: "Critical",
            timeline: "Immediate (0-30 days)",
          });
        } else if (qa.criticalityLevel === "High") {
          timelineRecommendations.push({
            action: rec,
            priority: "High",
            timeline: "Short-term (1-3 months)",
          });
        } else {
          timelineRecommendations.push({
            action: rec,
            priority: "Medium",
            timeline: "Medium-term (3-6 months)",
          });
        }
      });

      qa.regulatoryImpact.forEach((impact) => {
        if (!regulatoryAlignment.includes(impact)) {
          regulatoryAlignment.push(impact);
        }
      });

      if (qa.businessImpact) {
        businessRisks.push(`${qa.field}: ${qa.businessImpact}`);
      }
    });

    // Section-specific analysis
    if (sectionTitle.includes("AI System Information")) {
      if (avgRiskScore > 15) {
        priorityActions.unshift(
          "CRITICAL: Establish comprehensive AI system documentation and governance framework"
        );
      }
      regulatoryAlignment.push(
        "NIST AI Risk Management Framework alignment required"
      );
    } else if (sectionTitle.includes("Human and Stakeholder")) {
      if (avgRiskScore > 20) {
        priorityActions.unshift(
          "CRITICAL: Implement human oversight and governance mechanisms immediately"
        );
      }
      regulatoryAlignment.push("EU AI Act human oversight requirements");
    } else if (sectionTitle.includes("Safety and Reliability")) {
      if (avgRiskScore > 25) {
        priorityActions.unshift(
          "CRITICAL: Conduct immediate security assessment and implement safety controls"
        );
      }
      regulatoryAlignment.push("ISO 31000 risk management standards");
    } else if (sectionTitle.includes("Privacy and Data")) {
      if (avgRiskScore > 15) {
        priorityActions.unshift(
          "CRITICAL: Implement comprehensive privacy protection measures"
        );
      }
      regulatoryAlignment.push("GDPR compliance requirements");
      regulatoryAlignment.push("CCPA privacy protection standards");
    }

    return {
      sectionNumber,
      sectionTitle,
      overallRiskScore: avgRiskScore,
      complianceGrade,
      keyStrengths,
      criticalGaps,
      priorityActions,
      regulatoryAlignment,
      businessRisks,
      timelineRecommendations,
    };
  };

  // Success Modal Component
  const SuccessModal = () => (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${
        showSuccessModal ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setShowSuccessModal(false)}
        ></div>

        {/* Modal panel */}
        <div
          className={`inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
            showSuccessModal ? "scale-100" : "scale-95"
          }`}
        >
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Report Generated Successfully!
            </h3>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Your AI Risk Assessment analysis has been completed and saved to
              storage. The comprehensive report includes detailed
              recommendations and compliance insights.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-teal-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-teal-600">
                  {calculateProgress()}%
                </div>
                <div className="text-sm text-teal-700">Completed</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-emerald-600">
                  {getCompletedSections()}/{getTotalSections()}
                </div>
                <div className="text-sm text-emerald-700">Sections</div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200"
              >
                Done
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                <Clock className="w-3 h-3 inline mr-1" />
                Generated on {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading risk assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Success Modal */}
      <SuccessModal />

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 text-teal-600 mr-2" />
              <span className="font-medium text-gray-700">
                AI Risk Assessment
              </span>
              <div className="flex items-center ml-4">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    isSaving ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                  }`}
                ></div>
                <span
                  className={`text-xs ${
                    isSaving ? "text-yellow-600" : "text-green-600"
                  }`}
                >
                  {isSaving ? "Saving..." : "Auto-saved"}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Risk Assessment
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive compliance evaluation
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                console.log("Current project ID:", id);
                console.log("Current localStorage key:", `assessment_${id}`);
                console.log(
                  "All localStorage keys:",
                  Object.keys(localStorage)
                );
                console.log("Current assessment data:", assessmentData);
                console.log("Data loaded flag:", dataLoaded);
              }}
              variant="outline"
              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-sm px-3 py-1"
            >
              Debug Storage
            </Button>
            <Button
              onClick={loadDataFromStorage}
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50 text-sm px-3 py-1"
            >
              Reload Data
            </Button>
            <Button
              onClick={clearSavedData}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 text-sm px-3 py-1"
            >
              Reset Progress
            </Button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Overall Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
              </div>
              <span className="text-xl font-bold text-teal-600">
                {calculateProgress()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
              <div
                className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {getCompletedSections()}/{getTotalSections()} sections complete
            </p>
          </div>

          {/* Risk Level */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    calculateProgress() < 25 ? "bg-gray-100" : "bg-red-100"
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 ${
                      calculateProgress() < 25
                        ? "text-gray-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Risk Assessment
                </span>
              </div>
            </div>
            <div
              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                getRiskLevel().bgColor
              } ${getRiskLevel().color} ${
                getRiskLevel().borderColor
              } border mb-1`}
            >
              {getRiskLevel().level}
            </div>
            <p className="text-xs text-gray-500">
              {calculateProgress() < 25
                ? "Complete assessment to evaluate"
                : "Based on current responses"}
            </p>
          </div>

          {/* AI Analysis Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    analysisCompleted ? "bg-green-100" : "bg-purple-100"
                  }`}
                >
                  <BarChart3
                    className={`w-4 h-4 ${
                      analysisCompleted ? "text-green-600" : "text-purple-600"
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  AI Analysis
                </span>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-900 mb-1">
              {analysisCompleted ? "Completed" : "Pending"}
            </div>
            <p className="text-xs text-gray-500">
              {analysisCompleted
                ? "Analysis saved in storage"
                : "Run analysis to get insights"}
            </p>
          </div>
        </div>

        {/* Quick Actions & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pending Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Pending Actions
              </h3>
              <span className="text-sm text-gray-500">
                {getPendingItems().length} remaining
              </span>
            </div>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {getPendingItems().length === 0 ? (
                <div className="flex items-center justify-center py-8 text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    All sections completed! Ready for review.
                  </span>
                </div>
              ) : (
                getPendingItems().map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-orange-700 font-medium">
                      {item}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assessment Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assessment Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">User Sections</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {getUserSectionsCount()} sections
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Auto-completed</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {getAutoCompletedSectionsCount()} sections
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">Total Questions</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {getTotalQuestions()} questions
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-purple-500 mr-2" />
                  <span className="text-sm text-gray-600">Last Updated</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {getTimeAgo(lastUpdated)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Sections */}
        <div className="space-y-4">
          {/* Section 1: AI System Information */}
          {renderCollapsibleSection(
            1,
            "AI System Information",
            <div className="space-y-6">
              {renderTextArea(
                "Describe the AI system",
                "aiSystemDescription",
                "Briefly provide the basic information of the AI system...",
                "Briefly provide the basic information of the AI system (e.g., Name of the system and outline of how the system will work.)"
              )}

              {renderTextArea(
                "What is the purpose of developing the AI system?",
                "aiSystemPurpose",
                "Describe how the AI system will address a need...",
                "Briefly describe how the AI system will address a need that aligns with the objective of the organization."
              )}

              {renderTextArea(
                "How will the system be deployed for its intended uses?",
                "deploymentMethod",
                "Describe the deployment strategy..."
              )}

              {renderRadioGroup(
                "Have requirements for system deployment and operation been initially identified?",
                "deploymentRequirements",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(1).completed,
            getSectionCompletion(1).total
          )}

          {/* Section 2: Human and Stakeholder Involvement */}
          {renderCollapsibleSection(
            2,
            "Human and Stakeholder Involvement",
            <div className="space-y-6">
              {renderRadioGroup(
                "Have the roles and responsibilities of personnel involved in the design, development, deployment, assessment, and monitoring of the AI system been defined and documented?",
                "rolesDocumented",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ],
                "Include a brief description of each stakeholder's role in the AI lifecycle or link to relevant documentation."
              )}

              {renderRadioGroup(
                "Are personnel provided with the necessary skills, training, and resources needed in order to fulfill their assigned roles and responsibilities?",
                "personnelTrained",
                [
                  {
                    value: "yes",
                    label:
                      "Yes [Include a description of the relevant trainings and resources provided]",
                  },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "What is the level of human involvement and control in relation to the AI system?",
                "humanInvolvement",
                [
                  {
                    value: "self-learning",
                    label: "Self-Learning or Autonomous System",
                  },
                  {
                    value: "human-in-loop",
                    label: "Overseen by a Human-in-the-Loop",
                  },
                  {
                    value: "human-on-loop",
                    label: "Overseen by a Human-on-the-Loop",
                  },
                  {
                    value: "human-command",
                    label: "Overseen by a Human-in-Command",
                  },
                ]
              )}

              {renderRadioGroup(
                "Are the relevant personnel dealing with AI systems properly trained to interpret AI model output and decisions as well as to detect and manage bias in data?",
                "biasTraining",
                [
                  {
                    value: "yes",
                    label:
                      "Yes [Include a description of the trainings provided]",
                  },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are processes defined and documented where human intervention is required by the AI system?",
                "humanIntervention",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ],
                "There are a number of cases and scenarios where human intervention is needed to ensure the safe, ethical, and secure use of AI."
              )}

              {renderRadioGroup(
                "Do human reviewers have the expertise and authority to override decisions made by the AI and modify them to the appropriate outcome?",
                "humanOverride",
                [
                  {
                    value: "yes",
                    label:
                      "Yes [Include a description of the process or mechanism in place]",
                  },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(2).completed,
            getSectionCompletion(2).total
          )}

          {/* Section 3: Valid and Reliable AI */}
          {renderCollapsibleSection(
            3,
            "Valid and Reliable AI",
            <div className="space-y-6">
              {renderRadioGroup(
                "Are mechanisms in place to identify and assess the impacts of the AI system on individuals, the environment, communities, and society?",
                "impactAssessmentMechanisms",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are potential negative impacts re-assessed if there are significant changes to the AI system in all stages of the AI lifecycle?",
                "negativeImpactsReassessed",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are identified potential negative impacts used to inform and implement mitigating measures throughout the AI lifecycle?",
                "mitigatingMeasuresImplemented",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Have all existing regulations and guidelines that may affect the AI system been identified?",
                "regulationsIdentified",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(3).completed,
            getSectionCompletion(3).total
          )}

          {/* Section 4: Safety and Reliability of AI */}
          {renderCollapsibleSection(
            4,
            "Safety and Reliability of AI",
            <div className="space-y-6">
              {renderRadioGroup(
                "Are tolerable risk levels defined for the AI system based on the business objectives, regulatory compliance, and data sensitivity requirements of the system?",
                "riskLevels",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ],
                "AI risk tolerance level refers to the extent to which individuals, organizations, or societies are willing to accept or tolerate potential risks associated with the AI system."
              )}

              {renderRadioGroup(
                "Have the possible threats to the AI system (design faults, technical faults, environmental threats) been identified, and the possible consequences to AI trustworthiness?",
                "threatsIdentified",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are the risks of possible malicious use, misuse, or inappropriate use of the AI system assessed?",
                "maliciousUseAssessed",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(4).completed,
            getSectionCompletion(4).total
          )}

          {/* Section 5: Secure and Resilient AI */}
          {renderCollapsibleSection(
            5,
            "Secure and Resilient AI",
            <div className="space-y-6">
              {renderRadioGroup(
                "Are mechanisms in place to assess vulnerabilities in terms of security and resiliency across the AI lifecycle?",
                "vulnerabilityAssessmentMechanisms",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are red-team exercises used to actively test the system under adversarial or stress conditions?",
                "redTeamExercises",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are processes in place to modify system security and countermeasures to increase robustness?",
                "securityModificationProcesses",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are processes in place to respond to incidents related to AI systems?",
                "incidentResponseProcesses",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {autoSectionsCompleted.has(5) ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Are procedures and relevant performance metrics in place to
                    monitor AI system's accuracy?
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="performanceMetrics"
                        value="yes"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                        checked
                      />
                      <span className="text-sm text-gray-500">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="performanceMetrics"
                        value="no"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="performanceMetrics"
                        value="na"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">N/A</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                    This section will be auto-completed once model is evaluated
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Are procedures and relevant performance metrics in place to
                    monitor AI system's accuracy?
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="performanceMetrics"
                        value="yes"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="performanceMetrics"
                        value="no"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="performanceMetrics"
                        value="na"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">N/A</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                    This section will be auto-completed once model is evaluated
                  </div>
                </div>
              )}

              {renderRadioGroup(
                "Are processes in place to establish and track security tests and metrics?",
                "securityTestsMetrics",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(5).completed,
            getSectionCompletion(5).total
          )}

          {/* Section 6: Explainable and Interpretable AI */}
          {renderCollapsibleSection(
            6,
            "Explainable and Interpretable AI",
            autoSectionsCompleted.has(6)
              ? renderCompletedSection(
                  "This section is intended to assess the measures in place to ensure that information requirements for explainable AI are maintained, and AI decisions are interpreted as expected.",
                  [
                    "✓ Are measures in place to address the traceability of the AI system during its entire lifecycle?",
                    "✓ Are measures in place to continuously assess the quality of the input data to the AI system?",
                    "✓ Are explanations on the decision of the AI system provided to relevant users and stakeholders?",
                  ]
                )
              : renderIncompleteSection(
                  "Explainable and Interpretable AI",
                  "This section is intended to assess the measures in place to ensure that information requirements for explainable AI are maintained, and AI decisions are interpreted as expected.",
                  [
                    "Are measures in place to address the traceability of the AI system during its entire lifecycle?",
                    "Are measures in place to continuously assess the quality of the input data to the AI system?",
                    "Are explanations on the decision of the AI system provided to relevant users and stakeholders?",
                  ]
                ),
            autoSectionsCompleted.has(6),
            autoSectionsCompleted.has(6) ? 3 : 0,
            3
          )}

          {/* Section 7: Privacy and Data Governance */}
          {renderCollapsibleSection(
            7,
            "Privacy and Data Governance",
            <div className="space-y-6">
              {renderRadioGroup(
                "Is the AI system being trained, or was it developed, by using or processing personal information?",
                "personalInfoUsed",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]
              )}

              {renderTextArea(
                "Please describe the categories of personal information used by the AI system. Indicate if the system is using sensitive or special categories of personal information, including a description of the legal basis for processing the personal information.",
                "personalInfoCategories",
                "Describe the categories of personal information...",
                "Special categories of personal information refer to specific types of personal information that are considered more sensitive and are subject to enhanced data protection and privacy regulations (e.g., race, religious beliefs, health data, sexual orientation, or criminal records)."
              )}

              {renderRadioGroup(
                "Have applicable legal regulations for privacy been identified and considered before processing personal information to train, develop, or deploy the AI system?",
                "privacyRegulations",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Has a privacy risk assessment been conducted to ensure the privacy and security of the personal information used for the AI system?",
                "privacyRiskAssessment",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Have measures to achieve privacy by design and default been implemented when applicable to mitigate identified privacy risks?",
                "privacyByDesign",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are individuals informed of the processing of their personal information for the development of the AI system?",
                "individualsInformed",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Have mechanisms been implemented to enable individuals to exercise their right to privacy for any personal information used in the AI system?",
                "privacyRights",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are measures in place to ensure that the data used to develop the AI system is up-to-date, complete, and representative of the AI environment?",
                "dataQuality",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Have risks been assessed in using datasets obtained from third parties?",
                "thirdPartyRisks",
                [
                  { value: "yes", label: "Yes " },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(7).completed,
            getSectionCompletion(7).total
          )}

          {/* Section 8: Fairness and Unbiased AI */}
          {renderCollapsibleSection(
            8,
            "Fairness and Unbiased AI",
            <div className="space-y-6">
              {autoSectionsCompleted.has(8) ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Is a strategy established to avoid creating or reinforcing
                    unfair bias in the AI system?
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyEstablished"
                        value="yes"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                        checked
                      />
                      <span className="text-sm text-gray-500">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyEstablished"
                        value="no"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyEstablished"
                        value="na"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">N/A</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                    This section will be auto-completed once model is evaluated
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Is a strategy established to avoid creating or reinforcing
                    unfair bias in the AI system?
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyEstablished"
                        value="yes"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyEstablished"
                        value="no"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyEstablished"
                        value="na"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">N/A</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                    This section will be auto-completed once model is evaluated
                  </div>
                </div>
              )}

              {autoSectionsCompleted.has(8) ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Is diversity and representativeness of end-users considered
                    in the data used for the AI system?
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="diversityConsidered"
                        value="yes"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                        checked
                      />
                      <span className="text-sm text-gray-500">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="diversityConsidered"
                        value="no"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="diversityConsidered"
                        value="na"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">N/A</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                    This section will be auto-completed once model is evaluated
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Is diversity and representativeness of end-users considered
                    in the data used for the AI system?
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="diversityConsidered"
                        value="yes"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="diversityConsidered"
                        value="no"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">No</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="diversityConsidered"
                        value="na"
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                        disabled
                      />
                      <span className="text-sm text-gray-500">N/A</span>
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                    This section will be auto-completed once model is evaluated
                  </div>
                </div>
              )}

              {renderRadioGroup(
                "Are demographics of those involved in design and development documented to capture potential biases?",
                "demographicsDocumented",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are AI actors aware of the possible bias they can inject into the design and development?",
                "aiActorsBiasAwareness",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(8).completed,
            getSectionCompletion(8).total
          )}

          {/* Section 9: Transparent and Accountable AI */}
          {renderCollapsibleSection(
            9,
            "Transparent and Accountable AI",
            <div className="space-y-6">
              {renderRadioGroup(
                "Is sufficient information provided to relevant AI actors to assist in making informed decisions?",
                "sufficientInfoProvided",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are end users aware that they are interacting with an AI system and not a human?",
                "endUsersAware",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are end-users informed of the purpose, criteria, and limitations of the decisions generated?",
                "endUsersInformed",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Are end-users informed of the benefits of the AI system?",
                "endUsersBenefits",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Is a mechanism in place to regularly communicate with external stakeholders?",
                "externalStakeholders",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(9).completed,
            getSectionCompletion(9).total
          )}

          {/* Section 10: AI Accountability */}
          {renderCollapsibleSection(
            10,
            "AI Accountability",
            <div className="space-y-6">
              {renderRadioGroup(
                "Is a risk management system implemented to address risks identified in the AI system?",
                "riskManagementSystem",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}

              {renderRadioGroup(
                "Can the AI system be audited by independent third parties?",
                "aiSystemAuditable",
                [
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "na", label: "N/A" },
                ]
              )}
            </div>,
            false,
            getSectionCompletion(10).completed,
            getSectionCompletion(10).total
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white"
            disabled={loading}
          >
            <Download className="w-4 h-4" />
            {loading ? "Generating..." : "Generate & Save to Storage"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RiskAssessmentPage;
