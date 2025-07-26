import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, AlertTriangle, Clock, Download } from 'lucide-react';

interface CarrierProfileProps {
  carrierId: string;
  onClose: () => void;
}

export default function CarrierProfile({ carrierId, onClose }: CarrierProfileProps) {
  const [carrier, setCarrier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCarrierDetails();
  }, [carrierId]);

  const fetchCarrierDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/carriers/${carrierId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch carrier details');
      }

      setCarrier(data);
    } catch (error: any) {
      console.error('Error fetching carrier details:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'REJECTED': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'W9': return 'IRS Form W-9';
      case 'COI': return 'Certificate of Insurance';
      case 'AUTHORITY_LETTER': return 'Authority Letter';
      case 'DISPATCH_CONTACT': return 'Dispatch Contact Info';
      case 'OPERATING_AGREEMENT': return 'Operating Agreement';
      case 'INSURANCE_POLICY': return 'Insurance Policy';
      case 'SAFETY_AUDIT': return 'Safety Audit';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading carrier profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">Error</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {carrier?.legalName || 'Carrier Profile'}
            </h2>
            <p className="text-gray-600">
              MC: {carrier?.mcNumber} | DOT: {carrier?.dotNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Legal Name:</span>
                <p className="text-gray-600">{carrier?.legalName}</p>
              </div>
              {carrier?.dbaName && (
                <div>
                  <span className="font-medium text-gray-700">DBA Name:</span>
                  <p className="text-gray-600">{carrier.dbaName}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-600">{carrier?.phoneNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <p className="text-gray-600">{carrier?.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Operating Status:</span>
                <p className="text-gray-600 capitalize">
                  {carrier?.operatingStatus?.replace('_', ' ').toLowerCase()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Verification Status:</span>
                <div className="flex items-center space-x-2">
                  {getDocumentStatusIcon(carrier?.verificationStatus)}
                  <span className="text-gray-600">{carrier?.verificationStatus}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Documents */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
            {carrier?.documents && carrier.documents.length > 0 ? (
              <div className="space-y-2">
                {carrier.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{getDocumentTypeName(doc.type)}</p>
                        <p className="text-sm text-gray-600">{doc.originalName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getDocumentStatusIcon(doc.status)}
                        <span className="text-sm text-gray-600">{doc.status}</span>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No documents uploaded yet</p>
            )}
          </section>

          {/* Safety Information */}
          {carrier?.basicScores && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Safety Scores (BASIC)</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(carrier.basicScores).map(([category, score]: [string, any]) => (
                  <div key={category} className="p-3 border rounded-lg">
                    <p className="font-medium text-gray-900 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            score > 75 ? 'bg-red-500' : 
                            score > 50 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(score, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Verification History */}
          {carrier?.verifications && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification History</h3>
              <div className="space-y-2">
                {carrier.verifications.map((verification: any) => (
                  <div key={verification.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{verification.type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(verification.performedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getDocumentStatusIcon(verification.status)}
                        <span className="text-sm text-gray-600">{verification.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Download Full Report
          </button>
        </div>
      </div>
    </div>
  );
}