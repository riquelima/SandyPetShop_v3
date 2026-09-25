import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // Verifica se o usuário já fechou o banner anteriormente
    const hasDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (hasDismissed) return;

    // Verifica se já está instalado (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    if (isStandalone) return;

    // Detecta o tipo de dispositivo
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/.test(ua);

    if (isIos) {
      setDeviceType('ios');
      // No iOS não temos o evento beforeinstallprompt, então já mostramos a instrução
      setIsVisible(true);
    } else if (isAndroid) {
      setDeviceType('android');
      // No Android aguardamos o evento nativo
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setDeviceType('android'); // Garantia
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    
    setDeferredPrompt(null);
  };

  const dismissBanner = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slideUp">
      <div className="bg-[#FFF5F7] border border-pink-200 text-pink-900 rounded-xl shadow-lg p-4 flex flex-col gap-3 relative">
        <button 
          onClick={dismissBanner}
          className="absolute top-2 right-2 text-pink-400 hover:text-pink-600 transition-colors"
          aria-label="Fechar"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="bg-pink-100 text-pink-600 p-2 rounded-lg">
            <ArrowDownTrayIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight">Instale nosso App</h4>
            <p className="text-pink-700 text-sm mt-0.5">Mais rápido e fácil de agendar!</p>
          </div>
        </div>

        {deviceType === 'android' && (
          <button 
            onClick={handleInstallClick}
            className="w-full bg-pink-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
          >
            Instalar Agora
          </button>
        )}

        {deviceType === 'ios' && (
          <div className="bg-pink-100 text-pink-800 rounded-lg p-3 text-sm mt-1">
            <p className="flex items-center gap-2 mb-1">
              1. Toque no ícone de <strong>Compartilhar</strong> <ShareIcon className="w-4 h-4 inline-block" />
            </p>
            <p className="flex items-center gap-2">
              2. Escolha <strong>Adicionar à Tela de Início</strong> <PlusCircleIcon className="w-4 h-4 inline-block" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
