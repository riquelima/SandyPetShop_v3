import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export interface ScheduleSlotConfig {
  id?: string;
  category: 'pet_movel' | 'fixed';
  condominium?: string | null; // 'Vitta Parque' | 'Max Haus' | 'Paseo' | null
  day_of_week: number;         // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  hour: number;                // 7..19
  capacity: number;            // 0 = closed, 1 = single slot, 2 = double slot, etc.
  is_active: boolean;          // true = open, false = blocked
  created_at?: string;
  updated_at?: string;
}

const STORAGE_KEY = 'sandyPetShop_scheduleSlotConfigs_v1';
const UPDATE_EVENT = 'sandy_schedule_slots_updated';

// Horários padrão para Pet Móvel e Banho & Tosa Fixo
export const DEFAULT_PET_MOVEL_HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
export const DEFAULT_FIXED_HOURS_WEEKDAY = [10, 11, 12, 14, 15, 16, 17];
export const DEFAULT_FIXED_HOURS_SATURDAY = [9, 10, 11, 12, 13, 14, 15, 16];

export const CONDOMINIUM_SCHEDULE_DAYS: Record<string, number> = {
  'Vitta Parque': 3, // Quarta-feira
  'Max Haus': 4,     // Quinta-feira
  'Paseo': 5,        // Sexta-feira
};

/**
 * Gera a lista padrão inicial de configurações de slots
 */
export function getDefaultConfigs(): ScheduleSlotConfig[] {
  const defaults: ScheduleSlotConfig[] = [];

  // Pet Móvel: 8h às 15h, 1 vaga única por horário
  const condos = [
    { name: 'Vitta Parque', day: 3 },
    { name: 'Max Haus', day: 4 },
    { name: 'Paseo', day: 5 },
  ];

  for (const condo of condos) {
    for (const hour of DEFAULT_PET_MOVEL_HOURS) {
      defaults.push({
        category: 'pet_movel',
        condominium: condo.name,
        day_of_week: condo.day,
        hour,
        capacity: 1,
        is_active: true,
      });
    }
  }

  // Banho & Tosa Fixo: Terça (2) a Sexta (5)
  for (let d = 2; d <= 5; d++) {
    for (const hour of DEFAULT_FIXED_HOURS_WEEKDAY) {
      defaults.push({
        category: 'fixed',
        condominium: null,
        day_of_week: d,
        hour,
        capacity: 1,
        is_active: true,
      });
    }
  }

  // Banho & Tosa Fixo: Sábado (6)
  for (const hour of DEFAULT_FIXED_HOURS_SATURDAY) {
    defaults.push({
      category: 'fixed',
      condominium: null,
      day_of_week: 6,
      hour,
      capacity: 1,
      is_active: true,
    });
  }

  return defaults;
}

// Cache em memória sincronizado
let memoryConfigs: ScheduleSlotConfig[] = (() => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[useScheduleSlots] Erro ao ler cache local de slots:', err);
  }
  return getDefaultConfigs();
})();

/**
 * Normaliza o nome do condomínio para lookup seguro
 */
function normalizeCondoName(name?: string | null): string {
  if (!name) return '';
  const n = name.trim().toLowerCase();
  if (n.includes('vitta')) return 'Vitta Parque';
  if (n.includes('max') || n.includes('haus')) return 'Max Haus';
  if (n.includes('paseo')) return 'Paseo';
  return name.trim();
}

/**
 * Consulta síncrona rápida de capacidade e status de um slot específico.
 * Usada por evaluateSlotAvailability e seletores de horário.
 */
export function getCachedSlotConfig(
  category: 'pet_movel' | 'fixed',
  condominium: string | undefined | null,
  dayOfWeek: number,
  hour: number
): { capacity: number; isActive: boolean; isCustom: boolean } {
  const normCondo = category === 'pet_movel' ? normalizeCondoName(condominium) : null;

  const found = memoryConfigs.find(c => {
    if (c.category !== category) return false;
    if (c.day_of_week !== dayOfWeek) return false;
    if (c.hour !== hour) return false;
    if (category === 'pet_movel') {
      return normalizeCondoName(c.condominium) === normCondo;
    }
    return true;
  });

  if (found) {
    return {
      capacity: Math.max(0, found.capacity ?? 1),
      isActive: found.is_active !== false && (found.capacity ?? 1) > 0,
      isCustom: true,
    };
  }

  // Padrão de fallback: 1 vaga se dentro dos horários normais
  let isWithinDefault = false;
  if (category === 'pet_movel') {
    isWithinDefault = DEFAULT_PET_MOVEL_HOURS.includes(hour);
  } else {
    isWithinDefault = dayOfWeek === 6 
      ? DEFAULT_FIXED_HOURS_SATURDAY.includes(hour)
      : DEFAULT_FIXED_HOURS_WEEKDAY.includes(hour);
  }

  return {
    capacity: isWithinDefault ? 1 : 0,
    isActive: isWithinDefault,
    isCustom: false,
  };
}

