import { ServiceType, PetWeight, AddonService } from './types';

export const SERVICES = {
  [ServiceType.BATH]: {
    label: 'Só Banho',
    duration: 1, // in hours
  },
  [ServiceType.BATH_AND_GROOMING]: {
    label: 'Banho & Tosa',
    duration: 2, // in hours
  },
  [ServiceType.GROOMING_ONLY]: {
    label: 'Só Tosa',
    duration: 2, // in hours
  },
  [ServiceType.VISIT_DAYCARE]: {
    label: 'Creche Pet',
    duration: 1, // in hours
  },
  [ServiceType.VISIT_HOTEL]: {
    label: 'Hotel Pet',
    duration: 1, // in hours
  },
  [ServiceType.PET_MOBILE_BATH]: {
    label: 'Só Banho (Pet Móvel)',
    duration: 1.5,
  },
  [ServiceType.PET_MOBILE_BATH_AND_GROOMING]: {
    label: 'Banho & Tosa (Pet Móvel)',
    duration: 2.5,
  },
  [ServiceType.PET_MOBILE_GROOMING_ONLY]: {
    label: 'Só Tosa (Pet Móvel)',
    duration: 2.5,
  },
};

export const PET_WEIGHT_OPTIONS: Record<PetWeight, string> = {
    [PetWeight.UP_TO_5]: 'Até 5kg',
    [PetWeight.KG_10]: 'Até 10kg',
    [PetWeight.KG_15]: 'Até 15kg',
    [PetWeight.KG_20]: 'Até 20kg',
    [PetWeight.KG_25]: 'Até 25kg',
    [PetWeight.KG_30]: 'Até 30kg',
    [PetWeight.OVER_30]: 'Acima de 30kg',
};

export const SERVICE_PRICES: Record<PetWeight, { [key in ServiceType.BATH | ServiceType.GROOMING_ONLY]: number }> = {
  [PetWeight.UP_TO_5]: { [ServiceType.BATH]: 65, [ServiceType.GROOMING_ONLY]: 130 },
  [PetWeight.KG_10]: { [ServiceType.BATH]: 75, [ServiceType.GROOMING_ONLY]: 150 },
  [PetWeight.KG_15]: { [ServiceType.BATH]: 85, [ServiceType.GROOMING_ONLY]: 170 },
  [PetWeight.KG_20]: { [ServiceType.BATH]: 95, [ServiceType.GROOMING_ONLY]: 190 },
  [PetWeight.KG_25]: { [ServiceType.BATH]: 105, [ServiceType.GROOMING_ONLY]: 210 },
  [PetWeight.KG_30]: { [ServiceType.BATH]: 115, [ServiceType.GROOMING_ONLY]: 230 },
  [PetWeight.OVER_30]: { [ServiceType.BATH]: 150, [ServiceType.GROOMING_ONLY]: 300 },
};

export const ADDON_SERVICES: AddonService[] = [
  // Rule: Only available for pets up to 5kg.
  { id: 'tosa_tesoura', label: 'Tosa na Tesoura', price: 160, requiresWeight: [PetWeight.UP_TO_5]},
  { id: 'aparacao', label: 'Aparação Contorno', price: 35 },
  // Rule: Only available for pets over 5kg.
  { id: 'hidratacao', label: 'Hidratação', price: 25, excludesWeight: [PetWeight.UP_TO_5] },
  { id: 'tosa_higienica', label: 'Tosa Higiênica', price: 15 },
  { id: 'botinhas', label: 'Botinhas', price: 25 },
  { id: 'desembolo', label: 'Desembolo', price: 25 }, 
  { id: 'patacure1', label: 'Patacure (1 cor)', price: 10 },
  { id: 'patacure2', label: 'Patacure (2 cores)', price: 20 },
  { id: 'tintura', label: 'Tintura (1 parte)', price: 20 },
];


export const WORKING_HOURS: number[] = [9, 10, 11, 13, 14, 15, 16, 17];
export const VISIT_WORKING_HOURS: number[] = [9, 10, 11, 12, 13, 14, 15, 16];
export const LUNCH_HOUR = 12;
export const MAX_CAPACITY_PER_SLOT = 2; // Two groomers
