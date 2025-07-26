import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { FMCSACarrierData } from './fmcsa-api';

export interface DocumentOCRResult {
  text: string;
  confidence: number;
  extractedData: {
    [key: string]: any;
  };
}

export interface DocumentVerificationResult {
  isValid: boolean;
  confidence: number;
  matchedFields: string[];
  misMatchedFields: string[];
  extractedData: any;
  issues: string[];
}

export interface W9Data {
  businessName?: string;
  taxClassification?: string;
  federalTaxId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  requestedName?: string;
}

export interface COIData {
  insuredName?: string;
  policyNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  insuranceCarrier?: string;
  coverageTypes?: string[];
  limits?: {
    [coverageType: string]: string;
  };
}

export interface AuthorityLetterData {
  carrierName?: string;
  mcNumber?: string;
  dotNumber?: string;
  authorizedContact?: string;
  phoneNumber?: string;
  email?: string;
  effectiveDate?: string;
}

class DocumentVerificationService {
  private worker: any = null;

  async initializeOCR() {
    if (!this.worker) {
      this.worker = await createWorker();
      await this.worker.loadLanguage('eng');
      await this.worker.initialize('eng');
    }
  }

  async processDocument(filePath: string, documentType: string): Promise<DocumentOCRResult> {
    await this.initializeOCR();

    try {
      const { data } = await this.worker.recognize(filePath);
      const extractedData = this.parseDocumentText(data.text, documentType);

      return {
        text: data.text,
        confidence: data.confidence,
        extractedData
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process document');
    }
  }

  private parseDocumentText(text: string, documentType: string): any {
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');

    switch (documentType) {
      case 'W9':
        return this.parseW9(normalizedText);
      case 'COI':
        return this.parseCOI(normalizedText);
      case 'AUTHORITY_LETTER':
        return this.parseAuthorityLetter(normalizedText);
      default:
        return this.parseGenericDocument(normalizedText);
    }
  }

  private parseW9(text: string): W9Data {
    const data: W9Data = {};

    // Extract business name (usually after "name" or "business name")
    const nameMatch = text.match(/(?:name|business name)[\s:]*([^\n]{1,100})/i);
    if (nameMatch) {
      data.businessName = nameMatch[1].trim();
    }

    // Extract Federal Tax ID (EIN format: XX-XXXXXXX)
    const einMatch = text.match(/(?:ein|tax id|federal tax id)[\s:]*(\d{2}-?\d{7})/i);
    if (einMatch) {
      data.federalTaxId = einMatch[1].replace(/[^\d-]/g, '');
    }

    // Extract address components
    const addressMatch = text.match(/(?:address|street)[\s:]*([^\n]{1,100})/i);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
    }

    // Extract city, state, zip
    const cityStateZipMatch = text.match(/([a-z\s]+),?\s*([a-z]{2}),?\s*(\d{5}(?:-?\d{4})?)/i);
    if (cityStateZipMatch) {
      data.city = cityStateZipMatch[1].trim();
      data.state = cityStateZipMatch[2].trim().toUpperCase();
      data.zipCode = cityStateZipMatch[3].replace(/[^\d-]/g, '');
    }

    return data;
  }

  private parseCOI(text: string): COIData {
    const data: COIData = {};

    // Extract insured name
    const insuredMatch = text.match(/(?:insured|certificate holder)[\s:]*([^\n]{1,100})/i);
    if (insuredMatch) {
      data.insuredName = insuredMatch[1].trim();
    }

    // Extract policy number
    const policyMatch = text.match(/(?:policy|certificate)\s*(?:no|number)[\s:]*([a-z0-9-]{5,20})/i);
    if (policyMatch) {
      data.policyNumber = policyMatch[1].trim();
    }

    // Extract insurance carrier
    const carrierMatch = text.match(/(?:insurance company|carrier|insurer)[\s:]*([^\n]{1,100})/i);
    if (carrierMatch) {
      data.insuranceCarrier = carrierMatch[1].trim();
    }

    // Extract dates (MM/DD/YYYY format)
    const dateMatches = text.match(/(\d{1,2}\/\d{1,2}\/\d{4})/g);
    if (dateMatches && dateMatches.length >= 2) {
      data.effectiveDate = dateMatches[0];
      data.expirationDate = dateMatches[1];
    }

    // Extract coverage types and limits
    const coverageTypes = [];
    const limits: any = {};

    if (text.includes('general liability')) {
      coverageTypes.push('General Liability');
      const glLimitMatch = text.match(/general liability.*?(\$[\d,]+)/i);
      if (glLimitMatch) limits['General Liability'] = glLimitMatch[1];
    }

    if (text.includes('auto liability') || text.includes('commercial auto')) {
      coverageTypes.push('Auto Liability');
      const autoLimitMatch = text.match(/auto liability.*?(\$[\d,]+)/i);
      if (autoLimitMatch) limits['Auto Liability'] = autoLimitMatch[1];
    }

    if (text.includes('cargo')) {
      coverageTypes.push('Cargo');
      const cargoLimitMatch = text.match(/cargo.*?(\$[\d,]+)/i);
      if (cargoLimitMatch) limits['Cargo'] = cargoLimitMatch[1];
    }

    data.coverageTypes = coverageTypes;
    data.limits = limits;

    return data;
  }

