import React, { useState, useMemo } from 'react';
import { 
    ClockIcon, 
    TruckIcon, 
    BuildingStorefrontIcon, 
    ArrowPathIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    ChevronLeftIcon,
    CommandLineIcon,
    DocumentDuplicateIcon,
    SparklesIcon,
    CalendarDaysIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { 
    useScheduleSlots, 
    ScheduleSlotConfig, 
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

const SQL_MIGRATION_TEXT = `-- Tabela para gerenciar dinamicamente a capacidade e grade de horários de atendimento
-- (Pet Móvel e Banho & Tosa Fixo)
CREATE TABLE IF NOT EXISTS public.schedule_slot_configs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category text NOT NULL, -- 'pet_movel' | 'fixed'
    condominium text,        -- 'Vitta Parque', 'Max Haus', 'Paseo' (ou null para fixo)
    day_of_week integer NOT NULL, -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    hour integer NOT NULL,        -- 8, 9, 10, 11, 12, 13, 14, 15, etc.
    capacity integer NOT NULL DEFAULT 1, -- 0=fechado, 1=1 vaga, 2=2 vagas, etc.
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT schedule_slot_configs_pkey PRIMARY KEY (id),
    CONSTRAINT schedule_slot_configs_unique_slot UNIQUE (category, condominium, day_of_week, hour)
);

CREATE INDEX IF NOT EXISTS idx_schedule_slot_configs_query 
ON public.schedule_slot_configs(category, condominium, day_of_week, is_active);

ALTER TABLE public.schedule_slot_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read schedule_slot_configs" 
ON public.schedule_slot_configs FOR SELECT USING (true);

CREATE POLICY "Admins can manage schedule_slot_configs" 
ON public.schedule_slot_configs FOR ALL USING (true) WITH CHECK (true);
`;

export default function AtendimentoView({ onBack }: AtendimentoViewProps) {
    const { 
        configs, 
        isLoading, 
        isSyncing, 
        isSupabaseOnline, 
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

        // Padrão
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
        setTimeout(() => setToastMessage(null), 4000);
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

        showToast(`Definido ${capacity} vaga(s) para todos os horários padrão (${hours[0]}h às ${hours[hours.length - 1]}h)!`);
    };

    // Salvar alterações
    const handleSave = async () => {
        const res = await saveAll(configs);
        showToast(res.message);
    };

    // Restaurar padrões
    const handleReset = async () => {
        if (window.confirm('Deseja realmente restaurar os horários padrão de fábrica? (Pet Móvel: 8h-15h 1 vaga; Fixo: 10h-17h/9h-16h 1 vaga)')) {
            const res = await resetToDefaults();
            showToast(res.message);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
            {/* Toast feedback */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700 text-sm font-medium animate-slideUp">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2.5 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 text-gray-600 hover:text-pink-600 transition-all shadow-sm"
                        title="Voltar ao Painel"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">
                                <SparklesIcon className="w-3.5 h-3.5" />
                                Administração
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                            Atendimento & Grade de Horários
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Gerencie slots de atendimento: configure 1 slot, 2 slots ou feche horários específicos.
                        </p>
                    </div>
                </div>

                {/* Botões de Ação do Topo */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm"
                    >
                        <ArrowPathIcon className="w-4 h-4 text-gray-500" />
                        Restaurar Padrão
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 shadow-md shadow-pink-500/20 transition-all disabled:opacity-50"
                    >
                        {isSyncing ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircleIcon className="w-4 h-4" />
                        )}
                        Salvar Alterações
                    </button>
                </div>
            </div>

            {/* Abas Principais: Pet Móvel vs Loja Física */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setActiveTab('pet_movel')}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'pet_movel'
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <TruckIcon className="w-5 h-5" />
                        <span>Pet Móvel (Condomínios)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('fixed')}
                        className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'fixed'
                                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <BuildingStorefrontIcon className="w-5 h-5" />
                        <span>Banho & Tosa Fixo (Loja)</span>
                    </button>
                </div>
            </div>

            {/* Sub-Seletores de Condomínio ou Dia da Semana */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Seletor de Condomínio (Pet Móvel) */}
                    {activeTab === 'pet_movel' ? (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Escolha o Condomínio & Dia de Atendimento
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {(
                                    [
                                        { name: 'Vitta Parque', day: 'Quarta-feira', dayNum: 3 },
                                        { name: 'Max Haus', day: 'Quinta-feira', dayNum: 4 },
                                        { name: 'Paseo', day: 'Sexta-feira', dayNum: 5 },
                                    ] as const
                                ).map(item => {
                                    const isSelected = selectedCondo === item.name;
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => setSelectedCondo(item.name)}
                                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <CalendarDaysIcon className={`w-4 h-4 ${isSelected ? 'text-pink-600' : 'text-gray-400'}`} />
                                            <span>{item.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-normal">
                                                {item.day}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Seletor de Dia da Semana (Banho & Tosa Fixo) */
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Escolha o Dia da Semana (Loja Física)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {[
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
                                            onClick={() => setSelectedFixedDay(item.dayNum)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                                                isSelected
                                                    ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <CalendarDaysIcon className={`w-4 h-4 ${isSelected ? 'text-pink-600' : 'text-gray-400'}`} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Cartão de Resumo Rápido da Grade Selecionada */}
                    <div className="flex items-center gap-4 bg-gray-50 border border-gray-200/80 rounded-xl px-4 py-3 shrink-0">
                        <div>
                            <span className="text-xs text-gray-500 block">Horários Abertos</span>
                            <span className="text-lg font-bold text-gray-900">{stats.activeSlotsCount} horários</span>
                        </div>
                        <div className="h-8 w-px bg-gray-200" />
                        <div>
                            <span className="text-xs text-gray-500 block">Total de Vagas</span>
                            <span className="text-lg font-bold text-pink-600">{stats.totalCapacity} vagas</span>
                        </div>
                    </div>
                </div>

                {/* Barra de Ações em Lote (Presets Rápidos) */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Ações Rápidas:
                        </span>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(1)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                            Definir 1 Slot em Todos (Padrão Único)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(2)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                            Definir 2 Slots em Todos (Slots Duplos)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleApplyPreset(0)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
                        >
                            Fechar Todos
                        </button>
                    </div>

                    <div className="text-xs text-gray-500">
                        * Padrão atual: 08h às 15h, 1 vaga por horário.
                    </div>
                </div>
            </div>

            {/* Grade Visual dos Horários */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-pink-600" />
                            Grade Horária para {activeTab === 'pet_movel' ? `${selectedCondo}` : 'Loja Física'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Clique nos botões de cada horário para alternar instantaneamente entre Fechado, 1 Slot ou 2 Slots.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {displayHours.map(hour => {
                        const slot = getSlot(hour);
                        const isClosed = !slot.is_active || slot.capacity === 0;
                        const isSingle = slot.is_active && slot.capacity === 1;
                        const isDouble = slot.is_active && slot.capacity === 2;
                        const isMore = slot.is_active && slot.capacity > 2;

                        return (
                            <div
                                key={hour}
                                className={`relative rounded-2xl p-4 border transition-all duration-200 ${
                                    isClosed
                                        ? 'bg-gray-50/70 border-dashed border-gray-300 opacity-80'
                                        : isSingle
                                        ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                                        : isDouble
                                        ? 'bg-indigo-50/40 border-indigo-300 shadow-sm'
                                        : 'bg-purple-50/40 border-purple-300 shadow-sm'
                                }`}
                            >
                                {/* Horário e Badge de Status */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-gray-900 tracking-tight">
                                            {String(hour).padStart(2, '0')}:00
                                        </span>
                                    </div>

                                    {/* Tag de Estado */}
                                    {isClosed && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">
                                            Fechado
                                        </span>
                                    )}
                                    {isSingle && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            1 Vaga (Único)
                                        </span>
                                    )}
                                    {isDouble && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                            2 Vagas (Duplo)
                                        </span>
                                    )}
                                    {isMore && (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                                            {slot.capacity} Vagas
                                        </span>
                                    )}
                                </div>

                                {/* Botões Rápidos de Vagas (0, 1, 2) */}
                                <div className="grid grid-cols-3 gap-1.5 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => handleSetSlotCapacity(hour, 0)}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            isClosed
                                                ? 'bg-gray-700 text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        0 (Off)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetSlotCapacity(hour, 1)}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            isSingle
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                                        }`}
                                    >
                                        1 Vaga
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSetSlotCapacity(hour, 2)}
                                        className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                            isDouble
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                        }`}
                                    >
                                        2 Vagas
                                    </button>
                                </div>

                                {/* Stepper de Ajuste Fino (+ / -) */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                                    <span>Capacidade custom:</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleSetSlotCapacity(hour, Math.max(0, slot.capacity - 1))}
                                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm"
                                            title="Diminuir 1 vaga"
                                        >
                                            -
                                        </button>
                                        <span className="w-5 text-center font-bold text-gray-800">
                                            {slot.capacity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleSetSlotCapacity(hour, slot.capacity + 1)}
                                            className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm"
                                            title="Aumentar 1 vaga"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Rodapé informativo */}
                <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Qualquer alteração feita nesta tela passa a valer imediatamente para agendamentos e mensalistas.</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSyncing}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-pink-600 text-white hover:bg-pink-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isSyncing ? 'Sincronizando...' : 'Confirmar & Salvar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
