import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    PhoneIcon,
    SparklesIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XMarkIcon,
    PauseIcon,
    PlayIcon
} from '@heroicons/react/24/outline';
import { MonthlyClient } from '../../types';
import { useServiceValidation } from '../hooks/useServiceValidation';
import { supabase } from '../../supabaseClient';
import {
    WORKING_HOURS,
    BATH_GROOMING_HOURS,
    MAX_CAPACITY_PER_SLOT,
    getPetMovelWorkingHours,
    isPetMovelHourDuplicated,
    matchesCondo
} from '../../constants';

// --- Helpers ---
const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1000;

function toSaoPauloUTC(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): Date {
    return new Date(Date.UTC(year, month, day, hour, minute, second) + SAO_PAULO_OFFSET_MS);
}

function parseISODateAsSaoPaulo(isoDate: string): Date {
    if (!isoDate) return new Date();
    const clean = isoDate.split('T')[0].trim();
    const [y, m, d] = clean.split('-').map(Number);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
    return toSaoPauloUTC(y, m - 1, d, 12, 0, 0);
}

function getSaoPauloTimeParts(date: Date | string | null | undefined) {
    if (!date) {
        const now = new Date();
        const spDate = new Date(now.getTime() - SAO_PAULO_OFFSET_MS);
        return {
            year: spDate.getUTCFullYear(),
            month: spDate.getUTCMonth(),
            date: spDate.getUTCDate(),
            hour: spDate.getUTCHours(),
            day: spDate.getUTCDay(),
        };
    }
    let d: Date;
    if (typeof date === 'string') {
        const trimmed = date.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            d = parseISODateAsSaoPaulo(trimmed);
        } else {
            d = new Date(trimmed);
        }
    } else {
        d = date;
    }
    const time = isNaN(d.getTime()) ? Date.now() : d.getTime();
    const spDate = new Date(time - SAO_PAULO_OFFSET_MS);
    return {
        year: spDate.getUTCFullYear(),
        month: spDate.getUTCMonth(),
        date: spDate.getUTCDate(),
        hour: spDate.getUTCHours(),
        day: spDate.getUTCDay(),
    };
}

const FALLBACK_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28">🐾</text></svg>';

const SafeImage: React.FC<{
    src: string;
    alt: string;
    className?: string;
    loading?: 'eager' | 'lazy';
    onClick?: (e: React.MouseEvent) => void;
}> = ({ src, alt, className, loading = 'lazy', onClick }) => {
    const [currentSrc, setCurrentSrc] = useState<string>(src);
    const [errored, setErrored] = useState<boolean>(false);
    return (
        <img
            src={currentSrc}
            alt={alt}
            className={className}
            loading={loading}
            decoding="async"
            referrerPolicy="no-referrer"
            onClick={onClick}
            onError={() => {
                if (!errored) {
                    setErrored(true);
                    setCurrentSrc(FALLBACK_IMG);
                }
            }}
        />
    );
};

const formatDateToBR = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return '-';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length > 10) {
        digits = digits.substring(2);
    }
    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
};

const getLastDayOfCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const targetDay = Math.min(30, lastDay);
    return new Date(year, month, targetDay);
};

const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getNextAppointmentDateText = (client: MonthlyClient, selectedDate: Date = new Date()) => {
    const now = new Date();
    // Se selectedDate for no passado, calculamos a partir do primeiro dia do mês selecionado.
    // Caso contrário, calculamos a partir de hoje.
    const isPastMonth = (selectedDate.getFullYear() < now.getFullYear()) || 
                        (selectedDate.getFullYear() === now.getFullYear() && selectedDate.getMonth() < now.getMonth());
    
    const baseDate = isPastMonth 
        ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const today = baseDate;

    let nextDate = new Date(today);

    if (client.recurrence_type === 'monthly') {
        const targetDay = client.recurrence_day;
        if (today.getDate() <= targetDay) {
            nextDate.setDate(targetDay);
        } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
            nextDate.setDate(targetDay);
        }
    } else {
        const targetDayOfWeek = client.recurrence_day;
        const currentJsDay = today.getDay() === 0 ? 7 : today.getDay();
        const targetJsDay = targetDayOfWeek;

        let daysToAdd = targetJsDay - currentJsDay;
        if (daysToAdd < 0) {
            daysToAdd += 7;
        }

        nextDate.setDate(today.getDate() + daysToAdd);
    }

    return formatDateToBR(nextDate);
};

