export interface AssessmentData {
  aiSystemDescription: string;
  aiSystemPurpose: string;
  deploymentMethod: string;
  deploymentRequirements: string;
  rolesDocumented: string;
  personnelTrained: string;
  humanInvolvement: string;
  biasTraining: string;
  humanIntervention: string;
  humanOverride: string;
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

export interface ProjectDetails {
  project_name?: string;
  description?: string;
}

export interface RiskLevel {
  level: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export interface TemplateVariables {
  // Header variables
  project_name: string;
  assessment_date: string;
  
  // Executive Summary variables
  overall_risk_level: string;
  completion_percentage: number;
  completed_sections: number;
  total_sections: number;
  governance_strengths: string;
  security_strengths: string;
  privacy_strengths: string;
  explainability_strengths: string;
  compliance_readiness: string;
  privacy_compliance_status: string;
  nist_compliance_status: string;
  iso_compliance_status: string;
  assessment_disclaimer: string;
  
  // AI System Information variables
  ai_system_description: string;
  ai_system_purpose: string;
  deployment_method: string;
  deployment_requirements: string;
  
  // Human and Stakeholder Involvement variables
  roles_documented: string;
  personnel_trained: string;
  human_involvement: string;
  bias_training: string;
  human_intervention: string;
  human_override: string;
  
  // Safety and Reliability variables
  risk_levels: string;
  threats_identified: string;
  malicious_use_assessed: string;
  
  // Privacy and Data Governance variables
  personal_info_used: string;
  personal_info_categories: string;
  privacy_regulations: string;
  privacy_risk_assessment: string;
  privacy_by_design: string;
  individuals_informed: string;
  privacy_rights: string;
  data_quality: string;
  third_party_risks: string;
  
  // Risk Matrix variables
  privacy_score: number;
  privacy_likelihood: string;
  privacy_impact: string;
  privacy_risk_level: string;
  privacy_priority: string;
  
  bias_score: number;
  bias_likelihood: string;
  bias_impact: string;
  bias_risk_level: string;
  bias_priority: string;
  
  explainability_score: number;
  explainability_likelihood: string;
  explainability_impact: string;
  explainability_risk_level: string;
  explainability_priority: string;
  
  robustness_score: number;
  robustness_likelihood: string;
  robustness_impact: string;
  robustness_risk_level: string;
  robustness_priority: string;
  
  governance_score: number;
  governance_likelihood: string;
  governance_impact: string;
  governance_risk_level: string;
  governance_priority: string;
  
  security_score: number;
  security_likelihood: string;
  security_impact: string;
  security_risk_level: string;
  security_priority: string;
  
  // AI Recommendations
  ai_recommendations: string;
}

export class HTMLReportGenerator {
  
  /**
   * Calculate progress percentage based on completed fields
   */
  private static calculateProgress(assessmentData: AssessmentData): number {
    const allFields = Object.keys(assessmentData);
    const completedFields = allFields.filter(field => 
      assessmentData[field as keyof AssessmentData] && 
      assessmentData[field as keyof AssessmentData].trim() !== ''
    );
    
    // Add auto-completed sections (6 out of 10 sections are auto-completed)
    const userSectionFields = allFields.length; // 22 user fields
    const autoSectionFields = 6; // 6 auto-completed sections
    const totalFields = userSectionFields + autoSectionFields;
    const totalCompleted = completedFields.length + autoSectionFields;
    
    return Math.round((totalCompleted / totalFields) * 100);
  }

