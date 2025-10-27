import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Carrier ID is required' });
    }

    // Fetch comprehensive carrier data
    const carrier = await prisma.carrier.findUnique({
      where: { id },
      include: {
        company: true,
        documents: {
          orderBy: { uploadedAt: 'desc' }
        },
        verifications: {
          orderBy: { performedAt: 'desc' },
          take: 10
        },
        flagReports: {
          where: { status: { in: ['OPEN', 'INVESTIGATING'] } },
          orderBy: { createdAt: 'desc' }
        },
        inspectionHistory: {
          orderBy: { date: 'desc' },
          take: 20
        }
      }
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Format the response with additional computed fields
    const responseData = {
      ...carrier,
      // Add computed fields for easier frontend consumption
      summary: {
        totalDocuments: carrier.documents.length,
        verifiedDocuments: carrier.documents.filter(doc => doc.status === 'VERIFIED').length,
        pendingDocuments: carrier.documents.filter(doc => doc.status === 'PENDING').length,
        rejectedDocuments: carrier.documents.filter(doc => doc.status === 'REJECTED').length,
        totalVerifications: carrier.verifications.length,
        successfulVerifications: carrier.verifications.filter(v => v.status === 'VERIFIED').length,
        activeFlags: carrier.flagReports.length,
        recentInspections: carrier.inspectionHistory.filter(inspection => {
          const inspectionDate = new Date(inspection.date);
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          return inspectionDate > twoYearsAgo;
        }).length
      },
      requiredDocuments: [
        {
          type: 'W9',
          name: 'IRS Form W-9',
          required: true,
          status: getDocumentStatus(carrier.documents, 'W9')
        },
        {
          type: 'COI',
          name: 'Certificate of Insurance',
          required: true,
          status: getDocumentStatus(carrier.documents, 'COI')
        },
        {
          type: 'AUTHORITY_LETTER',
          name: 'Authority Letter',
          required: true,
          status: getDocumentStatus(carrier.documents, 'AUTHORITY_LETTER')
        },
        {
          type: 'DISPATCH_CONTACT',
          name: 'Dispatch Contact Info',
          required: false,
          status: getDocumentStatus(carrier.documents, 'DISPATCH_CONTACT')
        }
      ],
      // Risk assessment summary
      riskAssessment: {
        currentLevel: carrier.riskLevel,
        currentScore: carrier.riskScore,
        factors: analyzeRiskFactors(carrier),
        recommendations: generateCarrierRecommendations(carrier)
      },
      // Compliance status
      complianceStatus: {
        fmcsaCompliant: carrier.operatingStatus === 'AUTHORIZED',
        documentationComplete: isDocumentationComplete(carrier.documents),
        insuranceValid: isInsuranceValid(carrier),
        verificationComplete: carrier.verificationStatus === 'VERIFIED'
      }
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching carrier details:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Failed to fetch carrier details'
    });
  }
}

function getDocumentStatus(documents: any[], documentType: string): 'VERIFIED' | 'PENDING' | 'REJECTED' | 'MISSING' {
  const doc = documents.find(d => d.type === documentType);
  if (!doc) return 'MISSING';
  return doc.status as 'VERIFIED' | 'PENDING' | 'REJECTED';
}

function isDocumentationComplete(documents: any[]): boolean {
  const requiredDocs = ['W9', 'COI', 'AUTHORITY_LETTER'];
  return requiredDocs.every(type => 
    documents.some((doc: any) => doc.type === type && doc.status === 'VERIFIED')
  );
}

function isInsuranceValid(carrier: any): boolean {
  if (!carrier.insuranceExpiry) return false;
  const expiryDate = new Date(carrier.insuranceExpiry);
  const now = new Date();
  return expiryDate > now;
}

