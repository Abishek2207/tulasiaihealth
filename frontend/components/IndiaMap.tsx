/**
 * IndiaMap Component for TulsiHealth
 * Interactive map showing healthcare facilities and statistics across India
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Activity, Users, Hospital, TrendingUp, Info } from 'lucide-react';

interface StateData {
  code: string;
  name: string;
  patients: number;
  facilities: number;
  doctors: number;
  growth: number;
  ayushFacilities: number;
}

interface IndiaMapProps {
  onStateSelect?: (state: StateData) => void;
  showStats?: boolean;
  showAyush?: boolean;
  interactive?: boolean;
  height?: string;
}

const indiaStates: StateData[] = [
  { code: 'AP', name: 'Andhra Pradesh', patients: 45230, facilities: 1240, doctors: 3400, growth: 12.5, ayushFacilities: 340 },
  { code: 'AR', name: 'Arunachal Pradesh', patients: 8450, facilities: 180, doctors: 420, growth: 8.3, ayushFacilities: 65 },
  { code: 'AS', name: 'Assam', patients: 28900, facilities: 890, doctors: 2100, growth: 10.2, ayushFacilities: 220 },
  { code: 'BR', name: 'Bihar', patients: 78450, facilities: 1560, doctors: 3800, growth: 14.7, ayushFacilities: 480 },
  { code: 'CT', name: 'Chhattisgarh', patients: 31200, facilities: 720, doctors: 1900, growth: 11.8, ayushFacilities: 180 },
  { code: 'GA', name: 'Goa', patients: 12400, facilities: 180, doctors: 580, growth: 9.2, ayushFacilities: 45 },
  { code: 'GJ', name: 'Gujarat', patients: 67800, facilities: 1890, doctors: 5200, growth: 13.4, ayushFacilities: 420 },
  { code: 'HR', name: 'Haryana', patients: 42300, facilities: 980, doctors: 2600, growth: 12.1, ayushFacilities: 190 },
  { code: 'HP', name: 'Himachal Pradesh', patients: 18900, facilities: 450, doctors: 1100, growth: 8.9, ayushFacilities: 120 },
  { code: 'JH', name: 'Jharkhand', patients: 26700, facilities: 640, doctors: 1600, growth: 13.2, ayushFacilities: 160 },
  { code: 'KA', name: 'Karnataka', patients: 89400, facilities: 2340, doctors: 6800, growth: 15.3, ayushFacilities: 580 },
  { code: 'KL', name: 'Kerala', patients: 72300, facilities: 1980, doctors: 6200, growth: 11.7, ayushFacilities: 680 },
  { code: 'MP', name: 'Madhya Pradesh', patients: 56700, facilities: 1340, doctors: 3200, growth: 12.9, ayushFacilities: 290 },
  { code: 'MH', name: 'Maharashtra', patients: 124500, facilities: 3120, doctors: 8900, growth: 14.6, ayushFacilities: 720 },
  { code: 'MN', name: 'Manipur', patients: 12300, facilities: 280, doctors: 680, growth: 9.8, ayushFacilities: 85 },
  { code: 'ML', name: 'Meghalaya', patients: 9800, facilities: 220, doctors: 520, growth: 8.1, ayushFacilities: 55 },
  { code: 'MZ', name: 'Mizoram', patients: 7600, facilities: 160, doctors: 420, growth: 7.6, ayushFacilities: 42 },
  { code: 'NL', name: 'Nagaland', patients: 8900, facilities: 200, doctors: 480, growth: 8.4, ayushFacilities: 48 },
  { code: 'OD', name: 'Odisha', patients: 41200, facilities: 1080, doctors: 2800, growth: 11.3, ayushFacilities: 340 },
  { code: 'PB', name: 'Punjab', patients: 38900, facilities: 1120, doctors: 3400, growth: 10.8, ayushFacilities: 220 },
  { code: 'RJ', name: 'Rajasthan', patients: 62300, facilities: 1680, doctors: 4200, growth: 13.7, ayushFacilities: 380 },
  { code: 'SK', name: 'Sikkim', patients: 6800, facilities: 140, doctors: 380, growth: 7.9, ayushFacilities: 38 },
  { code: 'TN', name: 'Tamil Nadu', patients: 98700, facilities: 2680, doctors: 7800, growth: 13.1, ayushFacilities: 640 },
  { code: 'TR', name: 'Tripura', patients: 11200, facilities: 260, doctors: 620, growth: 8.7, ayushFacilities: 62 },
  { code: 'UP', name: 'Uttar Pradesh', patients: 145600, facilities: 3450, doctors: 8900, growth: 15.2, ayushFacilities: 860 },
  { code: 'UT', name: 'Uttarakhand', patients: 18900, facilities: 480, doctors: 1200, growth: 10.3, ayushFacilities: 140 },
  { code: 'WB', name: 'West Bengal', patients: 82300, facilities: 2120, doctors: 6400, growth: 12.4, ayushFacilities: 520 },
  { code: 'AN', name: 'Andaman & Nicobar', patients: 3400, facilities: 80, doctors: 180, growth: 6.8, ayushFacilities: 18 },
  { code: 'CH', name: 'Chandigarh', patients: 8900, facilities: 120, doctors: 420, growth: 9.1, ayushFacilities: 28 },
  { code: 'DN', name: 'Dadra & Nagar Haveli', patients: 5600, facilities: 90, doctors: 220, growth: 8.2, ayushFacilities: 22 },
  { code: 'DD', name: 'Daman & Diu', patients: 4200, facilities: 70, doctors: 180, growth: 7.8, ayushFacilities: 18 },
  { code: 'DL', name: 'Delhi', patients: 56700, facilities: 1420, doctors: 5200, growth: 11.9, ayushFacilities: 180 },
  { code: 'JK', name: 'Jammu & Kashmir', patients: 15600, facilities: 380, doctors: 980, growth: 9.4, ayushFacilities: 120 },
  { code: 'LA', name: 'Ladakh', patients: 2800, facilities: 60, doctors: 140, growth: 6.2, ayushFacilities: 16 },
  { code: 'LD', name: 'Lakshadweep', patients: 1200, facilities: 30, doctors: 80, growth: 5.8, ayushFacilities: 8 },
  { code: 'PY', name: 'Puducherry', patients: 7800, facilities: 140, doctors: 380, growth: 8.6, ayushFacilities: 32 }
];

export default function IndiaMap({
  onStateSelect,
  showStats = true,
  showAyush = true,
  interactive = true,
  height = '500px'
}: IndiaMapProps) {
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [hoveredState, setHoveredState] = useState<StateData | null>(null);
  const [mapData, setMapData] = useState<StateData[]>(indiaStates);
  const [isLoading, setIsLoading] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (interactive) {
      fetchRealTimeData();
    }
  }, [interactive]);

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analytics/india-stats');
      if (response.ok) {
        const data = await response.json();
        setMapData(data.states || indiaStates);
      }
    } catch (error) {
      console.error('Error fetching India stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateClick = (state: StateData) => {
    if (!interactive) return;
    
    setSelectedState(state);
    if (onStateSelect) {
      onStateSelect(state);
    }
  };

  const getStateColor = (state: StateData) => {
    const intensity = state.patients / 150000; // Normalize to max patients
    
    if (hoveredState?.code === state.code) {
      return 'rgb(34, 197, 94)'; // green-500
    }
    
    if (selectedState?.code === state.code) {
      return 'rgb(16, 185, 129)'; // green-600
    }
    
    // Color based on patient count
    if (intensity > 0.8) return 'rgb(220, 38, 38)'; // red-600
    if (intensity > 0.6) return 'rgb(249, 115, 22)'; // orange-500
    if (intensity > 0.4) return 'rgb(234, 179, 8)'; // yellow-500
    if (intensity > 0.2) return 'rgb(59, 130, 246)'; // blue-500
    return 'rgb(107, 114, 128)'; // gray-500
  };

  const formatNumber = (num: number) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalPatients = mapData.reduce((sum, state) => sum + state.patients, 0);
  const totalFacilities = mapData.reduce((sum, state) => sum + state.facilities, 0);
  const totalDoctors = mapData.reduce((sum, state) => sum + state.doctors, 0);
  const totalAyush = mapData.reduce((sum, state) => sum + state.ayushFacilities, 0);
  const avgGrowth = mapData.reduce((sum, state) => sum + state.growth, 0) / mapData.length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">India Healthcare Map</h3>
          <p className="text-sm text-gray-400">
            AYUSH + ICD-11 Dual-Coding EMR Coverage Across India
          </p>
        </div>
        
        {interactive && (
          <button
            onClick={fetchRealTimeData}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Refresh data"
          >
            <Activity className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Stats Overview */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Total Patients</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatNumber(totalPatients)}</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Hospital className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Facilities</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatNumber(totalFacilities)}</p>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Doctors</span>
            </div>
            <p className="text-lg font-semibold text-white">{formatNumber(totalDoctors)}</p>
          </div>
          
          {showAyush && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <MapPin className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">AYUSH</span>
              </div>
              <p className="text-lg font-semibold text-white">{formatNumber(totalAyush)}</p>
            </div>
          )}
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Growth</span>
            </div>
            <p className="text-lg font-semibold text-white">{avgGrowth.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height }}>
        {/* SVG India Map - Simplified representation */}
        <svg
          ref={svgRef}
          viewBox="0 0 800 900"
          className="w-full h-full"
        >
          {/* Simplified India state boundaries */}
          {mapData.map((state) => (
            <g key={state.code}>
              {/* This is a simplified representation - in production, use actual SVG paths */}
              <rect
                x={Math.random() * 700 + 50}
                y={Math.random() * 800 + 50}
                width={60}
                height={60}
                fill={getStateColor(state)}
                stroke={hoveredState?.code === state.code ? '#10b981' : '#374151'}
                strokeWidth={hoveredState?.code === state.code ? 2 : 1}
                className={interactive ? 'cursor-pointer transition-all duration-200' : ''}
                onClick={() => handleStateClick(state)}
                onMouseEnter={() => setHoveredState(state)}
                onMouseLeave={() => setHoveredState(null)}
              />
              
              {/* State Code */}
              <text
                x={Math.random() * 700 + 80}
                y={Math.random() * 800 + 80}
                fill="white"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                pointerEvents="none"
              >
                {state.code}
              </text>
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredState && interactive && (
          <div className="absolute top-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg z-10">
            <h4 className="font-semibold text-white mb-2">{hoveredState.name}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Patients:</span>
                <span className="text-white">{formatNumber(hoveredState.patients)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Facilities:</span>
                <span className="text-white">{hoveredState.facilities}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Doctors:</span>
                <span className="text-white">{hoveredState.doctors}</span>
              </div>
              {showAyush && (
                <div className="flex justify-between">
                  <span className="text-gray-400">AYUSH:</span>
                  <span className="text-white">{hoveredState.ayushFacilities}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Growth:</span>
                <span className="text-green-400">{hoveredState.growth}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected State Details */}
      {selectedState && interactive && (
        <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">{selectedState.name}</h4>
            <button
              onClick={() => setSelectedState(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Total Patients</p>
              <p className="text-lg font-semibold text-white">{formatNumber(selectedState.patients)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Healthcare Facilities</p>
              <p className="text-lg font-semibold text-white">{selectedState.facilities}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Registered Doctors</p>
              <p className="text-lg font-semibold text-white">{selectedState.doctors}</p>
            </div>
            {showAyush && (
              <div>
                <p className="text-xs text-gray-400 mb-1">AYUSH Centers</p>
                <p className="text-lg font-semibold text-white">{selectedState.ayushFacilities}</p>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Monthly Growth Rate</span>
              <span className="text-sm font-medium text-green-400">{selectedState.growth}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span>Low Activity</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>High</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span>Very High</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-600 rounded"></div>
          <span>Maximum</span>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="mb-1">
              <strong>Interactive Map:</strong> Click on any state to view detailed healthcare statistics.
            </p>
            <p>
              <strong>Real-time Data:</strong> Shows live patient counts, facility information, and AYUSH integration across India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