  private parseAuthorityLetter(text: string): AuthorityLetterData {
    const data: AuthorityLetterData = {};

    // Extract carrier name
    const nameMatch = text.match(/(?:carrier|company)\s*(?:name)?[\s:]*([^\n]{1,100})/i);
    if (nameMatch) {
      data.carrierName = nameMatch[1].trim();
    }

    // Extract MC number
    const mcMatch = text.match(/mc[\s-]*(\d+)/i);
    if (mcMatch) {
      data.mcNumber = `MC${mcMatch[1]}`;
    }

    // Extract DOT number
    const dotMatch = text.match(/dot[\s-]*(\d+)/i);
    if (dotMatch) {
      data.dotNumber = dotMatch[1];
    }

    // Extract phone number
    const phoneMatch = text.match(/(?:phone|tel)[\s:]*(\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4})/i);
    if (phoneMatch) {
      data.phoneNumber = phoneMatch[1].replace(/[^\d]/g, '');
    }

    // Extract email
    const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    if (emailMatch) {
      data.email = emailMatch[1].toLowerCase();
    }

    return data;
  }

  private parseGenericDocument(text: string): any {
    const data: any = {};

    // Extract common patterns
    const phoneMatch = text.match(/(\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4})/);
    if (phoneMatch) data.phone = phoneMatch[1];

    const emailMatch = text.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    if (emailMatch) data.email = emailMatch[1];

    const mcMatch = text.match(/mc[\s-]*(\d+)/i);
    if (mcMatch) data.mcNumber = `MC${mcMatch[1]}`;

    const dotMatch = text.match(/dot[\s-]*(\d+)/i);
    if (dotMatch) data.dotNumber = dotMatch[1];

    return data;
  }

  async verifyDocumentAgainstFMCSA(
    documentData: any,
    documentType: string,
    fmcsaData: FMCSACarrierData
  ): Promise<DocumentVerificationResult> {
    const result: DocumentVerificationResult = {
      isValid: false,
      confidence: 0,
      matchedFields: [],
      misMatchedFields: [],
      extractedData: documentData,
      issues: []
    };

    let matchCount = 0;
    let totalChecks = 0;

    switch (documentType) {
      case 'W9':
        result = await this.verifyW9(documentData as W9Data, fmcsaData);
        break;
      case 'COI':
        result = await this.verifyCOI(documentData as COIData, fmcsaData);
        break;
      case 'AUTHORITY_LETTER':
        result = await this.verifyAuthorityLetter(documentData as AuthorityLetterData, fmcsaData);
        break;
      default:
        result.issues.push('Unknown document type for verification');
    }

    return result;
  }

  private async verifyW9(w9Data: W9Data, fmcsaData: FMCSACarrierData): Promise<DocumentVerificationResult> {
    const result: DocumentVerificationResult = {
      isValid: false,
      confidence: 0,
      matchedFields: [],
      misMatchedFields: [],
      extractedData: w9Data,
      issues: []
    };

    let matchCount = 0;
    let totalChecks = 0;

    // Check business name
    if (w9Data.businessName) {
      totalChecks++;
      if (this.fuzzyMatch(w9Data.businessName, fmcsaData.legalName) || 
          (fmcsaData.dbaName && this.fuzzyMatch(w9Data.businessName, fmcsaData.dbaName))) {
        matchCount++;
        result.matchedFields.push('businessName');
      } else {
        result.misMatchedFields.push('businessName');
        result.issues.push(`Business name mismatch: W9 shows "${w9Data.businessName}", FMCSA shows "${fmcsaData.legalName}"`);
      }
    }

    // Check address components
    if (w9Data.city && fmcsaData.physicalAddress.city) {
      totalChecks++;
      if (this.fuzzyMatch(w9Data.city, fmcsaData.physicalAddress.city)) {
        matchCount++;
        result.matchedFields.push('city');
      } else {
        result.misMatchedFields.push('city');
        result.issues.push(`City mismatch: W9 shows "${w9Data.city}", FMCSA shows "${fmcsaData.physicalAddress.city}"`);
      }
    }

    if (w9Data.state && fmcsaData.physicalAddress.state) {
      totalChecks++;
      if (w9Data.state.toUpperCase() === fmcsaData.physicalAddress.state.toUpperCase()) {
        matchCount++;
        result.matchedFields.push('state');
      } else {
        result.misMatchedFields.push('state');
        result.issues.push(`State mismatch: W9 shows "${w9Data.state}", FMCSA shows "${fmcsaData.physicalAddress.state}"`);
      }
    }

    if (totalChecks > 0) {
      result.confidence = (matchCount / totalChecks) * 100;
      result.isValid = result.confidence >= 70; // 70% match threshold
    }

    return result;
  }

  private async verifyCOI(coiData: COIData, fmcsaData: FMCSACarrierData): Promise<DocumentVerificationResult> {
    const result: DocumentVerificationResult = {
      isValid: false,
      confidence: 0,
      matchedFields: [],
      misMatchedFields: [],
      extractedData: coiData,
      issues: []
    };

    let matchCount = 0;
    let totalChecks = 0;

    // Check insured name
    if (coiData.insuredName) {
      totalChecks++;
      if (this.fuzzyMatch(coiData.insuredName, fmcsaData.legalName) || 
          (fmcsaData.dbaName && this.fuzzyMatch(coiData.insuredName, fmcsaData.dbaName))) {
        matchCount++;
        result.matchedFields.push('insuredName');
      } else {
        result.misMatchedFields.push('insuredName');
        result.issues.push(`Insured name mismatch: COI shows "${coiData.insuredName}", FMCSA shows "${fmcsaData.legalName}"`);
      }
    }

    // Check insurance carrier
    if (coiData.insuranceCarrier && fmcsaData.insuranceCarrier) {
      totalChecks++;
      if (this.fuzzyMatch(coiData.insuranceCarrier, fmcsaData.insuranceCarrier)) {
        matchCount++;
        result.matchedFields.push('insuranceCarrier');
      } else {
        result.misMatchedFields.push('insuranceCarrier');
        result.issues.push(`Insurance carrier mismatch: COI shows "${coiData.insuranceCarrier}", FMCSA shows "${fmcsaData.insuranceCarrier}"`);
      }
    }

    // Check policy number
    if (coiData.policyNumber && fmcsaData.insurancePolicyNumber) {
      totalChecks++;
      if (coiData.policyNumber === fmcsaData.insurancePolicyNumber) {
        matchCount++;
        result.matchedFields.push('policyNumber');
      } else {
        result.misMatchedFields.push('policyNumber');
        result.issues.push(`Policy number mismatch: COI shows "${coiData.policyNumber}", FMCSA shows "${fmcsaData.insurancePolicyNumber}"`);
      }
    }

    // Check expiration date
    if (coiData.expirationDate) {
      totalChecks++;
      const expiryDate = new Date(coiData.expirationDate);
      const now = new Date();
      
      if (expiryDate > now) {
        matchCount++;
        result.matchedFields.push('expirationDate');
      } else {
        result.misMatchedFields.push('expirationDate');
        result.issues.push(`Insurance expired: COI shows expiration date "${coiData.expirationDate}"`);
      }
    }

    // Check required coverage types for motor carriers
    const requiredCoverages = ['General Liability', 'Auto Liability', 'Cargo'];
    if (coiData.coverageTypes) {
      const missingCoverages = requiredCoverages.filter(req => 
        !coiData.coverageTypes?.some(cov => cov.toLowerCase().includes(req.toLowerCase()))
      );
      
      if (missingCoverages.length === 0) {
        result.matchedFields.push('requiredCoverages');
      } else {
        result.misMatchedFields.push('requiredCoverages');
        result.issues.push(`Missing required coverages: ${missingCoverages.join(', ')}`);
      }
    }

    if (totalChecks > 0) {
      result.confidence = (matchCount / totalChecks) * 100;
      result.isValid = result.confidence >= 70;
    }

    return result;
  }

  private async verifyAuthorityLetter(authData: AuthorityLetterData, fmcsaData: FMCSACarrierData): Promise<DocumentVerificationResult> {
    const result: DocumentVerificationResult = {
      isValid: false,
      confidence: 0,
      matchedFields: [],
      misMatchedFields: [],
      extractedData: authData,
      issues: []
    };

    let matchCount = 0;
    let totalChecks = 0;

    // Check carrier name
    if (authData.carrierName) {
      totalChecks++;
      if (this.fuzzyMatch(authData.carrierName, fmcsaData.legalName) || 
          (fmcsaData.dbaName && this.fuzzyMatch(authData.carrierName, fmcsaData.dbaName))) {
        matchCount++;
        result.matchedFields.push('carrierName');
      } else {
        result.misMatchedFields.push('carrierName');
        result.issues.push(`Carrier name mismatch: Authority letter shows "${authData.carrierName}", FMCSA shows "${fmcsaData.legalName}"`);
      }
    }

    // Check MC number
    if (authData.mcNumber && fmcsaData.mcNumber) {
      totalChecks++;
      if (authData.mcNumber.replace(/[^\d]/g, '') === fmcsaData.mcNumber.replace(/[^\d]/g, '')) {
        matchCount++;
        result.matchedFields.push('mcNumber');
      } else {
        result.misMatchedFields.push('mcNumber');
        result.issues.push(`MC number mismatch: Authority letter shows "${authData.mcNumber}", FMCSA shows "${fmcsaData.mcNumber}"`);
      }
    }

    // Check DOT number
    if (authData.dotNumber && fmcsaData.dotNumber) {
      totalChecks++;
      if (authData.dotNumber === fmcsaData.dotNumber) {
        matchCount++;
        result.matchedFields.push('dotNumber');
      } else {
        result.misMatchedFields.push('dotNumber');
        result.issues.push(`DOT number mismatch: Authority letter shows "${authData.dotNumber}", FMCSA shows "${fmcsaData.dotNumber}"`);
      }
    }

    // Check phone number
    if (authData.phoneNumber && fmcsaData.phone) {
      totalChecks++;
      const normalizedAuthPhone = authData.phoneNumber.replace(/[^\d]/g, '');
      const normalizedFmcsaPhone = fmcsaData.phone.replace(/[^\d]/g, '');
      
      if (normalizedAuthPhone === normalizedFmcsaPhone) {
        matchCount++;
        result.matchedFields.push('phoneNumber');
      } else {
        result.misMatchedFields.push('phoneNumber');
        result.issues.push(`Phone number mismatch: Authority letter shows "${authData.phoneNumber}", FMCSA shows "${fmcsaData.phone}"`);
      }
    }

    // Check email
    if (authData.email && fmcsaData.email) {
      totalChecks++;
      if (authData.email.toLowerCase() === fmcsaData.email.toLowerCase()) {
        matchCount++;
        result.matchedFields.push('email');
      } else {
        result.misMatchedFields.push('email');
        result.issues.push(`Email mismatch: Authority letter shows "${authData.email}", FMCSA shows "${fmcsaData.email}"`);
      }
    }

    if (totalChecks > 0) {
      result.confidence = (matchCount / totalChecks) * 100;
      result.isValid = result.confidence >= 80; // Higher threshold for authority letters
    }

    return result;
  }

  private fuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
    if (!str1 || !str2) return false;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return true;
    
    // Simple similarity check (can be improved with Levenshtein distance)
    const words1 = s1.split(' ');
    const words2 = s2.split(' ');
    
    let matchingWords = 0;
    for (const word1 of words1) {
      if (word1.length < 3) continue; // Skip short words
      for (const word2 of words2) {
        if (word2.includes(word1) || word1.includes(word2)) {
          matchingWords++;
          break;
        }
      }
    }
    
    const similarity = matchingWords / Math.max(words1.length, words2.length);
    return similarity >= threshold;
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const documentVerificationService = new DocumentVerificationService();