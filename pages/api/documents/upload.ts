import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../../../lib/prisma';
import { documentVerificationService } from '../../../lib/document-verification';
import { fmcsaService } from '../../../lib/fmcsa-api';
import { v4 as uuidv4 } from 'uuid';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Parse the incoming form data
    const form = new IncomingForm({
      uploadDir: UPLOAD_DIR,
      maxFileSize: MAX_FILE_SIZE,
      keepExtensions: true,
      multiples: false
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const carrierId = Array.isArray(fields.carrierId) ? fields.carrierId[0] : fields.carrierId;
    const documentType = Array.isArray(fields.documentType) ? fields.documentType[0] : fields.documentType;
    
    if (!carrierId || !documentType) {
      return res.status(400).json({ 
        error: 'Carrier ID and document type are required' 
      });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      await fs.unlink(file.filepath);
      return res.status(400).json({ 
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files only.' 
      });
    }

    // Validate document type
    const validDocumentTypes = ['W9', 'COI', 'AUTHORITY_LETTER', 'DISPATCH_CONTACT', 'OPERATING_AGREEMENT', 'INSURANCE_POLICY', 'SAFETY_AUDIT', 'OTHER'];
    if (!validDocumentTypes.includes(documentType)) {
      await fs.unlink(file.filepath);
      return res.status(400).json({ 
        error: 'Invalid document type' 
      });
    }

    // Get carrier information
    const carrier = await prisma.carrier.findUnique({
      where: { id: carrierId },
      include: { company: true }
    });

    if (!carrier) {
      await fs.unlink(file.filepath);
      return res.status(404).json({ error: 'Carrier not found' });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalFilename || '');
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const finalPath = path.join(UPLOAD_DIR, uniqueFilename);

    // Move file to final location
    await fs.rename(file.filepath, finalPath);

    // Create document record
    const document = await prisma.document.create({
      data: {
        carrierId: carrier.id,
        companyId: carrier.companyId,
        type: documentType as any,
        filename: uniqueFilename,
        originalName: file.originalFilename || 'unknown',
        filePath: finalPath,
        fileSize: file.size || 0,
        mimeType: file.mimetype || 'application/octet-stream',
        status: 'PROCESSING'
      }
    });

    // Process document asynchronously
    processDocumentAsync(document.id, finalPath, documentType, carrier);

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully and is being processed',
      document: {
        id: document.id,
        type: document.type,
        filename: document.originalName,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
    });
  }
}

async function processDocumentAsync(documentId: string, filePath: string, documentType: string, carrier: any) {
  try {
    console.log(`Processing document ${documentId} of type ${documentType}`);

    // Perform OCR on the document
    const ocrResult = await documentVerificationService.processDocument(filePath, documentType);

    // Get FMCSA data for verification
    const fmcsaData = await fmcsaService.getCarrierByDOT(carrier.dotNumber);

    let verificationResult = null;
    if (fmcsaData) {
      // Verify document against FMCSA data
      verificationResult = await documentVerificationService.verifyDocumentAgainstFMCSA(
        ocrResult.extractedData,
        documentType,
        fmcsaData
      );
    }

    // Determine document status
    let documentStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' = 'PENDING';
    if (verificationResult) {
      if (verificationResult.isValid && verificationResult.confidence >= 80) {
        documentStatus = 'VERIFIED';
      } else if (verificationResult.confidence < 50 || verificationResult.issues.length > 2) {
        documentStatus = 'REJECTED';
      }
    }

    // Update document with OCR results and verification
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: documentStatus,
        ocrData: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          extractedData: ocrResult.extractedData,
          processedAt: new Date()
        },
        verifiedData: verificationResult ? {
          isValid: verificationResult.isValid,
          confidence: verificationResult.confidence,
          matchedFields: verificationResult.matchedFields,
          misMatchedFields: verificationResult.misMatchedFields,
          issues: verificationResult.issues,
          verifiedAt: new Date()
        } : null,
        verifiedAt: documentStatus === 'VERIFIED' ? new Date() : null
      }
    });

    // Create verification record
    if (verificationResult) {
      await prisma.verification.create({
        data: {
          carrierId: carrier.id,
          type: getVerificationType(documentType),
          status: documentStatus === 'VERIFIED' ? 'VERIFIED' : 'FAILED',
          method: 'OCR',
          data: {
            documentId,
            documentType,
            ocrResult,
            verificationResult,
            processedAt: new Date()
          }
        }
      });
    }

    // Check if carrier should be marked as verified
    await checkAndUpdateCarrierVerificationStatus(carrier.id);

    console.log(`Document ${documentId} processing completed with status: ${documentStatus}`);

  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    // Update document status to indicate processing error
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        ocrData: {
          error: error.message,
          processedAt: new Date()
        }
      }
    });
  }
}

async function checkAndUpdateCarrierVerificationStatus(carrierId: string) {
  try {
    // Get all documents for the carrier
    const documents = await prisma.document.findMany({
      where: { carrierId }
    });

    // Required documents for verification
    const requiredDocs = ['W9', 'COI', 'AUTHORITY_LETTER'];
    const verifiedDocs = documents.filter(doc => doc.status === 'VERIFIED');

    // Check if all required documents are verified
    const hasAllRequiredDocs = requiredDocs.every(requiredType =>
      verifiedDocs.some(doc => doc.type === requiredType)
    );

    // Check if FMCSA data is verified
    const fmcsaVerification = await prisma.verification.findFirst({
      where: {
        carrierId,
        type: 'FMCSA_DATA',
        status: 'VERIFIED'
      }
    });

    let newVerificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' = 'PENDING';

    if (hasAllRequiredDocs && fmcsaVerification) {
      newVerificationStatus = 'VERIFIED';
    } else if (documents.some(doc => doc.status === 'REJECTED')) {
      // If any critical document is rejected, mark as failed
      const rejectedRequiredDocs = documents.filter(doc => 
        requiredDocs.includes(doc.type) && doc.status === 'REJECTED'
      );
      if (rejectedRequiredDocs.length > 0) {
        newVerificationStatus = 'FAILED';
      }
    }

    // Update carrier verification status
    await prisma.carrier.update({
      where: { id: carrierId },
      data: {
        verificationStatus: newVerificationStatus,
        updatedAt: new Date()
      }
    });

    // Update company verification status
    await prisma.company.update({
      where: { 
        carriers: {
          some: { id: carrierId }
        }
      },
      data: {
        isVerified: newVerificationStatus === 'VERIFIED'
      }
    });

    console.log(`Carrier ${carrierId} verification status updated to: ${newVerificationStatus}`);

  } catch (error) {
    console.error('Error updating carrier verification status:', error);
  }
}

function getVerificationType(documentType: string): 'FMCSA_DATA' | 'INSURANCE' | 'DOCUMENTS' | 'IDENTITY' | 'PHONE_EMAIL' | 'SAFETY_RECORD' {
  switch (documentType) {
    case 'W9':
      return 'IDENTITY';
    case 'COI':
    case 'INSURANCE_POLICY':
      return 'INSURANCE';
    case 'AUTHORITY_LETTER':
    case 'DISPATCH_CONTACT':
      return 'PHONE_EMAIL';
    case 'SAFETY_AUDIT':
      return 'SAFETY_RECORD';
    default:
      return 'DOCUMENTS';
  }
}