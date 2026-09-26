import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabaseClient';

// Declaracao global do lottie-web (bodymovin) carregado via CDN
declare global {
  interface Window {
    lottie: any;
  }
}

// Wrapper de imagem local (fallback para emoji em caso de erro)
const SafeImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ src, alt, ...rest }) => {
  const [hasError, setHasError] = useState(false);
  if (!src || hasError) return null;
  return <img src={src} alt={alt} onError={() => setHasError(true)} {...rest} />;
};

// Cache em memoria dos agendamentos por chave de semana (evita refetch ao reabrir)
const weeklyCache = new Map<string, any[]>();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto
const cacheTimestamps = new Map<string, number>();

interface WeeklyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WeeklyAppointment {
  id: string;
  pet_name: string;
  owner_name: string;
  appointment_time: string;
  service: string;
  status: string;
  type: 'Banho & Tosa' | 'Pet Móvel';
  monthly_client_id?: string;
  pet_photo_url?: string | null;
}

// Formata nomes: primeira letra de cada palavra em maiuscula
const formatName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getSaoPauloDateString = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(now);
  };

const PetWeeklyAvatar: React.FC<{ src?: string | null; name: string; isBanho: boolean }> = ({ src, name, isBanho }) => {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        className="w-11 h-11 rounded-full object-cover border border-pink-100 shadow-sm shrink-0"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  const fallbackSrc = isBanho 
    ? "https://cdn-icons-png.flaticon.com/512/14969/14969909.png" 
    : "https://cdn-icons-png.flaticon.com/512/10754/10754045.png";

  return (
    <img
      src={fallbackSrc}
      alt={isBanho ? "Banho & Tosa" : "Pet Móvel"}
      className="w-11 h-11 rounded-full object-cover border border-pink-100 shadow-sm shrink-0 bg-pink-50/30"
      referrerPolicy="no-referrer"
    />
  );
};

  const WeeklyScheduleModal: React.FC<WeeklyScheduleModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<WeeklyAppointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'banho_tosa' | 'pet_movel'>('all');

  // Calculate current week's Sunday to Saturday dates
  const weekDays = useMemo(() => {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);

    const weekdayNames = [
      'Domingo',
      'Segunda',
      'Terca',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sabado'
    ];

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(sunday);
      currentDay.setDate(sunday.getDate() + i);
      days.push({
        name: weekdayNames[i],
        date: currentDay,
        formattedDate: currentDay.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        isoDateStr: currentDay.toISOString().split('T')[0] // YYYY-MM-DD
      });
    }
    return days;
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchWeeklyData();
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const fetchWeeklyData = async () => {
    setIsLoading(true);
    const t0 = Date.now();
    // Chave de cache baseada na semana atual (YYYY-MM-DD do domingo)
    const cacheKey = `${weekDays[0].isoDateStr}_${weekDays[6].isoDateStr}`;

    // Verifica cache em memoria (TTL de 1 min) para evitar refetch ao reabrir
    const cachedAt = cacheTimestamps.get(cacheKey);
    const cached = weeklyCache.get(cacheKey);
    if (cached && cachedAt && (Date.now() - cachedAt) < CACHE_TTL_MS) {
      setAppointments(cached);
      // Mantem um pequeno delay para evitar flicker do spinner
      const elapsed = Date.now() - t0;
      setTimeout(() => setIsLoading(false), Math.max(0, 400 - elapsed));
      return;
    }

    try {
      const sunday = weekDays[0].date;
      const saturday = weekDays[6].date;

      const startStr = `${sunday.toISOString().split('T')[0]}T00:00:00`;
      const endStr = `${saturday.toISOString().split('T')[0]}T23:59:59`;

      // Fetch inactive monthly clients and photos in parallel
      const [
        inactiveClientsRes,
        monthlyClientsRes,
        daycareEnrollmentsRes,
        hotelRegistrationsRes,
        btRes,
        abRes,
        pmRes
      ] = await Promise.all([
        supabase.from('monthly_clients').select('id').eq('is_active', false),
        supabase.from('monthly_clients').select('id, pet_name, owner_name, pet_photo_url'),
        supabase.from('daycare_enrollments').select('pet_name, tutor_name, pet_photo_url'),
        supabase.from('hotel_registrations').select('pet_name, tutor_name, pet_photo_url'),
        supabase.from('appointments')
          .select('id, pet_name, owner_name, appointment_time, service, status, monthly_client_id')
          .gte('appointment_time', startStr)
          .lte('appointment_time', endStr)
          .in('status', ['AGENDADO', 'pending', 'CONCLUÍDO']),
        supabase.from('agendamento_banhotosa')
          .select('id, pet_name, owner_name, appointment_time, service, status, monthly_client_id')
          .gte('appointment_time', startStr)
          .lte('appointment_time', endStr)
          .in('status', ['AGENDADO', 'pending', 'CONCLUÍDO']),
        supabase.from('pet_movel_appointments')
          .select('id, pet_name, owner_name, appointment_time, service, status, monthly_client_id')
          .gte('appointment_time', startStr)
          .lte('appointment_time', endStr)
          .in('status', ['AGENDADO', 'pending', 'CONCLUÍDO'])
      ]);

      if (inactiveClientsRes.error) throw inactiveClientsRes.error;
      if (btRes.error) throw btRes.error;
      if (abRes.error) throw abRes.error;
      if (pmRes.error) throw pmRes.error;

      const inactiveSet = new Set((inactiveClientsRes.data || []).map(c => c.id));
      const nowTime = new Date().getTime();

      // Maps to associate photos
      const photoMapById = new Map<string, string>();
      const photoMapByNameAndTutor = new Map<string, string>();
      const photoMapByPetName = new Map<string, string>();

      const registerPhoto = (petName: string, tutorName: string, photoUrl: string) => {
        const pName = petName.toLowerCase().trim();
        const tName = tutorName.toLowerCase().trim();
        if (pName && tName) {
          const key = `${pName}_${tName}`;
          if (!photoMapByNameAndTutor.has(key)) {
            photoMapByNameAndTutor.set(key, photoUrl);
          }
        }
        if (pName && !photoMapByPetName.has(pName)) {
          photoMapByPetName.set(pName, photoUrl);
        }
      };

      if (monthlyClientsRes.data) {
        monthlyClientsRes.data.forEach(item => {
          if (item.pet_photo_url) {
            photoMapById.set(item.id, item.pet_photo_url);
            registerPhoto(item.pet_name, item.owner_name, item.pet_photo_url);
          }
        });
      }

      if (daycareEnrollmentsRes.data) {
        daycareEnrollmentsRes.data.forEach(item => {
          if (item.pet_photo_url) {
            registerPhoto(item.pet_name, item.tutor_name, item.pet_photo_url);
          }
        });
      }

      if (hotelRegistrationsRes.data) {
        hotelRegistrationsRes.data.forEach(item => {
          if (item.pet_photo_url) {
            registerPhoto(item.pet_name, item.tutor_name, item.pet_photo_url);
          }
        });
      }

      const getPetPhoto = (monthlyClientId?: string, petName?: string, ownerName?: string) => {
        if (monthlyClientId && photoMapById.has(monthlyClientId)) {
          return photoMapById.get(monthlyClientId) || null;
        }
        if (petName && ownerName) {
          const key = `${petName.toLowerCase().trim()}_${ownerName.toLowerCase().trim()}`;
          if (photoMapByNameAndTutor.has(key)) {
            return photoMapByNameAndTutor.get(key) || null;
          }
        }
        if (petName) {
          const petKey = petName.toLowerCase().trim();
          if (photoMapByPetName.has(petKey)) {
            return photoMapByPetName.get(petKey) || null;
          }
        }
        return null;
      };

      const btList: WeeklyAppointment[] = (btRes.data || []).map(apt => ({
        id: apt.id,
        pet_name: apt.pet_name,
        owner_name: apt.owner_name || '',
        appointment_time: apt.appointment_time,
        service: apt.service || 'Pet Móvel',
        status: apt.status,
        type: 'Pet Móvel',
        monthly_client_id: apt.monthly_client_id,
        pet_photo_url: getPetPhoto(apt.monthly_client_id, apt.pet_name, apt.owner_name)
      }));

      const abList: WeeklyAppointment[] = (abRes.data || []).map(apt => ({
        id: apt.id,
        pet_name: apt.pet_name,
        owner_name: apt.owner_name || '',
        appointment_time: apt.appointment_time,
        service: apt.service || 'Banho & Tosa',
        status: apt.status,
        type: 'Banho & Tosa',
        monthly_client_id: apt.monthly_client_id,
        pet_photo_url: getPetPhoto(apt.monthly_client_id, apt.pet_name, apt.owner_name)
      }));

      const pmList: WeeklyAppointment[] = (pmRes.data || []).map(apt => ({
        id: apt.id,
        pet_name: apt.pet_name,
        owner_name: apt.owner_name || '',
        appointment_time: apt.appointment_time,
        service: apt.service || 'Pet Móvel',
        status: apt.status,
        type: 'Pet Móvel',
        monthly_client_id: apt.monthly_client_id,
        pet_photo_url: getPetPhoto(apt.monthly_client_id, apt.pet_name, apt.owner_name)
      }));

      // Group, filter out future appointments of inactive monthly clients, and sort combined appointments
      const combined = [...btList, ...abList, ...pmList]
        .filter(apt => {
          if (apt.monthly_client_id && inactiveSet.has(apt.monthly_client_id)) {
            return new Date(apt.appointment_time).getTime() < nowTime;
          }
          return true;
        })
        .sort((a, b) => {
          return new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime();
        });

      setAppointments(combined);
      // Salva no cache em memoria para a mesma semana (evita refetch ao reabrir)
      weeklyCache.set(cacheKey, combined);
      cacheTimestamps.set(cacheKey, Date.now());
    } catch (err) {
      console.error('Erro ao buscar agenda semanal:', err);
    } finally {
      // Garante um minimo de 800ms de loading para evitar "flash" do spinner
      // (UX mais agradavel e evita flicker em loads rapidos)
      const elapsed = Date.now() - t0;
      const remaining = Math.max(0, 800 - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    }
  };

  // Filter and search appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Filter by type
      if (selectedFilter === 'banho_tosa' && apt.type !== 'Banho & Tosa') return false;
      if (selectedFilter === 'pet_movel' && apt.type !== 'Pet Móvel') return false;

      // Filter by search term
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const petMatches = apt.pet_name.toLowerCase().includes(query);
        const ownerMatches = apt.owner_name.toLowerCase().includes(query);
        return petMatches || ownerMatches;
      }

      return true;
    });
  }, [appointments, selectedFilter, searchTerm]);

  // Group appointments by day of the week
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, WeeklyAppointment[]> = {};
    weekDays.forEach(day => {
      groups[day.isoDateStr] = [];
    });

    filteredAppointments.forEach(apt => {
      const aptDateStr = apt.appointment_time.split('T')[0];
      if (groups[aptDateStr]) {
        groups[aptDateStr].push(apt);
      }
    });

    return groups;
  }, [filteredAppointments, weekDays]);

  if (!isOpen) return null;

  // Helper: cor para um servico
  const serviceStyles = (type: string) => {
    if (type === 'Banho & Tosa') {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    }
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
    };
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-[#fff0f5] overflow-y-auto animate-fadeIn flex flex-col"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col flex-1">

        {/* Header sticky */}
        <header className="sticky top-0 z-30 bg-[#fff0f5]/95 backdrop-blur-md pb-4 -mt-2 pt-2">
          <nav className="w-full flex items-center justify-between relative mb-3">
            <button
              onClick={onClose}
              aria-label="Voltar"
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-pink-100 flex items-center justify-center text-pink-700 hover:bg-pink-50 hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5 -ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              className="text-3xl sm:text-4xl font-bold text-pink-600 tracking-tight leading-tight whitespace-nowrap absolute left-1/2 -translate-x-1/2"
              style={{ fontFamily: '"Lobster Two", cursive' }}
            >
              Agenda Semanal
            </h1>
          </nav>
        </header>

        {/* Busca + filtros */}
        <section className="mt-5 mb-6 space-y-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-pink-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Busque pelo nome do Pet ou Tutor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-pink-100 rounded-2xl text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all shadow-sm"
              style={{ fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif' }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedFilter('all')}
              className={
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ' +
                (selectedFilter === 'all'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-200'
                  : 'bg-white text-pink-700 border-pink-100 hover:bg-pink-50')
              }
            >
              <span>Todos</span>
              <span className={'text-[10px] px-1.5 py-0.5 rounded-full ' + (selectedFilter === 'all' ? 'bg-white/20' : 'bg-pink-100')}>
                {appointments.length}
              </span>
            </button>
            <button
              onClick={() => setSelectedFilter('banho_tosa')}
              className={
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ' +
                (selectedFilter === 'banho_tosa'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50')
              }
            >
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Pet Fixo
            </button>
            <button
              onClick={() => setSelectedFilter('pet_movel')}
              className={
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ' +
                (selectedFilter === 'pet_movel'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                  : 'bg-white text-purple-700 border-purple-100 hover:bg-purple-50')
              }
            >
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Pet Móvel
            </button>
          </div>
        </section>

        {/* Tabela estilo planilha */}
        <section className="bg-white rounded-3xl border border-pink-100/70 shadow-sm overflow-hidden">
          {/* Header da tabela */}
          <div className="hidden sm:grid grid-cols-[80px_140px_90px_1fr_1fr_120px] gap-3 px-5 py-3.5 bg-pink-50/40 border-b border-pink-100/70 text-[10px] font-extrabold text-pink-800 uppercase tracking-[0.12em]">
            <div className="text-center">Data</div>
            <div>Dia</div>
            <div className="text-center">Horario</div>
            <div>Pet</div>
            <div>Tutor</div>
            <div className="text-center">Servico</div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-300 to-orange-200 rounded-full blur-2xl opacity-60 animate-pulse-slow scale-150"></div>
                <SafeImage
                  src="https://i.imgur.com/M3Gt3OA.png"
                  alt="Sandy's Pet Shop Logo"
                  className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-xl animate-pulse"
                  loading="eager"
                />
              </div>
              <p className="text-pink-700 font-bold text-sm">Carregando agendamentos...</p>
            </div>
          ) : (
            <div className="divide-y divide-pink-100/60">
              {weekDays.map((day) => {
                const dayAppointments = groupedAppointments[day.isoDateStr] || [];
                const isToday = getSaoPauloDateString() === day.isoDateStr;
                const filteredByDayType = dayAppointments.filter(a => {
                  if (selectedFilter === 'banho_tosa') return a.type === 'Banho & Tosa';
                  if (selectedFilter === 'pet_movel') return a.type === 'Pet Móvel';
                  return true;
                });

                return (
                  <div key={day.isoDateStr} className={isToday ? 'bg-pink-50/30' : ''}>
                    {/* Day header row */}
                    <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-pink-50/60 to-transparent border-y border-pink-100/50">
                      <div className="flex items-center gap-2">
                        <span className={'text-xs sm:text-sm font-extrabold tracking-tight ' + (isToday ? 'text-pink-700' : 'text-pink-900')}>
                          {day.name}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-pink-600 text-white animate-pulse">
                            Hoje
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                        <span>{day.formattedDate}</span>
                        <span className={'text-[10px] px-2 py-0.5 rounded-full font-extrabold ' + (filteredByDayType.length > 0 ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500')}>
                          {filteredByDayType.length} {filteredByDayType.length === 1 ? 'agendamento' : 'agendamentos'}
                        </span>
                      </div>
                    </div>

                    {filteredByDayType.length === 0 ? (
                      <div className="px-5 py-5 text-center text-gray-400 text-xs italic font-medium">
                        Nenhum agendamento para este dia
                      </div>
                    ) : (
                      filteredByDayType.map((apt) => {
                        const timeStr = new Date(apt.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
                        const s = serviceStyles(apt.type);
                        return (
                          <div
                            key={apt.id}
                            className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_140px_90px_1fr_1fr_120px] gap-2 sm:gap-3 px-3 sm:px-5 py-3 items-center hover:bg-pink-50/40 transition-colors"
                          >
                            <div className="sm:hidden col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {day.name} - {day.formattedDate}
                            </div>
                            <div className="hidden sm:flex items-center justify-center text-xs font-bold text-gray-700">
                              {day.formattedDate}
                            </div>
                            <div className="hidden sm:block text-xs font-bold text-gray-700 truncate">
                              {day.name}
                            </div>
                            <div className="text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-800 font-extrabold text-xs tabular-nums">
                                {timeStr}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <PetWeeklyAvatar src={apt.pet_photo_url} name={formatName(apt.pet_name)} isBanho={apt.type === 'Banho & Tosa'} />
                              <span className="text-sm font-bold text-pink-950 truncate">{formatName(apt.pet_name)}</span>
                            </div>
                            <div className="hidden sm:block text-sm text-gray-600 font-medium truncate">
                              {formatName(apt.owner_name) || 'Nao informado'}
                            </div>
                            <div className="hidden sm:flex items-center justify-center">
                              <span className={'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ' + s.bg + ' ' + s.text + ' ' + s.border}>
                                <span className={'w-1.5 h-1.5 rounded-full ' + s.dot}></span>
                                {apt.type === 'Banho & Tosa' ? 'Pet Fixo' : 'Pet Móvel'}
                              </span>
                            </div>
                            <div className="sm:hidden col-span-2 -mt-1">
                              <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ' + s.bg + ' ' + s.text + ' ' + s.border}>
                                <span className={'w-1.5 h-1.5 rounded-full ' + s.dot}></span>
                                {apt.type === 'Banho & Tosa' ? 'Pet Fixo' : 'Pet Móvel'}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">Tutor: <span className="font-semibold text-gray-700">{formatName(apt.owner_name) || 'Nao informado'}</span></span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && (
            <div className="px-5 py-3 bg-gray-50/50 border-t border-pink-100/60 text-[11px] text-gray-500 font-medium flex items-center justify-between">
              <span>
                Total: <span className="font-extrabold text-pink-700">{filteredAppointments.length}</span> agendamento(s)
              </span>
              <span className="hidden sm:inline">
                Atualizado em {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default WeeklyScheduleModal;
