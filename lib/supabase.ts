import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://vymbxhqurgneynpwqrdd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bWJ4aHF1cmduZXlucHdxcmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NTQxNzksImV4cCI6MjA3NjUzMDE3OX0.ApWKrf2p07TLSX1ujpbgSXRjALGueaXUsTBkZapOMKk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Bodyguard = {
  id: string;
  full_name: string;
  phone: string;
  bio: string;
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  latitude: number;
  longitude: number;
};

export type Booking = {
  id: string;
  client_id: string;
  bodyguard_id: string;
  service_type: string;
  start_time: string;
  end_time: string;
  pickup_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_location: string | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
};
