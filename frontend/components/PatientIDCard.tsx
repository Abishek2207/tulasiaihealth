/**
 * PatientIDCard Component for TulsiHealth
 * Displays patient information with ABHA integration
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Shield, 
  QrCode,
  Download,
  Share2,
  AlertCircle
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  abhaId?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  allergies?: string[];
  conditions?: string[];
  lastVisit?: string;
}

interface PatientIDCardProps {
  patient: Patient;
  showQR?: boolean;
  compact?: boolean;
  showActions?: boolean;
}

export default function PatientIDCard({
  patient,
  showQR = true,
  compact = false,
  showActions = true
}: PatientIDCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showQR && patient.abhaId) {
      generateQRCode();
    }
  }, [patient.abhaId, showQR]);

  const generateQRCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/patient/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId: patient.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCode);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCard = async () => {
    try {
      const response = await fetch(`/api/patient/${patient.id}/card/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${patient.name.replace(' ', '_')}_ID_Card.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading card:', error);
    }
  };

  const shareCard = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Patient ID Card - ${patient.name}`,
          text: `Patient: ${patient.name}\nABHA ID: ${patient.abhaId || 'N/A'}\nDOB: ${patient.dateOfBirth || 'N/A'}`,
          url: window.location.href,
        });
      } else {
        // Fallback: Copy to clipboard
        const text = `Patient: ${patient.name}\nABHA ID: ${patient.abhaId || 'N/A'}\nDOB: ${patient.dateOfBirth || 'N/A'}`;
        await navigator.clipboard.writeText(text);
      }
    } catch (error) {
      console.error('Error sharing card:', error);
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} years`;
  };

  if (compact) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-white">{patient.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>ID: {patient.id}</span>
              {patient.dateOfBirth && (
                <span>Age: {calculateAge(patient.dateOfBirth)}</span>
              )}
              {patient.gender && (
                <span>{patient.gender}</span>
              )}
            </div>
          </div>
          
          {showQR && (
            <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
              ) : qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="w-10 h-10" />
              ) : (
                <QrCode className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">Patient ID Card</span>
          </div>
          {patient.abhaId && (
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">ABHA Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Patient Information */}
      <div className="p-6">
        <div className="flex items-start space-x-6">
          {/* Patient Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Patient Details */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{patient.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 w-20">Patient ID:</span>
                  <span className="text-white font-medium">{patient.id}</span>
                </div>
                
                {patient.dateOfBirth && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">DOB/Age:</span>
                    <span className="text-white">{patient.dateOfBirth} ({calculateAge(patient.dateOfBirth)})</span>
                  </div>
                )}
                
                {patient.gender && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 w-20">Gender:</span>
                    <span className="text-white">{patient.gender}</span>
                  </div>
                )}
                
                {patient.bloodGroup && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 w-20">Blood Group:</span>
                    <span className="text-white font-medium">{patient.bloodGroup}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {patient.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-white">{patient.phone}</span>
                  </div>
                )}
                
                {patient.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{patient.email}</span>
                  </div>
                )}
                
                {patient.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{patient.address}</span>
                  </div>
                )}
                
                {patient.abhaId && (
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">ABHA: {patient.abhaId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code */}
          {showQR && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white rounded-lg p-2">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  </div>
                ) : qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="Patient QR Code" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Medical Information */}
        {(patient.allergies?.length || patient.conditions?.length) && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Medical Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Allergies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, index) => (
                      <span key={index} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {patient.conditions && patient.conditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-2">Chronic Conditions</h4>
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map((condition, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {patient.emergencyContact && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Emergency Contact</h3>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{patient.emergencyContact.name}</p>
                  <p className="text-sm text-gray-400">{patient.emergencyContact.relation}</p>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">{patient.emergencyContact.phone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadCard}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Card</span>
              </button>
              
              <button
                onClick={shareCard}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}

        {/* Last Visit */}
        {patient.lastVisit && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
