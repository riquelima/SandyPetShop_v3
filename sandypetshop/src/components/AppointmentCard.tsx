import React, { useState, useEffect } from 'react';
import {
    ClockIcon,
    UserIcon,
    TagIcon,
    CheckCircleIcon,
    TrashIcon,
    PencilSquareIcon as EditIcon,
    SparklesIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { AdminAppointment, ServiceType, PetWeight, MonthlyClient } from '../../types';
import { SERVICE_PRICES, PET_WEIGHT_OPTIONS } from '../../constants';
import { supabase } from '../../supabaseClient';

// --- Helpers ---
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

const WhatsAppIcon = () => (
    <img
        alt="WhatsApp Icon"
        className="h-4 w-4 opacity-60"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        src="https://cdn-icons-png.flaticon.com/512/15713/15713434.png"
    />
);

const getWeightKeyFromLabel = (label: string): PetWeight | null => {
    if (!label) return null;
    const keys = Object.keys(PET_WEIGHT_OPTIONS) as PetWeight[];
    return keys.find(k => PET_WEIGHT_OPTIONS[k] === label) || null;
};



const extractDateAndTimeString = (isoOrDateStr?: string) => {
    if (!isoOrDateStr) return { date: '', time: '' };
    try {
        const d = new Date(isoOrDateStr);
        if (isNaN(d.getTime())) return { date: '', time: '' };
        const pad = (n: number) => String(n).padStart(2, '0');
        const y = d.getFullYear();
        const m = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const h = pad(d.getHours());
        const min = pad(d.getMinutes());
        return {
            date: `${y}-${m}-${day}`,
            time: `${h}:${min}`
        };
    } catch {
        return { date: '', time: '' };
    }
};

interface AppointmentCardProps {
    appointment: AdminAppointment;
    onEdit: (appointment: AdminAppointment) => void;
    onDelete: (appointment: AdminAppointment) => void;
    onRequestCompletion: (id: string, price: number) => void;
    onOpenActionMenu: (appointment: AdminAppointment, e: React.MouseEvent) => void;
    onDeleteObservation: (appointment: AdminAppointment) => void;
    onAddObservation: () => void;
    isUpdating?: boolean;
    isDeleting?: boolean;
    onShowLoyalty?: (pet: string, owner: string) => void;
    onEmitNFe?: (appointment: AdminAppointment) => void;
    isEmittingNFe?: boolean;
    fiscalNotesMap?: Record<string, string>;
    monthlyClients?: MonthlyClient[];
    onMigrate?: (appointment: AdminAppointment) => void;
    isAdmin?: boolean;
    onStatusChanged?: () => void;
}

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

const AppointmentCard: React.FC<AppointmentCardProps> = ({
    appointment,
    onEdit,
    onDelete,
    onRequestCompletion,
    onOpenActionMenu,
    onDeleteObservation,
    onAddObservation,
    isUpdating = false,
    isDeleting = false,
    onShowLoyalty,
    onEmitNFe,
    isEmittingNFe,
    fiscalNotesMap,
    monthlyClients = [],
    onMigrate,
    isAdmin = true,
    onStatusChanged
}) => {
    const {
        id,
        appointment_time,
        pet_name,
        owner_name,
        service,
        status,
        price,
        addons,
        whatsapp,
        monthly_client_id,
        responsible,
        extra_services: es,
        observation,
        condominium,
        pet_photo_url,
        recurrence_type,
        pet_breed
    } = appointment;

    const isCompleted = status === 'CONCLUÍDO';
    const isCancelledByClient = (status as string) === 'cancelled' || (status as string) === 'cancelled_by_client' || (typeof status === 'string' && status.toLowerCase().includes('cancelado'));
    const isVisitService = (service === 'Creche Pet' || service === 'Hotel Pet' || (service && typeof service === 'string' && service.toLowerCase().includes('visita')));
    const isVisit = isVisitService && !monthly_client_id;


    // Price Calculation
    const extrasTotal = (() => {
        if (!es) return 0;
        let total = 0;
        Object.entries(es).forEach(([key, value]: [string, any]) => {

            if (value && typeof value === 'object') {
                if (key === 'dias_extras' && value.enabled && value.quantity > 0) {
                    total += Number(value.quantity) * Number(value.value || 0);
                } else if (value.enabled) {
                    total += Number(value.value || 0);
                }
            } else if (value === true) {
                // Should not happen with new structure, but safe fallback
                // Assuming we don't know the price if it's just 'true'
            }
        });
        return total;
    })();

    // Helper to format extra name
    const formatExtraName = (key: string) => {
        return key.replace(/_/g, ' ').replace('so ', '').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get active extras list
    const activeExtras: string[] = [];
    if (es) {
        Object.entries(es).forEach(([key, value]: [string, any]) => {

            if (value) {
                if (key === 'dias_extras') {
                    if (value.enabled && Number(value.quantity) > 0) activeExtras.push('Dias Extras');
                } else if (value.enabled || value === true) {
                    activeExtras.push(formatExtraName(key));
                }
            }
        });
    }

    const hasExtras = activeExtras.length > 0;

    // Encontrar o mensalista correspondente na lista, se houver
    const monthlyClient = monthly_client_id && monthlyClients 
        ? monthlyClients.find(c => c.id === monthly_client_id)
        : null;

    if (pet_name === 'Blue' || monthly_client_id) {
        console.log(`[Depuração] Pet: ${pet_name}, ID do mensalista no card: ${monthly_client_id}, Mensalista encontrado:`, monthlyClient ? `Sim (Preço: ${monthlyClient.price})` : 'Não', `Total de mensalistas recebidos: ${monthlyClients.length}`);
    }

    // Se o mensalista correspondente estiver ativo e com valor de mensalidade zerado, zeramos o preço base do agendamento
    const isMonthlyPriceZero = monthlyClient && Number(monthlyClient.price || 0) === 0;
    const basePrice = isMonthlyPriceZero ? 0 : Number(price || 0);

    const displayPrice: number = basePrice + extrasTotal;

    const whatsappHref = `https://wa.me/55${whatsapp.replace(/\D/g, '')}`;

    const statusStyles: Record<string, string> = {
        'AGENDADO': 'bg-blue-100 text-blue-800',
        'CONCLUÍDO': 'bg-green-100 text-green-800',
        'pending': 'bg-blue-100 text-blue-800',
    };

    const getRecurrenceLabel = () => {
        if (!recurrence_type) return null;
        const map: Record<string, string> = {
            weekly: 'Semanal',
            'bi-weekly': 'Quinzenal',
            monthly: 'Mensal'
        };
        return map[recurrence_type];
    };
    const recurrenceLabel = getRecurrenceLabel();

    // Date Formatting
    const dateObj = new Date(appointment_time);
    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

    // === FLIP CARD: edição inline + serviços extras ===
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    const [inlineMode, setInlineMode] = useState<'edit' | 'extras'>('edit');
    const [inlineForm, setInlineForm] = useState<any>(() => appointment);
    const [inlineSaving, setInlineSaving] = useState<boolean>(false);
    const [inlinePhotoFile, setInlinePhotoFile] = useState<File | null>(null);
    const [inlinePhotoPreview, setInlinePhotoPreview] = useState<string | null>(appointment.pet_photo_url || null);
    const inlinePhotoInputRef = React.useRef<HTMLInputElement>(null);

    const initialDT = extractDateAndTimeString(appointment.appointment_time);
    const [inlineDate, setInlineDate] = useState<string>(initialDT.date);
    const [inlineTime, setInlineTime] = useState<string>(initialDT.time);

    const [extras, setExtras] = useState<any>(() => {
        const es: any = appointment.extra_services || {};
        return {
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
        };
    });

    useEffect(() => {
        setInlineForm(appointment);
        setInlinePhotoPreview(appointment.pet_photo_url || null);
        setInlinePhotoFile(null);
        const dt = extractDateAndTimeString(appointment.appointment_time);
        setInlineDate(dt.date);
        setInlineTime(dt.time);
        const es: any = appointment.extra_services || {};
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
    }, [appointment.id, appointment.pet_photo_url, appointment.pet_name, appointment.pet_breed, appointment.owner_name, appointment.owner_address, appointment.owner_cpf, appointment.whatsapp, appointment.condominium, appointment.service, appointment.weight, appointment.status, appointment.responsible, appointment.appointment_time, appointment.observation, appointment.price, appointment.extra_services]);

    const handleFlipTrigger = (mode: 'edit' | 'extras') => {
        if (!isAdmin) {
            alert('Apenas administradores podem acessar o formulário de edição.');
            return;
        }
        setInlineMode(mode);
        setIsFlipped(true);
    };

    const handleInlineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInlineForm((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleInlinePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setInlinePhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setInlinePhotoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleExtrasToggle = (key: string) => {
        setExtras((prev: any) => ({
            ...prev,
            [key]: { ...(prev[key] as any), enabled: !(prev[key] as any).enabled }
        }));
    };
    const handleExtrasValue = (key: string, value: string) => {
        const safe = value.replace(',', '.').replace(/[^0-9.]/g, '');
        const parts = safe.split('.');
        const finalVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : safe;
        setExtras((prev: any) => ({
            ...prev,
            [key]: { ...(prev[key] as any), value: finalVal }
        }));
    };
    const handleExtrasQuantity = (key: string, qty: string) => {
        const n = Math.max(1, parseInt(qty) || 1);
        setExtras((prev: any) => ({
            ...prev,
            [key]: { ...(prev[key] as any), quantity: n }
        }));
    };
    const flipExtrasTotal: number = Object.values(extras).reduce<number>((acc: number, item: any) => {
        if (!item.enabled) return acc;
        const v = parseFloat(item.value) || 0;
        const q = item.quantity || 1;
        return acc + v * q;
    }, 0);

    const handleFlipBack = () => {
        setInlineForm(appointment);
        setInlinePhotoPreview(appointment.pet_photo_url || null);
        setInlinePhotoFile(null);
        const dt = extractDateAndTimeString(appointment.appointment_time);
        setInlineDate(dt.date);
        setInlineTime(dt.time);
        const es: any = appointment.extra_services || {};
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

    const handleInlineSave = async () => {
        if (!isAdmin) {
            alert('Apenas administradores podem salvar alterações.');
            return;
        }
        setInlineSaving(true);
        try {
            const table = appointment.table || 'appointments';
            let photoUrl = inlineForm.pet_photo_url || null;
            if (inlinePhotoFile) {
                const ext = inlinePhotoFile.name.split('.').pop() || 'jpg';
                const path = `appointments/${id}/photo-${Date.now()}.${ext}`;
                const { error: upErr } = await supabase.storage
                    .from('store_products')
                    .upload(path, inlinePhotoFile, { upsert: true, contentType: inlinePhotoFile.type });
                if (upErr) throw upErr;
                const { data: pub } = supabase.storage.from('store_products').getPublicUrl(path);
                photoUrl = pub.publicUrl;
            }

            let newAppointmentTime = appointment.appointment_time;
            if (inlineDate && inlineTime) {
                const [y, m, d] = inlineDate.split('-').map(Number);
                const [h, min] = inlineTime.split(':').map(Number);
                const combined = new Date(y, m - 1, d, h, min);
                if (!isNaN(combined.getTime())) {
                    newAppointmentTime = combined.toISOString();
                }
            }

            const updatePayload: any = {
                pet_name: inlineForm.pet_name,
                pet_breed: inlineForm.pet_breed,
                owner_name: inlineForm.owner_name,
                owner_address: inlineForm.owner_address,
                owner_cpf: inlineForm.owner_cpf,
                whatsapp: inlineForm.whatsapp,
                service: inlineForm.service,
                weight: inlineForm.weight,
                status: inlineForm.status,
                responsible: inlineForm.responsible,
                condominium: inlineForm.condominium,
                observation: inlineForm.observation,
                price: Number(inlineForm.price) || 0,
                pet_photo_url: photoUrl,
                appointment_time: newAppointmentTime,
            };
            const { error } = await supabase.from(table).update(updatePayload).eq('id', id);
            if (error) throw error;
            onEdit({ ...appointment, ...updatePayload } as AdminAppointment);
            setIsFlipped(false);
            onStatusChanged?.();
        } catch (err) {
            console.error('Erro ao salvar agendamento:', err);
            alert('Erro ao salvar alterações. Tente novamente.');
        } finally {
            setInlineSaving(false);
        }
    };

    const handleExtrasSave = async () => {
        if (!isAdmin) {
            alert('Apenas administradores podem salvar alterações.');
            return;
        }
        setInlineSaving(true);
        try {
            const table = appointment.table || 'appointments';
            const payload: any = {};
            (Object.keys(extras) as string[]).forEach(k => {
                const item: any = (extras as any)[k];
                payload[k] = {
                    enabled: !!item.enabled,
                    value: item.value || 0,
                    ...(k === 'dias_extras' ? { quantity: item.quantity || 1 } : {})
                };
            });
            const { error } = await supabase.from(table).update({ extra_services: payload }).eq('id', id);
            if (error) throw error;
            onEdit({ ...appointment, extra_services: payload } as AdminAppointment);
            setIsFlipped(false);
            setInlineMode('edit');
            onStatusChanged?.();
        } catch (err) {
            console.error('Erro ao salvar extras:', err);
            alert('Erro ao salvar serviços extras. Tente novamente.');
        } finally {
            setInlineSaving(false);
        }
    };

    return (
        <div
            className="relative w-full transition-all duration-500 ease-in-out"
            style={{
                perspective: '1200px',
                minHeight: isFlipped ? '720px' : undefined,
            }}
        >
            <div
                className="relative w-full transition-all duration-500 ease-in-out"
                style={{
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.4s ease',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    minHeight: isFlipped ? '720px' : undefined,
                    height: isFlipped ? '720px' : 'auto',
                }}
            >
                {/* FRONT FACE */}
                <div
                    className={`relative w-full bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 transform border overflow-hidden flex flex-col font-jakarta ${
                        isCancelledByClient
                            ? 'opacity-60 border-red-100'
                            : 'hover:shadow-pink-500/10 border-gray-100'
                    } ${isDeleting ? 'opacity-40 animate-pulse' : ''}`}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        minHeight: isFlipped ? '720px' : undefined,
                    }}
                >

            {/* --- Status Bar --- */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                isCancelledByClient 
                    ? 'from-red-500 to-red-600' 
                    : status === 'CONCLUÍDO' 
                        ? 'from-green-400 to-emerald-500' 
                        : 'from-pink-400 to-purple-500'
            }`} />

            {/* VISITA BANNER VIP */}
            {isVisit && (
                <div className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-white text-[11px] font-black uppercase tracking-widest py-1.5 px-5 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>
                    <div className="flex items-center gap-2 relative z-10">
                        <span className="text-sm">🏠</span>
                        <span>Agendamento de Visita</span>
                    </div>
                </div>
            )}

            <div className="p-5 flex flex-col h-full">

                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            {pet_photo_url ? (
                                <SafeImage
                                    src={pet_photo_url}
                                    alt={pet_name}
                                    className="relative w-14 h-14 rounded-full object-cover border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                />
                            ) : (
                                <div className="relative w-14 h-14 rounded-full bg-white flex items-center justify-center border-2 border-pink-50 shadow-sm text-2xl">
                                    🐶
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className={`font-outfit font-bold text-xl text-gray-900 leading-tight group-hover:text-pink-600 transition-colors ${isCancelledByClient ? 'line-through text-gray-400' : ''}`}>
                                {pet_name ? pet_name.charAt(0).toUpperCase() + pet_name.slice(1).toLowerCase() : ''}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {isCancelledByClient ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-red-100 text-red-600 border border-red-200">
                                        Cancelado pelo cliente
                                    </span>
                                ) : (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                                        {(status as string) === 'pending' ? 'AGENDADO' : status}
                                    </span>
                                )}
                                {monthly_client_id && recurrenceLabel && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 uppercase tracking-wide">
                                        {recurrenceLabel}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Price Tag */}
                    <div className="text-right flex flex-col items-end">
                        <div className="font-outfit font-bold text-lg text-gray-900 whitespace-nowrap">
                            R$ {displayPrice.toFixed(2).replace('.', ',')}
                        </div>
                        {hasExtras && activeExtras.map((extra, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFlipTrigger('extras');
                                }}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 mt-0.5 hover:bg-purple-100 hover:border-purple-200 transition-colors cursor-pointer"
                                title="Clique para editar serviços extras"
                            >
                                <SparklesIcon className="w-3 h-3 mr-1 text-purple-500" />
                                {extra}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-pink-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data & Hora</span>
                            <span className="text-xs font-bold text-gray-700">{dateStr}, {timeStr}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tutor</span>
                            <span className={`text-xs font-medium text-gray-700 truncate max-w-[100px] ${isCancelledByClient ? 'line-through text-gray-400' : ''}`}>{owner_name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col w-full">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Serviço</span>
                            <div className="flex items-center justify-between w-full">
                                <span className={`text-xs font-medium text-gray-700 ${isCancelledByClient ? 'line-through text-gray-400' : ''}`}>{service}</span>
                            </div>
                        </div>
                    </div>

                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                    >
                        <WhatsAppIcon />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp</span>
                            <span className="text-xs font-medium text-gray-700 hover:text-green-600 transition-colors">
                                {whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                            </span>
                        </div>
                    </a>

                    {!isVisit && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center text-gray-400 text-[10px]">🏢</div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Condomínio</span>
                                <span className="text-xs font-medium text-gray-700">
                                    {(!condominium || condominium === 'Nenhum Condomínio') ? 'Banho & Tosa Fixo' : condominium}
                                </span>
                            </div>
                        </div>
                    )}

                    {pet_breed && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 flex items-center justify-center text-gray-400 text-[10px]">🐾</div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Raça</span>
                                <span className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                    {pet_breed}
                                </span>
                            </div>
                        </div>
                    )}

                    {responsible && (
                        <div className="flex items-center gap-2 col-span-2 bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                            <div className="w-4 h-4 flex items-center justify-center text-purple-500 text-[10px]">👤</div>
                            <span className="text-xs font-medium text-purple-700">Resp: <strong>{responsible}</strong></span>
                        </div>
                    )}
                </div>

                {/* Addons/Extras Text List */}
                {addons && addons.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                        {addons.map((addon, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                + {addon}
                            </span>
                        ))}
                    </div>
                )}

                {/* Observation */}
                {observation && (
                    <div className="mt-auto mb-4 bg-yellow-50 p-2.5 rounded-lg border border-yellow-100 relative group/obs">
                        <p className="text-[11px] text-gray-600 italic">
                            "{observation}"
                        </p>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteObservation(appointment); }}
                            className="absolute top-1 right-1 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover/obs:opacity-100 transition-opacity"
                            title="Excluir observação"
                        >
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Footer / Actions */}
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    {/* Secondary Actions Group (Left) */}
                    <div className="flex items-center gap-5 sm:gap-6">
                        {/* Loyalty Link - Only for non-monthly clients */}
                        {!monthly_client_id && (
                            <button
                                onClick={() => onShowLoyalty?.(pet_name, owner_name)}
                                className="p-1 rounded-full hover:bg-pink-50 transition-colors"
                                title="Ver Cartão de Fidelidade"
                            >
                                <img 
                                    src="https://cdn-icons-png.flaticon.com/512/6021/6021962.png" 
                                    alt="Fidelidade"
                                    className="w-5 h-5 object-contain"
                                />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleFlipTrigger('extras'); }}
                            disabled={isUpdating || isDeleting}
                            className="p-1.5 rounded-xl text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-bold"
                            title="Serviços Extras"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Extras</span>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleFlipTrigger('edit'); }}
                            disabled={isUpdating || isDeleting}
                            className="p-1.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-bold"
                            title="Editar Agendamento"
                        >
                            <EditIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar</span>
                        </button>

                        {onMigrate && (
                            <button
                                onClick={() => onMigrate(appointment)}
                                disabled={isUpdating || isDeleting}
                                className="p-1 rounded-full text-gray-400 hover:bg-purple-50 hover:text-purple-600 transition-colors disabled:opacity-50"
                                title="Migrar agendamento (Banho & Tosa ↔ Pet Móvel)"
                            >
                                <ArrowsRightLeftIcon className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={() => onDelete(appointment)}
                            disabled={isUpdating || isDeleting}
                            className="p-1 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Excluir"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Primary Action Group (Right) */}
                    <div className="flex items-center gap-2">
                        {isCompleted ? (
                            onEmitNFe && (
                                <button
                                    onClick={() => {
                                        const nfeUrl = fiscalNotesMap?.[id];
                                        if (nfeUrl) {
                                            window.open(nfeUrl, '_blank');
                                        } else if (onEmitNFe) {
                                            onEmitNFe(appointment);
                                        }
                                    }}
                                    disabled={isEmittingNFe}
                                    className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 shadow-sm whitespace-nowrap ${
                                        isEmittingNFe 
                                        ? 'bg-pink-100 text-pink-400 cursor-not-allowed border border-pink-200' 
                                        : fiscalNotesMap?.[id]
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-md active:scale-95 border border-green-400/20'
                                        : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 hover:shadow-md active:scale-95 border border-pink-400/20'
                                    }`}
                                >
                                    {isEmittingNFe ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Processando...</span>
                                        </>
                                    ) : fiscalNotesMap?.[id] ? (
                                        <>
                                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                                            <span>Abrir Nota</span>
                                        </>
                                    ) : (
                                        <>
                                            <DocumentTextIcon className="w-5 h-5" />
                                            <span>Nota Fiscal</span>
                                        </>
                                    )}
                                </button>
                            )
                        ) : (
                            <button
                                onClick={() => {
                                    console.log('Requesting completion for appointment:', id, 'with price:', displayPrice);
                                    onRequestCompletion(id, displayPrice);
                                }}
                                disabled={isUpdating || isDeleting}
                                className="px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 hover:shadow-green-500/20 hover:-translate-y-0.5"
                                title="Concluir serviço"
                            >
                                {isUpdating && !isDeleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span>Concluir</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {/* END FRONT FACE */}

        {/* BACK FACE — Edição Inline */}
        <div
            className="absolute inset-0 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-pink-500/10 flex flex-col font-jakarta pt-1 pb-4 px-4 sm:px-5 overflow-hidden"
            style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                minHeight: isFlipped ? '720px' : undefined,
                height: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Top Accent Bar (verso: roxo/indigo para diferenciar) */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-3xl" />

            {/* Header do Verso com Foto do Pet e Identificação */}
            <header className="mt-3.5 mb-2.5 flex items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={handleFlipBack}
                        className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors shrink-0 active:scale-95 shadow-sm"
                        title="Voltar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {/* Foto do Pet no Header */}
                    <button
                        type="button"
                        onClick={() => inlinePhotoInputRef.current?.click()}
                        className="relative w-11 h-11 rounded-full ring-2 ring-indigo-200 hover:ring-indigo-400 transition-all overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 cursor-pointer shadow-sm group/photo"
                        title="Toque para alterar a foto do pet"
                    >
                        {inlinePhotoPreview ? (
                            <img src={inlinePhotoPreview} alt="Preview" className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                            <span className="text-xl">🐾</span>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white transition-opacity rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </button>
                    <input
                        ref={inlinePhotoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleInlinePhotoSelect}
                        className="hidden"
                    />

                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-black text-slate-800 truncate">
                            {inlineMode === 'edit' ? `Editar ${appointment.pet_name}` : `Extras — ${appointment.pet_name}`}
                        </h3>
                        <p className="text-[10px] text-indigo-600 font-bold truncate">
                            {inlineMode === 'edit' ? 'Alterar dados e agendamento' : 'Configurar serviços adicionais'}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleFlipBack}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Fechar"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>

            {!isAdmin ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <span className="text-3xl mb-2">🔒</span>
                    <p className="font-bold text-sm">Acesso Restrito</p>
                    <p className="text-xs text-slate-400 mt-1">Apenas administradores podem visualizar e editar este formulário.</p>
                    <button
                        type="button"
                        onClick={handleFlipBack}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                    >
                        Voltar
                    </button>
                </div>
            ) : (
                <>
                    {/* Tabs de modo (Dados | Extras) */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-2.5">
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
                        <section className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 -mr-1">
                            {/* IDENTIFICAÇÃO */}
                            <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-b border-indigo-100 pb-1 mt-0.5">Identificação</div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nome do Pet</label>
                                <input
                                    type="text"
                                    name="pet_name"
                                    value={inlineForm.pet_name || ''}
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
                                        value={inlineForm.owner_name || ''}
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
                                        <option value="Creche Pet">Creche Pet</option>
                                        <option value="Hotel Pet">Hotel Pet</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
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
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Responsável</label>
                                        <input
                                            type="text"
                                            name="responsible"
                                            value={inlineForm.responsible || ''}
                                            onChange={handleInlineChange}
                                            placeholder="Ex: Sandy"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                {/* AGENDAMENTO E FINANCEIRO */}
                                <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 border-b border-blue-100 pb-1 mt-3">Agendamento e Financeiro</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Data</label>
                                        <input
                                            type="date"
                                            value={inlineDate}
                                            onChange={(e) => setInlineDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Horário</label>
                                        <input
                                            type="time"
                                            value={inlineTime}
                                            onChange={(e) => setInlineTime(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Status</label>
                                        <select
                                            name="status"
                                            value={inlineForm.status || 'AGENDADO'}
                                            onChange={handleInlineChange}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                        >
                                            <option value="AGENDADO">Agendado</option>
                                            <option value="CONCLUÍDO">Concluído</option>
                                            <option value="Cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Preço Base (R$)</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={inlineForm.price || ''}
                                            onChange={handleInlineChange}
                                            step="0.01"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 focus:bg-white transition-all"
                                        />
                                    </div>
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
                    )}

                    {/* MODO: SERVIÇOS EXTRAS */}
                    {inlineMode === 'extras' && (
                        <section className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 -mr-1">
                            <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 border-b border-purple-100 pb-1 mt-1">Estética & Cuidados</div>

                            {/* Só Tosa */}
                            <ExtraCard
                                label="Só Tosa"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121" /></svg>}
                                enabled={extras.so_tosa?.enabled || false}
                                value={extras.so_tosa?.value || ''}
                                onToggle={() => handleExtrasToggle('so_tosa')}
                                onValueChange={(v) => handleExtrasValue('so_tosa', v)}
                            />
                            {/* Só Banho */}
                            <ExtraCard
                                label="Só Banho"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12c2-4 6-4 9 0s7 4 9 0M5 17h14" /></svg>}
                                enabled={extras.so_banho?.enabled || false}
                                value={extras.so_banho?.value || ''}
                                onToggle={() => handleExtrasToggle('so_banho')}
                                onValueChange={(v) => handleExtrasValue('so_banho', v)}
                            />
                            {/* Hidratação */}
                            <ExtraCard
                                label="Hidratação"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l4 6-4 4-4-4 4-6zm0 12l4 6-4 4-4-4 4-6z" /></svg>}
                                enabled={extras.hidratacao?.enabled || false}
                                value={extras.hidratacao?.value || ''}
                                onToggle={() => handleExtrasToggle('hidratacao')}
                                onValueChange={(v) => handleExtrasValue('hidratacao', v)}
                            />
                            {/* Botinha */}
                            <ExtraCard
                                label="Botinha"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 3l3 3 3-3 3 3 3-3v18l-3-3-3 3-3-3-3 3V3z" /></svg>}
                                enabled={extras.botinha?.enabled || false}
                                value={extras.botinha?.value || ''}
                                onToggle={() => handleExtrasToggle('botinha')}
                                onValueChange={(v) => handleExtrasValue('botinha', v)}
                            />
                            {/* Contorno */}
                            <ExtraCard
                                label="Contorno"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4z M9 9h6v6H9z" /></svg>}
                                enabled={extras.contorno?.enabled || false}
                                value={extras.contorno?.value || ''}
                                onToggle={() => handleExtrasToggle('contorno')}
                                onValueChange={(v) => handleExtrasValue('contorno', v)}
                            />
                            {/* Pintura */}
                            <ExtraCard
                                label="Pintura"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a1.5 1.5 0 010-3H21V8a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2v11a4 4 0 004 4z" /></svg>}
                                enabled={extras.pintura?.enabled || false}
                                value={extras.pintura?.value || ''}
                                onToggle={() => handleExtrasToggle('pintura')}
                                onValueChange={(v) => handleExtrasValue('pintura', v)}
                            />
                            {/* Patacure */}
                            <ExtraCard
                                label="Patacure"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" /></svg>}
                                enabled={extras.patacure?.enabled || false}
                                value={extras.patacure?.value || ''}
                                onToggle={() => handleExtrasToggle('patacure')}
                                onValueChange={(v) => handleExtrasValue('patacure', v)}
                            />
                            {/* Tintura */}
                            <ExtraCard
                                label="Tintura"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" /></svg>}
                                enabled={extras.tintura?.enabled || false}
                                value={extras.tintura?.value || ''}
                                onToggle={() => handleExtrasToggle('tintura')}
                                onValueChange={(v) => handleExtrasValue('tintura', v)}
                            />
                            {/* Penteado */}
                            <ExtraCard
                                label="Penteado"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3l3 3v18M19 3l-3 3v18" /></svg>}
                                enabled={extras.penteado?.enabled || false}
                                value={extras.penteado?.value || ''}
                                onToggle={() => handleExtrasToggle('penteado')}
                                onValueChange={(v) => handleExtrasValue('penteado', v)}
                            />
                            {/* Desembolo */}
                            <ExtraCard
                                label="Desembolo"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>}
                                enabled={extras.desembolo?.enabled || false}
                                value={extras.desembolo?.value || ''}
                                onToggle={() => handleExtrasToggle('desembolo')}
                                onValueChange={(v) => handleExtrasValue('desembolo', v)}
                            />
                            {/* Transporte */}
                            <ExtraCard
                                label="Transporte"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M1 13h16V6a1 1 0 00-1-1H4l-3 5v3h2" /></svg>}
                                enabled={extras.transporte?.enabled || false}
                                value={extras.transporte?.value || ''}
                                onToggle={() => handleExtrasToggle('transporte')}
                                onValueChange={(v) => handleExtrasValue('transporte', v)}
                            />

                            <div className="text-[10px] font-black uppercase tracking-wider text-cyan-600 border-b border-cyan-100 pb-1 mt-2">Hospedagem & Creche</div>

                            {/* Adestrador */}
                            <ExtraCard
                                label="Adestrador"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                enabled={extras.adestrador?.enabled || false}
                                value={extras.adestrador?.value || ''}
                                onToggle={() => handleExtrasToggle('adestrador')}
                                onValueChange={(v) => handleExtrasValue('adestrador', v)}
                            />
                            {/* Dias Extras */}
                            <ExtraCard
                                label="Dias Extras"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>}
                                enabled={extras.dias_extras?.enabled || false}
                                value={extras.dias_extras?.value || ''}
                                quantity={extras.dias_extras?.quantity || 1}
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
                                onToggle={() => handleExtrasToggle('hora_extra')}
                                onValueChange={(v) => handleExtrasValue('hora_extra', v)}
                            />
                            {/* Medicamento */}
                            <ExtraCard
                                label="Medicamento"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                enabled={extras.medicamento?.enabled || false}
                                value={extras.medicamento?.value || ''}
                                onToggle={() => handleExtrasToggle('medicamento')}
                                onValueChange={(v) => handleExtrasValue('medicamento', v)}
                            />
                            {/* Pernoite */}
                            <ExtraCard
                                label="Pernoite"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
                                enabled={extras.pernoite?.enabled || false}
                                value={extras.pernoite?.value || ''}
                                onToggle={() => handleExtrasToggle('pernoite')}
                                onValueChange={(v) => handleExtrasValue('pernoite', v)}
                            />
                            {/* Ração */}
                            <ExtraCard
                                label="Ração"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
                                enabled={extras.racao?.enabled || false}
                                value={extras.racao?.value || ''}
                                onToggle={() => handleExtrasToggle('racao')}
                                onValueChange={(v) => handleExtrasValue('racao', v)}
                            />
                            {/* Veterinário */}
                            <ExtraCard
                                label="Veterinário"
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                                enabled={extras.veterinario?.enabled || false}
                                value={extras.veterinario?.value || ''}
                                onToggle={() => handleExtrasToggle('veterinario')}
                                onValueChange={(v) => handleExtrasValue('veterinario', v)}
                            />

                            {/* Resumo */}
                            <div className="mt-2 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Total dos Extras</span>
                                <span className="text-base font-black text-purple-700">
                                    R$ {Number(flipExtrasTotal || 0).toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        </section>
                    )}

                    {/* Footer do Verso: Salvar / Cancelar */}
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
                </>
            )}
        </div>
        {/* END BACK FACE */}
    </div>
    {/* END Inner flip wrapper */}
</div>
    );
};

export default AppointmentCard;
