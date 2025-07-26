import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { fmcsaService } from '../../../lib/fmcsa-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mc, dot, name } = req.query;

    if (!mc && !dot && !name) {
      return res.status(400).json({ 
        error: 'Please provide either MC number, DOT number, or company name' 
      });
    }

    let fmcsaData = null;
    let searchIdentifier = '';

    // Try MC number first
    if (mc) {
      searchIdentifier = mc as string;
      fmcsaData = await fmcsaService.getCarrierByMC(searchIdentifier);
    }
    // Fall back to DOT number
    else if (dot) {
      searchIdentifier = dot as string;
      fmcsaData = await fmcsaService.getCarrierByDOT(searchIdentifier);
    }

    if (!fmcsaData) {
      return res.status(404).json({ 
        error: 'Carrier not found in FMCSA database',
        searchedFor: searchIdentifier 
      });
    }

    // Get inspection history
    const inspectionHistory = await fmcsaService.getInspectionHistory(fmcsaData.dotNumber);

    // Calculate risk score
    const riskScore = fmcsaService.calculateRiskScore(fmcsaData, inspectionHistory);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (riskScore >= 80) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    // Check if carrier already exists in our database
    let existingCarrier = null;
    try {
      existingCarrier = await prisma.carrier.findFirst({
        where: {
          OR: [
            { mcNumber: fmcsaData.mcNumber || '' },
            { dotNumber: fmcsaData.dotNumber }
          ]
        },
        include: {
          documents: true,
          verifications: {
            orderBy: { performedAt: 'desc' },
            take: 5
          },
          flagReports: {
            where: { status: 'OPEN' },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
    } catch (error) {
      console.error('Database query error:', error);
    }

    // Determine operating and authorized status
    const getOperatingStatus = (status: string) => {
      switch (status) {
        case 'A': return 'AUTHORIZED';
        case 'B': return 'NOT_AUTHORIZED';
        case 'C': return 'CONDITIONAL';
        case 'N': return 'OUT_OF_SERVICE';
        default: return 'NOT_AUTHORIZED';
      }
    };

    const getAuthorizedStatus = (authorized: boolean, operatingStatus: string) => {
      if (!authorized) return 'NOT_AUTHORIZED';
      if (operatingStatus === 'CONDITIONAL') return 'SUSPENDED';
      if (operatingStatus === 'OUT_OF_SERVICE') return 'REVOKED';
      return 'AUTHORIZED';
    };

    const operatingStatus = getOperatingStatus(fmcsaData.operatingStatus);
    const authorizedStatus = getAuthorizedStatus(fmcsaData.authorizedForHire, operatingStatus);

    // Prepare response
    const responseData = {
      fmcsaData: {
        ...fmcsaData,
        operatingStatus,
        authorizedStatus,
        riskScore,
        riskLevel,
        inspectionHistory
      },
      existingCarrier,
      verificationSummary: {
        isRegistered: !!existingCarrier,
        isVerified: existingCarrier?.verificationStatus === 'VERIFIED',
        hasActiveFlags: existingCarrier?.flagReports?.length > 0,
        lastVerification: existingCarrier?.verifications?.[0]?.performedAt,
        documentCount: existingCarrier?.documents?.length || 0
      },
      riskFactors: analyzeRiskFactors(fmcsaData, inspectionHistory, riskScore),
      recommendations: generateRecommendations(fmcsaData, riskLevel, existingCarrier)
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Carrier lookup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
}

function analyzeRiskFactors(fmcsaData: any, inspections: any[], riskScore: number) {
  const factors = [];

  // Operating status factors
  if (fmcsaData.operatingStatus !== 'A') {
    factors.push({
      type: 'OPERATING_STATUS',
      severity: fmcsaData.operatingStatus === 'N' ? 'CRITICAL' : 'HIGH',
      description: `Operating status: ${fmcsaData.operatingStatus === 'N' ? 'Out of Service' : 
                   fmcsaData.operatingStatus === 'C' ? 'Conditional' : 'Not Authorized'}`,
      impact: 'Carrier may not be legally authorized to operate'
    });
  }

  // Fleet size factors
  if (fmcsaData.powerUnits < 3) {
    factors.push({
      type: 'SMALL_FLEET',
      severity: 'MEDIUM',
      description: `Very small fleet (${fmcsaData.powerUnits} power units)`,
      impact: 'Small fleets may have higher operational risk'
    });
  }

  // BASIC score factors
  if (fmcsaData.basicScores) {
    Object.entries(fmcsaData.basicScores).forEach(([category, score]: [string, any]) => {
      if (score > 75) {
        factors.push({
          type: 'BASIC_SCORE',
          severity: score > 90 ? 'HIGH' : 'MEDIUM',
          description: `High ${category.replace(/([A-Z])/g, ' $1').toLowerCase()} score: ${score}%`,
          impact: 'Above-average safety violations in this category'
        });
      }
    });
  }

  // Inspection factors
  const recentInspections = inspections.filter(i => {
    const inspectionDate = new Date(i.date);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return inspectionDate > sixMonthsAgo;
  });

  const recentOOSCount = recentInspections.reduce((sum, i) => sum + i.oosViolations, 0);
  if (recentOOSCount > 0) {
    factors.push({
      type: 'OUT_OF_SERVICE',
      severity: recentOOSCount > 2 ? 'HIGH' : 'MEDIUM',
      description: `${recentOOSCount} out-of-service violations in last 6 months`,
      impact: 'Recent serious safety violations requiring immediate action'
    });
  }

  return factors;
}

function generateRecommendations(fmcsaData: any, riskLevel: string, existingCarrier: any) {
  const recommendations = [];

  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    recommendations.push({
      priority: 'HIGH',
      action: 'DO_NOT_HIRE',
      description: 'This carrier presents significant risk. Consider alternative carriers.',
      details: 'High risk score indicates safety, compliance, or operational concerns.'
    });
  }

  if (!existingCarrier?.verificationStatus || existingCarrier.verificationStatus !== 'VERIFIED') {
    recommendations.push({
      priority: 'HIGH',
      action: 'REQUIRE_VERIFICATION',
      description: 'Require carrier to complete identity verification process.',
      details: 'Upload W9, COI, Authority Letter, and other required documents.'
    });
  }

  if (fmcsaData.operatingStatus !== 'A') {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'VERIFY_AUTHORITY',
      description: 'Verify current operating authority before assigning loads.',
      details: 'Carrier may not be legally authorized to transport freight.'
    });
  }

  if (!fmcsaData.insuranceCarrier || !fmcsaData.insuranceExpirationDate) {
    recommendations.push({
      priority: 'HIGH',
      action: 'VERIFY_INSURANCE',
      description: 'Obtain current Certificate of Insurance.',
      details: 'Missing or incomplete insurance information in FMCSA records.'
    });
  }

  if (fmcsaData.powerUnits < 5) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'ENHANCED_MONITORING',
      description: 'Apply enhanced monitoring for small fleet carrier.',
      details: 'Small fleets may require additional oversight and communication.'
    });
  }

  if (existingCarrier?.flagReports?.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'REVIEW_FLAGS',
      description: `Review ${existingCarrier.flagReports.length} active flag report(s).`,
      details: 'Carrier has been flagged for potential issues by other users.'
    });
  }

  return recommendations;
}