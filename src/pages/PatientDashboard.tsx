import { useState, useEffect } from 'react';
import { Heart, Copy, Clock, Shield, FileText, LogOut, MessageCircle, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Patient, VirtualID, Visit, generateVirtualId } from '../lib/supabase';
import ChatbotModal from '../components/ChatbotModal';

export default function PatientDashboard() {
  const { profile, signOut } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [virtualIds, setVirtualIds] = useState<VirtualID[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [profile]);

  const loadPatientData = async () => {
    if (!profile) return;

    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (patientData) {
        setPatient(patientData);

        const { data: virtualData } = await supabase
          .from('temporary_virtual_ids')
          .select('*')
          .eq('patient_id', patientData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setVirtualIds(virtualData || []);

        const { data: visitsData } = await supabase
          .from('visits')
          .select('*')
          .eq('patient_id', patientData.id)
          .order('visit_date', { ascending: false })
          .limit(5);

        setVisits(visitsData || []);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTemporaryId = async () => {
    if (!patient) return;

    try {
      const virtualId = generateVirtualId();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const { error } = await supabase
        .from('temporary_virtual_ids')
        .insert({
          patient_id: patient.id,
          virtual_id: virtualId,
          expires_at: expiresAt.toISOString(),
          is_active: true,
        });

      if (error) throw error;
      await loadPatientData();
    } catch (error) {
      console.error('Error generating virtual ID:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-orange-500 fill-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your health records...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Heart className="w-16 h-16 text-orange-500 fill-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">Please complete your patient registration to access your health records.</p>
            <button
              onClick={signOut}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-orange-500 fill-orange-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-800">SevaKey</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{profile?.full_name}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your SUKHI ID</h2>
                <Shield className="w-8 h-8 text-orange-500" />
              </div>
              <div className="bg-gradient-to-r from-orange-100 to-blue-100 rounded-xl p-6">
                <p className="text-sm text-gray-600 mb-2">Permanent Health ID</p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-gray-800 tracking-wider">{patient.sukhi_id}</p>
                  <button
                    onClick={() => copyToClipboard(patient.sukhi_id)}
                    className="p-2 hover:bg-white/50 rounded-lg transition"
                  >
                    <Copy className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Temporary Virtual IDs</h2>
                <button
                  onClick={generateTemporaryId}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm font-medium"
                >
                  Generate New
                </button>
              </div>
              {virtualIds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active virtual IDs</p>
                  <p className="text-sm mt-1">Generate a temporary ID to share your records securely</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {virtualIds.map((vid) => (
                    <div
                      key={vid.id}
                      className={`border rounded-lg p-4 ${
                        isExpired(vid.expires_at) ? 'border-gray-300 bg-gray-50' : 'border-orange-200 bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg text-gray-800">{vid.virtual_id}</p>
                          <p className="text-sm text-gray-600">
                            {isExpired(vid.expires_at) ? 'Expired' : 'Expires'} on{' '}
                            {new Date(vid.expires_at).toLocaleString()}
                          </p>
                        </div>
                        {!isExpired(vid.expires_at) && (
                          <button
                            onClick={() => copyToClipboard(vid.virtual_id)}
                            className="p-2 hover:bg-white rounded-lg transition"
                          >
                            <Copy className="w-5 h-5 text-gray-700" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Visits</h2>
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              {visits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No visits recorded yet</p>
                  <p className="text-sm mt-1">Your medical consultations will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visits.map((visit) => (
                    <div key={visit.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-800">{visit.chief_complaint || 'General Consultation'}</p>
                          <p className="text-sm text-gray-600">{new Date(visit.visit_date).toLocaleDateString()}</p>
                        </div>
                        {visit.is_critical && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                            Critical
                          </span>
                        )}
                      </div>
                      {visit.diagnosis && (
                        <p className="text-sm text-gray-700 mt-2">
                          <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Date of Birth</p>
                  <p className="font-medium text-gray-800">{new Date(patient.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Sex</p>
                  <p className="font-medium text-gray-800 capitalize">{patient.sex}</p>
                </div>
                {patient.blood_group && (
                  <div>
                    <p className="text-gray-600">Blood Group</p>
                    <p className="font-medium text-gray-800">{patient.blood_group}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">Emergency Contact</p>
                  <p className="font-medium text-gray-800">{patient.emergency_contact}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowChatbot(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-2xl font-medium hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              AI Wellness Assistant
            </button>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Emergency Info</h4>
              <p className="text-sm text-orange-700">
                In case of emergency, your critical health information is available offline to authorized medical personnel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showChatbot && <ChatbotModal onClose={() => setShowChatbot(false)} />}
    </div>
  );
}
