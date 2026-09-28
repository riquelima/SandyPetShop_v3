import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const ClientLoginView: React.FC<{ onLogin: (phone: string, clientData: any) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/\D/g, '').substring(0, 11);
        let formatted = raw;
        if (raw.length > 2) {
            formatted = `(${raw.substring(0, 2)}) `;
            if (raw.length <= 10) {
                formatted += raw.substring(2, 6);
                if (raw.length > 6) formatted += '-' + raw.substring(6, 10);
            } else {
                formatted += raw.substring(2, 7);
                if (raw.length > 7) formatted += '-' + raw.substring(7, 11);
            }
        }
        setPhone(formatted);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawPhone = phone.replace(/\D/g, '');
        if (rawPhone.length < 10) {
            setError('Digite um número de telefone válido com DDD.');
            return;
        }

        const formatted11 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
        const formatted10 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);

        setLoading(true);
        setError('');

        try {
            let aggregatedData: any = {};
            let found = false;

            // Try monthly_clients
            const { data: monthlyDataArr } = await supabase
                .from('monthly_clients')
                .select('*')
                .or(`whatsapp.eq."${rawPhone}",whatsapp.eq."${formatted11}",whatsapp.eq."${formatted10}"`);

            if (monthlyDataArr && monthlyDataArr.length > 0) {
                const first = monthlyDataArr[0];
                aggregatedData = { 
                    ...first, 
                    isMensalista: true, 
                    monthlyPets: monthlyDataArr,
                    name: first.tutor_name || first.owner_name || 'Cliente' 
                };
                found = true;
            }

            // Try daycare_enrollments
            const { data: daycareDataArr } = await supabase
                .from('daycare_enrollments')
                .select('*')
                .or(`contact_phone.eq."${rawPhone}",contact_phone.eq."${formatted11}",contact_phone.eq."${formatted10}"`);

            if (daycareDataArr && daycareDataArr.length > 0) {
                const first = daycareDataArr[0];
                aggregatedData = {
                    ...aggregatedData, // keep existing mensalista fields if they exist
                    isDaycare: true,
                    daycarePets: daycareDataArr,
                    daycareData: first,
                    name: aggregatedData.name || first.tutor_name || 'Cliente'
                };
                // If the user isn't mensalista, we can just map the pet photo and id here so it works generically.
                if (!aggregatedData.id) aggregatedData.id = first.id;
                if (!aggregatedData.pet_photo_url) aggregatedData.pet_photo_url = first.pet_photo_url;
                if (!aggregatedData.pet_name) aggregatedData.pet_name = first.pet_name;
                
                found = true;
            }

            
            // Try hotel_registrations
            if (!found) {
                const { data: hotelDataArr } = await supabase
                    .from('hotel_registrations')
                    .select('*')
                    .or(`tutor_phone.eq."${rawPhone}",tutor_phone.eq."${formatted11}",tutor_phone.eq."${formatted10}"`);

                if (hotelDataArr && hotelDataArr.length > 0) {
                    const first = hotelDataArr[0];
                    aggregatedData = {
                        ...aggregatedData,
                        isHotel: true,
                        hotelPets: hotelDataArr,
                        hotelData: first,
                        name: aggregatedData.name || first.tutor_name || 'Cliente'
                    };
                    if (!aggregatedData.id) aggregatedData.id = first.id;
                    if (!aggregatedData.pet_photo_url) aggregatedData.pet_photo_url = first.pet_photo_url;
                    if (!aggregatedData.pet_name) aggregatedData.pet_name = first.pet_name;
                    
                    found = true;
                }
            }

            // Try clients
            const { data: clientData } = await supabase
                .from('clients')
                .select('*')
                .or(`phone.eq."${rawPhone}",phone.eq."${formatted11}",phone.eq."${formatted10}"`)
                .limit(1)
                .maybeSingle();

            if (clientData) {
                aggregatedData = { ...aggregatedData, name: aggregatedData.name || clientData.name || 'Cliente' };
                found = true;
            }

            // Try appointments
            if (!found) {
                const { data: apptData } = await supabase
                    .from('appointments')
                    .select('owner_name, whatsapp')
                    .or(`whatsapp.eq."${rawPhone}",whatsapp.eq."${formatted11}",whatsapp.eq."${formatted10}"`)
                    .order('appointment_time', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (apptData) {
                    aggregatedData = { ...aggregatedData, name: apptData.owner_name, whatsapp: apptData.whatsapp };
                    found = true;
                } else {
                    const { data: apptMovelData } = await supabase
                        .from('pet_movel_appointments')
                        .select('owner_name, whatsapp')
                        .or(`whatsapp.eq."${rawPhone}",whatsapp.eq."${formatted11}",whatsapp.eq."${formatted10}"`)
                        .order('appointment_time', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    
                    if (apptMovelData) {
                        aggregatedData = { ...aggregatedData, name: apptMovelData.owner_name, whatsapp: apptMovelData.whatsapp };
                        found = true;
                    }
                }
            }

            if (found) {
                if (aggregatedData.isMensalista === undefined) aggregatedData.isMensalista = false;
                onLogin(rawPhone, aggregatedData);
                return;
            }

            setError('Nenhum cadastro encontrado com este número.');
        } catch (err) {
            console.error('Error logging in client:', err);
            setError('Ocorreu um erro ao buscar seus dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-20 bg-[#FFF5F7] relative">
            {/* Botao Voltar no header (padrao dos formularios) */}
            <button
                type="button"
                onClick={onBack}
                aria-label="Voltar para a pagina inicial"
                title="Voltar para a pagina inicial"
                className="absolute top-6 left-2 sm:top-8 sm:left-4 z-[110] flex items-center justify-center w-10 h-10 bg-pink-50 text-pink-700 font-bold rounded-full shadow-sm hover:bg-pink-100 hover:shadow-md transition-all duration-300"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
            </button>

            <div className="mb-8 text-center animate-fadeInDown">
                <h1 className="font-brand text-5xl sm:text-6xl text-pink-900 tracking-tight leading-none drop-shadow-sm">
                    Sandy's <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">Pet Shop</span>
                </h1>
            </div>

            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center animate-fadeInUp">
                <div className="w-32 h-32 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                    <iframe
                        src="https://lottie.host/embed/70d1f5f9-34fa-4399-a363-31149183508f/eAiSwdNV2o.json"
                        className="w-full h-full pointer-events-none scale-110"
                        style={{ border: 'none' }}
                        title="Login Animation"
                    ></iframe>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Área do Cliente</h2>
                <p className="text-sm text-gray-500 mb-6">Digite seu telefone com DDD para acessar</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/14051/14051811.png"
                                alt="WhatsApp Icon"
                                className="h-4 w-4 opacity-60"
                            />
                        </span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="(11) 99999-9999"
                            className="w-full text-center text-xl py-4 px-12 border border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading || phone.replace(/\D/g, '').length < 10}
                        className="w-full bg-pink-600 text-white font-bold text-lg py-4 rounded-2xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 disabled:opacity-50"
                    >
                        {loading ? 'Buscando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
