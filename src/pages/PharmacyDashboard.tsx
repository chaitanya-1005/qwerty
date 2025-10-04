import { useState } from 'react';
import { Heart, Search, CheckCircle, XCircle, LogOut, Pill } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Prescription, Patient } from '../lib/supabase';

interface PrescriptionWithPatient extends Prescription {
  patient?: Patient;
}

export default function PharmacyDashboard() {
  const { profile, signOut } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>([]);
  const [loading, setLoading] = useState(false);

  const searchPrescriptions = async () => {
    if (!searchId.trim()) return;

    setLoading(true);
    try {
      let patientId: string | null = null;

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('sukhi_id', searchId.trim())
        .maybeSingle();

      if (patientData) {
        patientId = patientData.id;
      } else {
        const { data: virtualId } = await supabase
          .from('temporary_virtual_ids')
          .select('patient_id')
          .eq('virtual_id', searchId.trim())
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (virtualId) {
          patientId = virtualId.patient_id;
        }
      }

      if (!patientId) {
        alert('Patient not found or ID expired');
        setPrescriptions([]);
        return;
      }

      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      const { data: patient } = await supabase
        .from('patients')
        .select('sukhi_id, date_of_birth, sex, blood_group')
        .eq('id', patientId)
        .maybeSingle();

      const prescriptionsWithPatient = (prescriptionsData || []).map(p => ({
        ...p,
        patient: patient || undefined
      }));

      setPrescriptions(prescriptionsWithPatient);
    } catch (error) {
      console.error('Error searching prescriptions:', error);
      alert('Error searching prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const verifyPrescription = async (prescriptionId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          is_verified: true,
          verified_by: profile.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', prescriptionId);

      if (error) throw error;

      setPrescriptions(prev =>
        prev.map(p =>
          p.id === prescriptionId
            ? { ...p, is_verified: true, verified_by: profile.id, verified_at: new Date().toISOString() }
            : p
        )
      );

      alert('Prescription verified successfully!');
    } catch (error) {
      console.error('Error verifying prescription:', error);
      alert('Error verifying prescription');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-orange-500 fill-orange-500 mr-2" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">SevaKey</h1>
              <p className="text-xs text-gray-500">Pharmacy Portal</p>
            </div>
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Verify Prescription</h2>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPrescriptions()}
                placeholder="Enter Patient's SUKHI ID or Temporary Virtual ID"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchPrescriptions}
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {prescriptions.length > 0 ? (
          <div className="space-y-6">
            {prescriptions[0].patient && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">SUKHI ID</p>
                    <p className="font-bold text-gray-800">{prescriptions[0].patient.sukhi_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date of Birth</p>
                    <p className="font-medium text-gray-800">
                      {new Date(prescriptions[0].patient.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sex</p>
                    <p className="font-medium text-gray-800 capitalize">{prescriptions[0].patient.sex}</p>
                  </div>
                  {prescriptions[0].patient.blood_group && (
                    <div>
                      <p className="text-gray-600">Blood Group</p>
                      <p className="font-medium text-gray-800">{prescriptions[0].patient.blood_group}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Prescriptions</h3>
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className={`border-2 rounded-xl p-6 ${
                      prescription.is_verified ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Prescribed on</p>
                        <p className="font-medium text-gray-800">
                          {new Date(prescription.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {prescription.is_verified ? (
                        <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Pill className="w-5 h-5 text-orange-500" />
                        Medications
                      </h4>
                      <div className="space-y-3">
                        {prescription.medications.map((med: any, idx: number) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="font-bold text-gray-800 mb-2">{med.name}</p>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-gray-600">Dosage</p>
                                <p className="font-medium text-gray-800">{med.dosage}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Frequency</p>
                                <p className="font-medium text-gray-800">{med.frequency}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Duration</p>
                                <p className="font-medium text-gray-800">{med.duration}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {prescription.instructions && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Special Instructions</h4>
                        <p className="text-gray-700 text-sm bg-white rounded-lg p-3 border border-gray-200">
                          {prescription.instructions}
                        </p>
                      </div>
                    )}

                    {!prescription.is_verified && (
                      <button
                        onClick={() => verifyPrescription(prescription.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Verify Prescription
                      </button>
                    )}

                    {prescription.is_verified && prescription.verified_at && (
                      <div className="text-center text-sm text-gray-600 mt-4">
                        Verified on {new Date(prescription.verified_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Prescriptions Found</h3>
            <p className="text-gray-600">
              Search for a patient using their SUKHI ID or Temporary Virtual ID to verify prescriptions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
