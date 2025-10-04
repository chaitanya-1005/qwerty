import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'patient' | 'doctor' | 'pharmacist' | 'insurer';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  sukhi_id: string;
  date_of_birth: string;
  sex: 'male' | 'female' | 'other';
  blood_group?: string;
  emergency_contact: string;
  address: string;
  nearest_police_station?: string;
  last_online_sync: string;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  license_number: string;
  specialization?: string;
  hospital_affiliation?: string;
  created_at: string;
}

export interface VirtualID {
  id: string;
  patient_id: string;
  virtual_id: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

export interface Visit {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  audio_url?: string;
  transcription?: string;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  visit_id: string;
  patient_id: string;
  doctor_id: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  instructions?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export function generateSukhiId(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return timestamp + random;
}

export function generateVirtualId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
