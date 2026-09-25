import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const ClientLoginView: React.FC<{ onLogin: (phone: string, clientData: any) => void; onBack: () => void }> = ({ onLogin, onBack }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.substring(0, 11);
        if (val.length > 2) {
            val = `(${val.substring(0,2)}) ${val.substring(2)}`;
        }
        if (val.length > 9) {
            val = `${val.substring(0,9)}-${val.substring(9)}`;
        }
        setPhone(val);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const rawPhone = phone.replace(/\D/g, '');
        if (rawPhone.length < 10) {
            setError('Digite um número de telefone válido com DDD.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // First try monthly_clients
            const { data: monthlyData, error: monthlyError } = await supabase
                .from('monthly_clients')
                .select('*')
                .ilike('whatsapp', `%${rawPhone}%`)
                .maybeSingle();

            if (monthlyData) {
                onLogin(rawPhone, { ...monthlyData, isMensalista: true, name: monthlyData.tutor_name || monthlyData.owner_name || 'Cliente' });
                return;
            }

            // Then try clients
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .ilike('phone', `%${rawPhone}%`)
                .maybeSingle();

            if (clientData) {
                onLogin(rawPhone, { ...clientData, isMensalista: false, name: clientData.name || 'Cliente' });
                return;
            }

            // Finally try appointments just to check if they have scheduled anything
            const { data: apptData, error: apptError } = await supabase
                .from('appointments')
                .select('owner_name, whatsapp')
                .ilike('whatsapp', `%${rawPhone}%`)
                .order('appointment_time', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (apptData) {
                onLogin(rawPhone, { name: apptData.owner_name, whatsapp: apptData.whatsapp, isMensalista: false });
                return;
            }
            
            // Or try pet_movel_appointments
             const { data: apptMovelData } = await supabase
                .from('pet_movel_appointments')
                .select('owner_name, whatsapp')
                .ilike('whatsapp', `%${rawPhone}%`)
                .order('appointment_time', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (apptMovelData) {
                onLogin(rawPhone, { name: apptMovelData.owner_name, whatsapp: apptMovelData.whatsapp, isMensalista: false });
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
                <div className="w-20 h-20 mx-auto mb-6 bg-pink-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
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
