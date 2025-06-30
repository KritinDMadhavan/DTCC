import React, { useState } from 'react';
import { Button } from "./ui/button";
import { FileText, Eye } from 'lucide-react';
import { HTMLReportGenerator } from '../utils/htmlReportGenerator';

// Sample assessment data for demonstration
const sampleAssessmentData = {
  aiSystemDescription: 'An AI-powered fraud detection system for financial transactions that uses machine learning algorithms to identify suspicious patterns and anomalies in real-time payment processing.',
  aiSystemPurpose: 'To detect and prevent fraudulent financial transactions while minimizing false positives and ensuring legitimate transactions are processed efficiently.',
  deploymentMethod: 'Cloud-based deployment on AWS with microservices architecture and real-time API integration.',
  deploymentRequirements: 'High availability infrastructure, SOC 2 compliance, real-time processing capabilities, and integration with existing payment systems.',
  rolesDocumented: 'yes',
  personnelTrained: 'yes',
  humanInvolvement: 'Human oversight required for high-risk decisions and escalations above automated thresholds.',
  biasTraining: 'yes',
  humanIntervention: 'yes',
  humanOverride: 'yes',
  riskLevels: 'Low to Medium risk identified across privacy, bias, and operational domains with specific mitigation strategies.',
  threatsIdentified: 'Data poisoning attacks, adversarial examples, model drift, and privacy breaches identified with corresponding controls.',
  maliciousUseAssessed: 'yes',
  personalInfoUsed: 'yes',
  personalInfoCategories: 'Transaction data, account information, device fingerprints, behavioral patterns, and customer identification data.',
  privacyRegulations: 'GDPR, CCPA, PCI DSS, and banking regulations including GLBA and Basel III requirements.',
  privacyRiskAssessment: 'yes',
  privacyByDesign: 'yes',
  individualsInformed: 'yes',
  privacyRights: 'Comprehensive privacy rights management including data access, correction, deletion, and portability requests.',
  dataQuality: 'yes',
  thirdPartyRisks: 'yes'
};

const sampleProjectDetails = {
  project_name: 'FinTech Fraud Detection AI System',
  description: 'Advanced AI system for real-time fraud detection in financial transactions'
};

const sampleAIRecommendations = `Based on the comprehensive assessment, here are the key recommendations:

**Immediate Actions (0-30 days):**
- Enhance monitoring dashboards for real-time bias detection
- Implement additional privacy controls for sensitive data processing
- Establish formal incident response procedures for AI system failures

**Short-term Improvements (1-3 months):**
- Conduct third-party security audit of AI model infrastructure
- Develop comprehensive explainability documentation for regulatory compliance
- Implement automated fairness testing in CI/CD pipeline

**Long-term Strategic Initiatives (3-12 months):**
- Establish AI governance board with diverse stakeholder representation
- Develop industry-leading AI ethics framework aligned with emerging regulations
- Create center of excellence for responsible AI practices across organization`;

const HTMLReportDemo: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      const html = await HTMLReportGenerator.generateHTMLReport(
        sampleAssessmentData,
        sampleProjectDetails,
        sampleAIRecommendations
      );
      setHtmlContent(html);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Failed to generate preview. Please check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSample = async () => {
    try {
      setIsGenerating(true);
      await HTMLReportGenerator.downloadHTMLReport(
        sampleAssessmentData,
        sampleProjectDetails,
        sampleAIRecommendations
      );
    } catch (error) {
      console.error('Error downloading sample:', error);
      alert('Failed to download sample report. Please check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Professional HTML Report Template Demo
      </h2>
      
      <p className="text-gray-600 mb-6">
        This demonstrates the new professional HTML report layout that transforms the current AI Risk Assessment 
        into a structured, semantic format optimized for both viewing and HTML-to-PDF conversion.
      </p>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">✨ New Features:</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li>Professional semantic HTML structure with proper headings (h1, h2, h3)</li>
            <li>Clean CSS styling optimized for PDF conversion</li>
            <li>Comprehensive risk assessment matrix with domain-specific scoring</li>
            <li>Structured content sections following NIST AI RMF framework</li>
            <li>Professional footer and header with branding</li>
            <li>Responsive layout that works across different screen sizes</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={generatePreview}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isGenerating}
          >
            <Eye className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Preview Template'}
          </Button>

          <Button
            onClick={downloadSample}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isGenerating}
          >
            <FileText className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Download Sample HTML'}
          </Button>
        </div>
      </div>

      {showPreview && htmlContent && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">HTML Preview</h3>
            <Button
              onClick={() => setShowPreview(false)}
              variant="outline"
              size="sm"
            >
              Close Preview
            </Button>
          </div>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <iframe
              srcDoc={htmlContent}
              className="w-full h-96 border-0"
              title="HTML Report Preview"
              sandbox="allow-same-origin"
            />
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Note: This is a scaled preview. The actual HTML report will be full-sized and optimized for printing/PDF conversion.
          </p>
        </div>
      )}
    </div>
  );
};

export default HTMLReportDemo; 