  /**
   * Determine risk level based on completion percentage
   */
  private static getRiskLevel(progress: number): RiskLevel {
    if (progress < 25) {
      return { level: "Pending", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
    }
    if (progress >= 80) {
      return { level: "Low Risk", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
    }
    if (progress >= 60) {
      return { level: "Medium Risk", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
    }
    return { level: "High Risk", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
  }

  /**
   * Calculate risk score for a domain based on assessment responses
   */
  private static calculateDomainRiskScore(domain: string, assessmentData: AssessmentData): number {
    // Simplified risk scoring logic - can be enhanced based on specific requirements
    switch (domain) {
      case 'privacy':
        if (assessmentData.personalInfoUsed?.toLowerCase() === 'yes') {
          if (!assessmentData.privacyRiskAssessment || assessmentData.privacyRiskAssessment.length < 10) return 7;
          if (assessmentData.privacyByDesign?.toLowerCase() === 'no') return 6;
          return 4;
        }
        return 3;
        
      case 'bias':
        if (assessmentData.biasTraining?.toLowerCase() === 'no') return 8;
        if (!assessmentData.biasTraining || assessmentData.biasTraining.length < 5) return 6;
        return 3;
        
      case 'explainability':
        // Auto-completed section - assume good controls
        return 3;
        
      case 'robustness':
        if (!assessmentData.threatsIdentified || assessmentData.threatsIdentified.length < 10) return 7;
        if (assessmentData.maliciousUseAssessed?.toLowerCase() === 'no') return 6;
        return 4;
        
      case 'governance':
        if (assessmentData.rolesDocumented?.toLowerCase() === 'no') return 8;
        if (assessmentData.personnelTrained?.toLowerCase() === 'no') return 7;
        if (assessmentData.humanOverride?.toLowerCase() === 'no') return 6;
        return 3;
        
      case 'security':
        // Auto-completed section - assume good controls
        return 3;
        
      default:
        return 5;
    }
  }

  /**
   * Determine likelihood based on score
   */
  private static getLikelihood(score: number): string {
    if (score >= 7) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  }

  /**
   * Determine impact based on domain and system characteristics
   */
  private static getImpact(domain: string, assessmentData: AssessmentData): string {
    const hasPersonalData = assessmentData.personalInfoUsed?.toLowerCase() === 'yes';
    const isFinancialSystem = assessmentData.aiSystemPurpose?.toLowerCase().includes('financial') || 
                             assessmentData.aiSystemPurpose?.toLowerCase().includes('credit') ||
                             assessmentData.aiSystemPurpose?.toLowerCase().includes('lending');
    
    if (domain === 'privacy' && hasPersonalData) return 'High';
    if (domain === 'bias' && isFinancialSystem) return 'High';
    if (domain === 'governance') return 'High';
    
    return 'Medium';
  }

  /**
   * Calculate overall risk level based on likelihood and impact
   */
  private static calculateRiskLevel(likelihood: string, impact: string): string {
    if (likelihood === 'High' && impact === 'High') return 'HIGH';
    if (likelihood === 'High' || impact === 'High') return 'MEDIUM';
    if (likelihood === 'Medium' && impact === 'Medium') return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Determine priority based on risk level
   */
  private static getPriority(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH': return 'Critical';
      case 'MEDIUM': return 'High';
      case 'LOW': return 'Medium';
      default: return 'Low';
    }
  }

  /**
   * Generate template variables from assessment data
   */
  static generateTemplateVariables(
    assessmentData: AssessmentData,
    projectDetails: ProjectDetails | null,
    aiRecommendations: string = ''
  ): TemplateVariables {
    
    const progress = this.calculateProgress(assessmentData);
    const riskLevel = this.getRiskLevel(progress);
    const completedSections = Math.floor(progress / 10); // Rough estimate
    const totalSections = 10;
    
    // Calculate domain risk scores
    const domains = ['privacy', 'bias', 'explainability', 'robustness', 'governance', 'security'];
    const domainMetrics = domains.map(domain => {
      const score = this.calculateDomainRiskScore(domain, assessmentData);
      const likelihood = this.getLikelihood(score);
      const impact = this.getImpact(domain, assessmentData);
      const riskLevel = this.calculateRiskLevel(likelihood, impact);
      const priority = this.getPriority(riskLevel);
      
      return { domain, score, likelihood, impact, riskLevel, priority };
    });

    // Generate strengths based on assessment data
    const governanceStrengths = assessmentData.rolesDocumented?.toLowerCase() === 'yes' 
      ? "Risk domain coverage appears to be emerging — May reduce regulatory audit risk pending verification of implementation depth"
      : "Oversight framework may be partially documented — Direct evidence of decision-making authority during incidents not confirmed";

    const securityStrengths = "Security controls appear to be considered — Effectiveness against financial fraud and operational disruptions requires validation";
    
    const privacyStrengths = assessmentData.personalInfoUsed?.toLowerCase() === 'yes'
      ? "Privacy framework appears to be developing — GDPR/CCPA compliance claims require independent verification"
      : "Limited personal data processing reduces regulatory exposure";

    const explainabilityStrengths = "Explainability concepts may be implemented — Audit trail effectiveness and lending compliance support not confirmed";

    // Generate compliance status
    const complianceReadiness = progress >= 80 ? 'High Readiness' : progress >= 60 ? 'Moderate Readiness' : 'Initial Readiness';
    
    const privacyComplianceStatus = assessmentData.personalInfoUsed?.toLowerCase() === 'yes'
      ? "Privacy impact assessments and data protection controls documented"
      : "Limited personal data processing reduces regulatory exposure";

    // Generate disclaimer if needed
    const needsDisclaimer = progress < 60 || 
      !assessmentData.aiSystemDescription || 
      assessmentData.aiSystemDescription.length < 20;
    
    const disclaimer = needsDisclaimer 
      ? '<div class="disclaimer">[!] Disclaimer: This report includes inferred evaluations where user input was incomplete. Final risk posture should be reassessed upon receiving full input.</div>'
      : '';

    return {
      // Header
      project_name: projectDetails?.project_name || 'AI System',
      assessment_date: new Date().toLocaleDateString(),
      
      // Executive Summary
      overall_risk_level: riskLevel.level,
      completion_percentage: progress,
      completed_sections: completedSections,
      total_sections: totalSections,
      governance_strengths: governanceStrengths,
      security_strengths: securityStrengths,
      privacy_strengths: privacyStrengths,
      explainability_strengths: explainabilityStrengths,
      compliance_readiness: complianceReadiness,
      privacy_compliance_status: privacyComplianceStatus,
      nist_compliance_status: "Framework alignment established with systematic risk identification",
      iso_compliance_status: "Risk management framework established with systematic risk identification",
      assessment_disclaimer: disclaimer,
      
      // AI System Information
      ai_system_description: assessmentData.aiSystemDescription || 'Not provided',
      ai_system_purpose: assessmentData.aiSystemPurpose || 'Not provided',
      deployment_method: assessmentData.deploymentMethod || 'Not provided',
      deployment_requirements: assessmentData.deploymentRequirements || 'Not provided',
      
      // Human and Stakeholder Involvement
      roles_documented: assessmentData.rolesDocumented || 'Not provided',
      personnel_trained: assessmentData.personnelTrained || 'Not provided',
      human_involvement: assessmentData.humanInvolvement || 'Not provided',
      bias_training: assessmentData.biasTraining || 'Not provided',
      human_intervention: assessmentData.humanIntervention || 'Not provided',
      human_override: assessmentData.humanOverride || 'Not provided',
      
      // Safety and Reliability
      risk_levels: assessmentData.riskLevels || 'Not provided',
      threats_identified: assessmentData.threatsIdentified || 'Not provided',
      malicious_use_assessed: assessmentData.maliciousUseAssessed || 'Not provided',
      
      // Privacy and Data Governance
      personal_info_used: assessmentData.personalInfoUsed || 'Not provided',
      personal_info_categories: assessmentData.personalInfoCategories || 'Not provided',
      privacy_regulations: assessmentData.privacyRegulations || 'Not provided',
      privacy_risk_assessment: assessmentData.privacyRiskAssessment || 'Not provided',
      privacy_by_design: assessmentData.privacyByDesign || 'Not provided',
      individuals_informed: assessmentData.individualsInformed || 'Not provided',
      privacy_rights: assessmentData.privacyRights || 'Not provided',
      data_quality: assessmentData.dataQuality || 'Not provided',
      third_party_risks: assessmentData.thirdPartyRisks || 'Not provided',
      
      // Risk Matrix - Privacy
      privacy_score: domainMetrics[0].score,
      privacy_likelihood: domainMetrics[0].likelihood,
      privacy_impact: domainMetrics[0].impact,
      privacy_risk_level: domainMetrics[0].riskLevel,
      privacy_priority: domainMetrics[0].priority,
      
      // Risk Matrix - Bias
      bias_score: domainMetrics[1].score,
      bias_likelihood: domainMetrics[1].likelihood,
      bias_impact: domainMetrics[1].impact,
      bias_risk_level: domainMetrics[1].riskLevel,
      bias_priority: domainMetrics[1].priority,
      
      // Risk Matrix - Explainability
      explainability_score: domainMetrics[2].score,
      explainability_likelihood: domainMetrics[2].likelihood,
      explainability_impact: domainMetrics[2].impact,
      explainability_risk_level: domainMetrics[2].riskLevel,
      explainability_priority: domainMetrics[2].priority,
      
      // Risk Matrix - Robustness
      robustness_score: domainMetrics[3].score,
      robustness_likelihood: domainMetrics[3].likelihood,
      robustness_impact: domainMetrics[3].impact,
      robustness_risk_level: domainMetrics[3].riskLevel,
      robustness_priority: domainMetrics[3].priority,
      
      // Risk Matrix - Governance
      governance_score: domainMetrics[4].score,
      governance_likelihood: domainMetrics[4].likelihood,
      governance_impact: domainMetrics[4].impact,
      governance_risk_level: domainMetrics[4].riskLevel,
      governance_priority: domainMetrics[4].priority,
      
      // Risk Matrix - Security
      security_score: domainMetrics[5].score,
      security_likelihood: domainMetrics[5].likelihood,
      security_impact: domainMetrics[5].impact,
      security_risk_level: domainMetrics[5].riskLevel,
      security_priority: domainMetrics[5].priority,
      
      // AI Recommendations
      ai_recommendations: aiRecommendations || 'AI analysis temporarily unavailable. Please review your responses and ensure all sections are complete.'
    };
  }

  /**
   * Generate complete HTML report
   */
  static async generateHTMLReport(
    assessmentData: AssessmentData,
    projectDetails: ProjectDetails | null,
    aiRecommendations: string = ''
  ): Promise<string> {
    
    // Load HTML template
    const response = await fetch('/ai-risk-assessment-template.html');
    let htmlTemplate = await response.text();
    
    // Generate template variables
    const variables = this.generateTemplateVariables(assessmentData, projectDetails, aiRecommendations);
    
    // Replace all template variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      htmlTemplate = htmlTemplate.replace(regex, String(value));
    });
    
    return htmlTemplate;
  }

  /**
   * Generate and download HTML report
   */
  static async downloadHTMLReport(
    assessmentData: AssessmentData,
    projectDetails: ProjectDetails | null,
    aiRecommendations: string = ''
  ): Promise<void> {
    
    const htmlContent = await this.generateHTMLReport(assessmentData, projectDetails, aiRecommendations);
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI_Risk_Assessment_Report_${projectDetails?.project_name?.replace(/\s+/g, '_') || 'Report'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
} 