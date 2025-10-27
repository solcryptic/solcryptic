import axios from 'axios';

export interface FMCSACarrierData {
  dotNumber: string;
  mcNumber?: string;
  legalName: string;
  dbaName?: string;
  physicalAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email?: string;
  operatingStatus: 'A' | 'B' | 'C' | 'N'; // Authorized, Not Authorized, Out of Service, Conditional
  authorizedForHire: boolean;
  powerUnits: number;
  drivers: number;
  saferRating?: string;
  reviewDate?: string;
  reviewType?: string;
  // BASIC Scores
  basicScores?: {
    unsafeDriving?: number;
    crashIndicator?: number;
    hoursOfServiceCompliance?: number;
    vehicleMaintenance?: number;
    controlledSubstancesAlcohol?: number;
    hazmatCompliance?: number;
    driverFitness?: number;
  };
  insuranceCarrier?: string;
  insurancePolicyNumber?: string;
  insuranceEffectiveDate?: string;
  insuranceExpirationDate?: string;
  equipmentTypes?: string[];
  operatingAreas?: string[];
  website?: string;
}

export interface FMCSAInspectionData {
  inspectionId: string;
  date: string;
  state: string;
  level: string;
  totalViolations: number;
  oosViolations: number;
  hazmatPlacardRequired: boolean;
  vehicleInspected: boolean;
  driverInspected: boolean;
  timeWeight?: number;
}

