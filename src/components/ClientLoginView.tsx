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
            const { data: monthlyData } = await supabase
                .from('monthly_clients')
                .select('*')
                .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`)
                .maybeSingle();

            if (monthlyData) {
                aggregatedData = { ...monthlyData, isMensalista: true, name: monthlyData.tutor_name || monthlyData.owner_name || 'Cliente' };
                found = true;
            }

            // Try daycare_enrollments
            const { data: daycareData } = await supabase
                .from('daycare_enrollments')
                .select('*')
                .or(`contact_phone.ilike."%${rawPhone}%",contact_phone.ilike."%${formatted11}%",contact_phone.ilike."%${formatted10}%"`)
                .maybeSingle();

            if (daycareData) {
                aggregatedData = {
                    ...aggregatedData, // keep existing mensalista fields if they exist
                    isDaycare: true,
                    daycareData: daycareData,
                    name: aggregatedData.name || daycareData.tutor_name || 'Cliente'
                };
                // If the user isn't mensalista, we can just map the pet photo and id here so it works generically.
                if (!aggregatedData.id) aggregatedData.id = daycareData.id;
                if (!aggregatedData.pet_photo_url) aggregatedData.pet_photo_url = daycareData.pet_photo_url;
                if (!aggregatedData.pet_name) aggregatedData.pet_name = daycareData.pet_name;
                
                found = true;
            }

            // Try clients
            const { data: clientData } = await supabase
                .from('clients')
                .select('*')
                .or(`phone.ilike."%${rawPhone}%",phone.ilike."%${formatted11}%",phone.ilike."%${formatted10}%"`)
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
                    .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`)
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
                        .or(`whatsapp.ilike."%${rawPhone}%",whatsapp.ilike."%${formatted11}%",whatsapp.ilike."%${formatted10}%"`)
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
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FFF5F7]">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center animate-fadeInUp">
                <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <iframe 
                        src="https://lottie.host/embed/70d1f5f9-34fa-4399-a363-31149183508f/eAiSwdNV2o.json"
                        className="w-full h-full pointer-events-none scale-150" 
                        style={{ border: 'none' }}
                        title="Login Animation"
                    ></iframe>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Área do Cliente</h2>
                <p className="text-sm text-gray-500 mb-6">Digite seu telefone com DDD para acessar</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="tel"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="(11) 99999-9999"
                            className="w-full text-center text-xl p-4 border border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
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

                <button onClick={onBack} className="mt-8 text-sm text-gray-400 hover:text-pink-600 font-medium transition-colors">
                    ← Voltar para a página inicial
                </button>
            </div>
        </div>
    );
};
