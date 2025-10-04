import { useState, useEffect } from 'react';
import { Heart, Search, Mic, Save, LogOut, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Doctor, Patient, Visit } from '../lib/supabase';

export default function DoctorDashboard() {
  const { profile, signOut } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [searchId, setSearchId] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [transcription, setTranscription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDoctorData();
  }, [profile]);

  const loadDoctorData = async () => {
    if (!profile) return;

    try {
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      setDoctor(doctorData);
    } catch (error) {
      console.error('Error loading doctor data:', error);
    }
  };

  const searchPatient = async () => {
    if (!searchId.trim()) return;

    setLoading(true);
    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('sukhi_id', searchId.trim())
        .maybeSingle();

      if (!patientData) {
        const { data: virtualId } = await supabase
          .from('temporary_virtual_ids')
          .select('patient_id')
          .eq('virtual_id', searchId.trim())
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (virtualId) {
          const { data: patientFromVirtual } = await supabase
            .from('patients')
            .select('*')
            .eq('id', virtualId.patient_id)
            .maybeSingle();

          setPatient(patientFromVirtual);
          if (patientFromVirtual) {
            await loadPatientVisits(patientFromVirtual.id);
          }
        } else {
          alert('Patient not found or ID expired');
          setPatient(null);
          setPatientVisits([]);
        }
      } else {
        setPatient(patientData);
        await loadPatientVisits(patientData.id);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('Error searching patient');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientVisits = async (patientId: string) => {
    try {
      const { data: visitsData } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false })
        .limit(10);

      setPatientVisits(visitsData || []);
    } catch (error) {
      console.error('Error loading visits:', error);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscription('Recording started... (AI transcription will appear here)\n\nDoctor: Patient presents with...\nPatient: I have been experiencing...\n\n[This is a placeholder. In production, this would use speech-to-text API]');
    } else {
      setIsRecording(false);
      setTranscription(prev => prev + '\n\nRecording stopped and transcription complete.');
    }
  };

  const saveVisit = async () => {
    if (!patient || !doctor) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('visits')
        .insert({
          patient_id: patient.id,
          doctor_id: doctor.id,
          visit_date: new Date().toISOString(),
          chief_complaint: chiefComplaint,
          diagnosis: diagnosis,
          notes: notes,
          transcription: transcription,
          is_critical: false,
        });

      if (error) throw error;

      alert('Visit saved successfully!');
      setChiefComplaint('');
      setDiagnosis('');
      setNotes('');
      setTranscription('');
      await loadPatientVisits(patient.id);
    } catch (error) {
      console.error('Error saving visit:', error);
      alert('Error saving visit');
    } finally {
      setSaving(false);
    }
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Heart className="w-16 h-16 text-orange-500 fill-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Profile</h2>
            <p className="text-gray-600 mb-6">Please complete your doctor registration to access the system.</p>
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
            <div>
              <h1 className="text-xl font-bold text-gray-800">SevaKey</h1>
              <p className="text-xs text-gray-500">Doctor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Dr. {profile?.full_name}</span>
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Patient Lookup</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPatient()}
                placeholder="Enter SUKHI ID or Temporary Virtual ID"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchPatient}
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {patient ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Patient Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">SUKHI ID</p>
                    <p className="font-bold text-lg text-gray-800">{patient.sukhi_id}</p>
                  </div>
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

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Visit History</h3>
                {patientVisits.length === 0 ? (
                  <p className="text-gray-500 text-sm">No previous visits</p>
                ) : (
                  <div className="space-y-3">
                    {patientVisits.map((visit) => (
                      <div key={visit.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-gray-800">{visit.chief_complaint || 'General'}</p>
                        <p className="text-xs text-gray-600">{new Date(visit.visit_date).toLocaleDateString()}</p>
                        {visit.is_critical && (
                          <span className="inline-block mt-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                            Critical
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">New Consultation</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                    <input
                      type="text"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="What brings the patient today?"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Clinical diagnosis"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Examination findings, treatment plan, etc."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Audio Recording & AI Transcription</label>
                      <button
                        onClick={toggleRecording}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                          isRecording
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-orange-500 text-white hover:bg-orange-600'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </button>
                    </div>
                    {transcription && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcription}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">AI-Assisted Documentation</p>
                      <p>Record your consultation and AI will automatically transcribe and structure the visit notes. You can edit before saving.</p>
                    </div>
                  </div>

                  <button
                    onClick={saveVisit}
                    disabled={saving || !chiefComplaint}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Visit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Patient Selected</h3>
            <p className="text-gray-600">Search for a patient using their SUKHI ID or Temporary Virtual ID to begin consultation</p>
          </div>
        )}
      </div>
    </div>
  );
}
