// FIX: Define and export all types to be used across the application.
// This file should only contain type definitions, not constant values.
export enum ServiceType {
  BATH = 'BATH',
  BATH_AND_GROOMING = 'BATH_AND_GROOMING',
  GROOMING_ONLY = 'GROOMING_ONLY',
  VISIT_DAYCARE = 'VISIT_DAYCARE',
  VISIT_HOTEL = 'VISIT_HOTEL',
  PET_MOBILE_BATH = 'PET_MOBILE_BATH',
  PET_MOBILE_BATH_AND_GROOMING = 'PET_MOBILE_BATH_AND_GROOMING',
  PET_MOBILE_GROOMING_ONLY = 'PET_MOBILE_GROOMING_ONLY',
}

export enum PetWeight {
  UP_TO_5 = 'UP_TO_5',
  KG_10 = 'KG_10',
  KG_15 = 'KG_15',
  KG_20 = 'KG_20',
  KG_25 = 'KG_25',
  KG_30 = 'KG_30',
  OVER_30 = 'OVER_30',
}

export interface AddonService {
  id: string;
  label: string;
  price: number;
  requiresWeight?: PetWeight[];
  excludesWeight?: PetWeight[];
  requiresService?: ServiceType;
}

export interface Appointment {
  id: string;
  petName: string;
  ownerName: string;
  whatsapp: string;
  service: ServiceType;
  appointmentTime: Date;
}

export interface AdminAppointment {
  id: string;
  appointment_time: string;
  pet_name: string;
  owner_name: string;
  service: string;
  status: 'AGENDADO' | 'CONCLUÍDO';
  price: number;
  addons: string[];
  whatsapp: string;
  weight: string;
  monthly_client_id?: string;
  owner_address?: string;
  pet_breed?: string;
  extra_services?: {
    pernoite: boolean;
    banho_tosa: boolean;
    so_banho: boolean;
    adestrador: boolean;
    despesa_medica: boolean;
    dias_extras: number;
  };
}

export interface PetMovelAppointment extends AdminAppointment {
    condominium: string;
    client_name: string;
    apartment?: string;
    date: string;
    time: string;
}


export interface Client {
  id: string;
  name: string;
  phone: string;
}

export interface MonthlyClient {
  id: string;
  pet_name: string;
  pet_breed: string;
  owner_name: string;
  owner_address: string;
  whatsapp: string;
  service: string;
  weight: string;
  price: number;
  recurrence_type: 'weekly' | 'bi-weekly' | 'monthly';
  recurrence_day: number;
  recurrence_time: number;
  payment_due_date: string;
  is_active: boolean;
  payment_status: 'Pendente' | 'Pago';
  condominium?: string;
  extra_services?: {
    pernoite: boolean;
    banho_tosa: boolean;
    so_banho: boolean;
    adestrador: boolean;
    despesa_medica: boolean;
    dias_extras: number;
  };
}

export interface DaycareRegistration {
    id?: string;
    created_at?: string;
    pet_name: string;
    pet_breed: string;
    is_neutered: boolean | null;
    pet_sex: string;
    pet_age: string;
    has_sibling_discount: boolean;
    tutor_name: string;
    tutor_rg: string;
    address: string;
    contact_phone: string;
    emergency_contact_name: string;
    vet_phone: string;
    gets_along_with_others: boolean | null;
    last_vaccine: string;
    last_deworming: string;
    last_flea_remedy: string;
    has_allergies: boolean | null;
    allergies_description: string;
    needs_special_care: boolean | null;
    special_care_description: string;
    delivered_items: {
        items: string[];
        other: string;
    };
    contracted_plan: '2x_week' | '3x_week' | '4x_week' | '5x_week' | null;
    // Serviços extras
    extra_services?: {
        pernoite: boolean;
        banho_tosa: boolean;
        so_banho: boolean;
        adestrador: boolean;
        despesa_medica: boolean;
        dia_extra: number; // quantidade de dias extras
    };
    total_price?: number;
    payment_date: string;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado';
}

export interface HotelRegistration {
    id?: string;
    created_at?: string;
    updated_at?: string;
    pet_name: string;
    pet_sex: 'Macho' | 'Fêmea' | null;
    pet_breed: string;
    is_neutered: boolean | null;
    pet_age: string;
    tutor_name: string;
    tutor_rg: string;
    tutor_address: string;
    tutor_phone: string;
    tutor_email: string;
    tutor_social_media: string;
    vet_phone: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relation: string;
    has_rg_document: boolean;
    has_residence_proof: boolean;
    has_vaccination_card: boolean;
    has_vet_certificate: boolean;
    has_flea_tick_remedy: boolean;
    flea_tick_remedy_date: string;
    photo_authorization: boolean;
    retrieve_at_checkout: boolean;
    preexisting_disease: string;
    allergies: string;
    behavior: string;
    fears_traumas: string;
    wounds_marks: string;
    food_brand: string;
    food_quantity: string;
    feeding_frequency: string;
    accepts_treats: string;
    special_food_care: string;
    check_in_date: string;
    check_in_time: string;
    check_out_date: string;
    check_out_time: string;
    service_bath: boolean;
    service_transport: boolean;
    service_daily_rate: boolean;
    service_extra_hour: boolean;
    service_vet: boolean;
    service_training: boolean;
    total_services_price: number;
    additional_info: string;
    professional_name: string;
    registration_date: string;
    tutor_check_in_signature: string;
    tutor_check_out_signature: string;
    declaration_accepted: boolean;
    status: 'Ativo' | 'Concluído' | 'Cancelado';
    checked_in_at?: string;
    checked_out_at?: string;
    check_in_status?: 'pending' | 'checked_in' | 'checked_out';
    extra_services?: {
        pernoite: boolean;
        banho_tosa: boolean;
        so_banho: boolean;
        adestrador: boolean;
        despesa_medica: boolean;
        dia_extra: number;
    };
}