function analyzeRiskFactors(carrier: any): any[] {
  const factors = [];

  // Operating status risk
  if (carrier.operatingStatus !== 'AUTHORIZED') {
    factors.push({
      category: 'Operating Status',
      severity: carrier.operatingStatus === 'OUT_OF_SERVICE' ? 'CRITICAL' : 'HIGH',
      description: `Carrier is ${carrier.operatingStatus.replace('_', ' ').toLowerCase()}`,
      impact: 'May not be legally authorized to operate'
    });
  }

  // Insurance expiry risk
  if (carrier.insuranceExpiry) {
    const expiryDate = new Date(carrier.insuranceExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      factors.push({
        category: 'Insurance',
        severity: 'CRITICAL',
        description: 'Insurance has expired',
        impact: 'Carrier operating without valid insurance coverage'
      });
    } else if (daysUntilExpiry < 30) {
      factors.push({
        category: 'Insurance',
        severity: 'MEDIUM',
        description: `Insurance expires in ${daysUntilExpiry} days`,
        impact: 'Insurance renewal required soon'
      });
    }
  }

  // Documentation risk
  const requiredDocs = ['W9', 'COI', 'AUTHORITY_LETTER'];
  const missingDocs = requiredDocs.filter(type => 
    !carrier.documents.some((doc: any) => doc.type === type && doc.status === 'VERIFIED')
  );

  if (missingDocs.length > 0) {
    factors.push({
      category: 'Documentation',
      severity: 'HIGH',
      description: `Missing verified documents: ${missingDocs.join(', ')}`,
      impact: 'Incomplete verification process'
    });
  }

  // BASIC scores risk
  if (carrier.basicScores) {
    Object.entries(carrier.basicScores).forEach(([category, score]: [string, any]) => {
      if (score > 75) {
        factors.push({
          category: 'Safety Performance',
          severity: score > 90 ? 'HIGH' : 'MEDIUM',
          description: `High ${category.replace(/([A-Z])/g, ' $1').toLowerCase()} percentile: ${score}%`,
          impact: 'Above-average safety violations in this category'
        });
      }
    });
  }

  // Fleet size risk
  if (carrier.powerUnits < 3) {
    factors.push({
      category: 'Fleet Size',
      severity: 'MEDIUM',
      description: `Very small fleet (${carrier.powerUnits} power units)`,
      impact: 'Small fleets may have limited operational capacity'
    });
  }

  return factors;
}

function generateCarrierRecommendations(carrier: any): any[] {
  const recommendations = [];

  // High-level verification recommendation
  if (carrier.verificationStatus !== 'VERIFIED') {
    recommendations.push({
      priority: 'HIGH',
      category: 'Verification',
      action: 'Complete carrier verification process',
      description: 'Ensure all required documents are submitted and verified'
    });
  }

  // Operating authority recommendation
  if (carrier.operatingStatus !== 'AUTHORIZED') {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Authority',
      action: 'Verify operating authority',
      description: 'Do not assign loads until carrier authority is confirmed'
    });
  }

  // Insurance recommendation
  if (!isInsuranceValid(carrier)) {
    recommendations.push({
      priority: 'CRITICAL',
      category: 'Insurance',
      action: 'Obtain current Certificate of Insurance',
      description: 'Verify active insurance coverage before load assignment'
    });
  }

  // Risk level recommendations
  if (carrier.riskLevel === 'HIGH' || carrier.riskLevel === 'CRITICAL') {
    recommendations.push({
      priority: 'HIGH',
      category: 'Risk Management',
      action: 'Apply enhanced monitoring',
      description: 'Require additional oversight and frequent check-ins'
    });
  }

  // Documentation recommendations
  const requiredDocs = ['W9', 'COI', 'AUTHORITY_LETTER'];
  const missingDocs = requiredDocs.filter(type => 
    !carrier.documents.some((doc: any) => doc.type === type && doc.status === 'VERIFIED')
  );

  if (missingDocs.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Documentation',
      action: 'Request missing documents',
      description: `Missing: ${missingDocs.join(', ')}`
    });
  }

  return recommendations;
}