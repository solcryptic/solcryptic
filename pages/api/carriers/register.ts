import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { fmcsaService } from '../../../lib/fmcsa-api';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      mcNumber,
      dotNumber,
      email,
      password,
      contactName,
      phoneNumber,
      dispatchEmail,
      dispatchPhone,
      verifyFMCSA = true
    } = req.body;

    // Validation
    if (!mcNumber && !dotNumber) {
      return res.status(400).json({ 
        error: 'Either MC number or DOT number is required' 
      });
    }

    if (!email || !password || !contactName || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Email, password, contact name, and phone number are required' 
      });
    }

    // Verify FMCSA data if requested
    let fmcsaData = null;
    if (verifyFMCSA) {
      if (mcNumber) {
        fmcsaData = await fmcsaService.getCarrierByMC(mcNumber);
      } else if (dotNumber) {
        fmcsaData = await fmcsaService.getCarrierByDOT(dotNumber);
      }

      if (!fmcsaData) {
        return res.status(404).json({ 
          error: 'Carrier not found in FMCSA database. Please verify your MC/DOT number.' 
        });
      }

      // Check if carrier is authorized
      if (fmcsaData.operatingStatus !== 'A') {
        return res.status(400).json({ 
          error: 'Carrier is not currently authorized to operate according to FMCSA records.',
          operatingStatus: fmcsaData.operatingStatus,
          details: getOperatingStatusMessage(fmcsaData.operatingStatus)
        });
      }
    }

    // Check if carrier is already registered
    const existingCarrier = await prisma.carrier.findFirst({
      where: {
        OR: [
          { mcNumber: mcNumber || undefined },
          { dotNumber: dotNumber || undefined }
        ]
      }
    });

    if (existingCarrier) {
      return res.status(409).json({ 
        error: 'This carrier is already registered in our system.',
        carrierId: existingCarrier.id,
        verificationStatus: existingCarrier.verificationStatus
      });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email address is already registered. Please use a different email or sign in.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create company record
    const company = await prisma.company.create({
      data: {
        name: fmcsaData?.legalName || `Carrier ${mcNumber || dotNumber}`,
        type: 'CARRIER',
        email: email,
        phone: phoneNumber,
        address: fmcsaData?.physicalAddress?.street || '',
        city: fmcsaData?.physicalAddress?.city || '',
        state: fmcsaData?.physicalAddress?.state || '',
        zipCode: fmcsaData?.physicalAddress?.zipCode || '',
        website: fmcsaData?.website || undefined,
        mcNumber: mcNumber || fmcsaData?.mcNumber,
        dotNumber: dotNumber || fmcsaData?.dotNumber,
        isVerified: false,
        riskScore: 0
      }
    });

    // Create user account
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: contactName,
        role: 'CARRIER',
        companyId: company.id
      }
    });

    // Create carrier record with FMCSA data
    const inspectionHistory = fmcsaData ? await fmcsaService.getInspectionHistory(fmcsaData.dotNumber) : [];
    const riskScore = fmcsaData ? fmcsaService.calculateRiskScore(fmcsaData, inspectionHistory) : 0;
    const riskLevel = getRiskLevel(riskScore);

    const carrier = await prisma.carrier.create({
      data: {
        companyId: company.id,
        mcNumber: mcNumber || fmcsaData?.mcNumber || '',
        dotNumber: dotNumber || fmcsaData?.dotNumber || '',
        legalName: fmcsaData?.legalName || company.name,
        dbaName: fmcsaData?.dbaName || undefined,
        operatingStatus: fmcsaData ? getOperatingStatus(fmcsaData.operatingStatus) : 'NOT_AUTHORIZED',
        authorizedStatus: fmcsaData ? getAuthorizedStatus(fmcsaData.authorizedForHire, fmcsaData.operatingStatus) : 'NOT_AUTHORIZED',
        powerUnits: fmcsaData?.powerUnits || 0,
        driverCount: fmcsaData?.drivers || 0,
        saferScore: fmcsaData?.saferRating ? parseFloat(fmcsaData.saferRating) : undefined,
        basicScores: fmcsaData?.basicScores || undefined,
        phoneNumber: phoneNumber,
        email: dispatchEmail || email,
        website: fmcsaData?.website || undefined,
        equipmentTypes: fmcsaData?.equipmentTypes || [],
        operatingAreas: fmcsaData?.operatingAreas || [],
        insuranceCarrier: fmcsaData?.insuranceCarrier || undefined,
        insurancePolicyNo: fmcsaData?.insurancePolicyNumber || undefined,
        insuranceExpiry: fmcsaData?.insuranceExpirationDate ? new Date(fmcsaData.insuranceExpirationDate) : undefined,
        lastFmcsaUpdate: new Date(),
        verificationStatus: 'PENDING',
        riskLevel,
        riskScore
      }
    });

    // Store inspection history
    if (inspectionHistory.length > 0) {
      await prisma.inspectionRecord.createMany({
        data: inspectionHistory.map(inspection => ({
          carrierId: carrier.id,
          inspectionId: inspection.inspectionId,
          date: new Date(inspection.date),
          state: inspection.state,
          level: inspection.level,
          totalViolations: inspection.totalViolations,
          oosViolations: inspection.oosViolations,
          hazmatPlacardReq: inspection.hazmatPlacardRequired,
          vehicleInspected: inspection.vehicleInspected,
          driverInspected: inspection.driverInspected,
          timeWeight: inspection.timeWeight
        }))
      });
    }

    // Create initial verification record for FMCSA data
    if (fmcsaData) {
      await prisma.verification.create({
        data: {
          carrierId: carrier.id,
          type: 'FMCSA_DATA',
          status: 'VERIFIED',
          method: 'FMCSA_API',
          data: {
            fmcsaData: fmcsaData as any,
            verificationDate: new Date(),
            riskScore,
            inspectionCount: inspectionHistory.length
          }
        }
      });
    }

    // Send welcome/verification email (implement later)
    // await sendWelcomeEmail(email, contactName, carrier.id);

    const response = {
      success: true,
      message: 'Carrier registration successful',
      carrier: {
        id: carrier.id,
        mcNumber: carrier.mcNumber,
        dotNumber: carrier.dotNumber,
        legalName: carrier.legalName,
        verificationStatus: carrier.verificationStatus,
        riskLevel: carrier.riskLevel,
        riskScore: carrier.riskScore
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      company: {
        id: company.id,
        name: company.name,
        type: company.type
      },
      nextSteps: [
        'Upload required documents (W9, COI, Authority Letter)',
        'Complete identity verification process',
        'Provide dispatch contact information',
        'Wait for verification approval'
      ],
      requiredDocuments: [
        {
          type: 'W9',
          description: 'IRS Form W-9: Request for Taxpayer Identification Number',
          required: true
        },
        {
          type: 'COI',
          description: 'Certificate of Insurance with required coverage',
          required: true
        },
        {
          type: 'AUTHORITY_LETTER',
          description: 'Authority letter with dispatch contact information',
          required: true
        },
        {
          type: 'DISPATCH_CONTACT',
          description: 'Authorized dispatch contact details',
          required: false
        }
      ]
    };

    return res.status(201).json(response);

  } catch (error) {
    console.error('Carrier registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Please try again later'
    });
  }
}

function getOperatingStatus(status: string) {
  switch (status) {
    case 'A': return 'AUTHORIZED';
    case 'B': return 'NOT_AUTHORIZED';
    case 'C': return 'CONDITIONAL';
    case 'N': return 'OUT_OF_SERVICE';
    default: return 'NOT_AUTHORIZED';
  }
}

function getAuthorizedStatus(authorized: boolean, operatingStatus: string) {
  if (!authorized) return 'NOT_AUTHORIZED';
  if (operatingStatus === 'C') return 'SUSPENDED';
  if (operatingStatus === 'N') return 'REVOKED';
  return 'AUTHORIZED';
}

function getRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskScore >= 80) return 'CRITICAL';
  if (riskScore >= 60) return 'HIGH';
  if (riskScore >= 40) return 'MEDIUM';
  return 'LOW';
}

function getOperatingStatusMessage(status: string): string {
  switch (status) {
    case 'A': return 'Authorized for operation';
    case 'B': return 'Not authorized for operation';
    case 'C': return 'Conditional operation - limited authority';
    case 'N': return 'Out of service - not authorized to operate';
    default: return 'Unknown operating status';
  }
}