import React, { useState, useEffect } from 'react';
import { ClientLoginView } from '../components/ClientLoginView';
import { ClientAreaView } from '../components/ClientAreaView';

const LOGO_URL = 'https://i.imgur.com/M3Gt3OA.png';

const ClientAreaPage: React.FC = () => {
    const [clientPhone, setClientPhone] = useState('');
    const [clientData, setClientData] = useState<any>(null);
    const [splashDone, setSplashDone] = useState(false);

    // Permitir voltar para a página inicial ao clicar na logo
    const goHome = () => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleLogout = () => {
        setClientPhone('');
        setClientData(null);
        setSplashDone(false);
        // Mantém na URL /cliente, mas sem login (volta ao login)
    };

    // Splash simples com nome do cliente (sem animação de áudio da App principal)
    useEffect(() => {
        if (!clientData) {
            setSplashDone(false);
        }
    }, [clientData]);

    if (!clientData) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-white to-rose-50">
                <header className="pt-6 px-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={goHome}
                        className="flex items-center gap-2 group"
                        aria-label="Voltar para a página inicial"
                    >
                        <img src={LOGO_URL} alt="Sandy's Pet Shop" className="h-10 w-10 rounded-full object-contain" />
                        <span className="font-brand text-2xl text-pink-800 group-hover:text-pink-600 transition-colors">Sandy's Pet Shop</span>
                    </button>
                </header>
                <main className="flex-1 flex items-start justify-center px-4 py-8">
                    <ClientLoginView
                        onLogin={(phone, data) => {
                            setClientPhone(phone);
                            setClientData(data);
                            setSplashDone(false);
                        }}
                        onBack={goHome}
                    />
                </main>
                <footer className="text-center text-xs text-gray-400 py-4">
                    Acesso restrito aos clientes da Sandy's Pet Shop.
                </footer>
            </div>
        );
    }

    if (!splashDone) {
        const firstName = clientData?.name ? clientData.name.split(' ')[0] : 'Cliente';
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 animate-fadeIn"
                onAnimationEnd={() => {
                    // Sai do splash automaticamente após a animação
                    setTimeout(() => setSplashDone(true), 900);
                }}
            >
                <img src={LOGO_URL} alt="Sandy's Pet Shop" className="h-20 w-20 mb-4 animate-bloom" />
                <h1 className="font-brand text-4xl text-pink-800 mb-2">Sandy's Pet Shop</h1>
                <p className="text-gray-700 text-lg mb-1">Bem-vindo(a), <span className="font-semibold text-pink-700">{firstName}</span>!</p>
                <p className="text-gray-500 text-sm">Carregando seus dados...</p>
                <div className="mt-6 w-48 h-1.5 bg-pink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 animate-pulse" style={{ width: '70%' }} />
                </div>
            </div>
        );
    }

    return <ClientAreaView phone={clientPhone} clientData={clientData} onLogout={handleLogout} />;
};

export default ClientAreaPage;
