import React, { useState, useMemo } from 'react';
import { 
    ClockIcon, 
    TruckIcon, 
    BuildingStorefrontIcon, 
    ArrowPathIcon, 
    CheckCircleIcon, 
    ChevronLeftIcon,
    CalendarDaysIcon,
    UsersIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import { 
    useScheduleSlots, 
    DEFAULT_PET_MOVEL_HOURS, 
    DEFAULT_FIXED_HOURS_WEEKDAY, 
    DEFAULT_FIXED_HOURS_SATURDAY,
    CONDOMINIUM_SCHEDULE_DAYS 
} from '../hooks/useScheduleSlots';

interface AtendimentoViewProps {
    onBack: () => void;
    appointments?: any[];
    monthlyClients?: any[];
}

const AVAILABLE_HOURS_PET_MOVEL = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const AVAILABLE_HOURS_FIXED = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

export default function AtendimentoView({ onBack }: AtendimentoViewProps) {
    const { 
        configs, 
        isSyncing, 
        saveAll, 
        updateSlot, 
        setDaySlotsCapacity, 
        resetToDefaults 
    } = useScheduleSlots();

    const [activeTab, setActiveTab] = useState<'pet_movel' | 'fixed'>('pet_movel');
    const [selectedCondo, setSelectedCondo] = useState<'Vitta Parque' | 'Max Haus' | 'Paseo'>('Vitta Parque');
    const [selectedFixedDay, setSelectedFixedDay] = useState<number>(2); // 2=Terça ... 6=Sábado
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Dia da semana atual selecionado
    const currentDayOfWeek = useMemo(() => {
        if (activeTab === 'pet_movel') {
            return CONDOMINIUM_SCHEDULE_DAYS[selectedCondo] || 3;
        }
        return selectedFixedDay;
    }, [activeTab, selectedCondo, selectedFixedDay]);

    // Horários disponíveis para exibir na grade
    const displayHours = useMemo(() => {
        return activeTab === 'pet_movel' ? AVAILABLE_HOURS_PET_MOVEL : AVAILABLE_HOURS_FIXED;
    }, [activeTab]);

    // Obtém configuração de um determinado horário
    const getSlot = (hour: number): { capacity: number; is_active: boolean } => {
        const normCondo = activeTab === 'pet_movel' ? selectedCondo : null;
        const found = configs.find(c => {
            if (c.category !== activeTab) return false;
            if (c.day_of_week !== currentDayOfWeek) return false;
            if (c.hour !== hour) return false;
            if (activeTab === 'pet_movel') {
                return c.condominium?.trim().toLowerCase() === normCondo?.toLowerCase();
            }
            return true;
        });

        if (found) {
            return {
                capacity: found.capacity ?? 1,
                is_active: found.is_active !== false && (found.capacity ?? 1) > 0,
            };
        }

        // Padrão: 8h às 15h para Pet Móvel, 10h às 17h para Fixo
        let isDefault = false;
        if (activeTab === 'pet_movel') {
            isDefault = DEFAULT_PET_MOVEL_HOURS.includes(hour);
        } else {
            isDefault = currentDayOfWeek === 6 
                ? DEFAULT_FIXED_HOURS_SATURDAY.includes(hour) 
                : DEFAULT_FIXED_HOURS_WEEKDAY.includes(hour);
        }

        return {
            capacity: isDefault ? 1 : 0,
            is_active: isDefault,
        };
    };

    // Estatísticas da grade atual
    const stats = useMemo(() => {
        let activeSlotsCount = 0;
        let totalCapacity = 0;

        for (const h of displayHours) {
            const slot = getSlot(h);
            if (slot.is_active && slot.capacity > 0) {
                activeSlotsCount += 1;
                totalCapacity += slot.capacity;
            }
        }

        return { activeSlotsCount, totalCapacity };
    }, [configs, activeTab, currentDayOfWeek, displayHours]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    // Altera a capacidade de um horário individual
    const handleSetSlotCapacity = (hour: number, capacity: number) => {
        updateSlot(
            activeTab,
            activeTab === 'pet_movel' ? selectedCondo : null,
            currentDayOfWeek,
            hour,
            {
                capacity,
                is_active: capacity > 0,
            }
        );
    };

    // Aplica predefinições rápidas para todos os horários do dia
    const handleApplyPreset = (capacity: number) => {
        const hours = activeTab === 'pet_movel' 
            ? DEFAULT_PET_MOVEL_HOURS 
            : (currentDayOfWeek === 6 ? DEFAULT_FIXED_HOURS_SATURDAY : DEFAULT_FIXED_HOURS_WEEKDAY);

        setDaySlotsCapacity(
            activeTab,
            activeTab === 'pet_movel' ? selectedCondo : null,
            currentDayOfWeek,
            capacity,
            hours
        );

        showToast('Configurações Salvas com Sucesso');
    };

    // Salvar alterações
    const handleSave = async () => {
        await saveAll(configs);
        showToast('Configurações Salvas com Sucesso');
    };

    // Restaurar padrões
    const handleReset = async () => {
        if (window.confirm('Deseja realmente restaurar os horários padrão de fábrica? (Pet Móvel: 8h-15h 1 vaga; Fixo: 10h-17h/9h-16h 1 vaga)')) {
            await resetToDefaults();
            showToast('Configurações Salvas com Sucesso');
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9fb] text-slate-800 antialiased flex justify-center py-2 sm:py-6 px-0 sm:px-4">
            {/* Mobile / Compact App Frame */}
            <div className="w-full max-w-[480px] md:max-w-3xl bg-[#faf9fb] flex flex-col relative shadow-xl sm:border sm:border-slate-200/70 sm:rounded-3xl pb-32 md:pb-0">
                
                {/* Toast feedback */}
                {toastMessage && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 text-xs font-semibold animate-fadeIn max-w-[90vw]">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* BEGIN: TopBar (Sticky) */}
                <header className="sticky top-0 z-30 bg-[#faf9fb]/90 backdrop-blur-md border-b border-slate-200/70 px-4 pt-3.5 pb-2.5 sm:rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <button 
                            type="button"
                            onClick={onBack}
                            aria-label="Voltar ao Painel" 
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200/80 active:scale-95 hover:border-pink-300 hover:text-pink-600 transition-all text-slate-700"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="flex flex-col items-center">
                            <h1 className="text-base font-bold text-slate-900 tracking-tight">Grade de Horários</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                type="button"
                                onClick={handleSave}
                                disabled={isSyncing}
                                title="Salvar Alterações"
                                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#e11d68] to-[#db2777] hover:from-[#c81057] text-white text-xs font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSyncing ? (
                                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <CheckIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                                <span>Salvar</span>
                            </button>

                            <button 
                                type="button"
                                onClick={handleReset}
                                title="Restaurar Padrão de Fábrica"
                                aria-label="Restaurar Padrão" 
                                className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200/80 active:scale-95 hover:border-pink-300 hover:text-pink-600 transition-all text-slate-600"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </header>
                {/* END: TopBar */}

                {/* BEGIN: MainContent */}
                <main className="flex-1 px-4 pt-3.5 space-y-4">
                    
                    {/* BEGIN: ServiceTypeSegment */}
                    <section>
                        <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center shadow-inner">
                            <button 
                                type="button"
                                onClick={() => setActiveTab('pet_movel')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                                    activeTab === 'pet_movel'
                                        ? 'bg-white shadow-sm text-[#db2777]'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <TruckIcon className="w-4 h-4" />
                                Pet Móvel (Condos)
                            </button>
                            <button 
                                type="button"
                                onClick={() => setActiveTab('fixed')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-semibold text-xs transition-all ${
                                    activeTab === 'fixed'
                                        ? 'bg-white shadow-sm text-[#db2777]'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <BuildingStorefrontIcon className="w-4 h-4" />
                                Banho &amp; Tosa Fixo
                            </button>
                        </div>
                    </section>
                    {/* END: ServiceTypeSegment */}

                    {/* BEGIN: CondominiumSelector */}
                    <section className="space-y-1.5">
                        <div className="flex items-center justify-between px-0.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                {activeTab === 'pet_movel' ? 'Condomínio & Dia' : 'Dia da Semana (Loja Física)'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {activeTab === 'pet_movel' ? (
                                ([
                                    { name: 'Vitta Parque', day: 'Quarta-feira' },
                                    { name: 'Max Haus', day: 'Quinta-feira' },
                                    { name: 'Paseo', day: 'Sexta-feira' }
                                ] as const).map(item => {
                                    const isSelected = selectedCondo === item.name;
                                    return (
                                        <button
                                            key={item.name}
                                            type="button"
                                            onClick={() => setSelectedCondo(item.name)}
                                            className={`flex-shrink-0 relative rounded-2xl p-2.5 pl-3 pr-4 shadow-sm min-w-[160px] text-left transition-all ${
                                                isSelected
                                                    ? 'bg-white border-2 border-pink-500 shadow-sm'
                                                    : 'bg-white border border-slate-200/90 opacity-75 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-pink-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <p className="font-bold text-xs text-slate-900">{item.name}</p>
                                            </div>
                                            <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-pink-600 font-semibold' : 'text-slate-400 font-medium'}`}>
                                                {item.day}
                                            </p>
                                            {isSelected && (
                                                <div className="absolute right-2 top-2 text-pink-500">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                [
                                    { dayNum: 2, label: 'Terça-feira' },
                                    { dayNum: 3, label: 'Quarta-feira' },
                                    { dayNum: 4, label: 'Quinta-feira' },
                                    { dayNum: 5, label: 'Sexta-feira' },
                                    { dayNum: 6, label: 'Sábado' },
                                ].map(item => {
                                    const isSelected = selectedFixedDay === item.dayNum;
                                    return (
                                        <button
                                            key={item.dayNum}
                                            type="button"
                                            onClick={() => setSelectedFixedDay(item.dayNum)}
                                            className={`flex-shrink-0 relative rounded-2xl p-2.5 pl-3 pr-4 shadow-sm min-w-[150px] text-left transition-all ${
                                                isSelected
                                                    ? 'bg-white border-2 border-pink-500 shadow-sm'
                                                    : 'bg-white border border-slate-200/90 opacity-75 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-pink-500 animate-pulse' : 'bg-slate-300'}`} />
                                                <p className="font-bold text-xs text-slate-900">{item.label}</p>
                                            </div>
                                            <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-pink-600 font-semibold' : 'text-slate-400 font-medium'}`}>
                                                Loja Física
                                            </p>
                                            {isSelected && (
                                                <div className="absolute right-2 top-2 text-pink-500">
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </section>
                    {/* END: CondominiumSelector */}

                    {/* BEGIN: MetricSummaryCards */}
                    <section className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-medium text-slate-400 block leading-tight">Horários Abertos</span>
                                <span className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5 block">
                                    {stats.activeSlotsCount} <span className="text-xs font-semibold text-slate-400">slots</span>
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                <ClockIcon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-3 border border-pink-100 shadow-sm flex items-center justify-between bg-gradient-to-br from-white to-pink-50/40">
                            <div>
                                <span className="text-[11px] font-medium text-pink-600 block leading-tight">Total de Vagas</span>
                                <span className="text-xl font-extrabold text-pink-600 tracking-tight mt-0.5 block">
                                    {stats.totalCapacity} <span className="text-xs font-bold text-pink-400">vagas</span>
                                </span>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-pink-100/70 flex items-center justify-center text-pink-600">
                                <UsersIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </section>
                    {/* END: MetricSummaryCards */}

                    {/* BEGIN: QuickActionsBar */}
                    <section className="bg-white/90 rounded-2xl p-2.5 border border-slate-200/80 shadow-sm space-y-1.5">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ações Rápidas</span>
                            <span className="text-[10px] text-slate-400">Aplicar em lote</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button 
                                type="button"
                                onClick={() => handleApplyPreset(1)}
                                className="py-2 px-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-semibold tracking-tight text-center active:scale-95 transition-all"
                            >
                                1 Vaga Tudo
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleApplyPreset(2)}
                                className="py-2 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-[11px] font-semibold tracking-tight text-center active:scale-95 transition-all"
                            >
                                2 Vagas Tudo
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleApplyPreset(0)}
                                className="py-2 px-2 bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-xl text-[11px] font-semibold tracking-tight text-center active:scale-95 transition-all"
                            >
                                Fechar Todos
                            </button>
                        </div>
                    </section>
                    {/* END: QuickActionsBar */}

                    {/* BEGIN: TimeSlotList */}
                    <section className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-slate-900">Grade de Horários</span>
                                <span className="text-xs text-slate-400 font-medium">(07h às 19h)</span>
                            </div>
                            <span className="text-[11px] text-slate-400">Toque para alterar</span>
                        </div>

                        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2.5 md:space-y-0">
                            {displayHours.map((hour) => {
                                const slot = getSlot(hour);
                                const isClosed = !slot.is_active || slot.capacity === 0;
                                const isSingle = slot.is_active && slot.capacity === 1;
                                const isDouble = slot.is_active && slot.capacity === 2;
                                const isMore = slot.is_active && slot.capacity > 2;

                                return (
                                    <article 
                                        key={hour}
                                        className={`bg-white rounded-2xl p-3 border transition-all ${
                                            isClosed 
                                                ? 'border-slate-200/70 shadow-sm opacity-80' 
                                                : isSingle 
                                                ? 'border-2 border-emerald-500/80 shadow-[0_2px_10px_rgba(16,185,129,0.08)]' 
                                                : isDouble 
                                                ? 'border-2 border-blue-500/80 shadow-[0_2px_10px_rgba(59,130,246,0.08)]'
                                                : 'border-2 border-purple-500/80 shadow-[0_2px_10px_rgba(168,85,247,0.08)]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-black ${isClosed ? 'text-sm text-slate-700' : 'text-base text-slate-900'}`}>
                                                    {String(hour).padStart(2, '0')}:00
                                                </span>

                                                {/* Status Badge */}
                                                {isClosed && (
                                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                        Fechado
                                                    </span>
                                                )}
                                                {isSingle && (
                                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                        1 Vaga
                                                    </span>
                                                )}
                                                {isDouble && (
                                                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                        2 Vagas
                                                    </span>
                                                )}
                                                {isMore && (
                                                    <span className="text-[11px] font-bold text-purple-700 bg-purple-100/90 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                                        {slot.capacity} Vagas
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stepper */}
                                            <div className="flex items-center gap-1 bg-slate-100/80 rounded-lg p-0.5">
                                                <button 
                                                    type="button"
                                                    onClick={() => handleSetSlotCapacity(hour, Math.max(0, slot.capacity - 1))}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-slate-600 text-xs font-bold shadow-xs active:bg-slate-200 transition-colors"
                                                    title="Diminuir"
                                                >
                                                    -
                                                </button>
                                                <span className={`text-xs font-bold w-4 text-center ${isClosed ? 'text-slate-500' : 'text-slate-800'}`}>
                                                    {slot.capacity}
                                                </span>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleSetSlotCapacity(hour, slot.capacity + 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-slate-600 text-xs font-bold shadow-xs active:bg-slate-200 transition-colors"
                                                    title="Aumentar"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Direct Options: 0 (Off), 1 Vaga, 2 Vagas */}
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <button 
                                                type="button"
                                                onClick={() => handleSetSlotCapacity(hour, 0)}
                                                className={`py-1.5 rounded-xl text-[11px] transition-all ${
                                                    isClosed 
                                                        ? 'font-bold bg-slate-700 text-white shadow-xs' 
                                                        : 'font-medium bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                0 (Off)
                                            </button>

                                            <button 
                                                type="button"
                                                onClick={() => handleSetSlotCapacity(hour, 1)}
                                                className={`py-1.5 rounded-xl text-[11px] transition-all ${
                                                    isSingle 
                                                        ? 'font-bold bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600' 
                                                        : 'font-medium bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                                                }`}
                                            >
                                                1 Vaga
                                            </button>

                                            <button 
                                                type="button"
                                                onClick={() => handleSetSlotCapacity(hour, 2)}
                                                className={`py-1.5 rounded-xl text-[11px] transition-all ${
                                                    isDouble 
                                                        ? 'font-bold bg-blue-600 text-white shadow-sm ring-1 ring-blue-600' 
                                                        : 'font-medium bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                                }`}
                                            >
                                                2 Vagas
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                    {/* END: TimeSlotList */}

                </main>
                {/* END: MainContent */}

                {/* BEGIN: Mobile Fixed Bottom Bar (Apenas no Mobile < md) */}
                <aside className="md:hidden fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-4 pt-2.5 pb-6 z-40 shadow-2xl">
                    <div className="flex items-center gap-1.5 justify-center mb-2">
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                        <span className="text-[11px] text-slate-500 font-medium">Alterações passam a valer imediatamente</span>
                    </div>

                    <button 
                        type="button"
                        onClick={handleSave}
                        disabled={isSyncing}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#e11d68] to-[#db2777] hover:from-[#c81057] hover:to-[#be185d] text-white font-bold text-sm rounded-2xl shadow-[0_10px_25px_-5px_rgba(225,29,104,0.25)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isSyncing ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                        )}
                        <span>{isSyncing ? 'Sincronizando...' : 'Confirmar & Salvar Alterações'}</span>
                    </button>
                </aside>
                {/* END: Mobile Fixed Bottom Bar */}

                {/* BEGIN: Desktop Aligned Footer (100% alinhado dentro do card no Desktop) */}
                <aside className="hidden md:block sticky bottom-0 z-30 w-full bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-6 py-4 rounded-b-3xl shadow-lg mt-8">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span className="text-xs text-slate-500 font-medium">Alterações passam a valer imediatamente para agendamentos</span>
                        </div>

                        <button 
                            type="button"
                            onClick={handleSave}
                            disabled={isSyncing}
                            className="px-6 py-3 bg-gradient-to-r from-[#e11d68] to-[#db2777] hover:from-[#c81057] hover:to-[#be185d] text-white font-bold text-sm rounded-xl shadow-[0_10px_25px_-5px_rgba(225,29,104,0.25)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0"
                        >
                            {isSyncing ? (
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                                <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                            )}
                            <span>{isSyncing ? 'Sincronizando...' : 'Confirmar & Salvar Alterações'}</span>
                        </button>
                    </div>
                </aside>
                {/* END: Desktop Aligned Footer */}

            </div>
        </div>
    );
}