/**
 * Retorna todos os horários ativos para um dado dia/condomínio/categoria
 */
export function getActiveHoursForDay(
  category: 'pet_movel' | 'fixed',
  condominium: string | undefined | null,
  dayOfWeek: number
): number[] {
  const normCondo = category === 'pet_movel' ? normalizeCondoName(condominium) : null;
  const list = memoryConfigs.filter(c => {
    if (c.category !== category) return false;
    if (c.day_of_week !== dayOfWeek) return false;
    if (category === 'pet_movel') {
      return normalizeCondoName(c.condominium) === normCondo;
    }
    return true;
  });

  if (list.length > 0) {
    return list
      .filter(c => c.is_active && c.capacity > 0)
      .map(c => c.hour)
      .sort((a, b) => a - b);
  }

  // Fallback padrão
  if (category === 'pet_movel') {
    return [...DEFAULT_PET_MOVEL_HOURS];
  }
  return dayOfWeek === 6 ? [...DEFAULT_FIXED_HOURS_SATURDAY] : [...DEFAULT_FIXED_HOURS_WEEKDAY];
}

/**
 * Hook React para gerenciamento e interface administrativa dos horários
 */
export function useScheduleSlots() {
  const [configs, setConfigs] = useState<ScheduleSlotConfig[]>(memoryConfigs);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Atualiza cache em memória e localStorage
  const updateLocalCache = (newConfigs: ScheduleSlotConfig[]) => {
    memoryConfigs = newConfigs;
    setConfigs(newConfigs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigs));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: newConfigs }));
    } catch (err) {
      console.warn('[useScheduleSlots] Erro ao salvar no localStorage:', err);
    }
  };

  // Carrega configurações do Supabase ou do localStorage
  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('schedule_slot_configs')
        .select('*')
        .order('category')
        .order('day_of_week')
        .order('hour');

      if (error) {
        // Se a tabela ainda não existe no Supabase (PGRST205), usa o armazenamento local
        if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          console.info('[useScheduleSlots] Tabela schedule_slot_configs ainda não criada no Supabase. Usando armazenamento local.');
          setIsSupabaseOnline(false);
        } else {
          console.warn('[useScheduleSlots] Aviso ao carregar do Supabase:', error.message);
          setIsSupabaseOnline(false);
        }
      } else if (data && data.length > 0) {
        setIsSupabaseOnline(true);
        updateLocalCache(data as ScheduleSlotConfig[]);
        setIsLoading(false);
        return;
      } else {
        // Tabela existe mas está vazia: tentar semear valores iniciais
        setIsSupabaseOnline(true);
      }
    } catch (err: any) {
      console.warn('[useScheduleSlots] Falha de rede ao consultar Supabase:', err);
      setIsSupabaseOnline(false);
    }

    // Se chegou aqui, mantém o cache local ou padrão
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          updateLocalCache(parsed);
          setIsLoading(false);
          return;
        }
      } catch (e) {}
    }

    // Inicializa com padrões
    const defaults = getDefaultConfigs();
    updateLocalCache(defaults);
    setIsLoading(false);
  }, []);

  // Salva lista completa no Supabase e no localStorage
  const saveAll = async (newConfigs: ScheduleSlotConfig[]): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    setErrorMessage(null);

    // Salva imediatamente em memória e localStorage para resposta instantânea
    updateLocalCache(newConfigs);

    try {
      // Tenta upsert no Supabase
      const payload = newConfigs.map(c => ({
        category: c.category,
        condominium: c.condominium || null,
        day_of_week: c.day_of_week,
        hour: c.hour,
        capacity: c.capacity,
        is_active: c.is_active,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('schedule_slot_configs')
        .upsert(payload, { onConflict: 'category,condominium,day_of_week,hour' });

      if (error) {
        console.warn('[useScheduleSlots] Supabase upsert falhou (usando armazenamento local):', error.message);
        setIsSupabaseOnline(false);
        setIsSyncing(false);
        return {
          success: true,
          message: 'Configurações Salvas com Sucesso',
        };
      }

      setIsSupabaseOnline(true);
      setIsSyncing(false);
      return {
        success: true,
        message: 'Configurações Salvas com Sucesso',
      };
    } catch (err: any) {
      console.warn('[useScheduleSlots] Erro de rede ao sincronizar Supabase:', err);
      setIsSupabaseOnline(false);
      setIsSyncing(false);
      return {
        success: true,
        message: 'Configurações Salvas com Sucesso',
      };
    }
  };

  // Atualiza um slot específico
  const updateSlot = (
    category: 'pet_movel' | 'fixed',
    condominium: string | null | undefined,
    dayOfWeek: number,
    hour: number,
    updates: Partial<ScheduleSlotConfig>
  ) => {
    const normCondo = category === 'pet_movel' ? normalizeCondoName(condominium) : null;
    const currentList = [...configs];
    const index = currentList.findIndex(c => {
      if (c.category !== category) return false;
      if (c.day_of_week !== dayOfWeek) return false;
      if (c.hour !== hour) return false;
      if (category === 'pet_movel') {
        return normalizeCondoName(c.condominium) === normCondo;
      }
      return true;
    });

    if (index >= 0) {
      currentList[index] = { ...currentList[index], ...updates };
    } else {
      currentList.push({
        category,
        condominium: normCondo,
        day_of_week: dayOfWeek,
        hour,
        capacity: 1,
        is_active: true,
        ...updates,
      });
    }

    updateLocalCache(currentList);
  };

  // Define capacidade para todos os horários de um condomínio ou dia
  const setDaySlotsCapacity = (
    category: 'pet_movel' | 'fixed',
    condominium: string | null | undefined,
    dayOfWeek: number,
    capacity: number,
    hoursRange?: number[]
  ) => {
    const hours = hoursRange || (category === 'pet_movel' 
      ? DEFAULT_PET_MOVEL_HOURS 
      : (dayOfWeek === 6 ? DEFAULT_FIXED_HOURS_SATURDAY : DEFAULT_FIXED_HOURS_WEEKDAY));

    const normCondo = category === 'pet_movel' ? normalizeCondoName(condominium) : null;
    let currentList = [...configs];

    for (const h of hours) {
      const idx = currentList.findIndex(c => {
        if (c.category !== category) return false;
        if (c.day_of_week !== dayOfWeek) return false;
        if (c.hour !== h) return false;
        if (category === 'pet_movel') {
          return normalizeCondoName(c.condominium) === normCondo;
        }
        return true;
      });

      if (idx >= 0) {
        currentList[idx] = {
          ...currentList[idx],
          capacity,
          is_active: capacity > 0,
        };
      } else {
        currentList.push({
          category,
          condominium: normCondo,
          day_of_week: dayOfWeek,
          hour: h,
          capacity,
          is_active: capacity > 0,
        });
      }
    }

    updateLocalCache(currentList);
  };

  // Restaura padrões de fábrica (Pet Móvel 8h-15h 1 vaga; Fixo 10h-17h/9h-16h 1 vaga)
  const resetToDefaults = async () => {
    const defaults = getDefaultConfigs();
    return await saveAll(defaults);
  };

  // Escuta atualizações de outras abas ou componentes
  useEffect(() => {
    fetchConfigs();

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ScheduleSlotConfig[]>;
      if (customEvent.detail) {
        setConfigs(customEvent.detail);
      }
    };

    window.addEventListener(UPDATE_EVENT, handleCustomEvent);
    return () => {
      window.removeEventListener(UPDATE_EVENT, handleCustomEvent);
    };
  }, [fetchConfigs]);

  return {
    configs,
    isLoading,
    isSyncing,
    isSupabaseOnline,
    errorMessage,
    fetchConfigs,
    saveAll,
    updateSlot,
    setDaySlotsCapacity,
    resetToDefaults,
  };
}
