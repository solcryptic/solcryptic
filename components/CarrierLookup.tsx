import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface CarrierLookupProps {
  onSearch: (searchTerm: string, searchType: 'mc' | 'dot' | 'name') => void;
  isLoading: boolean;
}

export default function CarrierLookup({ onSearch, isLoading }: CarrierLookupProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'mc' | 'dot' | 'name'>('mc');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      return;
    }

    let cleanedTerm = searchTerm.trim();
    
    // Clean up MC/DOT number formatting
    if (searchType === 'mc') {
      cleanedTerm = cleanedTerm.replace(/[^\d]/g, ''); // Remove non-digits
      if (!cleanedTerm) {
        return;
      }
    } else if (searchType === 'dot') {
      cleanedTerm = cleanedTerm.replace(/[^\d]/g, ''); // Remove non-digits
      if (!cleanedTerm) {
        return;
      }
    }

    onSearch(cleanedTerm, searchType);
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'mc':
        return 'Enter MC number (e.g., 123456 or MC123456)';
      case 'dot':
        return 'Enter DOT number (e.g., 1234567)';
      case 'name':
        return 'Enter company name';
      default:
        return 'Search...';
    }
  };

  const formatInput = (value: string) => {
    if (searchType === 'mc') {
      // Remove non-digits and format as MC number
      const digits = value.replace(/[^\d]/g, '');
      return digits ? `MC${digits}` : '';
    } else if (searchType === 'dot') {
      // Remove non-digits for DOT numbers
      return value.replace(/[^\d]/g, '');
    }
    return value;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (searchType === 'mc' || searchType === 'dot') {
      // Only allow digits and MC prefix for MC numbers
      if (searchType === 'mc') {
        const digits = value.replace(/[^\d]/g, '');
        setSearchTerm(digits);
      } else {
        const digits = value.replace(/[^\d]/g, '');
        setSearchTerm(digits);
      }
    } else {
      setSearchTerm(value);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Type Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setSearchType('mc');
              setSearchTerm('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === 'mc'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            MC Number
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchType('dot');
              setSearchTerm('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === 'dot'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            DOT Number
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchType('name');
              setSearchTerm('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              searchType === 'name'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Company Name
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={searchType === 'mc' && searchTerm ? `MC${searchTerm}` : searchTerm}
            onChange={handleInputChange}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder={getPlaceholder()}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="submit"
              disabled={isLoading || !searchTerm.trim()}
              className="mr-3 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Tips */}
        <div className="text-sm text-gray-500 space-y-1">
          <p className="font-medium">Search Tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>MC Number:</strong> Enter just the numbers (system will add MC prefix)</li>
            <li><strong>DOT Number:</strong> Enter the full DOT number without spaces</li>
            <li><strong>Company Name:</strong> Enter partial or full company name</li>
          </ul>
        </div>

        {/* Quick Examples */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => {
              setSearchType('mc');
              setSearchTerm('123456');
            }}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200"
            disabled={isLoading}
          >
            Try MC123456
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchType('dot');
              setSearchTerm('2567890');
            }}
            className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200"
            disabled={isLoading}
          >
            Try DOT2567890
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchType('mc');
              setSearchTerm('999999');
            }}
            className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200"
            disabled={isLoading}
          >
            Try High Risk Carrier
          </button>
        </div>
      </form>
    </div>
  );
}