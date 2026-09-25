import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const ClientAreaView: React.FC<{ clientData: any; phone: string; onLogout: () => void }> = ({ clientData, phone, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'appointments' | 'fidelity' | 'invoices'>('appointments');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loadingAppts, setLoadingAppts] = useState(true);

    const [loyaltyData, setLoyaltyData] = useState<any>(null);
    const [loadingLoyalty, setLoadingLoyalty] = useState(false);

    useEffect(() => {
        const rawPhone = phone.replace(/\D/g, '');
        const formatted11 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
        const formatted10 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);

        const fetchAppointments = async () => {
            setLoadingAppts(true);
            try {
                // Fetch from appointments
                const { data: apptData } = await supabase
                    .from('appointments')
                    .select('*')
                    .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`)
                    .order('appointment_time', { ascending: false });

                // Fetch from pet_movel_appointments
                const { data: movelData } = await supabase
                    .from('pet_movel_appointments')
                    .select('*')
                    .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`)
                    .order('appointment_time', { ascending: false });

                // Fetch from agendamento_banhotosa
                const { data: banhoData } = await supabase
                    .from('agendamento_banhotosa')
                    .select('*')
                    .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`)
                    .order('appointment_time', { ascending: false });

                const combined = [
                    ...(apptData || []).map(a => ({ ...a, source: 'Banho e Tosa' })),
                    ...(movelData || []).map(a => ({ ...a, source: 'Pet Móvel' })),
                    ...(banhoData || []).map(a => ({ ...a, source: 'Agendamento' }))
                ].sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());

                setAppointments(combined);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingAppts(false);
            }
        };

        fetchAppointments();
    }, [phone]);

    useEffect(() => {
        if (!clientData.isMensalista) {
            const rawPhone = phone.replace(/\D/g, '');
            const formatted11 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
            const formatted10 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);

            const fetchLoyalty = async () => {
                setLoadingLoyalty(true);
                try {
                    const { data } = await supabase
                        .from('loyalty_cards')
                        .select('*')
                        .or(`client_phone.eq."${rawPhone}",client_phone.eq."${formatted11}",client_phone.eq."${formatted10}"`)
                        .maybeSingle();
                    if (data) {
                        setLoyaltyData(data);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingLoyalty(false);
                }
            };
            fetchLoyalty();
        }
    }, [phone, clientData.isMensalista]);

    const upcoming = appointments.filter(a => a.status === 'AGENDADO' || a.status === 'Agendado' || !a.status);
    const past = appointments.filter(a => a.status?.toUpperCase() === 'CONCLUÍDO' || a.status?.toUpperCase() === 'CONCLUIDO');

    return (
        <div className="min-h-screen bg-[#FFF5F7] pb-20">
            {/* Header / Avatar */}
            <div className="bg-pink-600 rounded-b-[40px] pt-12 pb-16 px-6 text-center text-white shadow-lg relative">
                <button onClick={onLogout} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
                <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full p-1 shadow-md">
                    <img 
                        src={clientData.pet_photo_url || 'https://cdn-icons-png.flaticon.com/512/3009/3009489.png'} 
                        alt="Avatar" 
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
                <h1 className="text-2xl font-bold font-brand tracking-wide">Olá, {clientData.name.split(' ')[0]}!</h1>
                <p className="text-pink-100 mt-1">{clientData.pet_name ? `Tutor(a) do ${clientData.pet_name}` : 'Bem-vindo(a) à sua área'}</p>
            </div>

            {/* Content Tabs */}
            <div className="max-w-md mx-auto px-4 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2 mb-6">
                    <button 
                        onClick={() => setActiveTab('appointments')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'appointments' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Agenda
                    </button>
                    
                    {!clientData.isMensalista ? (
                        <button 
                            onClick={() => setActiveTab('fidelity')}
                            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'fidelity' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Fidelidade
                        </button>
                    ) : (
                        <button 
                            onClick={() => setActiveTab('invoices')}
                            className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'invoices' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Faturas
                        </button>
                    )}
                </div>

                {/* Agenda View */}
                {activeTab === 'appointments' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Próximos
                            </h3>
                            {loadingAppts ? (
                                <p className="text-gray-400 text-center py-4">Buscando...</p>
                            ) : upcoming.length > 0 ? (
                                <div className="space-y-3">
                                    {upcoming.map((appt, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-gray-800">{new Date(appt.appointment_time).toLocaleDateString('pt-BR')}</p>
                                                    <p className="text-sm text-gray-500">{new Date(appt.appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Agendado
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-gray-50 mt-1">
                                                <p className="text-sm text-gray-700 font-medium">Pet: {appt.pet_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {appt.service?.includes(appt.source) ? appt.service : `${appt.service} ${appt.source ? `(${appt.source})` : ''}`.trim()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-gray-100">
                                    <p className="text-gray-500">Nenhum agendamento futuro.</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 bg-gray-300 rounded-full"></span> Histórico Realizado
                            </h3>
                            {loadingAppts ? (
                                <p className="text-gray-400 text-center py-4">Buscando...</p>
                            ) : past.length > 0 ? (
                                <div className="space-y-3">
                                    {past.slice(0, 10).map((appt, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 opacity-80">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-gray-700">{new Date(appt.appointment_time).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                                                    Concluído
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 font-medium">{appt.pet_name} - {appt.service}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center text-sm py-4">Sem histórico de serviços.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Fidelity View */}
                {activeTab === 'fidelity' && !clientData.isMensalista && (
                    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6 animate-fadeIn text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-3xl">⭐</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Seu Cartão Fidelidade</h3>
                        
                        {loadingLoyalty ? (
                            <p className="text-gray-400 py-4">Carregando selos...</p>
                        ) : loyaltyData ? (
                            <>
                                <p className="text-gray-500 text-sm mb-6">A cada 10 banhos, ganhe uma tosa higiênica ou hidratação!</p>
                                <div className="grid grid-cols-5 gap-3 max-w-xs mx-auto">
                                    {Array.from({ length: 10 }).map((_, i) => {
                                        const isFilled = i < loyaltyData.stamps_count;
                                        return (
                                            <div key={i} className={`w-full aspect-square rounded-full flex items-center justify-center border-2 ${isFilled ? 'bg-pink-100 border-pink-400 shadow-inner' : 'border-gray-200 bg-gray-50'}`}>
                                                {isFilled ? <span className="text-pink-500 text-lg">🐾</span> : <span className="text-gray-300 text-xs">{i+1}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <p className="text-sm font-bold text-pink-600">Faltam {10 - loyaltyData.stamps_count} banhos para seu brinde!</p>
                                </div>
                            </>
                        ) : (
                            <div className="py-6">
                                <p className="text-gray-500 text-sm mb-4">Você ainda não tem selos fidelidade. Agende um banho para começar a juntar!</p>
                                <div className="grid grid-cols-5 gap-3 max-w-xs mx-auto opacity-40">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="w-full aspect-square rounded-full flex items-center justify-center border-2 border-gray-200 bg-gray-50">
                                            <span className="text-gray-300 text-xs">{i+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Invoices View */}
                {activeTab === 'invoices' && clientData.isMensalista && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Current/Open */}
                        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Fatura Atual (Em aberto)</h3>
                            
                            {clientData.payment_status === 'Pendente' || !clientData.payment_status ? (
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-3xl font-black text-gray-800">R$ {clientData.price?.toFixed(2).replace('.', ',')}</p>
                                        <p className="text-sm font-medium text-red-500">Vence dia {clientData.payment_due_date || '--'}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4">Plano: {clientData.recurrence_type === 'weekly' ? 'Semanal' : clientData.recurrence_type === 'bi-weekly' ? 'Quinzenal' : 'Mensal'}</p>
                                    
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">Nenhuma fatura em aberto no momento. Tudo certo por aqui! ✨</p>
                            )}
                        </div>

                        {/* History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Histórico de Pagas</h3>
                            
                            {clientData.payment_status === 'Pago' ? (
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-gray-700">Mês Atual</p>
                                        <p className="text-xs text-gray-500">R$ {clientData.price?.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                                        Pago
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {/* Mockup historical data just to show the structure if needed, or say no history */}
                                    <p className="text-gray-400 text-sm italic text-center py-4">Sem histórico anterior disponível no sistema.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