const getNextAppointmentsList = (client: MonthlyClient, count: number = 8) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const list: string[] = [];

    let currentDate = new Date(today);

    // Initial setup similar to getNextAppointmentDateText
    if (client.recurrence_type === 'monthly') {
        const targetDay = client.recurrence_day;
        if (currentDate.getDate() > targetDay) {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        currentDate.setDate(targetDay);
    } else {
        const currentJsDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
        const targetJsDay = client.recurrence_day;
        let daysToAdd = targetJsDay - currentJsDay;
        if (daysToAdd < 0) daysToAdd += 7;
        currentDate.setDate(currentDate.getDate() + daysToAdd);
    }

    // Generate list
    for (let i = 0; i < count; i++) {
        list.push(formatDateToBR(new Date(currentDate)));

        // Increment for next loop
        if (client.recurrence_type === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (client.recurrence_type === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (client.recurrence_type === 'bi-weekly') {
            currentDate.setDate(currentDate.getDate() + 14);
        } else {
            break; // Unknown type
        }
    }

    return list;
};

// Mock function to check if appointment is completed - in a real app this would check against DB
const isAppointmentCompleted = (dateStr: string) => {
    // This is a placeholder. In a real scenario, we would need to fetch actual appointments 
    // for this client and check if there's a completed appointment on this date.
    // For now, we'll assume past dates are completed for visual demonstration if needed, 
    // or just return false as we don't have this data readily available in the client object yet.

    // Simple logic: if date is in the past, mark as completed? 
    // User asked: "se aquele agendamento daquela data já está marcado com concluído"
    // Since we don't have the appointments list here, we might need to update the parent component to pass this info.
    // However, to fulfill the request "visually" for now or based on a reasonable assumption:

    // Let's parse the dateStr (DD/MM/YYYY)
    const [day, month, year] = dateStr.split('/').map(Number);
    const appDate = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // If date is in the past, assume completed/done? 
    // Or strictly check if we have a status. 
    // Given the constraints, I'll add the visual element. 
    // Ideally, `client` object should have a list of `completed_appointments` or similar.

    return appDate < now;
};

// --- Componente: Card de Serviço Extra (Editável Inline) ---
const ExtraCard: React.FC<{
    label: string;
    icon: React.ReactNode;
    enabled: boolean;
    value: string | number;
    quantity?: number;
    onToggle: () => void;
    onValueChange: (val: string) => void;
    onQuantityChange?: (qty: string) => void;
}> = ({ label, icon, enabled, value, quantity, onToggle, onValueChange, onQuantityChange }) => {
    return (
        <div
            className={`
                relative p-3 rounded-xl border-2 transition-all duration-200 group
                ${enabled
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50'}
            `}
        >
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg shrink-0 ${enabled ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-400'} transition-colors`}>
                        {icon}
                    </div>
                    <h4 className={`font-bold text-xs truncate ${enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                        {label}
                    </h4>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 duration-300 ease-in-out shrink-0 ${enabled ? 'bg-purple-500' : 'bg-slate-300'}`}
                    aria-label={`Ativar ${label}`}
                >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${enabled ? 'translate-x-4' : ''}`} />
                </button>
            </div>

            <div
                className={`overflow-hidden transition-all duration-300 ${enabled ? 'max-h-20 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2">
                    {quantity !== undefined && onQuantityChange && (
                        <div className="flex items-center bg-white border border-purple-200 rounded-lg px-2 py-1 shadow-sm">
                            <span className="text-[9px] text-slate-400 font-bold mr-1">QTD</span>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => onQuantityChange(e.target.value)}
                                className="w-8 text-xs font-semibold text-slate-700 focus:outline-none text-center bg-transparent"
                            />
                        </div>
                    )}
                    <div className="flex items-center flex-1 bg-white border border-purple-200 rounded-lg px-2 py-1 shadow-sm">
                        <span className="text-[10px] text-slate-400 mr-1 font-bold">R$</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={value || ''}
                            onChange={(e) => onValueChange(e.target.value)}
                            className="w-full text-xs font-semibold text-slate-700 focus:outline-none bg-transparent"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Component ---

const MonthlyClientCard: React.FC<{
    client: MonthlyClient;
    selectedDate?: Date;
    onClick?: (client: MonthlyClient) => void;
    onEdit: (client: MonthlyClient) => void;
    onDelete: (client: MonthlyClient) => void;
    onAddExtraServices: (client: MonthlyClient) => void;
    onTogglePaymentStatus: (client: MonthlyClient, e: React.MouseEvent) => void;
    hasActiveHotel?: boolean;
    hasActiveDaycare?: boolean;
    onChangePhoto: (client: MonthlyClient) => void;
    onView: (client: MonthlyClient) => void;
    onEmitNFe?: (client: MonthlyClient) => void;
    isEmittingNFe?: boolean;
    fiscalNotesMap?: Record<string, string>;
    onStatusChanged?: () => void;
}> = ({ client, selectedDate, onClick, onEdit, onDelete, onAddExtraServices, onTogglePaymentStatus, onChangePhoto, onView, onEmitNFe, isEmittingNFe, fiscalNotesMap, onStatusChanged }) => {

    const getYearMonthString = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    };

    const getClientPaymentStatusForMonth = (client: any, monthStr: string): 'Pago' | 'Pendente' => {
        if (!client.payment_status) return 'Pendente';
        if (client.payment_status.startsWith('{')) {
            try {
                const history = JSON.parse(client.payment_status);
                return history[monthStr] || 'Pendente';
            } catch (e) {
                console.error("Error parsing payment history JSON:", e);
            }
        }
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        if (monthStr === currentMonthStr) {
            return client.payment_status === 'Pago' ? 'Pago' : 'Pendente';
        }
        return 'Pendente';
    };

    const monthStr = getYearMonthString(selectedDate || new Date());
    const isPaid = getClientPaymentStatusForMonth(client, monthStr) === 'Pago';

    const { hasDaycare, hasHotel } = useServiceValidation(client.whatsapp);

    const [upcomingAppointments, setUpcomingAppointments] = useState<{date: string, status: string, isPast: boolean}[]>([]);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
    const [completedBathsCount, setCompletedBathsCount] = useState<number>(0);
    const [totalBathsThisMonthCount, setTotalBathsThisMonthCount] = useState<number>(0);

    // Estados para o fluxo de confirmação e sucesso ao pausar mensalista
    const [showPauseConfirm, setShowPauseConfirm] = useState(false);
    const [showPauseSuccess, setShowPauseSuccess] = useState(false);
    const [isPausing, setIsPausing] = useState(false);

    const handlePause = async () => {
        setIsPausing(true);
        try {
            const { error } = await supabase.from('monthly_clients')
                .update({ is_active: false })
                .eq('id', client.id);
            if (error) throw error;
            setShowPauseConfirm(false);
            setShowPauseSuccess(true);
            onStatusChanged?.();
        } catch (err) {
            console.error('Failed to pause monthly client:', err);
        } finally {
            setIsPausing(false);
        }
    };

    // Estados para o fluxo de confirmação e sucesso ao reativar mensalista
    const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
    const [showReactivateSuccess, setShowReactivateSuccess] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false);

    const handleReactivate = async () => {
        setIsReactivating(true);
        try {
            const { error } = await supabase.from('monthly_clients')
                .update({ is_active: true })
                .eq('id', client.id);
            if (error) throw error;
            setShowReactivateConfirm(false);
            setShowReactivateSuccess(true);
            onStatusChanged?.();
        } catch (err) {
            console.error('Failed to reactivate monthly client:', err);
        } finally {
            setIsReactivating(false);
        }
    };

    useEffect(() => {
        if (!client.is_active) {
            setUpcomingAppointments([]);
            setCompletedBathsCount(0);
            setTotalBathsThisMonthCount(0);
            setIsLoadingAppointments(false);
            return;
        }
        let isMounted = true;
        const fetchAppointments = async () => {
            setIsLoadingAppointments(true);
            try {
                const now = new Date();
                const selDate = selectedDate || new Date();
                
                // Datas para buscar agendamentos concluídos do mês selecionado
                const y = selDate.getFullYear();
                const m = selDate.getMonth();
                const startOfMonth = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
                const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();
                const todayIso = new Date().toISOString();

                const [
                    apptsRes, petMovelRes, bathGroomRes, 
                    completedApptsRes, completedPetMovelRes, completedBathGroomRes,
                    futureApptsRes, futurePetMovelRes, futureBathGroomRes
                ] = await Promise.all([
                    supabase
                        .from('appointments')
                        .select('appointment_time, status')
                        .eq('monthly_client_id', client.id)
                        .gte('appointment_time', startOfMonth)
                        .lte('appointment_time', endOfMonth),
                    supabase
                        .from('pet_movel_appointments')
                        .select('appointment_time, status')
                        .eq('monthly_client_id', client.id)
                        .gte('appointment_time', startOfMonth)
                        .lte('appointment_time', endOfMonth),
                    supabase
                        .from('agendamento_banhotosa')
                        .select('appointment_time, status')
                        .eq('monthly_client_id', client.id)
                        .gte('appointment_time', startOfMonth)
                        .lte('appointment_time', endOfMonth),
                    supabase
                        .from('appointments')
                        .select('id')
                        .eq('monthly_client_id', client.id)
                        .eq('status', 'CONCLUÍDO')
                        .gte('appointment_time', startOfMonth)
                        .lte('appointment_time', endOfMonth),
                    supabase
                        .from('pet_movel_appointments')
                        .select('id')
                        .eq('monthly_client_id', client.id)
                        .eq('status', 'CONCLUÍDO')
                        .gte('appointment_time', startOfMonth)
                        .lte('appointment_time', endOfMonth),
                    supabase
                        .from('agendamento_banhotosa')
                        .select('id')
                        .eq('monthly_client_id', client.id)
                        .eq('status', 'CONCLUÍDO')
                        .gte('appointment_time', startOfMonth)
                        .lte('appointment_time', endOfMonth),
                    supabase
                        .from('appointments')
                        .select('appointment_time, status')
                        .eq('monthly_client_id', client.id)
                        .gte('appointment_time', todayIso)
                        .order('appointment_time', { ascending: true })
                        .limit(8),
                    supabase
                        .from('pet_movel_appointments')
                        .select('appointment_time, status')
                        .eq('monthly_client_id', client.id)
                        .gte('appointment_time', todayIso)
                        .order('appointment_time', { ascending: true })
                        .limit(8),
                    supabase
                        .from('agendamento_banhotosa')
                        .select('appointment_time, status')
                        .eq('monthly_client_id', client.id)
                        .gte('appointment_time', todayIso)
                        .order('appointment_time', { ascending: true })
                        .limit(8)
                ]);

                if (!isMounted) return;

                const completedCount = 
                    (completedApptsRes.data || []).length + 
                    (completedPetMovelRes.data || []).length + 
                    (completedBathGroomRes.data || []).length;
                setCompletedBathsCount(completedCount);

                // Calcular total de serviços no mês selecionado (concluídos ou agendados)
                const totalApptsThisMonth = [
                    ...(apptsRes.data || []),
                    ...(petMovelRes.data || []),
                    ...(bathGroomRes.data || [])
                ];

                const seenDatesForCount = new Set();
                let monthAppointmentsCount = 0;
                for (const appt of totalApptsThisMonth) {
                    const dateStr = formatDateToBR(new Date(appt.appointment_time));
                    if (!seenDatesForCount.has(dateStr)) {
                        seenDatesForCount.add(dateStr);
                        monthAppointmentsCount++;
                    }
                }
                setTotalBathsThisMonthCount(monthAppointmentsCount);

                const combined = [
                    ...(apptsRes.data || []),
                    ...(petMovelRes.data || []),
                    ...(bathGroomRes.data || []),
                    ...(futureApptsRes.data || []),
                    ...(futurePetMovelRes.data || []),
                    ...(futureBathGroomRes.data || [])
                ];

                combined.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());

                const formatted = combined.map(app => {
                    const d = new Date(app.appointment_time);
                    const isPast = d < now;
                    return {
                        date: formatDateToBR(d),
                        status: app.status,
                        isPast
                    };
                });

                // Deduplicate by date
                const uniqueDates: typeof formatted = [];
                const seen = new Set();
                for (const item of formatted) {
                    if (!seen.has(item.date)) {
                        seen.add(item.date);
                        uniqueDates.push(item);
                    }
                }

                setUpcomingAppointments(uniqueDates.slice(0, 8));
            } catch (err) {
                console.error("Error fetching appointments:", err);
            } finally {
                if (isMounted) setIsLoadingAppointments(false);
            }
        };

        fetchAppointments();

        return () => { isMounted = false; };
    }, [client.id, selectedDate]);

    // Estado do flip card (edição inline)
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [inlineMode, setInlineMode] = useState<'edit' | 'extras'>('edit');
    const [inlineForm, setInlineForm] = useState<MonthlyClient>(() => client);
    const [inlineSaving, setInlineSaving] = useState<boolean>(false);
    const [inlinePhotoFile, setInlinePhotoFile] = useState<File | null>(null);
    const [inlinePhotoPreview, setInlinePhotoPreview] = useState<string | null>(client.pet_photo_url || null);
    const inlinePhotoInputRef = React.useRef<HTMLInputElement>(null);

    // Estado dos serviços extras (espelha os campos do type MonthlyClient.extra_services + modal de extras)
    const [extras, setExtras] = useState(() => {
        const es: any = client.extra_services || {};
        return {
            // Gerais
            so_tosa: { enabled: !!es.so_tosa?.enabled, value: es.so_tosa?.value || '' },
            so_banho: { enabled: !!es.so_banho?.enabled, value: es.so_banho?.value || '' },
            hidratacao: { enabled: !!es.hidratacao?.enabled, value: es.hidratacao?.value || '' },
            botinha: { enabled: !!es.botinha?.enabled, value: es.botinha?.value || '' },
            contorno: { enabled: !!es.contorno?.enabled, value: es.contorno?.value || '' },
            pintura: { enabled: !!es.pintura?.enabled, value: es.pintura?.value || '' },
            patacure: { enabled: !!es.patacure?.enabled, value: es.patacure?.value || '' },
            tintura: { enabled: !!es.tintura?.enabled, value: es.tintura?.value || '' },
            penteado: { enabled: !!es.penteado?.enabled, value: es.penteado?.value || '' },
            desembolo: { enabled: !!es.desembolo?.enabled, value: es.desembolo?.value || '' },
            transporte: { enabled: !!es.transporte?.enabled, value: es.transporte?.value || '' },
            // Daycare
            adestrador: { enabled: !!es.adestrador?.enabled, value: es.adestrador?.value || '' },
            dias_extras: { enabled: !!es.dias_extras?.enabled, value: es.dias_extras?.value || '', quantity: es.dias_extras?.quantity || 1 },
            hora_extra: { enabled: !!es.hora_extra?.enabled, value: es.hora_extra?.value || '' },
            medicamento: { enabled: !!es.medicamento?.enabled, value: es.medicamento?.value || '' },
            pernoite: { enabled: !!es.pernoite?.enabled, value: es.pernoite?.value || '' },
            racao: { enabled: !!es.racao?.enabled, value: es.racao?.value || '' },
            veterinario: { enabled: !!es.veterinario?.enabled, value: es.veterinario?.value || '' },
        };
    });

    useEffect(() => {
        // Sempre que o client muda (re-fetch), reseta o form
        setInlineForm(client);
        setInlinePhotoPreview(client.pet_photo_url || null);
        setInlinePhotoFile(null);
        const es: any = client.extra_services || {};
        setExtras({
            so_tosa: { enabled: !!es.so_tosa?.enabled, value: es.so_tosa?.value || '' },
            so_banho: { enabled: !!es.so_banho?.enabled, value: es.so_banho?.value || '' },
            hidratacao: { enabled: !!es.hidratacao?.enabled, value: es.hidratacao?.value || '' },
            botinha: { enabled: !!es.botinha?.enabled, value: es.botinha?.value || '' },
            contorno: { enabled: !!es.contorno?.enabled, value: es.contorno?.value || '' },
            pintura: { enabled: !!es.pintura?.enabled, value: es.pintura?.value || '' },
            patacure: { enabled: !!es.patacure?.enabled, value: es.patacure?.value || '' },
            tintura: { enabled: !!es.tintura?.enabled, value: es.tintura?.value || '' },
            penteado: { enabled: !!es.penteado?.enabled, value: es.penteado?.value || '' },
            desembolo: { enabled: !!es.desembolo?.enabled, value: es.desembolo?.value || '' },
            transporte: { enabled: !!es.transporte?.enabled, value: es.transporte?.value || '' },
            adestrador: { enabled: !!es.adestrador?.enabled, value: es.adestrador?.value || '' },
            dias_extras: { enabled: !!es.dias_extras?.enabled, value: es.dias_extras?.value || '', quantity: es.dias_extras?.quantity || 1 },
            hora_extra: { enabled: !!es.hora_extra?.enabled, value: es.hora_extra?.value || '' },
            medicamento: { enabled: !!es.medicamento?.enabled, value: es.medicamento?.value || '' },
            pernoite: { enabled: !!es.pernoite?.enabled, value: es.pernoite?.value || '' },
            racao: { enabled: !!es.racao?.enabled, value: es.racao?.value || '' },
            veterinario: { enabled: !!es.veterinario?.enabled, value: es.veterinario?.value || '' },
        });
    }, [client.id, client.pet_photo_url, client.pet_name, client.pet_breed, client.owner_name, client.owner_address, client.owner_cpf, client.whatsapp, client.condominium, client.service, client.weight, client.recurrence_type, client.recurrence_day, client.recurrence_time, client.observation, client.payment_status, client.payment_due_date, client.price, client.extra_services]);

    const [existingMonthlyClients, setExistingMonthlyClients] = useState<any[]>([]);

    useEffect(() => {
        if (isFlipped && inlineMode === 'edit') {
            supabase
                .from('monthly_clients')
                .select('id, pet_name, condominium, recurrence_day, recurrence_time, is_active')
                .eq('is_active', true)
                .then(({ data, error }) => {
                    if (data && !error) {
                        setExistingMonthlyClients(data);
                    }
                });
        }
    }, [isFlipped, inlineMode]);

    const isFormPetMovel = React.useMemo(() => {
        const srv = `${inlineForm.service || ''} ${client.service || ''}`.toLowerCase();
        const cdo = `${inlineForm.condominium || ''} ${client.condominium || ''}`.toLowerCase();
        const obs = `${inlineForm.observation || ''} ${client.observation || ''}`.toLowerCase();
        if (srv.includes('móvel') || srv.includes('movel')) return true;
        if (cdo.includes('vitta') || cdo.includes('max') || cdo.includes('paseo')) return true;
        if (obs.includes('vitta') || obs.includes('max haus') || obs.includes('paseo')) return true;
        return false;
    }, [inlineForm.service, inlineForm.condominium, inlineForm.observation, client.service, client.condominium, client.observation]);

    const formEffectiveCondo = React.useMemo(() => {
        const rawCondo = (inlineForm.condominium || client.condominium || '').trim();
        if (rawCondo && rawCondo !== 'Nenhum Condomínio') return rawCondo;
        const obs = `${inlineForm.observation || ''} ${client.observation || ''}`.toLowerCase();
        if (obs.includes('paseo')) return 'Paseo';
        if (obs.includes('max haus')) return 'Max Haus';
        if (obs.includes('vitta')) return 'Vitta Parque';
        if (isFormPetMovel) {
            const d = Number(inlineForm.recurrence_day ?? client.recurrence_day);
            if (d === 3) return 'Vitta Parque';
            if (d === 4) return 'Max Haus';
            if (d === 5) return 'Paseo';
            return 'Pet Móvel';
        }
        return 'Banho & Tosa Fixo';
    }, [inlineForm.condominium, inlineForm.observation, inlineForm.recurrence_day, inlineForm.service, client, isFormPetMovel]);

    const formWorkingHours = React.useMemo(() => {
        if (isFormPetMovel) {
            return getPetMovelWorkingHours(Number(inlineForm.recurrence_day), formEffectiveCondo);
        }
        if (formEffectiveCondo === 'Banho & Tosa Fixo' || inlineForm.service?.includes('Fixo')) {
            return BATH_GROOMING_HOURS;
        }
        return WORKING_HOURS;
    }, [isFormPetMovel, inlineForm.recurrence_day, formEffectiveCondo, inlineForm.service]);

    const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'recurrence_day') {
            const numDay = Number(value);
            setInlineForm(prev => {
                const next = { ...prev, recurrence_day: numDay };
                if (isFormPetMovel) {
                    if (numDay === 3 && (!prev.condominium || !prev.condominium.toLowerCase().includes('vitta'))) {
                        next.condominium = 'Vitta Parque';
                    } else if (numDay === 4 && (!prev.condominium || !prev.condominium.toLowerCase().includes('max'))) {
                        next.condominium = 'Max Haus';
                    } else if (numDay === 5 && (!prev.condominium || !prev.condominium.toLowerCase().includes('paseo'))) {
                        next.condominium = 'Paseo';
                    }
                }
                return next;
            });
            return;
        }
        if (name === 'condominium') {
            setInlineForm(prev => {
                const next = { ...prev, condominium: value };
                const lower = value.toLowerCase();
                if (isFormPetMovel) {
                    if (lower.includes('vitta')) next.recurrence_day = 3;
                    else if (lower.includes('max')) next.recurrence_day = 4;
                    else if (lower.includes('paseo')) next.recurrence_day = 5;
                }
                return next;
            });
            return;
        }
        setInlineForm(prev => ({ ...prev, [name]: value }));
    };

    // Garantir que inlineForm.recurrence_time seja válido na grade ativa
    useEffect(() => {
        if (!isFlipped || inlineMode !== 'edit') return;
        if (formWorkingHours.length > 0 && inlineForm.recurrence_time !== undefined && inlineForm.recurrence_time !== null) {
            const currTime = Number(inlineForm.recurrence_time);
            if (!formWorkingHours.includes(currTime)) {
                const firstAvailable = formWorkingHours.find(h => {
                    const maxCap = 1;
                    const count = existingMonthlyClients.filter(mc =>
                        mc.id !== client.id &&
                        mc.is_active &&
                        Number(mc.recurrence_day) === Number(inlineForm.recurrence_day) &&
                        Number(mc.recurrence_time) === Number(h) &&
                        (!formEffectiveCondo || !mc.condominium || matchesCondo(mc.condominium, formEffectiveCondo))
                    ).length;
                    return count < maxCap;
                }) ?? formWorkingHours[0];

                if (firstAvailable !== undefined) {
                    setInlineForm(prev => ({ ...prev, recurrence_time: firstAvailable }));
                }
            }
        }
    }, [formWorkingHours, isFlipped, inlineMode]);

    const handleInlinePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setInlinePhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setInlinePhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // Helpers dos serviços extras
    const handleExtrasToggle = (key: keyof typeof extras) => {
        setExtras(prev => ({
            ...prev,
            [key]: { ...(prev[key] as any), enabled: !(prev[key] as any).enabled }
        }));
    };
    const handleExtrasValue = (key: keyof typeof extras, value: string) => {
        const safe = value.replace(',', '.').replace(/[^0-9.]/g, '');
        const parts = safe.split('.');
        const finalVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : safe;
        setExtras(prev => ({
            ...prev,
            [key]: { ...(prev[key] as any), value: finalVal }
        }));
    };
    const handleExtrasQuantity = (key: keyof typeof extras, qty: string) => {
        const n = Math.max(1, parseInt(qty) || 1);
        setExtras(prev => ({
            ...prev,
            [key]: { ...(prev[key] as any), quantity: n }
        }));
    };
    const extrasTotal = Object.values(extras).reduce((acc, item: any) => {
        if (!item.enabled) return acc;
        const v = parseFloat(item.value) || 0;
        const q = item.quantity || 1;
        return acc + v * q;
    }, 0);

    const handleInlineSave = async () => {
        setInlineSaving(true);
        try {
            let photoUrl = inlineForm.pet_photo_url || null;
            if (inlinePhotoFile) {
                const ext = inlinePhotoFile.name.split('.').pop() || 'jpg';
                const path = `monthly_clients/${client.id}/photo-${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage
                    .from('store_products')
                    .upload(path, inlinePhotoFile, { upsert: true, contentType: inlinePhotoFile.type });
                if (upErr) throw upErr;
                const { data: pub } = supabase.storage.from('store_products').getPublicUrl(path);
                photoUrl = pub.publicUrl;
            }

            const updatePayload: any = {
                pet_name: inlineForm.pet_name,
                pet_breed: inlineForm.pet_breed,
                owner_name: inlineForm.owner_name,
                owner_address: inlineForm.owner_address,
                owner_cpf: inlineForm.owner_cpf,
                whatsapp: inlineForm.whatsapp,
                condominium: inlineForm.condominium,
                service: inlineForm.service,
                weight: inlineForm.weight,
                recurrence_type: inlineForm.recurrence_type,
                recurrence_day: Number(inlineForm.recurrence_day) || 1,
                recurrence_time: Number(inlineForm.recurrence_time) || 9,
                observation: inlineForm.observation,
                payment_status: inlineForm.payment_status,
                payment_due_date: inlineForm.payment_due_date,
                price: Number(inlineForm.price) || 0,
                pet_photo_url: photoUrl,
            };

            const { error } = await supabase.from('monthly_clients').update(updatePayload).eq('id', client.id);
            if (error) throw error;

            // Atualiza em massa os agendamentos futuros
            const today = new Date().toISOString();
            const unitPriceUpdate = (() => {
                const total = Number(inlineForm.price || 0);
                if (inlineForm.recurrence_type === 'weekly') return total / 4;
                if (inlineForm.recurrence_type === 'bi-weekly') return total / 2;
                return total;
            })();

            const commonPayload = {
                pet_name: inlineForm.pet_name,
                owner_name: inlineForm.owner_name,
                whatsapp: inlineForm.whatsapp,
                owner_cpf: inlineForm.owner_cpf ? inlineForm.owner_cpf.replace(/\D/g, '') : null,
                pet_breed: inlineForm.pet_breed,
                owner_address: inlineForm.owner_address,
                service: inlineForm.service,
                weight: inlineForm.weight,
                price: unitPriceUpdate,
                condominium: inlineForm.condominium,
                observation: inlineForm.observation
            };

            const targetHour = inlineForm.recurrence_time !== undefined && inlineForm.recurrence_time !== null
                ? Number(typeof inlineForm.recurrence_time === 'string' ? inlineForm.recurrence_time.split(':')[0] : inlineForm.recurrence_time)
                : null;

            const tables: ('appointments' | 'pet_movel_appointments' | 'agendamento_banhotosa')[] = 
                ['appointments', 'pet_movel_appointments', 'agendamento_banhotosa'];

            for (const table of tables) {
                const { data: futureAppts } = await supabase
                    .from(table)
                    .select('id, appointment_time, status')
                    .eq('monthly_client_id', client.id)
                    .gte('appointment_time', today);

                if (futureAppts && futureAppts.length > 0) {
                    for (const appt of futureAppts) {
                        if (appt.status === 'CONCLUÍDO') {
                            await supabase.from(table).update(commonPayload).eq('id', appt.id);
                            continue;
                        }

                        const currentApptDate = new Date(appt.appointment_time);
                        const spParts = getSaoPauloTimeParts(currentApptDate);
                        let year = spParts.year;
                        let month = spParts.month;
                        let date = spParts.date;

                        if (inlineForm.recurrence_type !== 'monthly' && inlineForm.recurrence_day) {
                            const targetDayOfWeek = Number(inlineForm.recurrence_day);
                            const currentDayOfWeek = spParts.day === 0 ? 7 : spParts.day;
                            const diffDays = targetDayOfWeek - currentDayOfWeek;
                            if (diffDays !== 0) {
                                const tempDate = new Date(Date.UTC(year, month, date));
                                tempDate.setUTCDate(tempDate.getUTCDate() + diffDays);
                                year = tempDate.getUTCFullYear();
                                month = tempDate.getUTCMonth();
                                date = tempDate.getUTCDate();
                            }
                        }

                        const hourToUse = targetHour !== null && !isNaN(targetHour) ? targetHour : spParts.hour;
                        const newAppointmentTime = toSaoPauloUTC(year, month, date, hourToUse).toISOString();

                        await supabase
                            .from(table)
                            .update({
                                ...commonPayload,
                                appointment_time: newAppointmentTime
                            })
                            .eq('id', appt.id);
                    }
                }
            }

            onStatusChanged?.();
            setIsFlipped(false);
        } catch (err) {
            console.error('Erro ao salvar edição inline:', err);
            alert('Erro ao salvar alterações. Tente novamente.');
        } finally {
            setInlineSaving(false);
        }
    };

    const handleExtrasSave = async () => {
        setInlineSaving(true);
        try {
            // Normaliza os extras: enabled false → mantém value, mas remove flag
            const payload: any = {};
            (Object.keys(extras) as (keyof typeof extras)[]).forEach(k => {
                const item: any = (extras as any)[k];
                payload[k] = {
                    enabled: !!item.enabled,
                    value: item.value || 0,
                    ...(k === 'dias_extras' ? { quantity: item.quantity || 1 } : {})
                };
            });

            const { error } = await supabase
                .from('monthly_clients')
                .update({ extra_services: payload })
                .eq('id', client.id);
            if (error) throw error;

            onStatusChanged?.();
            setIsFlipped(false);
            setInlineMode('edit');
        } catch (err) {
            console.error('Erro ao salvar extras:', err);
            alert('Erro ao salvar serviços extras. Tente novamente.');
        } finally {
            setInlineSaving(false);
        }
    };

    const handleFlipBack = () => {
        // Resetar o form para os valores atuais do client
        setInlineForm(client);
        setInlinePhotoPreview(client.pet_photo_url || null);
        setInlinePhotoFile(null);
        const es: any = client.extra_services || {};
        setExtras({
            so_tosa: { enabled: !!es.so_tosa?.enabled, value: es.so_tosa?.value || '' },
            so_banho: { enabled: !!es.so_banho?.enabled, value: es.so_banho?.value || '' },
            hidratacao: { enabled: !!es.hidratacao?.enabled, value: es.hidratacao?.value || '' },
            botinha: { enabled: !!es.botinha?.enabled, value: es.botinha?.value || '' },
            contorno: { enabled: !!es.contorno?.enabled, value: es.contorno?.value || '' },
            pintura: { enabled: !!es.pintura?.enabled, value: es.pintura?.value || '' },
            patacure: { enabled: !!es.patacure?.enabled, value: es.patacure?.value || '' },
            tintura: { enabled: !!es.tintura?.enabled, value: es.tintura?.value || '' },
            penteado: { enabled: !!es.penteado?.enabled, value: es.penteado?.value || '' },
            desembolo: { enabled: !!es.desembolo?.enabled, value: es.desembolo?.value || '' },
            transporte: { enabled: !!es.transporte?.enabled, value: es.transporte?.value || '' },
            adestrador: { enabled: !!es.adestrador?.enabled, value: es.adestrador?.value || '' },
            dias_extras: { enabled: !!es.dias_extras?.enabled, value: es.dias_extras?.value || '', quantity: es.dias_extras?.quantity || 1 },
            hora_extra: { enabled: !!es.hora_extra?.enabled, value: es.hora_extra?.value || '' },
            medicamento: { enabled: !!es.medicamento?.enabled, value: es.medicamento?.value || '' },
            pernoite: { enabled: !!es.pernoite?.enabled, value: es.pernoite?.value || '' },
            racao: { enabled: !!es.racao?.enabled, value: es.racao?.value || '' },
            veterinario: { enabled: !!es.veterinario?.enabled, value: es.veterinario?.value || '' },
        });
        setInlineMode('edit');
        setIsFlipped(false);
    };

    const nextAppointmentText = isLoadingAppointments 
        ? '...' 
        : upcomingAppointments.length > 0 
            ? (() => {
                const now = new Date();
                now.setHours(0,0,0,0);
                const futureAppts = upcomingAppointments.filter(app => {
                    const [d, m, y] = app.date.split('/').map(Number);
                    const appDate = new Date(y, m - 1, d);
                    return appDate >= now;
                });
                if (futureAppts.length > 0) return futureAppts[0].date;
                return client.is_active ? getNextAppointmentDateText(client, selectedDate) : 'Pausado';
              })()
            : client.is_active 
                ? getNextAppointmentDateText(client, selectedDate)
                : 'Pausado';

    const getRecurrenceText = (client: MonthlyClient) => {
        if (client.recurrence_type === 'weekly') return 'Semanal';
        if (client.recurrence_type === 'bi-weekly') return 'Quinzenal';
        if (client.recurrence_type === 'monthly') return 'Mensal';
        return 'Não definido';
    };

    const renderRecurrenceBadge = (client: MonthlyClient) => {
        const text = getRecurrenceText(client);

        if (!client.is_active) {
            return (
                <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 leading-none whitespace-nowrap shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="truncate">{text}</span>
                </span>
            );
        }

        switch (client.recurrence_type) {
            case 'weekly':
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200/90 leading-none whitespace-nowrap shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-600 shadow-[0_0_6px_rgba(124,58,237,0.6)] animate-pulse shrink-0" />
                        <span className="truncate">{text}</span>
                    </span>
                );
            case 'bi-weekly':
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 leading-none whitespace-nowrap shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse shrink-0" />
                        <span className="truncate">{text}</span>
                    </span>
                );
            case 'monthly':
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/90 leading-none whitespace-nowrap shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)] animate-pulse shrink-0" />
                        <span className="truncate">{text}</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 leading-none whitespace-nowrap shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="truncate">{text}</span>
                    </span>
                );
        }
    };

    const calculateExtrasTotal = (extraServices: any) => {
        if (!extraServices || typeof extraServices !== 'object') return 0;
        let total = 0;
        Object.entries(extraServices).forEach(([key, service]: [string, any]) => {
            if (service && service.enabled) {
                if (key === 'dias_extras' && service.quantity) {
                    total += (Number(service.value) || 0) * Number(service.quantity);
                } else {
                    total += Number(service.value) || 0;
                }
            }
        });
        return total;
    };

    const calculateTotalInvoiceValue = (client: MonthlyClient) => {
        const basePrice = Number(client.price || 0);
        const extrasTotal = calculateExtrasTotal(client.extra_services);
        return basePrice + extrasTotal;
    };

    const totalInvoiceValue = calculateTotalInvoiceValue(client);
    const hasMonthlyExtras = Boolean(
        client.extra_services && Object.entries(client.extra_services).some(([key, s]: [string, any]) =>
            s.enabled
        )
    );

    const weekDaysLabel: Record<number, string> = { 1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado', 7: 'Domingo' };
    const recurrenceDayLabel = client.recurrence_type === 'monthly' ? `Dia ${client.recurrence_day}` : (weekDaysLabel[client.recurrence_day] || String(client.recurrence_day));
    const recurrenceTimeLabel = `${String(client.recurrence_time).padStart(2, '0')}:00`;

    // Logic for Condominium Label
    const getEffectiveCondo = (client: MonthlyClient): string => {
        if (client.condominium && client.condominium !== 'Nenhum Condomínio' && client.condominium.trim() !== '') {
            return client.condominium.trim();
        }
        const obs = (client.observation || '').toLowerCase();
        if (obs.includes('paseo')) return 'Paseo';
        if (obs.includes('max haus')) return 'Max Haus';
        if (obs.includes('vitta')) return 'Vitta Parque';
        const srv = (client.service || '').toLowerCase();
        if (srv.includes('móvel') || srv.includes('movel')) {
            return 'Pet Móvel';
        }
        return 'Banho & Tosa Fixo';
    };

    const effectiveCondo = getEffectiveCondo(client);

    const getCondoLabel = () => effectiveCondo;

    return (
        <>
            <div
                className="relative w-full"
                style={{ perspective: '1200px' }}
            >
                <div
                    className="relative w-full"
                    style={{
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                >
                    {/* FRONT FACE */}
                    <div
                        className="group relative bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 transform hover:-translate-y-0.5 border border-slate-100 overflow-hidden flex flex-col font-jakarta pt-1 pb-5 px-4 sm:px-5"
                        onClick={() => { if (!isFlipped && onClick) onClick(client); }}
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-600 rounded-t-[2rem]" />

            {/* HEADER */}
            <header className="mt-3.5 mb-3 flex flex-col gap-2.5">
                {/* Top Row: Avatar + Pet & Tutor | Total Fixo & Status */}
                <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0 w-14 h-14">
                            <div
                                className="w-14 h-14 rounded-full ring-2 ring-pink-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                                onClick={(e) => { e.stopPropagation(); onChangePhoto(client); }}
                            >
                                {client.pet_photo_url ? (
                                    <SafeImage src={client.pet_photo_url} alt={client.pet_name} className="w-14 h-14 rounded-full object-cover" />
                                ) : (
                                    <span className="text-2xl">🐶</span>
                                )}
                            </div>
                            {client.is_active && (
                                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-extrabold ring-2 ring-white shadow leading-none" title={`${completedBathsCount} serviço(s) concluído(s) no mês`}>
                                    {completedBathsCount}
                                </span>
                            )}
                            {(hasDaycare || hasHotel) && (
                                <div className="absolute -top-1 -left-1 flex gap-0.5">
                                    {hasHotel && <span className="bg-blue-100 text-blue-600 p-0.5 rounded-full border border-white text-[8px]" title="Hotel">🏨</span>}
                                    {hasDaycare && <span className="bg-yellow-100 text-yellow-600 p-0.5 rounded-full border border-white text-[8px]" title="Creche">🏠</span>}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-800 leading-tight truncate group-hover:text-pink-600 transition-colors">
                                    {toTitleCase(client.pet_name)}
                                </h3>
                                {!client.is_active && (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 shrink-0">
                                        Pausado
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5 flex items-center gap-1.5">
                                <img src="https://cdn-icons-png.flaticon.com/512/14365/14365544.png" alt="Tutor" className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                <span className="font-semibold text-slate-700 truncate">{toTitleCase(client.owner_name)}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-1">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">TOTAL FIXO</span>
                        <div className="mt-1 flex items-baseline gap-0.5 leading-none">
                            <span className="text-xs font-semibold text-slate-500">R$</span>
                            <span className="text-xl font-black text-slate-900 tracking-tight">
                                {Math.floor(totalInvoiceValue)}
                                <span className="text-xs font-bold">,{((totalInvoiceValue % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onTogglePaymentStatus(client, e); }}
                            className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-all shadow-xs ${
                                isPaid 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
                            }`}
                            title={isPaid ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                            {isPaid ? (
                                <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Pago</>
                            ) : (
                                <><ClockIcon className="w-3 h-3 text-amber-500 shrink-0" />Pendente</>
                            )}
                        </button>
                        <span className="text-[9px] font-semibold text-slate-400 mt-1 leading-none tracking-tight">Venc: {formatDateToBR(getLastDayOfCurrentMonth())}</span>
                    </div>
                </div>

                {/* Badges Row: Full width chips bar */}
                <div className="flex items-center gap-1 sm:gap-2 flex-nowrap overflow-hidden pt-2 border-t border-slate-100/90">
                    {/* Recurrence Badge (Semanal / Quinzenal / Mensal) */}
                    {renderRecurrenceBadge(client)}

                    {/* Service Badge */}
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200/80 leading-none whitespace-nowrap shadow-xs">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-pink-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="truncate">{client.service || 'Banho & Tosa'}</span>
                    </span>

                    {/* Condomínio Badge - Always shown for Pet Móvel & clients with condo! */}
                    {effectiveCondo && (
                        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 leading-none whitespace-nowrap shadow-xs" title={`Condomínio: ${effectiveCondo}`}>
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="truncate">{effectiveCondo}</span>
                        </span>
                    )}
                </div>
            </header>

            {/* INFO CARDS (2x2 Grid) */}
            <section className="bg-slate-50/70 rounded-2xl p-2.5 sm:p-3 border border-slate-100/90 mb-3">
                <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp */}
                    {client.whatsapp ? (
                        <a
                            href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 min-w-0 p-2 rounded-xl bg-white border border-slate-100/80 shadow-2xs hover:border-emerald-200 hover:shadow-xs transition-all group/wa"
                            title="Abrir WhatsApp"
                        >
                            <div className="w-7 h-7 flex items-center justify-center shrink-0">
                                <img src="https://cdn-icons-png.flaticon.com/512/1944/1944502.png" alt="WhatsApp" className="w-5 h-5 object-contain opacity-80 group-hover/wa:opacity-100 group-hover/wa:scale-110 transition-all" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">WHATSAPP</p>
                                <p className="text-[11px] font-bold text-emerald-700 mt-0.5 tracking-tight leading-none whitespace-nowrap truncate">
                                    {formatPhoneNumber(client.whatsapp)}
                                </p>
                            </div>
                        </a>
                    ) : (
                        <div className="flex items-center gap-2 min-w-0 p-2 rounded-xl bg-white border border-slate-100/80 shadow-2xs">
                            <div className="w-7 h-7 flex items-center justify-center shrink-0 grayscale opacity-50">
                                <img src="https://cdn-icons-png.flaticon.com/512/1944/1944502.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">WHATSAPP</p>
                                <p className="text-[11px] font-medium text-slate-400 mt-0.5 leading-none">-</p>
                            </div>
                        </div>
                    )}

                    {/* Condomínio / Local */}
                    <div className="flex items-center gap-2 min-w-0 p-2 rounded-xl bg-white border border-slate-100/80 shadow-2xs">
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <img src="https://cdn-icons-png.flaticon.com/512/5792/5792154.png" alt="Condomínio" className="w-5 h-5 object-contain opacity-80" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">CONDOMÍNIO</p>
                            <p className="text-[11px] font-bold text-slate-800 mt-0.5 leading-tight truncate" title={effectiveCondo}>
                                {effectiveCondo}
                            </p>
                        </div>
                    </div>

                    {/* Dia & Horário Fixo */}
                    <div className="flex items-center gap-2 min-w-0 p-2 rounded-xl bg-white border border-slate-100/80 shadow-2xs">
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <img src="https://cdn-icons-png.flaticon.com/512/2838/2838794.png" alt="Dia e Horário" className="w-5 h-5 object-contain opacity-80" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">DIA & HORÁRIO</p>
                            <p className="text-[11px] font-bold text-slate-800 mt-0.5 leading-tight truncate">
                                {recurrenceDayLabel}, {recurrenceTimeLabel}
                            </p>
                        </div>
                    </div>

                    {/* Próximo Agendamento */}
                    <div className="flex items-center gap-2 min-w-0 p-2 rounded-xl bg-white border border-slate-100/80 shadow-2xs">
                        <div className="w-7 h-7 flex items-center justify-center shrink-0">
                            <img src="https://cdn-icons-png.flaticon.com/512/17370/17370918.png" alt="Próx. Agendamento" className="w-5 h-5 object-contain opacity-80" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase leading-none">PRÓX. AGEND.</p>
                            <p className="text-[11px] font-extrabold text-pink-600 mt-0.5 leading-tight truncate">
                                {nextAppointmentText}
                            </p>
                        </div>
                    </div>
                </div>
            </section>



            {/* OBSERVATION + EXTRAS */}
            {(client.observation || hasMonthlyExtras) && (
                <div className="space-y-2 mb-3">
                    {client.observation && (
                        <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-2.5 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs h-[88px]">
                            <div className="w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                                <img src="https://cdn-icons-png.flaticon.com/512/3756/3756712.png" alt="Observação" className="w-5 h-5 object-contain opacity-80" />
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scroll h-full pr-1">
                                <p className="font-medium italic leading-snug tracking-tight text-amber-900 whitespace-pre-wrap">
                                    "{client.observation}"
                                </p>
                            </div>
                        </div>
                    )}
                    {hasMonthlyExtras && (
                        <div className="flex flex-col gap-1.5">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide pl-1">Extras Adicionados</p>
                            <div className="flex flex-wrap gap-1.5">
                                {client.extra_services && Object.entries(client.extra_services).map(([key, value]: [string, any]) => {
                                    if (!value.enabled) return null;
                                    const label = key.replace(/_/g, ' ').replace('so ', '');
                                    return (
                                        <span key={key} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                                            <SparklesIcon className="w-3 h-3" />{label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* APPOINTMENTS TIMELINE */}
            <section className="bg-pink-50/30 border border-pink-100/80 rounded-2xl p-3.5 mb-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-pink-500" />
                    <h2 className="text-[11px] font-extrabold text-pink-600 tracking-wider uppercase">PRÓXIMOS AGENDAMENTOS</h2>
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scroll pr-1">
                    {!client.is_active ? (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <span className="text-2xl mb-1">⏸️</span>
                            <p className="text-[11px] font-bold text-amber-600">Mensalista Pausado</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Agendamentos futuros ocultados.</p>
                        </div>
                    ) : isLoadingAppointments ? (
                        <div className="flex items-center justify-center py-4 text-xs text-pink-400 font-medium">Buscando agendamentos...</div>
                    ) : upcomingAppointments.length > 0 ? (
                        upcomingAppointments.map((app, idx) => {
                            const isCompleted = app.status === 'CONCLUÍDO' || app.isPast;
                            return (
                                <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-pink-50 shadow-sm">
                                    <span className="text-xs font-bold text-pink-700 tracking-tight">{app.date}</span>
                                    {isCompleted ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                            CONCLUÍDO<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Agendado</span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <span className="text-xl mb-1">📅</span>
                            <p className="text-[11px] font-bold text-gray-500">Sem agendamentos neste mês.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* SECONDARY ACTIONS */}
            <section className="grid gap-1.5 mb-3 grid-cols-3">
                <button onClick={(e) => { e.stopPropagation(); setInlineMode('extras'); setIsFlipped(true); }} className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 text-xs font-semibold rounded-xl border border-purple-100/70 transition-colors" type="button">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    <span>Extras</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }} className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-100/70 transition-colors" type="button">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span>Editar</span>
                </button>
                {onEmitNFe ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); const nfeUrl = fiscalNotesMap?.[client.id]; if (nfeUrl) { window.open(nfeUrl, '_blank'); } else { onEmitNFe(client); } }}
                        disabled={isEmittingNFe}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-colors active:scale-95 ${isEmittingNFe ? 'bg-pink-50 text-pink-300 border-pink-100 cursor-not-allowed' : fiscalNotesMap?.[client.id] ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100/70' : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-100/70'}`}
                        type="button"
                    >
                        {isEmittingNFe ? <svg className="animate-spin h-3.5 w-3.5 text-pink-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : fiscalNotesMap?.[client.id] ? <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 shrink-0" /> : <DocumentTextIcon className="w-3.5 h-3.5 shrink-0" />}
                        <span>{isEmittingNFe ? 'Gerando...' : fiscalNotesMap?.[client.id] ? 'Abrir' : 'Nota'}</span>
                    </button>
                ) : <div />}
            </section>

            {/* FOOTER */}
            <footer className="flex justify-between items-center px-1">
                <button onClick={(e) => { e.stopPropagation(); onDelete(client); }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors py-1 px-2 rounded-lg active:bg-rose-50" type="button">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <span>Excluir</span>
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); if (client.is_active) { setShowPauseConfirm(true); } else { setShowReactivateConfirm(true); } }}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 px-2 rounded-lg ${client.is_active ? 'text-amber-600 hover:text-amber-700 active:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 active:bg-emerald-50'}`}
                    type="button"
                >
                    {client.is_active ? (<><PauseIcon className="w-3.5 h-3.5 shrink-0" /><span>Pausar</span></>) : (<><PlayIcon className="w-3.5 h-3.5 shrink-0" /><span>Ativar</span></>)}
                </button>
            </footer>

                    </div>
                    {/* END FRONT FACE */}

                    {/* BACK FACE — Edição Inline */}
                    <div
                        className="absolute inset-0 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-pink-500/10 flex flex-col font-jakarta pt-1 pb-5 px-4 sm:px-5 overflow-hidden"
                        style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Accent Bar (verso: roxo/indigo para diferenciar) */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-[2rem]" />

                        {/* Header do Verso */}
                        <header className="mt-3.5 mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <button
                                    type="button"
                                    onClick={handleFlipBack}
                                    className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                                    title="Voltar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <h3 className="text-base sm:text-lg font-black text-slate-800 truncate">
                                    {inlineMode === 'edit' ? `Editar ${client.pet_name}` : `Extras — ${client.pet_name}`}
                                </h3>
                            </div>
                        </header>

                        {/* Tabs de modo (Dados | Extras) */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
                            <button
                                type="button"
                                onClick={() => setInlineMode('edit')}
                                className={`py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    inlineMode === 'edit'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <span className="flex items-center justify-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    Dados
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setInlineMode('extras')}
                                className={`py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    inlineMode === 'extras'
                                        ? 'bg-white text-purple-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <span className="flex items-center justify-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    Extras
                                </span>
                            </button>
                        </div>

                        {/* MODO: EDITAR DADOS */}
                        {inlineMode === 'edit' && (
                            <>
                                {/* Foto do Pet */}
                                <section className="flex flex-col items-center gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => inlinePhotoInputRef.current?.click()}
                                        className="relative w-20 h-20 rounded-full ring-2 ring-indigo-200 hover:ring-indigo-400 transition-all overflow-hidden bg-slate-50 flex items-center justify-center"
                                    >
                                        {inlinePhotoPreview ? (
                                            <img src={inlinePhotoPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                                        ) : (
                                            <span className="text-3xl">🐶</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-full">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                    </button>
                                    <input
                                        ref={inlinePhotoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleInlinePhotoSelect}
                                        className="hidden"
                                    />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Toque para alterar a foto</span>
                                </section>

                        {/* Campos — scrolláveis */}
                        <section className="flex flex-col gap-2.5 flex-1 overflow-y-auto no-scrollbar pr-1 -mr-1">
                            {/* IDENTIFICAÇÃO */}
                            <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-b border-indigo-100 pb-1 mt-1">Identificação</div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nome do Pet</label>
                                <input
                                    type="text"
                                    name="pet_name"
                                    value={inlineForm.pet_name}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Raça do Pet</label>
                                <input
                                    type="text"
                                    name="pet_breed"
                                    value={inlineForm.pet_breed || ''}
                                    onChange={handleInlineChange}
                                    placeholder="Ex: Shih Tzu"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tutor</label>
                                <input
                                    type="text"
                                    name="owner_name"
                                    value={inlineForm.owner_name}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">WhatsApp</label>
                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={inlineForm.whatsapp || ''}
                                    onChange={handleInlineChange}
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">CPF do Tutor</label>
                                <input
                                    type="text"
                                    name="owner_cpf"
                                    value={inlineForm.owner_cpf || ''}
                                    onChange={handleInlineChange}
                                    placeholder="000.000.000-00"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Endereço do Tutor</label>
                                <input
                                    type="text"
                                    name="owner_address"
                                    value={inlineForm.owner_address || ''}
                                    onChange={handleInlineChange}
                                    placeholder="Endereço completo"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Condomínio</label>
                                <input
                                    type="text"
                                    name="condominium"
                                    value={inlineForm.condominium || ''}
                                    onChange={handleInlineChange}
                                    placeholder="Ex: Paseo (Opcional)"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>

                            {/* SERVIÇO */}
                            <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 border-b border-purple-100 pb-1 mt-3">Serviço</div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo de Serviço</label>
                                <select
                                    name="service"
                                    value={inlineForm.service || ''}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                >
                                    <option value="">Nenhum específico</option>
                                    <option value="Banho">Banho</option>
                                    <option value="Banho & Tosa">Banho & Tosa</option>
                                    <option value="Só Tosa">Só Tosa</option>
                                    <option value="Banho (Pet Móvel)">Banho (Pet Móvel)</option>
                                    <option value="Banho & Tosa (Pet Móvel)">Banho & Tosa (Pet Móvel)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Porte / Peso</label>
                                <select
                                    name="weight"
                                    value={inlineForm.weight || ''}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                >
                                    <option value="">Não informado</option>
                                    <option value="Pequeno">Pequeno (até 5kg)</option>
                                    <option value="Médio">Médio (5-10kg)</option>
                                    <option value="Grande">Grande (10-20kg)</option>
                                    <option value="Gigante">Gigante (20kg+)</option>
                                </select>
                            </div>

                            {/* REGRAS E FINANCEIRO */}
                            <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 border-b border-blue-100 pb-1 mt-3">Regras e Financeiro</div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Frequência</label>
                                <select
                                    name="recurrence_type"
                                    value={inlineForm.recurrence_type || 'weekly'}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                >
                                    <option value="weekly">Semanal</option>
                                    <option value="bi-weekly">Quinzenal</option>
                                    <option value="monthly">Mensal</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Dia</label>
                                    <select
                                        name="recurrence_day"
                                        value={inlineForm.recurrence_day ?? 1}
                                        onChange={handleInlineChange}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                    >
                                        {inlineForm.recurrence_type === 'monthly' ? (
                                            Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>Dia {d}</option>
                                            ))
                                        ) : isFormPetMovel ? (
                                            <>
                                                <option value={3}>Quarta (Vitta Parque)</option>
                                                <option value={4}>Quinta (Max Haus)</option>
                                                <option value={5}>Sexta (Paseo)</option>
                                                {![3, 4, 5].includes(Number(inlineForm.recurrence_day)) && (
                                                    <option value={inlineForm.recurrence_day}>
                                                        {weekDaysLabel[Number(inlineForm.recurrence_day)] || `Dia ${inlineForm.recurrence_day}`}
                                                    </option>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <option value={1}>Segunda</option>
                                                <option value={2}>Terça</option>
                                                <option value={3}>Quarta</option>
                                                <option value={4}>Quinta</option>
                                                <option value={5}>Sexta</option>
                                                <option value={6}>Sábado</option>
                                                <option value={7}>Domingo</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Horário</label>
                                    <select
                                        name="recurrence_time"
                                        value={inlineForm.recurrence_time ?? formWorkingHours[0] ?? 9}
                                        onChange={handleInlineChange}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                    >
                                        {inlineForm.recurrence_time !== undefined &&
                                         inlineForm.recurrence_time !== null &&
                                         !formWorkingHours.includes(Number(inlineForm.recurrence_time)) && (
                                            <option value={inlineForm.recurrence_time}>
                                                {`${inlineForm.recurrence_time}:00 (Atual - Fora da grade)`}
                                            </option>
                                        )}
                                        {formWorkingHours.map(h => {
                                            const maxCap = 1;
                                            const bookedCount = existingMonthlyClients.filter(mc => {
                                                if (mc.id === client.id) return false;
                                                if (!mc.is_active) return false;
                                                if (Number(mc.recurrence_day) !== Number(inlineForm.recurrence_day)) return false;
                                                if (Number(mc.recurrence_time) !== Number(h)) return false;
                                                if (isFormPetMovel && formEffectiveCondo && mc.condominium && !matchesCondo(mc.condominium, formEffectiveCondo)) {
                                                    return false;
                                                }
                                                return true;
                                            }).length;
                                            const isCurrentClientSlot = Number(inlineForm.recurrence_time) === h;
                                            const isFull = bookedCount >= maxCap && !isCurrentClientSlot;

                                            return (
                                                <option
                                                    key={h}
                                                    value={h}
                                                    disabled={isFull}
                                                    className={isFull ? 'text-red-400 bg-gray-100 font-normal' : ''}
                                                >
                                                    {`${h}:00`}
                                                    {isCurrentClientSlot
                                                        ? ` (Vaga atual de ${client.pet_name})`
                                                        : isFull
                                                            ? ` (Lotado - ${bookedCount}/${maxCap})`
                                                            : (bookedCount > 0 ? ` (${bookedCount}/${maxCap} ocupada)` : ` (1 vaga livre)`)
                                                    }
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Preço do Pacote (R$)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={inlineForm.price || ''}
                                    onChange={handleInlineChange}
                                    step="0.01"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Vencimento do Pagamento</label>
                                <input
                                    type="date"
                                    name="payment_due_date"
                                    value={inlineForm.payment_due_date || ''}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status do Pagamento</label>
                                <select
                                    name="payment_status"
                                    value={inlineForm.payment_status || 'Pendente'}
                                    onChange={handleInlineChange}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pago">Pago</option>
                                </select>
                            </div>

                            {/* OBSERVAÇÕES */}
                            <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 border-b border-amber-100 pb-1 mt-3">Observações</div>
                            <div className="flex flex-col gap-1">
                                <textarea
                                    name="observation"
                                    value={inlineForm.observation || ''}
                                    onChange={handleInlineChange}
                                    rows={3}
                                    placeholder="Alergias, comportamento, preferências..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all resize-none"
                                />
                            </div>
                        </section>
                            </>
                        )}

                        {/* MODO: SERVIÇOS EXTRAS */}
                        {inlineMode === 'extras' && (
                            <section className="flex flex-col gap-2.5 flex-1 overflow-y-auto no-scrollbar pr-1 -mr-1">
                                <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 border-b border-purple-100 pb-1 mt-1">Estética & Cuidados</div>

                                {/* Só Tosa */}
                                <ExtraCard
                                    label="Só Tosa"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121" /></svg>}
                                    enabled={extras.so_tosa?.enabled || false}
                                    value={extras.so_tosa?.value || ''}
                                    onToggle={() => handleExtrasToggle('so_tosa' as any)}
                                    onValueChange={(v) => handleExtrasValue('so_tosa' as any, v)}
                                />
                                {/* Só Banho */}
                                <ExtraCard
                                    label="Só Banho"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12c2-4 6-4 9 0s7 4 9 0M5 17h14" /></svg>}
                                    enabled={extras.so_banho.enabled}
                                    value={extras.so_banho.value}
                                    onToggle={() => handleExtrasToggle('so_banho')}
                                    onValueChange={(v) => handleExtrasValue('so_banho', v)}
                                />
                                {/* Hidratação */}
                                <ExtraCard
                                    label="Hidratação"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l4 6-4 4-4-4 4-6zm0 12l4 6-4 4-4-4 4-6z" /></svg>}
                                    enabled={extras.hidratacao.enabled}
                                    value={extras.hidratacao.value}
                                    onToggle={() => handleExtrasToggle('hidratacao')}
                                    onValueChange={(v) => handleExtrasValue('hidratacao', v)}
                                />
                                {/* Botinha */}
                                <ExtraCard
                                    label="Botinha"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3l3 3 3-3 3 3 3-3v18l-3-3-3 3-3-3-3 3V3z" /></svg>}
                                    enabled={extras.botinha?.enabled || false}
                                    value={extras.botinha?.value || ''}
                                    onToggle={() => handleExtrasToggle('botinha' as any)}
                                    onValueChange={(v) => handleExtrasValue('botinha' as any, v)}
                                />
                                {/* Contorno */}
                                <ExtraCard
                                    label="Contorno"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z M9 9h6v6H9z" /></svg>}
                                    enabled={extras.contorno?.enabled || false}
                                    value={extras.contorno?.value || ''}
                                    onToggle={() => handleExtrasToggle('contorno' as any)}
                                    onValueChange={(v) => handleExtrasValue('contorno' as any, v)}
                                />
                                {/* Pintura */}
                                <ExtraCard
                                    label="Pintura"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a1.5 1.5 0 010-3H21V8a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2v11a4 4 0 004 4z" /></svg>}
                                    enabled={extras.pintura?.enabled || false}
                                    value={extras.pintura?.value || ''}
                                    onToggle={() => handleExtrasToggle('pintura' as any)}
                                    onValueChange={(v) => handleExtrasValue('pintura' as any, v)}
                                />
                                {/* Patacure */}
                                <ExtraCard
                                    label="Patacure"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" /></svg>}
                                    enabled={extras.patacure?.enabled || false}
                                    value={extras.patacure?.value || ''}
                                    onToggle={() => handleExtrasToggle('patacure' as any)}
                                    onValueChange={(v) => handleExtrasValue('patacure' as any, v)}
                                />
                                {/* Tintura */}
                                <ExtraCard
                                    label="Tintura"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" /></svg>}
                                    enabled={extras.tintura?.enabled || false}
                                    value={extras.tintura?.value || ''}
                                    onToggle={() => handleExtrasToggle('tintura' as any)}
                                    onValueChange={(v) => handleExtrasValue('tintura' as any, v)}
                                />
                                {/* Penteado */}
                                <ExtraCard
                                    label="Penteado"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l3 3v18M19 3l-3 3v18" /></svg>}
                                    enabled={extras.penteado?.enabled || false}
                                    value={extras.penteado?.value || ''}
                                    onToggle={() => handleExtrasToggle('penteado' as any)}
                                    onValueChange={(v) => handleExtrasValue('penteado' as any, v)}
                                />
                                {/* Desembolo */}
                                <ExtraCard
                                    label="Desembolo"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>}
                                    enabled={extras.desembolo?.enabled || false}
                                    value={extras.desembolo?.value || ''}
                                    onToggle={() => handleExtrasToggle('desembolo' as any)}
                                    onValueChange={(v) => handleExtrasValue('desembolo' as any, v)}
                                />
                                {/* Transporte */}
                                <ExtraCard
                                    label="Transporte"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M1 13h16V6a1 1 0 00-1-1H4l-3 5v3h2" /></svg>}
                                    enabled={extras.transporte?.enabled || false}
                                    value={extras.transporte?.value || ''}
                                    onToggle={() => handleExtrasToggle('transporte' as any)}
                                    onValueChange={(v) => handleExtrasValue('transporte' as any, v)}
                                />

                                <div className="text-[10px] font-black uppercase tracking-wider text-cyan-600 border-b border-cyan-100 pb-1 mt-2">Hospedagem & Creche</div>

                                {/* Adestrador */}
                                <ExtraCard
                                    label="Adestrador"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                    enabled={extras.adestrador.enabled}
                                    value={extras.adestrador.value}
                                    onToggle={() => handleExtrasToggle('adestrador')}
                                    onValueChange={(v) => handleExtrasValue('adestrador', v)}
                                />
                                {/* Dias Extras */}
                                <ExtraCard
                                    label="Dias Extras"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
                                    enabled={extras.dias_extras.enabled}
                                    value={extras.dias_extras.value}
                                    quantity={extras.dias_extras.quantity || 1}
                                    onToggle={() => handleExtrasToggle('dias_extras')}
                                    onValueChange={(v) => handleExtrasValue('dias_extras', v)}
                                    onQuantityChange={(q) => handleExtrasQuantity('dias_extras', q)}
                                />
                                {/* Hora Extra */}
                                <ExtraCard
                                    label="Hora Extra"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    enabled={extras.hora_extra?.enabled || false}
                                    value={extras.hora_extra?.value || ''}
                                    onToggle={() => handleExtrasToggle('hora_extra' as any)}
                                    onValueChange={(v) => handleExtrasValue('hora_extra' as any, v)}
                                />
                                {/* Medicamento */}
                                <ExtraCard
                                    label="Medicamento"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                    enabled={extras.medicamento?.enabled || false}
                                    value={extras.medicamento?.value || ''}
                                    onToggle={() => handleExtrasToggle('medicamento' as any)}
                                    onValueChange={(v) => handleExtrasValue('medicamento' as any, v)}
                                />
                                {/* Pernoite */}
                                <ExtraCard
                                    label="Pernoite"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                                    enabled={extras.pernoite.enabled}
                                    value={extras.pernoite.value}
                                    onToggle={() => handleExtrasToggle('pernoite')}
                                    onValueChange={(v) => handleExtrasValue('pernoite', v)}
                                />
                                {/* Ração */}
                                <ExtraCard
                                    label="Ração"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                                    enabled={extras.racao?.enabled || false}
                                    value={extras.racao?.value || ''}
                                    onToggle={() => handleExtrasToggle('racao' as any)}
                                    onValueChange={(v) => handleExtrasValue('racao' as any, v)}
                                />
                                {/* Veterinário */}
                                <ExtraCard
                                    label="Veterinário"
                                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                                    enabled={extras.veterinario?.enabled || false}
                                    value={extras.veterinario?.value || ''}
                                    onToggle={() => handleExtrasToggle('veterinario' as any)}
                                    onValueChange={(v) => handleExtrasValue('veterinario' as any, v)}
                                />

                                {/* Resumo */}
                                <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Total dos Extras</span>
                                    <span className="text-base font-black text-purple-700">
                                        R$ {extrasTotal.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </section>
                        )}

                        {/* Footer do Verso: Salvar / Cancelar (com cor dinâmica por modo) */}
                        <footer className="mt-3 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleFlipBack}
                                disabled={inlineSaving}
                                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors active:scale-95 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={inlineMode === 'edit' ? handleInlineSave : handleExtrasSave}
                                disabled={inlineSaving}
                                className={`py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-95 shadow-md disabled:opacity-60 flex items-center justify-center gap-1.5 ${
                                    inlineMode === 'edit'
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30'
                                }`}
                            >
                                {inlineSaving ? (
                                    <>
                                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        Salvar
                                    </>
                                )}
                            </button>
                        </footer>
                    </div>
                    {/* END BACK FACE */}
                </div>
                {/* END Inner flip wrapper */}
            </div>
            {/* END Outer perspective wrapper */}
        {/* Modal de Confirmação da Pausa */}
        {showPauseConfirm && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-yellow-50">
                    {/* Header com Gradiente */}
                    <div className="relative h-32 bg-gradient-to-br from-yellow-500 to-amber-400 flex items-center justify-center">
                        <div className="absolute top-0 right-0 p-4 z-10">
                            <button 
                                onClick={() => setShowPauseConfirm(false)}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full backdrop-blur-xl border border-white/30 shadow-inner">
                            <ExclamationTriangleIcon className="w-12 h-12 text-white" />
                        </div>
                        
                        {/* Elementos Decorativos */}
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute top-0 -right-4 w-16 h-16 bg-amber-300/20 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-8 pt-8 pb-8 text-center">
                        <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2 font-outfit">
                            Confirmar Pausa do Plano?
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Você está prestes a pausar temporariamente o plano mensalista de <strong className="text-gray-700">{client.pet_name}</strong>.
                        </p>

                        {/* Card de Detalhes */}
                        <div className="bg-yellow-50/40 rounded-3xl p-5 mb-6 border border-yellow-100/50 text-left">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Tutor</span>
                                <span className="text-sm font-bold text-gray-700">{client.owner_name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Pet</span>
                                <span className="text-sm font-bold text-gray-700">{client.pet_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Frequência</span>
                                <span className="text-sm font-bold text-gray-700">{getRecurrenceText(client)}</span>
                            </div>
                            <div className="h-px bg-yellow-100 my-3"></div>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                ⚠️ <strong>Importante:</strong> Ao pausar, os agendamentos na grade serão ocultados e os horários serão liberados para novos atendimentos.
                            </p>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={handlePause}
                                disabled={isPausing}
                                className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-yellow-100 hover:shadow-yellow-200 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isPausing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Pausando...</span>
                                    </>
                                ) : (
                                    <>
                                        <PauseIcon className="w-5 h-5" />
                                        <span>Sim, Pausar</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowPauseConfirm(false)}
                                disabled={isPausing}
                                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal de Sucesso Pós-Pausa */}
        {showPauseSuccess && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-green-50">
                    {/* Header com Gradiente */}
                    <div className="relative h-32 bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                        <div className="absolute top-0 right-0 p-4 z-10">
                            <button 
                                onClick={() => {
                                    setShowPauseSuccess(false);
                                    onStatusChanged?.();
                                }}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full backdrop-blur-xl border border-white/30 shadow-inner">
                            <CheckCircleIcon className="w-12 h-12 text-white" />
                        </div>
                        
                        {/* Elementos Decorativos */}
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute top-0 -right-4 w-16 h-16 bg-emerald-300/20 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-8 pt-8 pb-8 text-center">
                        <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2 font-outfit">
                            Mensalista Pausado!
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            O plano mensalista de <strong className="text-gray-700">{client.pet_name}</strong> foi atualizado e as seguintes alterações foram realizadas com sucesso:
                        </p>

                        {/* Listagem Informativa de Ações */}
                        <div className="flex flex-col gap-3.5 mb-8 text-left">
                            <div className="flex gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 hover:bg-green-50/20 hover:border-green-100/50 transition-colors">
                                <span className="text-lg mt-0.5">⏸️</span>
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-0.5">Plano Pausado</h4>
                                    <p className="text-xs text-gray-500 leading-normal">O status do mensalista foi alterado para inativo no sistema.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 hover:bg-green-50/20 hover:border-green-100/50 transition-colors">
                                <span className="text-lg mt-0.5">📅</span>
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-0.5">Agendamentos Ocultados</h4>
                                    <p className="text-xs text-gray-500 leading-normal">Todos os agendamentos recorrentes deste pet foram ocultados do calendário.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 hover:bg-green-50/20 hover:border-green-100/50 transition-colors">
                                <span className="text-lg mt-0.5">🔓</span>
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-0.5">Horário Liberado</h4>
                                    <p className="text-xs text-gray-500 leading-normal">Os horários anteriormente reservados na grade estão livres para novas reservas de outros clientes.</p>
                                </div>
                            </div>
                        </div>

                        {/* Botão de Fechamento */}
                        <button
                            onClick={() => {
                                setShowPauseSuccess(false);
                                onStatusChanged?.();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:shadow-green-200 active:scale-[0.98] transition-all duration-300 font-outfit"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal de Confirmação de Reativação */}
        {showReactivateConfirm && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-blue-50">
                    {/* Header com Gradiente */}
                    <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-400 flex items-center justify-center">
                        <div className="absolute top-0 right-0 p-4 z-10">
                            <button 
                                onClick={() => setShowReactivateConfirm(false)}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full backdrop-blur-xl border border-white/30 shadow-inner">
                            <PlayIcon className="w-12 h-12 text-white" />
                        </div>
                        
                        {/* Elementos Decorativos */}
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute top-0 -right-4 w-16 h-16 bg-indigo-300/20 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-8 pt-8 pb-8 text-center">
                        <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2 font-outfit">
                            Reativar Mensalista?
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Você está prestes a reativar o plano mensalista de <strong className="text-gray-700">{client.pet_name}</strong>.
                        </p>

                        {/* Card de Detalhes */}
                        <div className="bg-blue-50/40 rounded-3xl p-5 mb-6 border border-blue-100/50 text-left">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Tutor</span>
                                <span className="text-sm font-bold text-gray-700">{client.owner_name}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Pet</span>
                                <span className="text-sm font-bold text-gray-700">{client.pet_name}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Frequência</span>
                                <span className="text-sm font-bold text-gray-700">{getRecurrenceText(client)}</span>
                            </div>
                            <div className="h-px bg-blue-100 my-3"></div>
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">
                                ℹ️ <strong>Importante:</strong> Ao reativar, os agendamentos recorrentes deste mensalista serão novamente exibidos na agenda do administrador e a disponibilidade do horário será atualizada.
                            </p>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={handleReactivate}
                                disabled={isReactivating}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:shadow-blue-200 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isReactivating ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Ativando...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlayIcon className="w-5 h-5" />
                                        <span>Sim, Ativar</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowReactivateConfirm(false)}
                                disabled={isReactivating}
                                className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {/* Modal de Sucesso Pós-Reativação */}
        {showReactivateSuccess && createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn border border-green-50">
                    {/* Header com Gradiente */}
                    <div className="relative h-32 bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                        <div className="absolute top-0 right-0 p-4 z-10">
                            <button 
                                onClick={() => {
                                    setShowReactivateSuccess(false);
                                    onStatusChanged?.();
                                }}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-md"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-white/20 p-4 rounded-full backdrop-blur-xl border border-white/30 shadow-inner">
                            <CheckCircleIcon className="w-12 h-12 text-white" />
                        </div>
                        
                        {/* Elementos Decorativos */}
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="absolute top-0 -right-4 w-16 h-16 bg-emerald-300/20 rounded-full blur-xl pointer-events-none"></div>
                    </div>

                    {/* Conteúdo */}
                    <div className="px-8 pt-8 pb-8 text-center">
                        <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2 font-outfit">
                            Mensalista Reativado!
                        </h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            O plano mensalista de <strong className="text-gray-700">{client.pet_name}</strong> foi reativado com sucesso.
                        </p>

                        {/* Listagem Informativa de Ações */}
                        <div className="flex flex-col gap-3.5 mb-8 text-left">
                            <div className="flex gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 hover:bg-green-50/20 hover:border-green-100/50 transition-colors">
                                <span className="text-lg mt-0.5">▶️</span>
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-0.5">Plano Ativo</h4>
                                    <p className="text-xs text-gray-500 leading-normal">O status do mensalista foi alterado para ativo no sistema.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 hover:bg-green-50/20 hover:border-green-100/50 transition-colors">
                                <span className="text-lg mt-0.5">📅</span>
                                <div>
                                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-0.5">Agendamentos Visíveis</h4>
                                    <p className="text-xs text-gray-500 leading-normal">Os agendamentos futuros deste pet voltaram a ficar visíveis para o administrador na agenda geral.</p>
                                </div>
                            </div>
                        </div>

                        {/* Botão de Fechamento */}
                        <button
                            onClick={() => {
                                setShowReactivateSuccess(false);
                                onStatusChanged?.();
                            }}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-green-100 hover:shadow-green-200 active:scale-[0.98] transition-all duration-300 font-outfit"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </>
);
};

export default MonthlyClientCard;