class FMCSAService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.FMCSA_BASE_URL || 'https://mobile.fmcsa.dot.gov/qc/services/carriers';
    this.apiKey = process.env.FMCSA_API_KEY;
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'CarrierVerificationSystem/1.0'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async getCarrierByDOT(dotNumber: string): Promise<FMCSACarrierData | null> {
    try {
      // Real FMCSA API endpoint (you'll need proper authentication)
      const response = await axios.get(`${this.baseUrl}/${dotNumber}`, {
        headers: this.getHeaders(),
        timeout: 30000
      });

      return this.mapFMCSAResponse(response.data);
    } catch (error) {
      console.error('Error fetching FMCSA data:', error);
      
      // For development/demo purposes, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockCarrierData(dotNumber);
      }
      
      return null;
    }
  }

  async getCarrierByMC(mcNumber: string): Promise<FMCSACarrierData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/mc/${mcNumber}`, {
        headers: this.getHeaders(),
        timeout: 30000
      });

      return this.mapFMCSAResponse(response.data);
    } catch (error) {
      console.error('Error fetching FMCSA data by MC:', error);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockCarrierData(`MC-${mcNumber}`);
      }
      
      return null;
    }
  }

  async getInspectionHistory(dotNumber: string): Promise<FMCSAInspectionData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/${dotNumber}/inspections`, {
        headers: this.getHeaders(),
        timeout: 30000
      });

      return response.data.inspections || [];
    } catch (error) {
      console.error('Error fetching inspection history:', error);
      
      if (process.env.NODE_ENV === 'development') {
        return this.getMockInspectionData();
      }
      
      return [];
    }
  }

  private mapFMCSAResponse(data: any): FMCSACarrierData {
    return {
      dotNumber: data.dotNumber,
      mcNumber: data.mcNumber,
      legalName: data.legalName,
      dbaName: data.dbaName,
      physicalAddress: {
        street: data.physicalAddress?.street || '',
        city: data.physicalAddress?.city || '',
        state: data.physicalAddress?.state || '',
        zipCode: data.physicalAddress?.zipCode || ''
      },
      phone: data.phone || '',
      email: data.email,
      operatingStatus: data.operatingStatus || 'N',
      authorizedForHire: data.authorizedForHire || false,
      powerUnits: data.powerUnits || 0,
      drivers: data.drivers || 0,
      saferRating: data.saferRating,
      reviewDate: data.reviewDate,
      reviewType: data.reviewType,
      basicScores: data.basicScores,
      insuranceCarrier: data.insuranceCarrier,
      insurancePolicyNumber: data.insurancePolicyNumber,
      insuranceEffectiveDate: data.insuranceEffectiveDate,
      insuranceExpirationDate: data.insuranceExpirationDate,
      equipmentTypes: data.equipmentTypes || [],
      operatingAreas: data.operatingAreas || []
    };
  }

  // Mock data for development/demo
  private getMockCarrierData(identifier: string): FMCSACarrierData {
    const isHighRisk = identifier.includes('999') || identifier.includes('666');
    
    return {
      dotNumber: identifier.startsWith('MC-') ? '123456' : identifier,
      mcNumber: identifier.startsWith('MC-') ? identifier.replace('MC-', '') : 'MC123456',
      legalName: `Demo Carrier ${identifier}`,
      dbaName: `Demo Transport LLC`,
      physicalAddress: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'TX',
        zipCode: '12345'
      },
      phone: '555-123-4567',
      email: 'demo@democarrier.com',
      operatingStatus: isHighRisk ? 'C' : 'A', // Conditional vs Authorized
      authorizedForHire: !isHighRisk,
      powerUnits: isHighRisk ? 2 : 15,
      drivers: isHighRisk ? 1 : 12,
      saferRating: isHighRisk ? 'CONDITIONAL' : 'SATISFACTORY',
      reviewDate: '2023-12-01',
      reviewType: 'NEW ENTRANT',
      basicScores: {
        unsafeDriving: isHighRisk ? 85 : 45,
        crashIndicator: isHighRisk ? 90 : 35,
        hoursOfServiceCompliance: isHighRisk ? 75 : 25,
        vehicleMaintenance: isHighRisk ? 80 : 40,
        controlledSubstancesAlcohol: isHighRisk ? 95 : 15,
        hazmatCompliance: isHighRisk ? 70 : 30,
        driverFitness: isHighRisk ? 85 : 20
      },
      insuranceCarrier: 'Demo Insurance Co.',
      insurancePolicyNumber: 'POL123456789',
      insuranceEffectiveDate: '2024-01-01',
      insuranceExpirationDate: '2024-12-31',
      equipmentTypes: ['Van', 'Refrigerated'],
      operatingAreas: ['TX', 'OK', 'LA', 'AR']
    };
  }

  private getMockInspectionData(): FMCSAInspectionData[] {
    return [
      {
        inspectionId: 'TX2023123456',
        date: '2023-11-15',
        state: 'TX',
        level: '1',
        totalViolations: 2,
        oosViolations: 0,
        hazmatPlacardRequired: false,
        vehicleInspected: true,
        driverInspected: true,
        timeWeight: 1.0
      },
      {
        inspectionId: 'OK2023789012',
        date: '2023-09-22',
        state: 'OK',
        level: '2',
        totalViolations: 0,
        oosViolations: 0,
        hazmatPlacardRequired: false,
        vehicleInspected: true,
        driverInspected: false,
        timeWeight: 1.0
      }
    ];
  }

  calculateRiskScore(carrierData: FMCSACarrierData, inspections: FMCSAInspectionData[]): number {
    let riskScore = 0;

    // Operating status risk
    switch (carrierData.operatingStatus) {
      case 'A': riskScore += 0; break; // Authorized
      case 'C': riskScore += 30; break; // Conditional
      case 'B': riskScore += 70; break; // Not Authorized
      case 'N': riskScore += 100; break; // Out of Service
    }

    // BASIC scores risk (higher percentiles = higher risk)
    if (carrierData.basicScores) {
      const basicScores = carrierData.basicScores;
      const avgBasicScore = Object.values(basicScores).reduce((sum, score) => sum + (score || 0), 0) / Object.keys(basicScores).length;
      riskScore += avgBasicScore * 0.5; // Scale down
    }

    // Inspection history risk
    const recentInspections = inspections.filter(i => {
      const inspectionDate = new Date(i.date);
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      return inspectionDate > twoYearsAgo;
    });

    if (recentInspections.length > 0) {
      const avgViolations = recentInspections.reduce((sum, i) => sum + i.totalViolations, 0) / recentInspections.length;
      const oosCount = recentInspections.reduce((sum, i) => sum + i.oosViolations, 0);
      riskScore += avgViolations * 5 + oosCount * 15;
    }

    // Fleet size consideration (very small fleets can be higher risk)
    if (carrierData.powerUnits < 3) {
      riskScore += 20;
    }

    return Math.min(100, Math.max(0, riskScore));
  }
}

export const fmcsaService = new FMCSAService();