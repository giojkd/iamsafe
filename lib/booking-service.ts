import { supabase } from './supabase';

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type ServiceType = 'location' | 'route';
export type DiscretionLevel = 'low' | 'medium' | 'high';
export type PaymentMethod = 'card' | 'wallet';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type CreateBookingData = {
  bodyguardId: string;
  serviceType: ServiceType;
  pickupLocation: string;
  dropoffLocation?: string;
  scheduledDate: string;
  durationHours: number;
  useVehicle: boolean;
  vehicleType?: string;
  discretionLevel: DiscretionLevel;
  outfitType: string;
  notes?: string;
  servicePrice: number;
  vehiclePrice: number;
  platformFee: number;
  totalPrice: number;
};

export type CreatePaymentData = {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cardLastFour?: string;
  transactionId?: string;
};

export type Booking = {
  id: string;
  client_id: string;
  bodyguard_id: string;
  service_type: ServiceType;
  pickup_location: string;
  dropoff_location?: string;
  scheduled_date: string;
  duration_hours: number;
  use_vehicle: boolean;
  vehicle_type?: string;
  discretion_level: DiscretionLevel;
  outfit_type: string;
  notes?: string;
  service_price: number;
  vehicle_price: number;
  platform_fee: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  booking_id: string;
  client_id: string;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  transaction_id?: string;
  card_last_four?: string;
  processed_at?: string;
  created_at: string;
};

export const bookingService = {
  async createBooking(data: CreateBookingData): Promise<{ booking: Booking | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { booking: null, error: { message: 'User not authenticated' } };
      }

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          bodyguard_id: data.bodyguardId,
          service_type: data.serviceType,
          pickup_location: data.pickupLocation,
          dropoff_location: data.dropoffLocation,
          scheduled_date: data.scheduledDate,
          duration_hours: data.durationHours,
          use_vehicle: data.useVehicle,
          vehicle_type: data.vehicleType,
          discretion_level: data.discretionLevel,
          outfit_type: data.outfitType,
          notes: data.notes,
          service_price: data.servicePrice,
          vehicle_price: data.vehiclePrice,
          platform_fee: data.platformFee,
          total_price: data.totalPrice,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Booking creation error:', error);
      }

      return { booking, error };
    } catch (error) {
      return { booking: null, error };
    }
  },

  async createPayment(data: CreatePaymentData): Promise<{ payment: Payment | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { payment: null, error: { message: 'User not authenticated' } };
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          booking_id: data.bookingId,
          client_id: user.id,
          amount: data.amount,
          payment_method: data.paymentMethod,
          card_last_four: data.cardLastFour,
          transaction_id: data.transactionId,
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Payment creation error:', error);
      }

      if (!error && payment) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', data.bookingId);
      }

      return { payment, error };
    } catch (error) {
      return { payment: null, error };
    }
  },

  async getClientBookings(): Promise<{ bookings: Booking[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { bookings: null, error: { message: 'User not authenticated' } };
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .order('scheduled_date', { ascending: false });

      return { bookings, error };
    } catch (error) {
      return { bookings: null, error };
    }
  },

  async getBodyguardBookings(): Promise<{ bookings: Booking[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { bookings: null, error: { message: 'User not authenticated' } };
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('bodyguard_id', user.id)
        .order('scheduled_date', { ascending: false });

      return { bookings, error };
    } catch (error) {
      return { bookings: null, error };
    }
  },

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<{ booking: Booking | null; error: any }> {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      return { booking, error };
    } catch (error) {
      return { booking: null, error };
    }
  },

  async cancelBooking(bookingId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },
};
