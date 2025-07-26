import React, { useState } from 'react';
import Head from 'next/head';
import { Search, Shield, AlertTriangle, CheckCircle, Clock, Truck, FileText, Users } from 'lucide-react';
import CarrierLookup from '../components/CarrierLookup';
import CarrierProfile from '../components/CarrierProfile';
import { toast, Toaster } from 'react-hot-toast';

interface CarrierData {
  fmcsaData: any;
  existingCarrier: any;
  verificationSummary: any;
  riskFactors: any[];
  recommendations: any[];
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<CarrierData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);

  const handleSearch = async (searchTerm: string, searchType: 'mc' | 'dot' | 'name') => {
    setIsLoading(true);
    setSearchResults(null);

    try {
      const params = new URLSearchParams();
      params.append(searchType, searchTerm);

      const response = await fetch(`/api/carriers/lookup?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data);
      toast.success('Carrier found successfully');
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search carrier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCarrierSelect = (carrierId: string) => {
    setSelectedCarrier(carrierId);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'FAILED': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Carrier Identity Verification System</title>
        <meta name="description" content="Real-time carrier identity verification for freight brokers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Carrier Verification System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Preventing Double Brokering</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Register Carrier
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Verify Carrier Identity in Real-Time
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Instantly verify carrier legitimacy, check FMCSA records, review safety scores, 
            and ensure compliance before assigning loads.
          </p>

          {/* Search Component */}
          <div className="max-w-2xl mx-auto">
            <CarrierLookup onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-6">
            {/* Carrier Overview Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {searchResults.fmcsaData.legalName}
                  </h3>
                  {searchResults.fmcsaData.dbaName && (
                    <p className="text-gray-600">DBA: {searchResults.fmcsaData.dbaName}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">
                      MC: {searchResults.fmcsaData.mcNumber}
                    </span>
                    <span className="text-sm text-gray-500">
                      DOT: {searchResults.fmcsaData.dotNumber}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(searchResults.fmcsaData.riskLevel)}`}>
                    {searchResults.fmcsaData.riskLevel} Risk
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(searchResults.existingCarrier?.verificationStatus || 'PENDING')}
                    <span className="text-sm font-medium">
                      {searchResults.existingCarrier?.verificationStatus || 'Not Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Truck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {searchResults.fmcsaData.powerUnits}
                  </div>
                  <div className="text-sm text-gray-600">Power Units</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {searchResults.fmcsaData.drivers}
                  </div>
                  <div className="text-sm text-gray-600">Drivers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {searchResults.verificationSummary.documentCount}
                  </div>
                  <div className="text-sm text-gray-600">Documents</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(searchResults.fmcsaData.riskScore)}%
                  </div>
                  <div className="text-sm text-gray-600">Risk Score</div>
                </div>
              </div>

              {/* Operating Status */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Operating Status</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {searchResults.fmcsaData.operatingStatus.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Authority Status</h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {searchResults.fmcsaData.authorizedStatus.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Last FMCSA Update</h4>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {searchResults.riskFactors.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                  Risk Factors
                </h3>
                <div className="space-y-3">
                  {searchResults.riskFactors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        factor.severity === 'CRITICAL' ? 'bg-red-500' :
                        factor.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{factor.description}</p>
                        <p className="text-sm text-gray-600">{factor.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {searchResults.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {searchResults.recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                      rec.priority === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                      'bg-blue-50 border-blue-500'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{rec.description}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rec.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{rec.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              {searchResults.existingCarrier ? (
                <button
                  onClick={() => handleCarrierSelect(searchResults.existingCarrier.id)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
                >
                  View Full Profile
                </button>
              ) : (
                <button className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700">
                  Invite Carrier to Register
                </button>
              )}
              <button className="bg-gray-600 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-700">
                Flag Carrier
              </button>
              <button className="bg-blue-100 text-blue-700 px-6 py-2 rounded-md font-medium hover:bg-blue-200">
                Download Report
              </button>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!searchResults && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Complete Carrier Verification Solution
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-Time FMCSA Lookup</h4>
                <p className="text-gray-600">
                  Instantly pull carrier data from FMCSA SAFER database including authority status, 
                  safety scores, and inspection history.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Document Verification</h4>
                <p className="text-gray-600">
                  AI-powered OCR verifies W9s, COIs, and authority letters against FMCSA records 
                  to detect document fraud.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Risk Assessment</h4>
                <p className="text-gray-600">
                  Advanced risk scoring based on safety violations, inspection history, 
                  and operational patterns to prevent double brokering.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Carrier Profile Modal/Page */}
      {selectedCarrier && (
        <CarrierProfile
          carrierId={selectedCarrier}
          onClose={() => setSelectedCarrier(null)}
        />
      )}
    </div>
  );
}