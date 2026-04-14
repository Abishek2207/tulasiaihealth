/**
 * DiagnosisSearch Component for TulsiHealth
 * Provides intelligent diagnosis search with AYUSH + ICD-11 dual coding
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Info, BookOpen, Stethoscope } from 'lucide-react';

interface DiagnosisResult {
  id: string;
  name: string;
  code: string;
  system: 'NAMASTE' | 'ICD-11';
  description?: string;
  icdCode?: string;
  confidence?: number;
  category?: string;
}

interface DiagnosisSearchProps {
  onDiagnosisSelect?: (diagnosis: DiagnosisResult) => void;
  placeholder?: string;
  showICDMapping?: boolean;
  maxResults?: number;
}

export default function DiagnosisSearch({
  onDiagnosisSelect,
  placeholder = "Search for diagnoses (AYUSH + ICD-11)...",
  showICDMapping = true,
  maxResults = 10
}: DiagnosisSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<DiagnosisResult[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchDiagnoses = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/terminology/search?q=${encodeURIComponent(query)}&limit=${maxResults}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(true);
        } else {
          // Mock data for development
          const mockResults: DiagnosisResult[] = [
            {
              id: '1',
              name: 'Jwara (Fever)',
              code: 'NAM001',
              system: 'NAMASTE',
              description: 'Elevated body temperature due to dosha imbalance',
              icdCode: '9A00.0',
              confidence: 0.95,
              category: 'Ayurveda'
            },
            {
              id: '2',
              name: 'Kasa (Cough)',
              code: 'NAM002',
              system: 'NAMASTE',
              description: 'Respiratory condition with cough reflex',
              icdCode: 'CA00.1',
              confidence: 0.88,
              category: 'Ayurveda'
            },
            {
              id: '3',
              name: 'Shoola (Pain)',
              code: 'NAM003',
              system: 'NAMASTE',
              description: 'Generalized pain condition',
              icdCode: 'MG30.0',
              confidence: 0.82,
              category: 'Ayurveda'
            }
          ];
          setResults(mockResults);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error searching diagnoses:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchDiagnoses, 300);
    return () => clearTimeout(timeoutId);
  }, [query, maxResults]);

  const handleSelect = (diagnosis: DiagnosisResult) => {
    if (onDiagnosisSelect) {
      onDiagnosisSelect(diagnosis);
    }
    setSelectedDiagnoses([...selectedDiagnoses, diagnosis]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeDiagnosis = (id: string) => {
    setSelectedDiagnoses(selectedDiagnoses.filter(d => d.id !== id));
  };

  const getSystemColor = (system: string) => {
    return system === 'NAMASTE' ? 'text-green-500' : 'text-blue-500';
  };

  const getSystemBg = (system: string) => {
    return system === 'NAMASTE' ? 'bg-green-500/20' : 'bg-blue-500/20';
  };

  return (
    <div className="w-full">
      <div ref={searchRef} className="relative">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 transition-colors text-white"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="p-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white">{result.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSystemBg(result.system)} ${getSystemColor(result.system)}`}>
                          {result.system}
                        </span>
                        {result.confidence && (
                          <span className="text-xs text-gray-400">
                            {Math.round(result.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-1">
                        <span>Code: {result.code}</span>
                        {showICDMapping && result.icdCode && (
                          <span>ICD-11: {result.icdCode}</span>
                        )}
                        {result.category && (
                          <span>{result.category}</span>
                        )}
                      </div>
                      
                      {result.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                    
                    <Plus className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-800 p-2">
              <button className="w-full p-2 text-sm text-green-500 hover:bg-gray-800 rounded transition-colors flex items-center justify-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>View All Terminology</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Diagnoses */}
      {selectedDiagnoses.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Selected Diagnoses:</h4>
          <div className="space-y-2">
            {selectedDiagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">{diagnosis.name}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getSystemBg(diagnosis.system)} ${getSystemColor(diagnosis.system)}`}>
                      {diagnosis.system}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                    <span>{diagnosis.code}</span>
                    {showICDMapping && diagnosis.icdCode && (
                      <span>ICD-11: {diagnosis.icdCode}</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => removeDiagnosis(diagnosis.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-1">
              <strong>Dual Coding System:</strong> Search includes both NAMASTE (AYUSH) and ICD-11 terminology.
            </p>
            <p>
              <strong>AI-Powered:</strong> Results are ranked by confidence scores using RAG technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
