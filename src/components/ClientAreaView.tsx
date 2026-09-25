import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const cleanServiceName = (service: string) => {
    return (service || '')
        .replace(/\(Pet M[oó]vel\)/ig, '')
        .replace(/\(Banho\s*&\s*Tosa\)/ig, '')
        .replace(/Pet M[oó]vel/ig, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const formatName = (name: string) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const FallbackLottieAvatar = ({ className = "" }: { className?: string }) => (
    <div className={`overflow-hidden relative flex items-center justify-center ${className}`}>
        <iframe 
            src="https://lottie.host/embed/ee823306-d890-4936-8032-f1bae7614d82/A1LpnduBwz.json"
            className="w-full h-full pointer-events-none" 
            style={{ border: 'none' }}
        ></iframe>
    </div>
);

export const ClientAreaView: React.FC<{ clientData: any; phone: string; onLogout: () => void }> = ({ clientData, phone, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'appointments' | 'fidelity' | 'invoices' | 'daycare'>('appointments');
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loadingAppts, setLoadingAppts] = useState(true);
    const [daycareDiaries, setDaycareDiaries] = useState<any[]>([]);

    const [loyaltyData, setLoyaltyData] = useState<any>(null);
    const [loadingLoyalty, setLoadingLoyalty] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState(clientData.pet_photo_url || null);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${clientData.id || clientData.phone?.replace(/\D/g, '') || phone.replace(/\D/g, '')}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
    
        setUploadingPhoto(true);
    
        try {
            const { error: uploadError } = await supabase.storage
                .from('monthly_pet_photos')
                .upload(filePath, file);
    
            if (uploadError) throw uploadError;
    
            const { data: { publicUrl } } = supabase.storage
                .from('monthly_pet_photos')
                .getPublicUrl(filePath);
    
            if (clientData.id && clientData.isMensalista) {
                await supabase.from('monthly_clients').update({ pet_photo_url: publicUrl }).eq('id', clientData.id);
            }
            if (clientData.pet_name) {
                const rawPhone = phone.replace(/\D/g, '');
                const formatted11 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
                const formatted10 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);
                
                await supabase.from('daycare_enrollments')
                    .update({ pet_photo_url: publicUrl })
                    .ilike('pet_name', clientData.pet_name)
                    .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`);

                await supabase.from('hotel_registrations')
                    .update({ pet_photo_url: publicUrl })
                    .ilike('pet_name', clientData.pet_name)
                    .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`);
            }
            
            setPhotoUrl(publicUrl);
            clientData.pet_photo_url = publicUrl;
        } catch (err) {
            console.error(err);
            alert('Erro ao fazer upload da foto. Tente novamente.');
        } finally {
            setUploadingPhoto(false);
        }
    };

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

    useEffect(() => {
        if (clientData.isDaycare && clientData.id) {
            const fetchDiaries = async () => {
                try {
                    const { data } = await supabase
                        .from('daycare_diary_entries')
                        .select('*')
                        .eq('enrollment_id', clientData.id)
                        .order('date', { ascending: false })
                        .limit(10);
                    if (data) setDaycareDiaries(data);
                } catch (e) {
                    console.error(e);
                }
            };
            fetchDiaries();
        }
    }, [clientData.id, clientData.isDaycare]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfToday = new Date(now.setHours(0,0,0,0)).getTime();

    const upcoming = appointments
        .filter(a => {
            const isAgendado = a.status === 'AGENDADO' || a.status === 'Agendado' || !a.status;
            if (!isAgendado) return false;
            const d = new Date(a.appointment_time);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && d.getTime() >= startOfToday;
        })
        .sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
    const past = appointments.filter(a => a.status?.toUpperCase() === 'CONCLUÍDO' || a.status?.toUpperCase() === 'CONCLUIDO');

    const hasAppointments = future.length > 0 || past.length > 0;
    // Show agenda if loading, or if they have appointments, or if they are just a regular avulso client
    const showAgenda = loadingAppts || hasAppointments || (!clientData.isDaycare && !clientData.isMensalista);
    const showFidelidade = !clientData.isMensalista && showAgenda;

    useEffect(() => {
        if (!loadingAppts && activeTab === 'appointments' && !showAgenda) {
            if (clientData.isDaycare) setActiveTab('daycare');
            else if (clientData.isMensalista) setActiveTab('invoices');
            else setActiveTab('fidelity');
        }
    }, [loadingAppts, showAgenda, activeTab, clientData]);

    const formatPlanBR = (plan: string | null | undefined) => {
        const s = String(plan || '').toLowerCase();
        const m = s.match(/^(\d+)x_(week|month)$/);
        if (m) {
            const n = m[1];
            const period = m[2] === 'week' ? 'vezes na semana' : 'vezes no mês';
            return `${n} ${period}`;
        }
        return s.replace('_', ' ');
    };

    const getDynamicDueDate = () => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
        return `30 de ${formatter.format(now)}`;
    };

    const behaviorLabel = (n: number | string | undefined) => {
        const num = Number(n);
        switch (num) {
            case 1: return 'Anjinho 😇';
            case 2: return 'Arteirinho às vezes 😼';
            case 3: return 'Bagunceiro 🤪';
            case 4: return 'Terrorzinho 😈';
            case 5: return 'O Rei do Caos 🌪️';
            default: return typeof n === 'string' ? n : '-';
        }
    };

    const getMoodIcon = (mood: string | undefined) => {
        const m = String(mood || '');
        if (m.includes('Feliz') || m.includes('Animado')) return '🥰';
        if (m.includes('Cansado') || m.includes('Preguiça')) return '😴';
        if (m.includes('Agitado') || m.includes('Energia')) return '⚡';
        if (m.includes('Triste') || m.includes('Quieto')) return '😢';
        return '🐾';
    };

    return (
        <div className="min-h-screen bg-[#FFF5F7] pb-20">
            {/* Header / Avatar */}
            <div className="bg-pink-600 rounded-b-[40px] pt-12 pb-16 px-6 text-center text-white shadow-lg relative">
                <button onClick={onLogout} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
                <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="w-full h-full bg-white rounded-full p-1 shadow-md">
                        {photoUrl ? (
                            <img 
                                src={photoUrl} 
                                alt="Avatar" 
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <FallbackLottieAvatar className="w-full h-full rounded-full" />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-pink-500 rounded-full p-2 shadow-lg cursor-pointer hover:bg-pink-400 transition-colors border-2 border-white">
                        {uploadingPhoto ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"></span>
                        ) : (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                </div>
                <h1 className="text-2xl font-bold font-brand tracking-wide">Olá, {formatName(clientData.name.split(' ')[0])}!</h1>
                <p className="text-pink-100 text-sm mt-1.5 px-4 font-medium opacity-90">
                    {clientData.isDaycare
                        ? "Acompanhe a rotina do seu pet na creche e consulte suas faturas."
                        : clientData.isMensalista 
                        ? "Gerencie seus próximos agendamentos e acompanhe suas faturas com facilidade."
                        : "Gerencie seus agendamentos e acompanhe seus pontos no Cartão Fidelidade."}
                </p>
            </div>

            {/* Content Tabs */}
            <div className="max-w-md mx-auto px-4 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-1 mb-6 overflow-x-auto snap-x hide-scrollbar">
                    {showAgenda && (
                        <button 
                            onClick={() => setActiveTab('appointments')}
                            className={`flex-1 min-w-[100px] snap-center py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'appointments' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Agenda
                        </button>
                    )}
                    
                    {clientData.isDaycare && (
                        <button 
                            onClick={() => setActiveTab('daycare')}
                            className={`flex-1 min-w-[100px] snap-center py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'daycare' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Creche
                        </button>
                    )}

                    {clientData.isMensalista && (
                        <button 
                            onClick={() => setActiveTab('invoices')}
                            className={`flex-1 min-w-[100px] snap-center py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'invoices' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Faturas
                        </button>
                    )}
                    
                    {showFidelidade && (
                        <button 
                            onClick={() => setActiveTab('fidelity')}
                            className={`flex-1 min-w-[100px] snap-center py-3 text-sm font-semibold rounded-xl transition-all ${activeTab === 'fidelity' ? 'bg-pink-100 text-pink-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Fidelidade
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
                                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 flex items-center gap-4 hover:shadow-md transition-shadow">
                                            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-pink-100 bg-pink-50">
                                                {photoUrl ? (
                                                    <img 
                                                        src={photoUrl} 
                                                        alt={appt.pet_name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FallbackLottieAvatar className="w-full h-full bg-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className="font-bold text-gray-800 text-base">{formatName(appt.pet_name)}</h4>
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Agendado
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-pink-600 mb-0.5">{cleanServiceName(appt.service)}</p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {(() => {
                                                        const d = new Date(appt.appointment_time);
                                                        const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long' });
                                                        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                                                        return `${capitalizedDay}, ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                                                    })()}
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
                                        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 opacity-80 hover:opacity-100 transition-opacity">
                                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100 bg-gray-50 grayscale">
                                                {photoUrl ? (
                                                    <img 
                                                        src={photoUrl} 
                                                        alt={appt.pet_name} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FallbackLottieAvatar className="w-full h-full bg-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className="font-bold text-gray-700 text-sm">{formatName(appt.pet_name)}</h4>
                                                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        Concluído
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-gray-600 mb-0.5">{cleanServiceName(appt.service)}</p>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {new Date(appt.appointment_time).toLocaleDateString('pt-BR')}
                                                </p>
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

                {/* Daycare View */}
                {activeTab === 'daycare' && clientData.isDaycare && (
                    <div className="space-y-6 animate-fadeIn">
                        
                        {/* Current/Open Invoice & Plan */}
                        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Plano e Fatura (Creche)</h3>
                            
                            {(() => {
                                const now = new Date();
                                const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                                
                                let paymentMap: Record<string, string> = {};
                                const targetData = clientData.daycareData || clientData;
                                
                                if (typeof targetData.payment_status === 'string') {
                                    try { paymentMap = JSON.parse(targetData.payment_status); } catch(e) {}
                                } else if (targetData.payment_status && typeof targetData.payment_status === 'object') {
                                    paymentMap = targetData.payment_status;
                                }

                                const currentMonthStatus = paymentMap[currentYYYYMM] || 'Pendente';
                                const rawDate = targetData.payment_date;
                                const dueDateStr = rawDate ? String(rawDate).split('-').reverse().join('/') : '--';
                                const priceNum = Number(targetData.total_price || 0);

                                return currentMonthStatus === 'Pendente' ? (
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-3xl font-black text-gray-800">R$ {priceNum.toFixed(2).replace('.', ',')}</p>
                                            <p className="text-sm font-medium text-red-500">Vence dia {getDynamicDueDate()}</p>
                                        </div>
                                        <p className="text-xs mb-4">
                                            <span className="bg-pink-100 text-pink-700 font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                                                Plano: {formatPlanBR(targetData.contracted_plan)} {targetData.attendance_days ? `(${targetData.attendance_days})` : ''}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Sua fatura deste mês já está paga. Tudo certo por aqui! ✨</p>
                                );
                            })()}
                        </div>

                        {/* Recent Diaries */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="text-lg">📖</span> Diário da Creche
                            </h3>
                            
                            {daycareDiaries.length > 0 ? (
                                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-5 px-5">
                                    {daycareDiaries.map((diary, i) => (
                                        <div key={i} className="min-w-[280px] w-full max-w-[320px] shrink-0 snap-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-pink-100 shadow-sm p-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-purple-400 to-pink-400"></div>
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="font-bold text-pink-700 bg-white px-3 py-1.5 rounded-full shadow-sm text-sm border border-pink-100">
                                                    {diary.date ? new Date(diary.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '--'}
                                                </p>
                                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-pink-100">
                                                    <span className="text-xs font-bold text-gray-600">{diary.mood || 'Normal'}</span>
                                                    <span className="text-lg leading-none">{getMoodIcon(diary.mood)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3 bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Comportamento</p>
                                                    <p className="text-sm font-semibold text-gray-800">{behaviorLabel(diary.behavior)}</p>
                                                </div>
                                                <div className="h-px w-full bg-gray-100"></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Alimentação</p>
                                                    <p className="text-sm font-semibold text-gray-800">{diary.feeding || '-'}</p>
                                                </div>
                                                <div className="h-px w-full bg-gray-100"></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Necessidades</p>
                                                    <p className="text-sm font-semibold text-gray-800">{Array.isArray(diary.needs_logs) ? (diary.needs_logs.map((n:any)=>`${n.type || 'Fez'} (${n.time || '--'})`).join(', ') || '-') : (typeof diary.needs_logs === 'string' ? diary.needs_logs : '-')}</p>
                                                </div>
                                            </div>
                                            {diary.obs && (
                                                <div className="mt-3 bg-white/60 p-3.5 rounded-xl border border-pink-50">
                                                    <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest mb-1">Observações Gerais</p>
                                                    <p className="text-sm text-gray-700 italic font-medium leading-snug">"{diary.obs}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm italic text-center py-4">Nenhum diário registrado recentemente.</p>
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
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Fatura Atual (Banho e Tosa)</h3>
                            
                            {(() => {
                                const now = new Date();
                                const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                                
                                let paymentMap: Record<string, string> = {};
                                if (typeof clientData.payment_status === 'string') {
                                    try { paymentMap = JSON.parse(clientData.payment_status); } catch(e) {}
                                } else if (clientData.payment_status && typeof clientData.payment_status === 'object') {
                                    paymentMap = clientData.payment_status;
                                }

                                const currentMonthStatus = paymentMap[currentYYYYMM] || 'Pendente';
                                const dueDateStr = clientData.payment_due_date ? clientData.payment_due_date.split('-').reverse().join('/') : '--';

                                return currentMonthStatus === 'Pendente' ? (
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-3xl font-black text-gray-800">R$ {clientData.price?.toFixed(2).replace('.', ',')}</p>
                                            <p className="text-sm font-medium text-red-500">Vence dia {dueDateStr}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4">Plano: {clientData.recurrence_type === 'weekly' ? 'Semanal' : clientData.recurrence_type === 'bi-weekly' ? 'Quinzenal' : 'Mensal'}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Sua fatura de banho e tosa deste mês já está paga. Tudo certo por aqui! ✨</p>
                                );
                            })()}
                        </div>

                        {clientData.isDaycare && (() => {
                            const targetData = clientData.daycareData || clientData;
                            const now = new Date();
                            const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                            
                            let paymentMap: Record<string, string> = {};
                            if (typeof targetData.payment_status === 'string') {
                                try { paymentMap = JSON.parse(targetData.payment_status); } catch(e) {}
                            } else if (targetData.payment_status && typeof targetData.payment_status === 'object') {
                                paymentMap = targetData.payment_status;
                            }

                            const currentMonthStatus = paymentMap[currentYYYYMM] || 'Pendente';
                            const priceNum = Number(targetData.total_price || 0);

                            return (
                                <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-2 h-full bg-purple-400"></div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Fatura Atual (Creche)</h3>
                                    {currentMonthStatus === 'Pendente' ? (
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-3xl font-black text-gray-800">R$ {priceNum.toFixed(2).replace('.', ',')}</p>
                                                <p className="text-sm font-medium text-purple-500">Vence dia {getDynamicDueDate()}</p>
                                            </div>
                                            <p className="text-xs mb-4">
                                                <span className="bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                                                    Plano: {formatPlanBR(targetData.contracted_plan)} {targetData.attendance_days ? `(${targetData.attendance_days})` : ''}
                                                </span>
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">Sua fatura da creche deste mês já está paga. ✨</p>
                                    )}
                                </div>
                            );
                        })()}

                        {/* History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Histórico de Pagas</h3>
                            
                            {(() => {
                                let paymentMap: Record<string, string> = {};
                                if (typeof clientData.payment_status === 'string') {
                                    try { paymentMap = JSON.parse(clientData.payment_status); } catch(e) {}
                                } else if (clientData.payment_status && typeof clientData.payment_status === 'object') {
                                    paymentMap = clientData.payment_status;
                                }

                                const paidMonths = Object.entries(paymentMap).filter(([k, v]) => v === 'Pago' || v === 'PAGO').sort((a, b) => b[0].localeCompare(a[0]));

                                return paidMonths.length > 0 ? (
                                    <div className="space-y-3">
                                        {paidMonths.map(([monthStr, _]) => {
                                            const [year, month] = monthStr.split('-');
                                            return (
                                                <div key={monthStr} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                                    <div>
                                                        <p className="font-bold text-gray-700">{month}/{year}</p>
                                                        <p className="text-xs text-gray-500">R$ {clientData.price?.toFixed(2).replace('.', ',')}</p>
                                                    </div>
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                                                        Pago
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-gray-400 text-sm italic text-center py-4">Sem histórico de faturas pagas disponível.</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
