
import React, { useState, useMemo, useCallback, useEffect } from 'react';
// FIX: Moved AddonService from constants import to types import, as it's a type defined in types.ts.
import { Appointment, ServiceType, PetWeight, AdminAppointment, Client, MonthlyClient, DaycareRegistration, PetMovelAppointment, AddonService, HotelRegistration } from './types';
import { SERVICES, WORKING_HOURS, MAX_CAPACITY_PER_SLOT, LUNCH_HOUR, PET_WEIGHT_OPTIONS, SERVICE_PRICES, ADDON_SERVICES, VISIT_WORKING_HOURS } from './constants';
import { supabase } from './supabaseClient';
import ExtraServicesModal from './ExtraServicesModal';


// --- TIMEZONE-AWARE HELPER FUNCTIONS (UTC-3 / SÃO PAULO) ---
const SAO_PAULO_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Creates a Date object in UTC that represents the desired wall-clock time in São Paulo.
 * Example: toSaoPauloUTC(2025, 9, 21, 11) creates a Date object for 2025-10-21 14:00:00Z.
 */
const toSaoPauloUTC = (year: number, month: number, day: number, hour = 0, minute = 0, second = 0) => {
    return new Date(Date.UTC(year, month, day, hour, minute, second) + SAO_PAULO_OFFSET_MS);
}

/**
 * Takes a Date object (which is inherently UTC based) and returns the São Paulo wall-clock time parts.
 */
const getSaoPauloTimeParts = (date: Date) => {
    const spDate = new Date(date.getTime() - SAO_PAULO_OFFSET_MS);
    return {
        year: spDate.getUTCFullYear(),
        month: spDate.getUTCMonth(),
        date: spDate.getUTCDate(),
        hour: spDate.getUTCHours(),
        day: spDate.getUTCDay(), // 0 = Sunday
    }
}

const isSameSaoPauloDay = (date1: Date, date2: Date): boolean => {
  const d1Parts = getSaoPauloTimeParts(date1);
  const d2Parts = getSaoPauloTimeParts(date2);
  return d1Parts.year === d2Parts.year && d1Parts.month === d2Parts.month && d1Parts.date === d2Parts.date;
};

const isPastSaoPauloDate = (date: Date): boolean => {
    const now = new Date();
    const todaySaoPaulo = getSaoPauloTimeParts(now);
    const dateSaoPaulo = getSaoPauloTimeParts(date);
    
    const today = new Date(Date.UTC(todaySaoPaulo.year, todaySaoPaulo.month, todaySaoPaulo.date));
    const compareDate = new Date(Date.UTC(dateSaoPaulo.year, dateSaoPaulo.month, dateSaoPaulo.date));

    return compareDate < today;
};

const isSaoPauloWeekend = (date: Date): boolean => {
    const { day } = getSaoPauloTimeParts(date);
    return day === 0 || day === 6;
};

const formatWhatsapp = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

const formatDateToBR = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    // Handles both date (YYYY-MM-DD) and datetime (YYYY-MM-DDTHH:mm:ss.sssZ) strings
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return dateString; // Fallback
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
};


// --- SVG ICONS ---
// FIX: Update ChevronLeftIcon and ChevronRightIcon to accept SVG props to allow passing className.
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
const PawIcon = () => <img src="https://static.thenounproject.com/png/pet-icon-6939415-512.png" alt="Pet Icon" className="h-7 w-7 opacity-60" />;
const UserIcon = () => <img src="https://static.thenounproject.com/png/profile-icon-709597-512.png" alt="User Icon" className="h-7 w-7 opacity-60" />;
const WhatsAppIcon = () => <img src="https://static.thenounproject.com/png/whatsapp-icon-6592278-512.png" alt="WhatsApp Icon" className="h-7 w-7 opacity-60" />;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="min-h-[64px] w-24 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const BreedIcon = () => <img src="https://static.thenounproject.com/png/pet-icon-7326432-512.png" alt="Breed Icon" className="h-7 w-7 opacity-60" />;
const AddressIcon = () => <img src="https://static.thenounproject.com/png/location-icon-7979305-512.png" alt="Address Icon" className="h-7 w-7 opacity-60" />;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V5h10a1 1 0 100-2H3zm12.293 4.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L16.586 13H9a1 1 0 110-2h7.586l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 10.586V6z" clipRule="evenodd" /></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-3.5-3.5V5.5A3.5 3.5 0 015.5 2h5.086a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V12.5A3.5 3.5 0 0112.5 16h-7zM10 9a1 1 0 100-2 1 1 0 000 2z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const LoadingSpinner = () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SuccessAlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// FIX: Added the missing CalendarIcon component.
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>;

// --- NEW ADMIN MENU ICONS ---
const BathTosaIcon = () => <img src="https://cdn-icons-png.flaticon.com/512/13702/13702805.png" alt="Banho & Tosa Icon" className="h-7 w-7" />;
const DaycareIcon = () => <img src="https://cdn-icons-png.flaticon.com/512/14257/14257709.png" alt="Creche Pet Icon" className="h-7 w-7" />;
const ClientsMenuIcon = () => <img src="https://cdn-icons-png.flaticon.com/512/1077/1077063.png" alt="Clientes Icon" className="h-7 w-7" />;
const MonthlyIcon = () => <img src="https://cdn-icons-png.flaticon.com/512/14242/14242317.png" alt="Mensalistas Icon" className="h-7 w-7" />;
const HotelIcon = () => <img src="https://cdn-icons-png.flaticon.com/512/18921/18921660.png" alt="Hotel Pet Icon" className="h-7 w-7" />;
const PetMovelIcon = () => <img src="https://cdn-icons-png.flaticon.com/512/6995/6995953.png" alt="Pet Móvel Icon" className="h-7 w-7" />;


// --- ADMIN COMPONENTS ---

const AlertModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant: 'success' | 'error';
}> = ({ isOpen, onClose, title, message, variant }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-full sm:max-w-md animate-scaleIn text-center border-4" style={{ borderColor: variant === 'success' ? '#86EFAC' : '#FCA5A5' }}>
                <div className="p-8">
                     <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full shadow-lg" style={{ backgroundColor: variant === 'success' ? '#D1FAE5' : '#FEE2E2' }}>
                        {variant === 'success' ? <SuccessAlertIcon /> : <ErrorIcon />}
                    </div>
                    <h2 className="mt-6 text-4xl font-bold text-gray-800">{title}</h2>
                    <p className="mt-4 text-gray-600 whitespace-pre-wrap text-lg leading-relaxed">{message}</p>
                </div>
                <div className="p-6 bg-gradient-to-t from-gray-50 to-white flex justify-center rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold py-4 px-12 rounded-xl hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-xl"
                    >
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'primary', isLoading }) => {
    if (!isOpen) return null;

    const confirmButtonClasses = {
        primary: 'bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800',
        danger: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-full sm:max-w-md animate-scaleIn border-2 border-gray-200">
                <div className="p-8">
                    <h2 className="text-4xl font-bold text-gray-800">{title}</h2>
                    <p className="mt-4 text-gray-600 text-lg leading-relaxed">{message}</p>
                </div>
                <div className="p-6 bg-gradient-to-t from-gray-50 to-white flex justify-end gap-4 rounded-b-3xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="bg-white border-2 border-gray-300 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 shadow-sm hover:shadow"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50 shadow-lg hover:shadow-xl ${confirmButtonClasses[variant]}`}
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminLogin: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError(error.message);
        } else {
            onLoginSuccess();
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
             <header className="text-center mb-6">
                <img src="https://i.imgur.com/M3Gt3OA.png" alt="Sandy's Pet Shop Logo" className="h-20 w-20 mx-auto mb-2"/>
                <h1 className="font-brand text-5xl text-pink-800">Sandy's Pet Shop</h1>
                <p className="text-gray-600 text-lg">Admin Login</p>
            </header>
            <div className="w-full max-w-full sm:max-w-sm bg-white p-8 rounded-2xl shadow-lg">
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-base font-semibold text-gray-700">Email</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500"/>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-base font-semibold text-gray-700">Senha</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500"/>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-3.5 px-6 border border-transparent rounded-md shadow-sm text-base font-semibold text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-400 min-h-[56px]">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const AddMonthlyClientView: React.FC<{ onBack: () => void; onSuccess: () => void; }> = ({ onBack, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [formData, setFormData] = useState({ petName: '', ownerName: '', whatsapp: '', petBreed: '', ownerAddress: '', condominium: '' });
    const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
    const [selectedWeight, setSelectedWeight] = useState<PetWeight | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
    const [packagePrice, setPackagePrice] = useState(0);
    const [recurrence, setRecurrence] = useState<{ type: 'weekly' | 'bi-weekly' | 'monthly', day: number, time: number }>({ type: 'weekly', day: 1, time: 9 });
    const [paymentDueDate, setPaymentDueDate] = useState('');
    const [serviceStartDate, setServiceStartDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; variant: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const calculatePrice = () => {
            if (!selectedWeight) {
                setPackagePrice(0);
                return;
            }

            const prices = SERVICE_PRICES[selectedWeight];
            if (!prices) {
                setPackagePrice(0);
                return;
            }

            let newTotalPrice = 0;
            // Calculate main service prices
            for (const serviceKey in serviceQuantities) {
                const quantity = serviceQuantities[serviceKey];
                if (quantity > 0) {
                    let servicePrice = 0;
                    if (serviceKey === ServiceType.BATH_AND_GROOMING) {
                        // FIX: Explicitly cast to number to prevent type errors in arithmetic operations.
                        servicePrice = (prices[ServiceType.BATH] as number) + (prices[ServiceType.GROOMING_ONLY] as number);
                    } else if (serviceKey === ServiceType.BATH || serviceKey === ServiceType.GROOMING_ONLY) {
                        // FIX: Explicitly cast to Number to prevent type errors in arithmetic operations.
                        servicePrice = Number(prices[serviceKey as keyof typeof prices]);
                    } else if ([ServiceType.PET_MOBILE_BATH, ServiceType.PET_MOBILE_BATH_AND_GROOMING, ServiceType.PET_MOBILE_GROOMING_ONLY].includes(serviceKey as ServiceType)) {
                         if (serviceKey === ServiceType.PET_MOBILE_BATH) {
                            servicePrice = prices[ServiceType.BATH];
                         } else if (serviceKey === ServiceType.PET_MOBILE_GROOMING_ONLY) {
                             servicePrice = prices[ServiceType.GROOMING_ONLY];
                         } else if (serviceKey === ServiceType.PET_MOBILE_BATH_AND_GROOMING) {
                             // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'. Cast values to `number` to ensure type-safe addition.
                             servicePrice = Number(prices[ServiceType.BATH]) + Number(prices[ServiceType.GROOMING_ONLY]);
                         }
                    }
                    // Apply R$ 10 discount for each service in the monthly package
                    const discountedServicePrice = Math.max(0, servicePrice - 10);
                    // FIX: Explicitly cast `quantity` to a number to prevent type errors during arithmetic operations.
                    newTotalPrice += discountedServicePrice * Number(quantity);
                }
            }

            // Calculate addon prices
            let addonsPrice = 0;
            Object.keys(selectedAddons).forEach(addonId => {
                if (selectedAddons[addonId]) {
                    const addon = ADDON_SERVICES.find(a => a.id === addonId);
                    if (addon) addonsPrice += addon.price;
                }
            });

            setPackagePrice(newTotalPrice + addonsPrice);
        };
        calculatePrice();
    }, [serviceQuantities, selectedWeight, selectedAddons]);
    
    // Effect to reset incompatible addons when weight changes
    useEffect(() => {
        if (!selectedWeight) return;

        const newAddons = { ...selectedAddons };
        let addonsChanged = false;
        ADDON_SERVICES.forEach(addon => {
            if (selectedAddons[addon.id]) {
                const isExcluded = addon.excludesWeight?.includes(selectedWeight);
                const requiresNotMet = addon.requiresWeight && !addon.requiresWeight.includes(selectedWeight);
                if (isExcluded || requiresNotMet) {
                    newAddons[addon.id] = false;
                    addonsChanged = true;
                }
            }
        });
        if (addonsChanged) {
            setSelectedAddons(newAddons);
        }
    }, [selectedWeight]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'whatsapp' ? formatWhatsapp(value) : value }));
    };

    const handleQuantityChange = (service: ServiceType, change: number) => {
        setServiceQuantities(prev => {
            const currentQuantity = prev[service] || 0;
            const newQuantity = Math.max(0, currentQuantity + change);
            return { ...prev, [service]: newQuantity };
        });
    };
    
    const handleAddonToggle = (addonId: string) => {
        const newAddons = { ...selectedAddons };
        newAddons[addonId] = !newAddons[addonId];
        if (addonId === 'patacure1' && newAddons[addonId]) newAddons['patacure2'] = false;
        else if (addonId === 'patacure2' && newAddons[addonId]) newAddons['patacure1'] = false;
        setSelectedAddons(newAddons);
    };

// FIX: Ensure recurrence day and time are stored as numbers to prevent comparison/arithmetic errors.
    const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setRecurrence(prev => ({...prev, [name]: name === 'type' ? value : Number(value)}));
    };
    
    const changeStep = (nextStep: number) => {
        setIsAnimating(true);
        setTimeout(() => {
          setStep(nextStep);
          setIsAnimating(false);
        }, 300);
    };

    const handleAlertClose = () => {
        const wasSuccess = alertInfo?.variant === 'success';
        setAlertInfo(null);
        if (wasSuccess) {
            onSuccess();
        }
    };
    
    const getPackageDetails = () => {
        const serviceLabels: string[] = [];
        let totalDuration = 0;

        Object.entries(serviceQuantities).forEach(([key, quantity]) => {
            // FIX: Cast quantity to a number to allow comparison.
            if (Number(quantity) > 0) {
                const service = SERVICES[key as ServiceType];
                serviceLabels.push(`${quantity}x ${service.label}`);
                // FIX: Explicitly cast to Number to prevent type errors in arithmetic operations.
                totalDuration += Number(service.duration) * Number(quantity);
            }
        });

        const addonLabels = ADDON_SERVICES
            .filter(addon => selectedAddons[addon.id])
            .map(addon => addon.label);

        const fullServiceString = serviceLabels.join(', ') + (addonLabels.length > 0 ? ` + ${addonLabels.join(', ')}` : '');
        
        return {
            serviceString: fullServiceString,
            duration: totalDuration,
            addonLabels: addonLabels,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Cast quantity to a number before reducing to prevent type errors.
        const selectedServicesCount = Object.values(serviceQuantities).reduce((sum: number, qty: number) => sum + Number(qty), 0);
        if (selectedServicesCount === 0 || !selectedWeight) {
            setAlertInfo({ title: 'Campos Incompletos', message: 'Por favor, selecione ao menos um serviço e o peso do pet.', variant: 'error' });
            return;
        }
        setIsSubmitting(true);

        // Recalculate price directly before submission to ensure it's not stale.
        let finalPrice = 0;
        if (selectedWeight) {
            const prices = SERVICE_PRICES[selectedWeight];
            if (prices) {
                let newTotalPrice = 0;
                // Calculate main service prices
                for (const serviceKey in serviceQuantities) {
                    const quantity = serviceQuantities[serviceKey];
                    if (quantity > 0) {
                        let servicePrice = 0;
                        if (serviceKey === ServiceType.BATH_AND_GROOMING) {
                            servicePrice = (prices[ServiceType.BATH] as number) + (prices[ServiceType.GROOMING_ONLY] as number);
                        } else if (serviceKey === ServiceType.BATH || serviceKey === ServiceType.GROOMING_ONLY) {
                            servicePrice = Number(prices[serviceKey as keyof typeof prices]);
                        } else if ([ServiceType.PET_MOBILE_BATH, ServiceType.PET_MOBILE_BATH_AND_GROOMING, ServiceType.PET_MOBILE_GROOMING_ONLY].includes(serviceKey as ServiceType)) {
                             if (serviceKey === ServiceType.PET_MOBILE_BATH) servicePrice = prices[ServiceType.BATH];
                             else if (serviceKey === ServiceType.PET_MOBILE_GROOMING_ONLY) servicePrice = prices[ServiceType.GROOMING_ONLY];
                             else if (serviceKey === ServiceType.PET_MOBILE_BATH_AND_GROOMING) servicePrice = Number(prices[ServiceType.BATH]) + Number(prices[ServiceType.GROOMING_ONLY]);
                        }
                        // Apply R$ 10 discount for each service in the monthly package
                        const discountedServicePrice = Math.max(0, servicePrice - 10);
                        newTotalPrice += discountedServicePrice * Number(quantity);
                    }
                }
                // Calculate addon prices
                let addonsPrice = 0;
                Object.keys(selectedAddons).forEach(addonId => {
                    if (selectedAddons[addonId]) {
                        const addon = ADDON_SERVICES.find(a => a.id === addonId);
                        if (addon) addonsPrice += addon.price;
                    }
                });
                finalPrice = newTotalPrice + addonsPrice;
            }
        }

        try {
            const { data: allAppointments, error: fetchError } = await supabase.from('appointments').select('appointment_time');
            if (fetchError) throw new Error("Não foi possível verificar a agenda existente. Tente novamente.");

            const hourlyOccupation: Record<string, number> = {};
            allAppointments.forEach((appt: { appointment_time: string }) => {
                hourlyOccupation[new Date(appt.appointment_time).toISOString()] = (hourlyOccupation[new Date(appt.appointment_time).toISOString()] || 0) + 1;
            });

            const appointmentsToCreate: { appointment_time: string }[] = [];
            const { serviceString, addonLabels } = getPackageDetails();
            const recurrenceDay = parseInt(String(recurrence.day), 10);
            const recurrenceTime = parseInt(String(recurrence.time), 10);
            const now = new Date();
            
            // Use service start date as the reference date instead of current date
            const serviceStartDateObj = serviceStartDate ? new Date(serviceStartDate + 'T00:00:00') : new Date();

            if (recurrence.type === 'weekly' || recurrence.type === 'bi-weekly') {
                let firstDate = new Date(serviceStartDateObj);
                const startDateSaoPaulo = getSaoPauloTimeParts(firstDate);
                // JS getDay(): Sun=0, Mon=1... Sat=6. Our day picker: Mon=1... Fri=5
                let firstDateDayOfWeek = startDateSaoPaulo.day;
                if (firstDateDayOfWeek === 0) firstDateDayOfWeek = 7; // Convert Sunday to 7 to be after Saturday

                let daysToAdd = (recurrenceDay - firstDateDayOfWeek + 7) % 7;
                // If the service start date is the same day as recurrence day, start from that day
                if (daysToAdd === 0) {
                    daysToAdd = 0; // Start from the service start date itself
                }
                firstDate.setDate(firstDate.getDate() + daysToAdd);

                const appointmentsToGenerate = recurrence.type === 'weekly' ? 4 : 2;
                const intervalDays = recurrence.type === 'weekly' ? 7 : 15;

                for (let i = 0; i < appointmentsToGenerate; i++) {
                    const targetDate = new Date(firstDate);
                    targetDate.setDate(targetDate.getDate() + (i * intervalDays));
                    const appointmentTime = toSaoPauloUTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), recurrenceTime);
                    appointmentsToCreate.push({ appointment_time: appointmentTime.toISOString() });
                }
            } else { // monthly
                let targetDate = new Date(serviceStartDateObj);
                targetDate.setDate(recurrenceDay);
                
                // If the target day is before the service start date, move to next month
                if (targetDate < serviceStartDateObj) {
                    targetDate.setMonth(targetDate.getMonth() + 1);
                }
                const appointmentTime = toSaoPauloUTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), recurrenceTime);
                appointmentsToCreate.push({ appointment_time: appointmentTime.toISOString() });
            }

            // Check if the service is Pet Móvel type - Pet Móvel services don't have capacity restrictions
            const isPetMovelService = Object.entries(serviceQuantities).some(([serviceType, quantity]) => {
                return Number(quantity) > 0 && [
                    ServiceType.PET_MOBILE_BATH,
                    ServiceType.PET_MOBILE_BATH_AND_GROOMING,
                    ServiceType.PET_MOBILE_GROOMING_ONLY
                ].includes(serviceType as ServiceType);
            }) || serviceString.includes('Pet Móvel');
            


            // Only check for conflicts if it's NOT a Pet Móvel service
            if (!isPetMovelService) {
                const conflicts = appointmentsToCreate.filter(appt => (hourlyOccupation[appt.appointment_time] || 0) >= MAX_CAPACITY_PER_SLOT);

                if (conflicts.length > 0) {
                    const conflictMessage = `Não foi possível criar os agendamentos pois os seguintes horários já estão cheios:\n\n- ${conflicts.map(c => new Date(c.appointment_time).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})).join('\n- ')}`;
                    setAlertInfo({ title: 'Conflito de Agendamento', message: conflictMessage, variant: 'error' });
                    return;
                }
            }

            const { data: existingClient, error: checkError } = await supabase.from('clients').select('id').eq('phone', formData.whatsapp).limit(1).single();
            if (checkError && checkError.code !== 'PGRST116') throw new Error(`Erro ao verificar cliente: ${checkError.message}`);
            if (!existingClient) {
                const { error: insertError } = await supabase.from('clients').insert({ name: formData.ownerName, phone: formData.whatsapp });
                if (insertError) throw new Error(`Erro ao criar novo cliente: ${insertError.message}`);
            }
            
            const { data: newClient, error: clientError } = await supabase.from('monthly_clients').insert({
                pet_name: formData.petName, pet_breed: formData.petBreed, owner_name: formData.ownerName, owner_address: formData.ownerAddress,
                whatsapp: formData.whatsapp, service: serviceString, weight: PET_WEIGHT_OPTIONS[selectedWeight!], price: finalPrice,
                recurrence_type: recurrence.type, recurrence_day: recurrenceDay, recurrence_time: recurrenceTime, payment_due_date: paymentDueDate, is_active: true,
                payment_status: 'Pendente', condominium: formData.condominium,
            }).select().single();

            if (clientError || !newClient) throw new Error(clientError?.message || "Falha ao criar o cadastro do mensalista.");

            const supabasePayloads = appointmentsToCreate.map(app => ({
                pet_name: formData.petName,
                pet_breed: formData.petBreed,
                owner_name: formData.ownerName,
                owner_address: formData.ownerAddress,
                whatsapp: formData.whatsapp,
                service: serviceString,
                weight: PET_WEIGHT_OPTIONS[selectedWeight!],
                addons: addonLabels,
                price: appointmentsToCreate.length > 0 ? finalPrice / appointmentsToCreate.length : finalPrice,
                status: 'AGENDADO',
                appointment_time: app.appointment_time,
                monthly_client_id: newClient.id,
                condominium: formData.condominium,
            }));

            if (supabasePayloads.length > 0) {
                if (isPetMovelService) {
                    // For Pet Móvel services, insert into BOTH tables with the same payload
                    const [appointmentsResult, petMovelResult] = await Promise.all([
                        supabase.from('appointments').insert(supabasePayloads),
                        supabase.from('pet_movel_appointments').insert(supabasePayloads)
                    ]);
                    
                    if (appointmentsResult.error || petMovelResult.error) {
                        const errorMsg = appointmentsResult.error?.message || petMovelResult.error?.message;
                        throw new Error(`Cadastro criado, mas erro ao gerar agendamentos: ${errorMsg}`);
                    }
                } else {
                    // For regular services, insert only into appointments table
                    const { error } = await supabase.from('appointments').insert(supabasePayloads);
                    if (error) throw new Error(`Cadastro criado, mas erro ao gerar agendamentos: ${error.message}`);
                }
                
                setAlertInfo({ title: 'Mensalista Cadastrado!', message: `Mensalista ${formData.petName} cadastrado com sucesso! ${supabasePayloads.length} agendamentos foram criados.`, variant: 'success' });
            } else {
                setAlertInfo({ title: 'Aviso', message: "Nenhum agendamento futuro pôde ser criado com as regras fornecidas.", variant: 'error' });
            }
        } catch (error: any) {
            setAlertInfo({ title: 'Erro na Operação', message: error.message, variant: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStep1Valid = formData.petName && formData.ownerName && formData.whatsapp.length > 13 && formData.petBreed && formData.ownerAddress && formData.condominium;
    // FIX: Cast quantity to a number before checking if any service is selected.
    const isStep2Valid = Object.values(serviceQuantities).some(q => Number(q) > 0) && selectedWeight;

    return (
        <>
            {alertInfo && <AlertModal isOpen={true} onClose={handleAlertClose} title={alertInfo.title} message={alertInfo.message} variant={alertInfo.variant} />}
            <div className="w-full max-w-3xl mx-auto bg-rose-50 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                 <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center text-sm font-semibold text-gray-500">
                        {['Dados', 'Serviços', 'Recorrência & Resumo'].map((name, index) => (
                            <div key={name} className={`flex items-center gap-3 ${step > index + 1 ? 'text-pink-600' : ''} ${step === index + 1 ? 'text-pink-600 font-bold' : ''}`}>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${step >= index + 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > index + 1 ? '✓' : index + 1}
                                </div>
                                <span className="hidden sm:inline">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={`relative p-6 sm:p-8 transition-all duration-300 ${isAnimating ? 'animate-slideOutToLeft' : 'animate-slideInFromRight'}`}>
                    {step === 1 && (
                         <div className="space-y-7">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Informações do Pet e Dono</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label htmlFor="petName" className="block text-base font-semibold text-gray-700">Nome do Pet</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><PawIcon/></span><input type="text" name="petName" id="petName" value={formData.petName} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg"/></div></div>
                                <div><label htmlFor="petBreed" className="block text-base font-semibold text-gray-700">Raça do Pet</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><BreedIcon/></span><input type="text" name="petBreed" id="petBreed" value={formData.petBreed} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg"/></div></div>
                                <div><label htmlFor="ownerName" className="block text-base font-semibold text-gray-700">Nome do Dono</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon/></span><input type="text" name="ownerName" id="ownerName" value={formData.ownerName} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg"/></div></div>
                                <div><label htmlFor="whatsapp" className="block text-base font-semibold text-gray-700">WhatsApp</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><WhatsAppIcon/></span><input type="tel" name="whatsapp" id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} required placeholder="(XX) XXXXX-XXXX" maxLength={15} className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg"/></div></div>
                                <div><label htmlFor="condominium" className="block text-base font-semibold text-gray-700">Condomínio</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><AddressIcon/></span>
                                    <select name="condominium" id="condominium" value={formData.condominium} onChange={handleInputChange} className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg">
                                        <option value="">Selecione um condomínio</option>
                                        <option value="Vitta Parque">Vitta Parque</option>
                                        <option value="Maxhaus">Maxhaus</option>
                                        <option value="Paseo">Paseo</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div></div>
                                <div className="md:col-span-2"><label htmlFor="ownerAddress" className="block text-base font-semibold text-gray-700">Endereço</label><div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><AddressIcon/></span><input type="text" name="ownerAddress" id="ownerAddress" value={formData.ownerAddress} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg"/></div></div>
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-6">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Escolha os Serviços do Pacote</h2>
                            <div>
                                <h3 className="text-md font-semibold text-gray-700 mb-2">1. Serviço(s)</h3>
                                <div className="space-y-3">
                                {Object.entries(SERVICES).filter(([key]) => ![ServiceType.VISIT_DAYCARE, ServiceType.VISIT_HOTEL].includes(key as ServiceType)).map(([key, { label }]) => (
                                    <div key={key} className="flex items-center justify-between p-6 sm:p-5 rounded-lg bg-white border-2 border-gray-200">
                                        <span className="font-semibold text-gray-800">{label}</span>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => handleQuantityChange(key as ServiceType, -1)} className="w-8 h-8 rounded-full bg-gray-200 text-lg font-bold hover:bg-gray-300">-</button>
                                            <span className="w-10 text-center font-semibold text-lg">{serviceQuantities[key] || 0}</span>
                                            <button type="button" onClick={() => handleQuantityChange(key as ServiceType, 1)} className="w-8 h-8 rounded-full bg-pink-500 text-white text-lg font-bold hover:bg-pink-600">+</button>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="petWeight" className="block text-md font-semibold text-gray-700 mb-2">2. Peso do Pet</label>
                                <select id="petWeight" value={selectedWeight || ''} onChange={e => setSelectedWeight(e.target.value as PetWeight)} required className="block w-full py-3 px-3 bg-gray-50 border border-gray-300 rounded-lg">
                                    <option value="" disabled>Selecione o peso</option>
                                    {(Object.keys(PET_WEIGHT_OPTIONS) as PetWeight[]).map(key => (<option key={key} value={key}>{PET_WEIGHT_OPTIONS[key]}</option>))}
                                </select>
                            </div>
                            <div>
                                <h3 className="text-md font-semibold text-gray-700 mb-2">3. Serviços Adicionais (Opcional)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    {ADDON_SERVICES.map(addon => {
                                        const isDisabled = !selectedWeight || Object.values(serviceQuantities).reduce((a, b) => Number(a) + Number(b), 0) === 0 || addon.excludesWeight?.includes(selectedWeight!) || (addon.requiresWeight && !addon.requiresWeight.includes(selectedWeight!));
                                        return (
                                            <label key={addon.id} className={`flex items-center p-6 sm:p-5 rounded-lg border-2 transition-all ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer bg-white hover:bg-pink-50'} ${selectedAddons[addon.id] ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                                                <input type="checkbox" onChange={() => handleAddonToggle(addon.id)} checked={!!selectedAddons[addon.id]} disabled={isDisabled} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                                                <span className="ml-2.5">{addon.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="w-full p-3 border rounded-lg bg-gray-100 flex justify-between items-center">
                                <span className="font-semibold text-gray-700">Preço do Pacote Mensal:</span>
                                <span className="font-bold text-2xl text-gray-900">R$ {(packagePrice ?? 0).toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">Recorrência e Resumo</h2>
                             <div className="p-4 bg-white rounded-lg border space-y-6">
                                <h3 className="font-semibold text-gray-700">Regra de Recorrência</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <select name="type" onChange={handleRecurrenceChange} value={recurrence.type} className="w-full px-5 py-4 border rounded-lg bg-gray-50">
                                        <option value="weekly">Semanal (4x no mês)</option>
                                        <option value="bi-weekly">Quinzenal (2x no mês)</option>
                                        <option value="monthly">Mensal (1x no mês)</option>
                                    </select>
                                    {recurrence.type === 'weekly' || recurrence.type === 'bi-weekly' ? (
                                        <select name="day" onChange={handleRecurrenceChange} value={recurrence.day} className="w-full px-5 py-4 border rounded-lg bg-gray-50">
                                            <option value={1}>Segunda-feira</option><option value={2}>Terça-feira</option><option value={3}>Quarta-feira</option><option value={4}>Quinta-feira</option><option value={5}>Sexta-feira</option>
                                        </select>
                                    ) : (
                                        <input type="number" name="day" min="1" max="31" value={recurrence.day} onChange={handleRecurrenceChange} placeholder="Dia do mês" className="w-full px-5 py-4 border rounded-lg bg-gray-50"/>
                                    )}
                                </div>
                                <select name="time" onChange={handleRecurrenceChange} value={recurrence.time} className="w-full px-5 py-4 border rounded-lg bg-gray-50">
                                    {WORKING_HOURS.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}
                                </select>
                                <div>
                                    <DatePicker 
                                        value={paymentDueDate} 
                                        onChange={setPaymentDueDate}
                                        label="Data de Vencimento do Pagamento"
                                        required
                                        className="mt-1" 
                                    />
                                </div>
                                <div>
                                    <DatePicker 
                                        value={serviceStartDate} 
                                        onChange={setServiceStartDate}
                                        label="Data de Início do Serviço"
                                        required
                                        className="mt-1" 
                                    />
                                </div>
                            </div>
                             <div className="p-4 bg-white rounded-lg space-y-2 text-gray-700 border">
                                <h3 className="font-semibold mb-2 text-gray-700">Resumo</h3>
                                <p><strong>Pet:</strong> {formData.petName} ({formData.petBreed})</p>
                                <p><strong>Responsável:</strong> {formData.ownerName}</p>
                                <p><strong>Serviços:</strong> {getPackageDetails().serviceString || 'Nenhum'}</p>
                                <p><strong>Peso:</strong> {selectedWeight ? PET_WEIGHT_OPTIONS[selectedWeight] : 'Nenhum'}</p>
                                <p className="mt-2 pt-2 border-t font-bold text-lg"><strong>Preço do Pacote: R$ {(packagePrice ?? 0).toFixed(2).replace('.', ',')}</strong></p>
                             </div>
                        </div>
                    )}
                    <div className="mt-8 flex justify-between items-center">
                        <button type="button" onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-5 rounded-lg hover:bg-gray-300 transition-colors">{step === 1 ? 'Cancelar' : 'Voltar'}</button>
                        <div className="flex-grow"></div>
                        {step < 3 && <button type="button" onClick={() => changeStep(step + 1)} disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)} className="w-full md:w-auto bg-pink-600 text-white font-bold py-3.5 px-5 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-300">Avançar</button>}
                        {step === 3 && <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-green-500 text-white font-bold py-3.5 px-5 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300">{isSubmitting ? 'Salvando...' : 'Salvar Mensalista'}</button>}
                    </div>
                </form>
            </div>
        </>
    );
};

interface StatisticsData {
    daily: {
        count: number;
        revenue: number;
        services: { [key: string]: number };
    };
    weekly: {
        count: number;
        revenue: number;
        services: { [key: string]: number };
    };
    monthly: {
        count: number;
        revenue: number;
        services: { [key: string]: number };
    };
}

const StatisticsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStatistics = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            // Buscar agendamentos concluídos de ambas as tabelas
            const [regularResult, petMovelResult] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('*')
                    .eq('status', 'CONCLUÍDO')
                    .order('appointment_time', { ascending: false }),
                supabase
                    .from('pet_movel_appointments')
                    .select('*')
                    .eq('status', 'CONCLUÍDO')
                    .order('appointment_time', { ascending: false })
            ]);

            if (regularResult.error || petMovelResult.error) {
                console.error('Erro ao buscar estatísticas:', regularResult.error || petMovelResult.error);
                return;
            }

            // Combinar agendamentos de ambas as tabelas
            const appointments = [...(regularResult.data || []), ...(petMovelResult.data || [])];

            const stats: StatisticsData = {
                daily: { count: 0, revenue: 0, services: {} },
                weekly: { count: 0, revenue: 0, services: {} },
                monthly: { count: 0, revenue: 0, services: {} }
            };

            appointments?.forEach(appointment => {
                const appointmentDate = new Date(appointment.appointment_time);
                const price = appointment.price || 0;
                const service = appointment.service || 'Não especificado';

                // Criar data de fim do dia para comparação correta
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);

                // Estatísticas diárias - apenas agendamentos de hoje
                if (appointmentDate >= today && appointmentDate <= endOfToday) {
                    stats.daily.count++;
                    stats.daily.revenue += price;
                    stats.daily.services[service] = (stats.daily.services[service] || 0) + 1;
                }

                // Estatísticas semanais - agendamentos desta semana
                if (appointmentDate >= weekStart) {
                    stats.weekly.count++;
                    stats.weekly.revenue += price;
                    stats.weekly.services[service] = (stats.weekly.services[service] || 0) + 1;
                }

                // Estatísticas mensais - agendamentos deste mês
                if (appointmentDate >= monthStart) {
                    stats.monthly.count++;
                    stats.monthly.revenue += price;
                    stats.monthly.services[service] = (stats.monthly.services[service] || 0) + 1;
                }
            });

            setStatistics(stats);
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchStatistics();
        }
    }, [isOpen, fetchStatistics]);

    if (!isOpen) return null;

    const StatCard: React.FC<{ title: string; data: { count: number; revenue: number; services: { [key: string]: number } } }> = ({ title, data }) => (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">{title}</h3>
            <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Total de Serviços</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{data.count}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Receita Total</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                            R$ {data.revenue.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>
                {Object.keys(data.services).length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Serviços Realizados:</h4>
                        <div className="space-y-2">
                            {Object.entries(data.services).map(([service, count]) => (
                                <div key={service} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="text-gray-700">{service}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">📊 Estatísticas de Serviços</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center">×</button>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="flex justify-center py-12 sm:py-16">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-pink-500"></div>
                        </div>
                    ) : statistics ? (
                        <div className="space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <StatCard title="📅 Hoje" data={statistics.daily} />
                                <StatCard title="📊 Esta Semana" data={statistics.weekly} />
                                <StatCard title="📈 Este Mês" data={statistics.monthly} />
                            </div>
                            
                            {(statistics.daily.count === 0 && statistics.weekly.count === 0 && statistics.monthly.count === 0) && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-lg">Nenhum serviço concluído encontrado para exibir estatísticas.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Erro ao carregar estatísticas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente de Estatísticas para Creche Pet
const DaycareStatisticsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [statistics, setStatistics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchDaycareStatistics = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            // Buscar matrículas da creche
            const { data: enrollments, error } = await supabase
                .from('daycare_enrollments')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar estatísticas da creche:', error);
                return;
            }

            const stats = {
                daily: { count: 0, revenue: 0, plans: {} as { [key: string]: number } },
                weekly: { count: 0, revenue: 0, plans: {} as { [key: string]: number } },
                monthly: { count: 0, revenue: 0, plans: {} as { [key: string]: number } },
                total: { 
                    approved: 0, 
                    pending: 0, 
                    rejected: 0,
                    totalRevenue: 0,
                    plans: {} as { [key: string]: number }
                }
            };

            enrollments?.forEach(enrollment => {
                const enrollmentDate = new Date(enrollment.created_at);
                const price = enrollment.total_price || 0;
                const plan = enrollment.contracted_plan || 'Não especificado';
                const status = enrollment.status;

                // Criar data de fim do dia para comparação correta
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);

                // Estatísticas totais por status
                if (status === 'Aprovado') stats.total.approved++;
                else if (status === 'Pendente') stats.total.pending++;
                else if (status === 'Rejeitado') stats.total.rejected++;

                stats.total.totalRevenue += price;
                stats.total.plans[plan] = (stats.total.plans[plan] || 0) + 1;

                // Estatísticas diárias - apenas matrículas de hoje
                if (enrollmentDate >= today && enrollmentDate <= endOfToday) {
                    stats.daily.count++;
                    stats.daily.revenue += price;
                    stats.daily.plans[plan] = (stats.daily.plans[plan] || 0) + 1;
                }

                // Estatísticas semanais - matrículas desta semana
                if (enrollmentDate >= weekStart) {
                    stats.weekly.count++;
                    stats.weekly.revenue += price;
                    stats.weekly.plans[plan] = (stats.weekly.plans[plan] || 0) + 1;
                }

                // Estatísticas mensais - matrículas deste mês
                if (enrollmentDate >= monthStart) {
                    stats.monthly.count++;
                    stats.monthly.revenue += price;
                    stats.monthly.plans[plan] = (stats.monthly.plans[plan] || 0) + 1;
                }
            });

            setStatistics(stats);
        } catch (error) {
            console.error('Erro ao calcular estatísticas da creche:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchDaycareStatistics();
        }
    }, [isOpen, fetchDaycareStatistics]);

    if (!isOpen) return null;

    const DaycareStatCard: React.FC<{ title: string; data: { count: number; revenue: number; plans: { [key: string]: number } } }> = ({ title, data }) => (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">{title}</h3>
            <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Total de Matrículas</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">{data.count}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Receita Total</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                            R$ {data.revenue.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>
                {Object.keys(data.plans).length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Planos Contratados:</h4>
                        <div className="space-y-2">
                            {Object.entries(data.plans).map(([plan, count]) => (
                                <div key={plan} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="text-gray-700">{plan.replace('_', 'x ').replace('week', ' por semana')}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">🏫 Estatísticas da Creche Pet</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center">×</button>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="flex justify-center py-12 sm:py-16">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-500"></div>
                        </div>
                    ) : statistics ? (
                        <div className="space-y-6 sm:space-y-8">
                            {/* Estatísticas Gerais */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📊 Resumo Geral</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{statistics.total.approved}</p>
                                        <p className="text-sm text-gray-600">Aprovadas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-yellow-600">{statistics.total.pending}</p>
                                        <p className="text-sm text-gray-600">Pendentes</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-600">{statistics.total.rejected}</p>
                                        <p className="text-sm text-gray-600">Rejeitadas</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg sm:text-xl font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                                            R$ {statistics.total.totalRevenue.toFixed(2).replace('.', ',')}
                                        </p>
                                        <p className="text-sm text-gray-600">Receita Total</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <DaycareStatCard title="📅 Hoje" data={statistics.daily} />
                                <DaycareStatCard title="📊 Esta Semana" data={statistics.weekly} />
                                <DaycareStatCard title="📈 Este Mês" data={statistics.monthly} />
                            </div>
                            
                            {(statistics.daily.count === 0 && statistics.weekly.count === 0 && statistics.monthly.count === 0) && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-lg">Nenhuma matrícula encontrada para exibir estatísticas.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Erro ao carregar estatísticas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente de Estatísticas para Hotel Pet
const HotelStatisticsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [statistics, setStatistics] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchHotelStatistics = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            // Buscar registros do hotel
            const { data: registrations, error } = await supabase
                .from('hotel_registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar estatísticas do hotel:', error);
                return;
            }

            const stats = {
                daily: { count: 0, revenue: 0, services: {} as { [key: string]: number } },
                weekly: { count: 0, revenue: 0, services: {} as { [key: string]: number } },
                monthly: { count: 0, revenue: 0, services: {} as { [key: string]: number } },
                total: { 
                    checkedIn: 0, 
                    checkedOut: 0, 
                    totalRevenue: 0,
                    services: {} as { [key: string]: number }
                }
            };

            registrations?.forEach(registration => {
                const registrationDate = new Date(registration.created_at);
                const price = registration.total_price || 0;
                const isCheckedIn = registration.is_checked_in;

                // Criar data de fim do dia para comparação correta
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);

                // Estatísticas totais por status
                if (isCheckedIn) stats.total.checkedIn++;
                else stats.total.checkedOut++;

                stats.total.totalRevenue += price;

                // Contar serviços extras
                if (registration.extra_services) {
                    const services = registration.extra_services;
                    if (services.banho_tosa) {
                        stats.total.services['Banho e Tosa'] = (stats.total.services['Banho e Tosa'] || 0) + 1;
                    }
                    if (services.transporte) {
                        stats.total.services['Transporte'] = (stats.total.services['Transporte'] || 0) + 1;
                    }
                    if (services.veterinario) {
                        stats.total.services['Veterinário'] = (stats.total.services['Veterinário'] || 0) + 1;
                    }
                }

                // Estatísticas diárias - apenas registros de hoje
                if (registrationDate >= today && registrationDate <= endOfToday) {
                    stats.daily.count++;
                    stats.daily.revenue += price;
                    
                    if (registration.extra_services) {
                        const services = registration.extra_services;
                        if (services.banho_tosa) {
                            stats.daily.services['Banho e Tosa'] = (stats.daily.services['Banho e Tosa'] || 0) + 1;
                        }
                        if (services.transporte) {
                            stats.daily.services['Transporte'] = (stats.daily.services['Transporte'] || 0) + 1;
                        }
                        if (services.veterinario) {
                            stats.daily.services['Veterinário'] = (stats.daily.services['Veterinário'] || 0) + 1;
                        }
                    }
                }

                // Estatísticas semanais - registros desta semana
                if (registrationDate >= weekStart) {
                    stats.weekly.count++;
                    stats.weekly.revenue += price;
                    
                    if (registration.extra_services) {
                        const services = registration.extra_services;
                        if (services.banho_tosa) {
                            stats.weekly.services['Banho e Tosa'] = (stats.weekly.services['Banho e Tosa'] || 0) + 1;
                        }
                        if (services.transporte) {
                            stats.weekly.services['Transporte'] = (stats.weekly.services['Transporte'] || 0) + 1;
                        }
                        if (services.veterinario) {
                            stats.weekly.services['Veterinário'] = (stats.weekly.services['Veterinário'] || 0) + 1;
                        }
                    }
                }

                // Estatísticas mensais - registros deste mês
                if (registrationDate >= monthStart) {
                    stats.monthly.count++;
                    stats.monthly.revenue += price;
                    
                    if (registration.extra_services) {
                        const services = registration.extra_services;
                        if (services.banho_tosa) {
                            stats.monthly.services['Banho e Tosa'] = (stats.monthly.services['Banho e Tosa'] || 0) + 1;
                        }
                        if (services.transporte) {
                            stats.monthly.services['Transporte'] = (stats.monthly.services['Transporte'] || 0) + 1;
                        }
                        if (services.veterinario) {
                            stats.monthly.services['Veterinário'] = (stats.monthly.services['Veterinário'] || 0) + 1;
                        }
                    }
                }
            });

            setStatistics(stats);
        } catch (error) {
            console.error('Erro ao calcular estatísticas do hotel:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchHotelStatistics();
        }
    }, [isOpen, fetchHotelStatistics]);

    if (!isOpen) return null;

    const HotelStatCard: React.FC<{ title: string; data: { count: number; revenue: number; services: { [key: string]: number } } }> = ({ title, data }) => (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">{title}</h3>
            <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Total de Hospedagens</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{data.count}</p>
                    </div>
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600">Receita Total</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                            R$ {data.revenue.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>
                {Object.keys(data.services).length > 0 && (
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Serviços Extras:</h4>
                        <div className="space-y-2">
                            {Object.entries(data.services).map(([service, count]) => (
                                <div key={service} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="text-gray-700">{service}</span>
                                    <span className="font-semibold text-gray-900">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">🏨 Estatísticas do Hotel Pet</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center">×</button>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="flex justify-center py-12 sm:py-16">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
                        </div>
                    ) : statistics ? (
                        <div className="space-y-6 sm:space-y-8">
                            {/* Estatísticas Gerais */}
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📊 Resumo Geral</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-600">{statistics.total.checkedIn}</p>
                                        <p className="text-sm text-gray-600">Check-ins Ativos</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-blue-600">{statistics.total.checkedOut}</p>
                                        <p className="text-sm text-gray-600">Check-outs</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg sm:text-xl font-bold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                                            R$ {statistics.total.totalRevenue.toFixed(2).replace('.', ',')}
                                        </p>
                                        <p className="text-sm text-gray-600">Receita Total</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                <HotelStatCard title="📅 Hoje" data={statistics.daily} />
                                <HotelStatCard title="📊 Esta Semana" data={statistics.weekly} />
                                <HotelStatCard title="📈 Este Mês" data={statistics.monthly} />
                            </div>
                            
                            {(statistics.daily.count === 0 && statistics.weekly.count === 0 && statistics.monthly.count === 0) && (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500 text-lg">Nenhuma hospedagem encontrada para exibir estatísticas.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">Erro ao carregar estatísticas.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const EditAppointmentModal: React.FC<{ appointment: AdminAppointment; onClose: () => void; onAppointmentUpdated: (updatedAppointment: AdminAppointment) => void; }> = ({ appointment, onClose, onAppointmentUpdated }) => {
    const [formData, setFormData] = useState<Omit<AdminAppointment, 'id' | 'addons' | 'appointment_time'>>(appointment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialSaoPauloDate = getSaoPauloTimeParts(new Date(appointment.appointment_time));
    const [datePart, setDatePart] = useState(new Date(Date.UTC(initialSaoPauloDate.year, initialSaoPauloDate.month, initialSaoPauloDate.date)).toISOString().split('T')[0]);
    const [timePart, setTimePart] = useState(initialSaoPauloDate.hour);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const [year, month, day] = datePart.split('-').map(Number);
        const newAppointmentTime = toSaoPauloUTC(year, month - 1, day, timePart);

        const { pet_name, owner_name, whatsapp, service, weight, price, status } = formData;
        
        const updatePayload = {
            pet_name,
            owner_name,
            whatsapp,
            service,
            weight,
            price: Number(price),
            status,
            appointment_time: newAppointmentTime.toISOString(),
            // Preservar campos opcionais importantes se existirem
            ...(appointment.monthly_client_id && { monthly_client_id: appointment.monthly_client_id }),
            ...(appointment.owner_address && { owner_address: appointment.owner_address }),
            ...(appointment.pet_breed && { pet_breed: appointment.pet_breed }),
            ...(appointment.condominium && { condominium: appointment.condominium }),
            ...(appointment.extra_services && { extra_services: appointment.extra_services }),
        };

        const { data, error } = await supabase
            .from('appointments')
            .update(updatePayload)
            .eq('id', appointment.id)
            .select();

        if (error) {
            alert(`Falha ao atualizar o agendamento: ${error.message || 'Erro desconhecido'}`);
            console.error('Erro detalhado:', error);
            console.error('Payload enviado:', updatePayload);
            setIsSubmitting(false);
        } else if (data && data.length > 0) {
            onAppointmentUpdated(data[0] as AdminAppointment);
        } else {
            alert('Nenhum registro foi atualizado.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h2 className="text-3xl font-bold text-gray-800">Editar Agendamento</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><label className="font-semibold text-gray-600">Nome do Pet</label><input name="pet_name" value={formData.pet_name} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Nome do Dono</label><input name="owner_name" value={formData.owner_name} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">WhatsApp</label><input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Serviço</label><input name="service" value={formData.service} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Peso</label><input name="weight" value={formData.weight} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Preço (R$)</label><input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><DatePicker value={datePart} onChange={setDatePart} label="Data" className="mt-1" /></div>
                        <div>
                            <label className="font-semibold text-gray-600">Hora</label>
                            <select value={timePart} onChange={e => setTimePart(Number(e.target.value))} className="w-full mt-1 px-5 py-4 border rounded-lg bg-white">
                                {WORKING_HOURS.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                           <label className="font-semibold text-gray-600">Status</label>
                           <select name="status" value={formData.status} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg bg-white">
                              <option value="AGENDADO">Agendado</option>
                              <option value="CONCLUÍDO">Concluído</option>
                           </select>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-pink-600 text-white font-bold py-3.5 px-4 rounded-lg disabled:bg-gray-400">
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminAddAppointmentModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onAppointmentCreated: () => void; 
}> = ({ isOpen, onClose, onAppointmentCreated }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ 
        petName: '', 
        ownerName: '', 
        whatsapp: '', 
        petBreed: '', 
        ownerAddress: '' 
    });
    const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
    const [serviceStepView, setServiceStepView] = useState<'main' | 'bath_groom' | 'pet_movel' | 'pet_movel_condo' | 'hotel_pet'>('main');
    const [selectedCondo, setSelectedCondo] = useState<string | null>(null);
    const [selectedWeight, setSelectedWeight] = useState<PetWeight | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allowedDays, setAllowedDays] = useState<number[] | undefined>(undefined);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const isVisitService = useMemo(() => 
        selectedService === ServiceType.VISIT_DAYCARE || selectedService === ServiceType.VISIT_HOTEL,
        [selectedService]
    );
    
    const isPetMovel = useMemo(() => serviceStepView === 'pet_movel', [serviceStepView]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFormData({ petName: '', ownerName: '', whatsapp: '', petBreed: '', ownerAddress: '' });
            setSelectedService(null);
            setServiceStepView('main');
            setSelectedCondo(null);
            setSelectedWeight(null);
            setSelectedAddons({});
            setTotalPrice(0);
            setSelectedDate(new Date());
            setSelectedTime(null);
            setIsSubmitting(false);
            setAllowedDays(undefined);
        }
    }, [isOpen]);

    // Fetch appointments for time slot validation
    useEffect(() => {
        const fetchAppointments = async () => {
            const { data: regularData, error: regularError } = await supabase
                .from('appointments')
                .select('*');

            if (regularError) {
                console.error('Error fetching appointments:', regularError);
                return;
            }

            const { data: petMovelData, error: petMovelError } = await supabase
                .from('pet_movel_appointments')
                .select('*');

            if (petMovelError) {
                console.error('Error fetching pet_movel_appointments:', petMovelError);
                return;
            }
            
            const combinedData = [...(regularData || []), ...(petMovelData || [])];

            if (combinedData.length > 0) {
                const allAppointments: Appointment[] = combinedData
                    .map((dbRecord: any) => {
                        const serviceKey = Object.keys(SERVICES).find(key => SERVICES[key as ServiceType].label === dbRecord.service) as ServiceType | undefined;
                        
                        if (!serviceKey) {
                            return null;
                        }
                
                        return {
                            id: dbRecord.id,
                            petName: dbRecord.pet_name,
                            ownerName: dbRecord.owner_name,
                            whatsapp: dbRecord.whatsapp,
                            service: serviceKey,
                            appointmentTime: new Date(dbRecord.appointment_time),
                        };
                    })
                    .filter((app): app is Appointment => app !== null);
                
                setAppointments(allAppointments);
            }
        };

        if (isOpen) {
            fetchAppointments();
        }
    }, [isOpen]);

    // Calendar day restrictions based on service type
    useEffect(() => {
        if (step === 3) {
            if (serviceStepView === 'bath_groom') {
                setAllowedDays([1, 2]); // Monday and Tuesday
            } else if (serviceStepView === 'pet_movel' && selectedCondo) {
                switch (selectedCondo) {
                    case 'Vitta Parque':
                        setAllowedDays([3]); // Wednesday
                        break;
                    case 'Maxhaus':
                        setAllowedDays([4]); // Thursday
                        break;
                    case 'Paseo':
                        setAllowedDays([5]); // Friday
                        break;
                    default:
                        setAllowedDays(undefined);
                }
            } else {
                setAllowedDays(undefined);
            }
        }
    }, [step, serviceStepView, selectedCondo]);

    // Reset selected time when date or service changes
    useEffect(() => { 
        setSelectedTime(null); 
    }, [selectedDate, selectedService]);

    // Calculate total price
    useEffect(() => {
        if (isVisitService) {
            setTotalPrice(0);
            return;
        }
        
        if (!selectedService || !selectedWeight) {
            setTotalPrice(0);
            return;
        }

        let basePrice = 0;
        
        const isRegularService = [ServiceType.BATH, ServiceType.GROOMING_ONLY, ServiceType.BATH_AND_GROOMING].includes(selectedService);
        const isMobileService = [ServiceType.PET_MOBILE_BATH, ServiceType.PET_MOBILE_BATH_AND_GROOMING, ServiceType.PET_MOBILE_GROOMING_ONLY].includes(selectedService);

        if (isRegularService || isMobileService) {
            const prices = SERVICE_PRICES[selectedWeight];
            if (prices) {
                if (selectedService === ServiceType.BATH || selectedService === ServiceType.PET_MOBILE_BATH) {
                    basePrice = prices[ServiceType.BATH] ?? 0;
                } else if (selectedService === ServiceType.GROOMING_ONLY || selectedService === ServiceType.PET_MOBILE_GROOMING_ONLY) {
                    basePrice = prices[ServiceType.GROOMING_ONLY] ?? 0;
                } else if (selectedService === ServiceType.BATH_AND_GROOMING || selectedService === ServiceType.PET_MOBILE_BATH_AND_GROOMING) {
                    basePrice = (prices[ServiceType.BATH] ?? 0) + (prices[ServiceType.GROOMING_ONLY] ?? 0);
                }
            }
        }
        
        let addonsPrice = 0;
        Object.keys(selectedAddons).forEach(addonId => {
            if (selectedAddons[addonId]) {
                const addon = ADDON_SERVICES.find(a => a.id === addonId);
                if (addon) addonsPrice += addon.price;
            }
        });
        setTotalPrice(basePrice + addonsPrice);
    }, [selectedService, selectedWeight, selectedAddons, isVisitService]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'whatsapp' ? formatWhatsapp(value) : value }));
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newWeight = e.target.value as PetWeight;
        setSelectedWeight(newWeight);
        const newAddons = {...selectedAddons};
        ADDON_SERVICES.forEach(addon => {
            if (selectedAddons[addon.id]) {
                const isExcluded = addon.excludesWeight?.includes(newWeight);
                const requiresNotMet = addon.requiresWeight && !addon.requiresWeight.includes(newWeight);
                if(isExcluded || requiresNotMet) newAddons[addon.id] = false;
            }
        });
        setSelectedAddons(newAddons);
    };

    const handleAddonToggle = (addonId: string) => {
        const newAddons = { ...selectedAddons };
        newAddons[addonId] = !newAddons[addonId];
        if (addonId === 'patacure1' && newAddons[addonId]) newAddons['patacure2'] = false;
        else if (addonId === 'patacure2' && newAddons[addonId]) newAddons['patacure1'] = false;
        setSelectedAddons(newAddons);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !selectedTime) return;
        setIsSubmitting(true);
        
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();
        const appointmentTime = toSaoPauloUTC(year, month, day, selectedTime);

        const isPetMovelSubmit = !!selectedCondo;
        // FIXED: Always save to 'appointments' table regardless of service type
        const targetTable = 'appointments';
        
        const basePayload = {
            appointment_time: appointmentTime.toISOString(),
            pet_name: formData.petName,
            pet_breed: formData.petBreed,
            owner_name: formData.ownerName,
            whatsapp: formData.whatsapp,
            service: SERVICES[selectedService].label,
            weight: isVisitService ? 'N/A' : (selectedWeight ? PET_WEIGHT_OPTIONS[selectedWeight] : 'N/A'),
            addons: isVisitService ? [] : ADDON_SERVICES.filter(addon => selectedAddons[addon.id]).map(addon => addon.label),
            price: totalPrice,
            status: 'AGENDADO'
        };
        
        // Always include owner_address and condominium fields (they can be null for regular services)
        const supabasePayload = {
            ...basePayload, 
            owner_address: formData.ownerAddress || null,
            condominium: selectedCondo || null
        };

        try {
            // Check for appointment conflicts (now applies to all services since all are saved in appointments table)
            const { data: existingAppointments, error: conflictError } = await supabase
                .from('appointments')
                .select('appointment_time, pet_name, owner_name')
                .eq('appointment_time', appointmentTime.toISOString())
                .eq('status', 'AGENDADO');

            if (conflictError) {
                console.error('Erro ao verificar conflitos:', conflictError);
            } else if (existingAppointments && existingAppointments.length >= MAX_CAPACITY_PER_SLOT) {
                throw new Error(`Este horário já está lotado! Máximo de ${MAX_CAPACITY_PER_SLOT} agendamentos simultâneos permitidos.`);
            }

            // Check if the same pet already has an appointment at the same time
            const duplicateAppointment = existingAppointments?.find(apt => 
                apt.pet_name.toLowerCase() === formData.petName.toLowerCase() && 
                apt.owner_name.toLowerCase() === formData.ownerName.toLowerCase()
            );

            if (duplicateAppointment) {
                throw new Error(`O pet ${formData.petName} já possui um agendamento neste horário!`);
            }

            const { data: newDbAppointment, error: supabaseError } = await supabase.from(targetTable).insert([supabasePayload]).select().single();
            if (supabaseError) throw supabaseError;

            // Auto-register client if not exists
            try {
                const { data: existingClient } = await supabase
                    .from('clients')
                    .select('id')
                    .eq('phone', supabasePayload.whatsapp)
                    .limit(1)
                    .single();

                if (!existingClient) {
                    const { error: clientInsertError } = await supabase
                        .from('clients')
                        .insert({ 
                            name: supabasePayload.owner_name, 
                            phone: supabasePayload.whatsapp 
                        });
                    if (clientInsertError) {
                        console.error('Failed to auto-register client:', clientInsertError.message);
                    }
                }
            } catch (error) {
                console.error('An error occurred during client auto-registration:', error);
            }
            
            // Send webhook notification
            try {
                const webhookUrl = 'https://n8n.intelektus.tech/webhook/servicoAgendado';
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supabasePayload),
                });

                if (!response.ok) {
                    throw new Error(`Webhook (servicoAgendado) failed with status ${response.status}`);
                }
            } catch (webhookError) {
                console.error('Error sending new appointment webhook:', webhookError);
            }

            // Success - close modal and refresh appointments
            onAppointmentCreated();
            onClose();
        } catch (error: any) {
            console.error("Error submitting appointment:", error);
            alert(error.message || 'Não foi possível concluir o agendamento. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStep1Valid = formData.petName && formData.ownerName && formData.whatsapp.length > 13 && formData.petBreed && formData.ownerAddress;
    const isStep2Valid = serviceStepView !== 'main' && selectedService && (isVisitService || selectedWeight);
    const isStep3Valid = selectedTime !== null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Adicionar Agendamento</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center mb-8">
                        <div className="flex items-center space-x-4">
                            {[1, 2, 3].map((stepNumber) => (
                                <div key={stepNumber} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        step >= stepNumber ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {stepNumber}
                                    </div>
                                    {stepNumber < 3 && (
                                        <div className={`w-12 h-1 mx-2 ${
                                            step > stepNumber ? 'bg-pink-600' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Pet and Owner Information */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Pet e Tutor</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pet</label>
                                    <input
                                        type="text"
                                        name="petName"
                                        value={formData.petName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Raça do Pet</label>
                                    <input
                                        type="text"
                                        name="petBreed"
                                        value={formData.petBreed}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Tutor</label>
                                    <input
                                        type="text"
                                        name="ownerName"
                                        value={formData.ownerName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                    <input
                                        type="tel"
                                        name="whatsapp"
                                        value={formData.whatsapp}
                                        onChange={handleInputChange}
                                        placeholder="(11) 99999-9999"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <input
                                        type="text"
                                        name="ownerAddress"
                                        value={formData.ownerAddress}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        disabled={!isStep1Valid}
                                        className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Service Selection */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleção de Serviço</h3>
                                
                                {serviceStepView === 'main' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setServiceStepView('bath_groom')}
                                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 transition-colors text-left"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <BathTosaIcon />
                                                <div>
                                                    <h4 className="font-medium text-gray-800">Banho & Tosa</h4>
                                                    <p className="text-sm text-gray-600">Serviços de higiene e estética</p>
                                                </div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setServiceStepView('pet_movel')}
                                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 transition-colors text-left"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <PetMovelIcon />
                                                <div>
                                                    <h4 className="font-medium text-gray-800">Pet Móvel</h4>
                                                    <p className="text-sm text-gray-600">Atendimento em condomínios</p>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {serviceStepView === 'bath_groom' && (
                                    <div className="space-y-4">
                                        <button
                                            type="button"
                                            onClick={() => setServiceStepView('main')}
                                            className="flex items-center text-pink-600 hover:text-pink-700 mb-4"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4 mr-1" />
                                            Voltar
                                        </button>

                                        <div className="space-y-3">
                                            {[ServiceType.BATH, ServiceType.GROOMING_ONLY, ServiceType.BATH_AND_GROOMING, ServiceType.VISIT_DAYCARE, ServiceType.VISIT_HOTEL].map((service) => (
                                                <label key={service} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="service"
                                                        value={service}
                                                        checked={selectedService === service}
                                                        onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                                                        className="text-pink-600 focus:ring-pink-500"
                                                    />
                                                    <span className="text-gray-800">{SERVICES[service].label}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {selectedService && !isVisitService && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Porte do Pet</label>
                                                <select
                                                    value={selectedWeight || ''}
                                                    onChange={handleWeightChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                    required
                                                >
                                                    <option value="">Selecione o porte</option>
                                                    {Object.entries(PET_WEIGHT_OPTIONS).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {selectedService && selectedWeight && !isVisitService && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Serviços Adicionais</h4>
                                                <div className="space-y-2">
                                                    {ADDON_SERVICES.filter(addon => {
                                                        const isExcluded = addon.excludesWeight?.includes(selectedWeight);
                                                        const requiresNotMet = addon.requiresWeight && !addon.requiresWeight.includes(selectedWeight);
                                                        return !isExcluded && !requiresNotMet;
                                                    }).map((addon) => (
                                                        <label key={addon.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAddons[addon.id] || false}
                                                                onChange={() => handleAddonToggle(addon.id)}
                                                                className="text-pink-600 focus:ring-pink-500"
                                                            />
                                                            <span className="flex-1 text-gray-800">{addon.label}</span>
                                                            <span className="text-pink-600 font-medium">R$ {addon.price.toFixed(2)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {totalPrice > 0 && (
                                            <div className="bg-pink-50 p-4 rounded-lg">
                                                <div className="text-lg font-semibold text-pink-800">
                                                    Total: R$ {(totalPrice ?? 0).toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {serviceStepView === 'pet_movel' && (
                                    <div className="space-y-4">
                                        <button
                                            type="button"
                                            onClick={() => setServiceStepView('main')}
                                            className="flex items-center text-pink-600 hover:text-pink-700 mb-4"
                                        >
                                            <ChevronLeftIcon className="h-4 w-4 mr-1" />
                                            Voltar
                                        </button>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Condomínio</label>
                                            <select
                                                value={selectedCondo || ''}
                                                onChange={(e) => setSelectedCondo(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                required
                                            >
                                                <option value="">Selecione o condomínio</option>
                                                <option value="Vitta Parque">Vitta Parque</option>
                                                <option value="Maxhaus">Maxhaus</option>
                                                <option value="Paseo">Paseo</option>
                                            </select>
                                        </div>

                                        {selectedCondo && (
                                            <div className="space-y-3">
                                                {[ServiceType.PET_MOBILE_BATH, ServiceType.PET_MOBILE_GROOMING_ONLY, ServiceType.PET_MOBILE_BATH_AND_GROOMING].map((service) => (
                                                    <label key={service} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="service"
                                                            value={service}
                                                            checked={selectedService === service}
                                                            onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                                                            className="text-pink-600 focus:ring-pink-500"
                                                        />
                                                        <span className="text-gray-800">{SERVICES[service].label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {selectedService && selectedCondo && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Porte do Pet</label>
                                                <select
                                                    value={selectedWeight || ''}
                                                    onChange={handleWeightChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                                    required
                                                >
                                                    <option value="">Selecione o porte</option>
                                                    {Object.entries(PET_WEIGHT_OPTIONS).map(([key, label]) => (
                                                        <option key={key} value={key}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {selectedService && selectedWeight && selectedCondo && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Serviços Adicionais</h4>
                                                <div className="space-y-2">
                                                    {ADDON_SERVICES.filter(addon => {
                                                        const isExcluded = addon.excludesWeight?.includes(selectedWeight);
                                                        const requiresNotMet = addon.requiresWeight && !addon.requiresWeight.includes(selectedWeight);
                                                        return !isExcluded && !requiresNotMet;
                                                    }).map((addon) => (
                                                        <label key={addon.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAddons[addon.id] || false}
                                                                onChange={() => handleAddonToggle(addon.id)}
                                                                className="text-pink-600 focus:ring-pink-500"
                                                            />
                                                            <span className="flex-1 text-gray-800">{addon.label}</span>
                                                            <span className="text-pink-600 font-medium">R$ {addon.price.toFixed(2)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {totalPrice > 0 && (
                                            <div className="bg-pink-50 p-4 rounded-lg">
                                                <div className="text-lg font-semibold text-pink-800">
                                                    Total: R$ {(totalPrice ?? 0).toFixed(2)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={!isStep2Valid}
                                        className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Próximo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Date and Time Selection */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Data e Horário</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Data do Agendamento</label>
                                    <Calendar
                                        selectedDate={selectedDate}
                                        onDateChange={setSelectedDate}
                                        disablePast={true}
                                        disableWeekends={true}
                                        allowedDays={allowedDays}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Horário</label>
                                    <TimeSlotPicker
                                        selectedDate={selectedDate}
                                        selectedService={selectedService}
                                        appointments={appointments}
                                        onTimeSelect={setSelectedTime}
                                        selectedTime={selectedTime}
                                        workingHours={isVisitService ? VISIT_WORKING_HOURS : WORKING_HOURS}
                                        isPetMovel={isPetMovel}
                                    />
                                </div>

                                <div className="flex justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isStep3Valid || isSubmitting}
                                        className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                                    >
                                        {isSubmitting && <LoadingSpinner />}
                                        <span>{isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};


{/* FIX: Changed the `status` prop type from `string` to the specific union type to match the `AdminAppointment` interface. */}
const AppointmentCard: React.FC<{ appointment: AdminAppointment; onUpdateStatus: (id: string, status: 'AGENDADO' | 'CONCLUÍDO') => void; isUpdating: boolean; onEdit: (appointment: AdminAppointment) => void; onDelete: (appointment: AdminAppointment) => void; isDeleting: boolean; onAddExtraServices: (appointment: AdminAppointment) => void; }> = ({ appointment, onUpdateStatus, isUpdating, onEdit, onDelete, isDeleting, onAddExtraServices }) => {
    const { id, appointment_time, pet_name, owner_name, service, status, price, addons, whatsapp, monthly_client_id } = appointment;
    const isCompleted = status === 'CONCLUÍDO';
    
    const statusStyles: Record<string, string> = {
        'AGENDADO': 'bg-blue-100 text-blue-800',
        'CONCLUÍDO': 'bg-green-100 text-green-800',
    };

    return (
        <div className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${isDeleting ? 'opacity-40 animate-pulse' : 'transform hover:scale-[1.02]'}`}>
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center text-sm font-semibold text-pink-600">
                            <ClockIcon />
                            <span>
                                {new Date(appointment_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })}, {new Date(appointment_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                            </span>
                        </div>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{pet_name}</p>
                        <p className="text-base text-gray-600">Dono(a): {owner_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                            {status}
                        </div>
                         {monthly_client_id && (
                            <div className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">
                                Mensalista
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center text-base text-gray-700">
                        <TagIcon />
                        <span className="font-semibold mr-2">Serviço:</span> {service}
                    </div>
                    {addons && addons.length > 0 && 
                        <div className="text-xs text-gray-500 mt-1 ml-6">
                           + {addons.join(', ')}
                        </div>
                    }
                     <div className="flex items-center text-base text-gray-700 mt-2">
                        <WhatsAppIcon />
                        <span className="font-semibold mr-2 ml-1.5">Contato:</span> {whatsapp}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-2xl font-bold text-gray-800">R$ {(price ?? 0).toFixed(2).replace('.', ',')}</p>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onAddExtraServices(appointment)}
                            disabled={isCompleted || isUpdating || isDeleting}
                            className="p-2 rounded-full text-blue-500 hover:bg-blue-100 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Adicionar serviços extras"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                         <button 
                            onClick={() => onEdit(appointment)}
                            disabled={isUpdating || isDeleting}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Editar agendamento"
                        >
                            <EditIcon />
                        </button>
                        <button 
                            onClick={() => onDelete(appointment)}
                            disabled={isUpdating || isDeleting}
                            className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Excluir agendamento"
                        >
                            <DeleteIcon />
                        </button>
                        <button 
                            onClick={() => onUpdateStatus(id, 'CONCLUÍDO')}
                            disabled={isCompleted || isUpdating || isDeleting}
                            className={`p-2 rounded-full text-white transition-colors duration-200 disabled:cursor-not-allowed ${
                                isCompleted ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                            }`}
                            aria-label="Concluir serviço"
                        >
                            {isUpdating && !isDeleting ? <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div> : <CheckCircleIcon/>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// FIX: Define the missing Calendar component
const Calendar: React.FC<{
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    disablePast?: boolean;
    disableWeekends?: boolean;
    allowedDays?: number[];
  }> = ({ selectedDate, onDateChange, disablePast = false, disableWeekends = false, allowedDays }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  
    useEffect(() => {
      // Sync currentMonth with selectedDate if selectedDate's month changes from outside
      if (selectedDate.getMonth() !== currentMonth.getMonth() || selectedDate.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      }
    }, [selectedDate]);
  
    const changeMonth = (offset: number) => {
      setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
  
    const renderDays = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon, ...
  
      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2 w-10 h-10"></div>);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const { day: dayOfWeek } = getSaoPauloTimeParts(date);
        const isSelected = isSameSaoPauloDay(date, selectedDate);
        // Apply day disabling logic
        const isDisabled = (disablePast && isPastSaoPauloDate(date)) ||
                          (disableWeekends && isSaoPauloWeekend(date)) ||
                          (allowedDays && !allowedDays.includes(dayOfWeek));
  
        days.push(
          <button
            key={day}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onDateChange(date)}
            className={`p-2 w-10 h-10 rounded-full text-center transition-colors flex items-center justify-center
              ${isSelected ? 'bg-pink-600 text-white font-bold' : 'hover:bg-pink-100'}
              ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
            `}
          >
            {day}
          </button>
        );
      }
      return days;
    };
  
    return (
      <div className="w-full max-w-full sm:max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-4 px-2">
          <button type="button" onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeftIcon /></button>
          <h3 className="font-semibold text-lg capitalize">
            {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </h3>
          <button type="button" onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon /></button>
        </div>
        <div className="grid grid-cols-7 gap-3 text-center text-base text-gray-500 mb-2 font-semibold">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-3 place-items-center">
          {renderDays()}
        </div>
      </div>
    );
  };

// DatePicker Component - Minimalist date picker with Calendar integration
const DatePicker: React.FC<{
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    disablePast?: boolean;
    disableWeekends?: boolean;
    allowedDays?: number[];
}> = ({ 
    value, 
    onChange, 
    label, 
    placeholder = "Selecione uma data", 
    required = false, 
    className = "", 
    disablePast = false,
    disableWeekends = false,
    allowedDays
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        if (value) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date();
    });

    // Sync selectedDate when value prop changes
    useEffect(() => {
        if (value) {
            const [year, month, day] = value.split('-').map(Number);
            setSelectedDate(new Date(year, month - 1, day));
        }
    }, [value]);

    const handleDateChange = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        onChange(dateString);
        setSelectedDate(date);
        setIsOpen(false);
    };

    const displayValue = value ? formatDateToBR(value) : '';

    return (
        <div className="relative">
            {label && (
                <label className="block text-base font-semibold text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    readOnly
                    required={required}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full px-5 py-4 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors ${className}`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[320px]">
                    <Calendar
                        selectedDate={selectedDate}
                        onDateChange={handleDateChange}
                        disablePast={disablePast}
                        disableWeekends={disableWeekends}
                        allowedDays={allowedDays}
                    />
                    <div className="flex justify-between mt-4 pt-3 border-t">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                handleDateChange(today);
                            }}
                            className="px-4 py-2 text-sm bg-pink-600 text-white rounded hover:bg-pink-700"
                        >
                            Hoje
                        </button>
                    </div>
                </div>
            )}
            
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

// --- ADMIN DASHBOARD VIEWS ---

const AppointmentsView: React.FC<{ key?: number }> = ({ key }) => {
    const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdminDate, setSelectedAdminDate] = useState(new Date());
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [adminView, setAdminView] = useState<'daily' | 'all'>('daily');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<AdminAppointment | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<AdminAppointment | null>(null);
    const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAppointmentExtraServicesModalOpen, setIsAppointmentExtraServicesModalOpen] = useState(false);
    const [appointmentForExtraServices, setAppointmentForExtraServices] = useState<AdminAppointment | null>(null);
    const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        
        try {
            // Fetch from both tables to ensure all appointments are displayed
            const [appointmentsResult, petMovelResult] = await Promise.all([
                supabase.from('appointments').select('*').order('appointment_time', { ascending: false }),
                supabase.from('pet_movel_appointments').select('*').order('appointment_time', { ascending: false })
            ]);

            if (appointmentsResult.error) {
                console.error('Error fetching appointments:', appointmentsResult.error);
            }
            
            if (petMovelResult.error) {
                console.error('Error fetching pet_movel_appointments:', petMovelResult.error);
            }

            // Combine data from both tables
            const appointmentsData = appointmentsResult.data || [];
            const petMovelData = petMovelResult.data || [];
            
            // Merge and remove duplicates (in case some appointments exist in both tables)
            const allAppointments = [...appointmentsData, ...petMovelData];
            const uniqueAppointments = allAppointments.filter((appointment, index, self) => 
                index === self.findIndex(a => a.id === appointment.id)
            );
            
            // Sort by appointment_time descending
            uniqueAppointments.sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());
            
            setAppointments(uniqueAppointments as AdminAppointment[]);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
        
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [key]);

    // FIX: Changed `newStatus` type from `string` to the specific union type to match `AdminAppointment['status']`.
    const handleUpdateStatus = async (id: string, newStatus: 'AGENDADO' | 'CONCLUÍDO') => {
        const appointmentToUpdate = appointments.find(app => app.id === id);
        if (!appointmentToUpdate) return;
        setUpdatingStatusId(id);
        
        // Try to update in both tables since we don't know which table the appointment is in
        const [appointmentsResult, petMovelResult] = await Promise.all([
            supabase.from('appointments').update({ status: newStatus }).eq('id', id),
            supabase.from('pet_movel_appointments').update({ status: newStatus }).eq('id', id)
        ]);

        // Check if at least one update was successful
        const hasError = appointmentsResult.error && petMovelResult.error;
        
        if (hasError) {
            console.error('Error updating in appointments:', appointmentsResult.error);
            console.error('Error updating in pet_movel_appointments:', petMovelResult.error);
            alert('Falha ao atualizar o status.');
        } else {
            const updatedAppointment = { ...appointmentToUpdate, status: newStatus };
            setAppointments(prev => prev.map(app => app.id === id ? updatedAppointment : app));
            if (newStatus === 'CONCLUÍDO') {
                try {
                    await fetch('https://n8n.intelektus.tech/webhook/servicoConcluido', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...updatedAppointment, message: 'Serviço Concluído' }),
                    });
                } catch (webhookError) { console.error('Error sending webhook:', webhookError); }
            }
        }
        setUpdatingStatusId(null);
    };
    
    const handleOpenEditModal = (appointment: AdminAppointment) => { setEditingAppointment(appointment); setIsEditModalOpen(true); };
    const handleCloseEditModal = () => { setEditingAppointment(null); setIsEditModalOpen(false); };
    const handleAppointmentUpdated = (updatedAppointment: AdminAppointment) => {
        setAppointments(prev => prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app));
        handleCloseEditModal();
    };
    const handleOpenExtraServicesModal = (appointment: AdminAppointment) => {
        setAppointmentForExtraServices(appointment);
        setIsAppointmentExtraServicesModalOpen(true);
    };
    const handleCloseExtraServicesModal = () => {
        setAppointmentForExtraServices(null);
        setIsAppointmentExtraServicesModalOpen(false);
    };
    const handleExtraServicesSuccess = (updatedAppointment: AdminAppointment) => {
        setAppointments(prev => prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app));
        handleCloseExtraServicesModal();
    };
    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };
    const handleCloseAddModal = () => setIsAddModalOpen(false);
    const handleAppointmentCreated = () => {
        fetchAppointments();
        handleCloseAddModal();
    };
    const handleRequestDelete = (appointment: AdminAppointment) => setAppointmentToDelete(appointment);
    const handleConfirmDelete = async () => {
        if (!appointmentToDelete) return;
        setDeletingAppointmentId(appointmentToDelete.id);
        
        // Try to delete from both tables since we don't know which table the appointment is in
        const [appointmentsResult, petMovelResult] = await Promise.all([
            supabase.from('appointments').delete().eq('id', appointmentToDelete.id),
            supabase.from('pet_movel_appointments').delete().eq('id', appointmentToDelete.id)
        ]);
        
        // Check if at least one deletion was successful
        const hasError = appointmentsResult.error && petMovelResult.error;
        
        if (hasError) {
            console.error('Error deleting from appointments:', appointmentsResult.error);
            console.error('Error deleting from pet_movel_appointments:', petMovelResult.error);
            alert('Falha ao excluir o agendamento.');
        } else {
            setAppointments(prev => prev.filter(app => app.id !== appointmentToDelete.id));
        }
        
        setDeletingAppointmentId(null);
        setAppointmentToDelete(null);
    };

    const filteredAppointments = useMemo(() => {
        if (!searchTerm) return appointments;
        return appointments.filter(app =>
            app.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.service.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [appointments, searchTerm]);
    
    const dailyAppointments = useMemo(() => filteredAppointments.filter(app => isSameSaoPauloDay(new Date(app.appointment_time), selectedAdminDate)).sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()), [filteredAppointments, selectedAdminDate]);
    
    const { upcomingAppointments, pastAppointments } = useMemo(() => {
        if (adminView !== 'all') return { upcomingAppointments: [], pastAppointments: [] };
        const today = new Date(); 
        const upcoming: AdminAppointment[] = []; const past: AdminAppointment[] = [];
        filteredAppointments.forEach(app => {
            if (new Date(app.appointment_time) >= today) upcoming.push(app); else past.push(app);
        });
        upcoming.sort((a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime());
        return { upcomingAppointments: upcoming, pastAppointments: past };
    }, [filteredAppointments, adminView]);

    const renderAppointments = (apps: AdminAppointment[]) => apps.map(app => <AppointmentCard key={app.id} appointment={app} onUpdateStatus={handleUpdateStatus} isUpdating={updatingStatusId === app.id} onEdit={handleOpenEditModal} onDelete={handleRequestDelete} isDeleting={deletingAppointmentId === app.id} onAddExtraServices={handleOpenExtraServicesModal} />);

    return (
        <>
            {isEditModalOpen && editingAppointment && <EditAppointmentModal appointment={editingAppointment} onClose={handleCloseEditModal} onAppointmentUpdated={handleAppointmentUpdated} />}
            {isAppointmentExtraServicesModalOpen && appointmentForExtraServices && (
                <ExtraServicesModal
                    isOpen={isAppointmentExtraServicesModalOpen}
                    onClose={handleCloseExtraServicesModal}
                    onSuccess={handleExtraServicesSuccess}
                    data={appointmentForExtraServices}
                    type="appointment"
                    title="Serviços Extras - Agendamento"
                />
            )}
            {isAddModalOpen && <AdminAddAppointmentModal isOpen={isAddModalOpen} onClose={handleCloseAddModal} onAppointmentCreated={handleAppointmentCreated} />}
            {appointmentToDelete && <ConfirmationModal isOpen={!!appointmentToDelete} onClose={() => setAppointmentToDelete(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o agendamento para ${appointmentToDelete.pet_name}?`} confirmText="Excluir" variant="danger" isLoading={deletingAppointmentId === appointmentToDelete.id} />}
            <StatisticsModal isOpen={isStatisticsModalOpen} onClose={() => setIsStatisticsModalOpen(false)} />

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <input type="text" placeholder="Buscar por pet, dono ou serviço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                </div>
                <button onClick={handleOpenAddModal} className="flex-shrink-0 flex items-center justify-center gap-3 bg-green-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors shadow-lg border-2 border-green-500" style={{minWidth: '200px'}}>
                    <UserPlusIcon /> Adicionar Agendamento
                </button>
                <button onClick={() => setIsStatisticsModalOpen(true)} className="flex-shrink-0 flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors shadow-lg border-2 border-blue-500" style={{minWidth: '160px'}}>
                    📊 Estatísticas
                </button>
                <button onClick={() => setAdminView(adminView === 'daily' ? 'all' : 'daily')} className="flex-shrink-0 flex items-center justify-center gap-3 bg-pink-100 text-pink-800 font-semibold py-3 px-5 rounded-lg hover:bg-pink-200 transition-colors">
                    {adminView === 'daily' ? <><ListIcon /> Ver Todos</> : <><CalendarIcon /> Ver Calendário</>}
                </button>
            </div>
            {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : (
                <>
                    {adminView === 'daily' ? (
                        <>
                            <section className="mb-8 p-4 bg-white rounded-2xl shadow-sm animate-fadeIn"><Calendar selectedDate={selectedAdminDate} onDateChange={setSelectedAdminDate} /></section>
                            <section className="animate-fadeInUp">
                                <h2 className="text-2xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-pink-200">Agendamentos para {selectedAdminDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h2>
                                {dailyAppointments.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderAppointments(dailyAppointments)}</div> : <div className="text-center py-16 bg-white rounded-lg shadow-sm"><p className="text-gray-500 text-lg">Nenhum agendamento para este dia.</p></div>}
                            </section>
                        </>
                    ) : (
                        <div className="space-y-12 animate-fadeIn">
                            <section>
                                <h2 className="text-2xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-pink-200">Próximos Agendamentos</h2>
                                {upcomingAppointments.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderAppointments(upcomingAppointments)}</div> : <div className="text-center py-12 bg-white rounded-lg shadow-sm"><p className="text-gray-500">Nenhum próximo agendamento encontrado.</p></div>}
                            </section>
                            <section>
                                <h2 className="text-2xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-pink-200">Agendamentos Anteriores</h2>
                                {pastAppointments.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{renderAppointments(pastAppointments)}</div> : <div className="text-center py-12 bg-white rounded-lg shadow-sm"><p className="text-gray-500">Nenhum agendamento anterior encontrado.</p></div>}
                            </section>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

const EditPetMovelAppointmentModal: React.FC<{
    appointment: PetMovelAppointment;
    onClose: () => void;
    onAppointmentUpdated: (updatedAppointment: PetMovelAppointment) => void;
}> = ({ appointment, onClose, onAppointmentUpdated }) => {
    const [formData, setFormData] = useState<Omit<PetMovelAppointment, 'id' | 'addons' | 'appointment_time' | 'monthly_client_id'>>(appointment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialSaoPauloDate = getSaoPauloTimeParts(new Date(appointment.appointment_time));
    const [datePart, setDatePart] = useState(new Date(Date.UTC(initialSaoPauloDate.year, initialSaoPauloDate.month, initialSaoPauloDate.date)).toISOString().split('T')[0]);
    const [timePart, setTimePart] = useState(initialSaoPauloDate.hour);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const [year, month, day] = datePart.split('-').map(Number);
        const newAppointmentTime = toSaoPauloUTC(year, month - 1, day, timePart);

        const { pet_name, owner_name, whatsapp, service, weight, price, status, owner_address, condominium } = formData;
        
        const updatePayload = {
            pet_name,
            owner_name,
            whatsapp,
            service,
            weight,
            price: Number(price),
            status,
            owner_address,
            condominium,
            appointment_time: newAppointmentTime.toISOString(),
            // Preservar campos opcionais importantes se existirem
            ...(appointment.monthly_client_id && { monthly_client_id: appointment.monthly_client_id }),
            ...(appointment.pet_breed && { pet_breed: appointment.pet_breed }),
            ...(appointment.extra_services && { extra_services: appointment.extra_services }),
        };

        const { data, error } = await supabase
            .from('pet_movel_appointments')
            .update(updatePayload)
            .eq('id', appointment.id)
            .select()
            .single();

        if (error) {
            alert('Falha ao atualizar o agendamento do Pet Móvel.');
            console.error(error);
            setIsSubmitting(false);
        } else {
            onAppointmentUpdated(data as PetMovelAppointment);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scaleIn">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-3xl font-bold text-gray-800">Editar Agendamento (Pet Móvel)</h2></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><label className="font-semibold text-gray-600">Nome do Pet</label><input name="pet_name" value={formData.pet_name} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Nome do Dono</label><input name="owner_name" value={formData.owner_name} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">WhatsApp</label><input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Serviço</label><input name="service" value={formData.service} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-600">Endereço (Apto/Casa)</label><input name="owner_address" value={formData.owner_address} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div>
                           <label className="font-semibold text-gray-600">Condomínio</label>
                           <select name="condominium" value={formData.condominium} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg bg-white">
                              <option value="Vitta Parque">Vitta Parque</option>
                              <option value="Maxhaus">Maxhaus</option>
                              <option value="Paseo">Paseo</option>
                           </select>
                        </div>
                        <div><label className="font-semibold text-gray-600">Preço (R$)</label><input type="number" name="price" value={formData.price || ''} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg"/></div>
                        <div>
                           <label className="font-semibold text-gray-600">Status</label>
                           <select name="status" value={formData.status} onChange={handleInputChange} className="w-full mt-1 px-5 py-4 border rounded-lg bg-white">
                              <option value="AGENDADO">Agendado</option>
                              <option value="CONCLUÍDO">Concluído</option>
                           </select>
                        </div>
                        <div><DatePicker value={datePart} onChange={setDatePart} label="Data" className="mt-1" /></div>
                        <div>
                            <label className="font-semibold text-gray-600">Hora</label>
                            <select value={timePart} onChange={e => setTimePart(Number(e.target.value))} className="w-full mt-1 px-5 py-4 border rounded-lg bg-white">
                                {WORKING_HOURS.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-pink-600 text-white font-bold py-3.5 px-4 rounded-lg disabled:bg-gray-400">
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PetMovelAppointmentDetailsModal: React.FC<{
    appointment: PetMovelAppointment;
    onClose: () => void;
    onEdit: (appointment: PetMovelAppointment) => void;
    onDelete: (appointment: PetMovelAppointment) => void;
}> = ({ appointment, onClose, onEdit, onDelete }) => {
    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-gray-800">{value || 'Não informado'}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-rose-50 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-scaleIn">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-gray-800">Detalhes do Agendamento</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                    </div>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <DetailItem label="Pet" value={appointment.pet_name} />
                        <DetailItem label="Tutor" value={appointment.owner_name} />
                        <DetailItem label="Contato" value={appointment.whatsapp} />
                        <DetailItem label="Condomínio" value={appointment.condominium} />
                        <DetailItem label="Endereço" value={appointment.owner_address} />
                        <DetailItem label="Serviço" value={appointment.service} />
                        <DetailItem label="Data e Hora" value={new Date(appointment.appointment_time).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})} />
                        <DetailItem label="Preço" value={`R$ ${Number(appointment.price || 0).toFixed(2).replace('.', ',')}`} />
                        <DetailItem label="Status" value={appointment.status} />
                        <DetailItem label="Adicionais" value={appointment.addons && appointment.addons.length > 0 ? appointment.addons.join(', ') : 'Nenhum'} />
                    </div>
                </div>
                <div className="p-4 bg-white mt-auto rounded-b-2xl flex justify-end items-center gap-3">
                    <button onClick={() => { onClose(); onDelete(appointment); }} className="bg-red-100 text-red-700 font-bold py-3.5 px-4 rounded-lg hover:bg-red-200 transition-colors">Excluir</button>
                    <button onClick={() => { onClose(); onEdit(appointment); }} className="bg-blue-100 text-blue-700 font-bold py-3.5 px-4 rounded-lg hover:bg-blue-200 transition-colors">Editar</button>
                </div>
            </div>
        </div>
    );
};

const PetMovelView: React.FC<{ key?: number }> = ({ key }) => {
    const [monthlyClients, setMonthlyClients] = useState<MonthlyClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCondos, setExpandedCondos] = useState<string[]>([]);
    const [selectedForDetails, setSelectedForDetails] = useState<MonthlyClient | null>(null);
    const [selectedForEdit, setSelectedForEdit] = useState<MonthlyClient | null>(null);
    const [selectedForDelete, setSelectedForDelete] = useState<MonthlyClient | null>(null);
    const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<PetMovelAppointment | null>(null);
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<PetMovelAppointment | null>(null);
    const [selectedAppointmentForDelete, setSelectedAppointmentForDelete] = useState<PetMovelAppointment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedClientForAppointments, setSelectedClientForAppointments] = useState<MonthlyClient | null>(null);
    const [clientAppointments, setClientAppointments] = useState<AdminAppointment[]>([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [calendarAppointments, setCalendarAppointments] = useState<PetMovelAppointment[]>([]);
    const [loadingCalendar, setLoadingCalendar] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<AdminAppointment | PetMovelAppointment | null>(null);

    const fetchMonthlyClients = useCallback(async () => {
        setLoading(true);
        
        const { data, error } = await supabase
            .from('monthly_clients')
            .select('*')
            .order('condominium', { ascending: true })
            .order('owner_name', { ascending: true });

        if (error) {
            console.error('Error fetching monthly clients:', error);
        } else {
            // Filter clients by specific condominiums for Pet Móvel
            const petMovelCondominiums = [
                'Paseo', 'Paseo Residence', 'Paseo Residencial',
                'Max Haus', 'Max House', 'Maxhaus',
                'Vitta', 'Vitta Residencial', 'Vitta Residence'
            ];
            
            const petMovelClients = (data as MonthlyClient[]).filter(client => {
                if (!client.condominium) return false;
                
                // Normalize condominium name for comparison
                const condominium = String(client.condominium).trim().toLowerCase();
                
                // Check if the client's condominium matches any of the Pet Móvel condominiums
                return petMovelCondominiums.some(targetCondo => {
                    const normalizedTarget = targetCondo.toLowerCase();
                    return condominium.includes(normalizedTarget) || 
                           normalizedTarget.includes(condominium) ||
                           condominium === normalizedTarget;
                });
            });
            
            setMonthlyClients(petMovelClients);
            if (petMovelClients && petMovelClients.length > 0) {
                setExpandedCondos([petMovelClients[0].condominium || 'Sem Condomínio']);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchMonthlyClients();
    }, [key]);

    const fetchClientAppointments = useCallback(async (clientId: string) => {
        setLoadingAppointments(true);
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('monthly_client_id', clientId)
                .order('appointment_time', { ascending: false });

            if (error) {
                console.error('Error fetching client appointments:', error);
                setClientAppointments([]);
            } else {
                setClientAppointments(data as AdminAppointment[]);
            }
        } catch (error) {
            console.error('Error fetching client appointments:', error);
            setClientAppointments([]);
        } finally {
            setLoadingAppointments(false);
        }
    }, []);

    const handleClientUpdated = (updatedClient: MonthlyClient) => {
        setMonthlyClients(prev => prev.map(client => client.id === updatedClient.id ? updatedClient : client));
        setSelectedForEdit(null);
    };

    const handleOpenAppointmentsModal = async (client: MonthlyClient) => {
        setSelectedClientForAppointments(client);
        await fetchClientAppointments(client.id);
    };

    const handleCloseAppointmentsModal = () => {
        setSelectedClientForAppointments(null);
        setClientAppointments([]);
    };

    const handleAppointmentUpdated = (updatedAppointment: PetMovelAppointment) => {
        setCalendarAppointments(prev => prev.map(appt => appt.id === updatedAppointment.id ? updatedAppointment : appt));
        setSelectedAppointmentForEdit(null);
    };

    const handleConfirmDeleteAppointment = async () => {
        if (!selectedAppointmentForDelete) return;
        
        setIsDeleting(true);
        const { error } = await supabase
            .from('pet_movel_appointments')
            .delete()
            .eq('id', selectedAppointmentForDelete.id);

        if (error) {
            alert('Falha ao excluir o agendamento.');
            console.error(error);
        } else {
            setCalendarAppointments(prev => prev.filter(appt => appt.id !== selectedAppointmentForDelete.id));
        }
        
        setIsDeleting(false);
        setSelectedAppointmentForDelete(null);
    };

    const fetchCalendarAppointments = useCallback(async () => {
        setLoadingCalendar(true);
        try {
            // Buscar nomes dos pets dos clientes Pet Móvel
            const petMovelPetNames = monthlyClients.map(client => client.pet_name).filter(name => name && name.trim());
            
            if (petMovelPetNames.length === 0) {
                setCalendarAppointments([]);
                return;
            }

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .in('pet_name', petMovelPetNames)
                .order('appointment_time', { ascending: true });

            if (error) {
                console.error('Error fetching calendar appointments:', error);
                setCalendarAppointments([]);
            } else {
                // Enriquecer os dados dos agendamentos com informações dos mensalistas
                const enrichedAppointments = (data as AdminAppointment[]).map(appointment => {
                    const monthlyClient = monthlyClients.find(client => 
                        client.pet_name && client.pet_name.trim().toLowerCase() === appointment.pet_name.trim().toLowerCase()
                    );
                    
                    // Extrair condomínio e apartamento do endereço
                    let condominium = 'Não informado';
                    let apartment = '';
                    
                    if (monthlyClient?.owner_address) {
                        const address = monthlyClient.owner_address;
                        // Tentar extrair apartamento (padrões comuns: "Apt 123", "Apto 123", "123")
                        const aptMatch = address.match(/(?:apt|apto|apartamento)\s*\.?\s*(\d+)/i) || 
                                       address.match(/\b(\d{2,4})\b/);
                        if (aptMatch) {
                            apartment = aptMatch[1];
                        }
                        
                        // Usar o endereço como condomínio (pode ser refinado conforme necessário)
                        condominium = address;
                    }
                    
                    return {
                        ...appointment,
                        condominium,
                        client_name: monthlyClient?.owner_name || appointment.owner_name,
                        apartment,
                        date: appointment.appointment_time.split('T')[0],
                        time: appointment.appointment_time.split('T')[1]?.substring(0, 5) || '00:00'
                    } as PetMovelAppointment;
                });
                
                setCalendarAppointments(enrichedAppointments);
            }
        } catch (error) {
            console.error('Error fetching calendar appointments:', error);
            setCalendarAppointments([]);
        } finally {
            setLoadingCalendar(false);
        }
    }, [monthlyClients]);

    useEffect(() => {
        if (viewMode === 'calendar' && monthlyClients.length > 0) {
            fetchCalendarAppointments();
        }
    }, [viewMode, monthlyClients, fetchCalendarAppointments]);

    const handleConfirmDelete = async () => {
        if (!selectedForDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('monthly_clients').delete().eq('id', selectedForDelete.id);
        if (error) {
            alert('Falha ao excluir o mensalista.');
        } else {
            setMonthlyClients(prev => prev.filter(client => client.id !== selectedForDelete.id));
        }
        setIsDeleting(false);
        setSelectedForDelete(null);
    };

    const groupedClients = useMemo(() => {
        const groups: Record<string, Record<string, MonthlyClient[]>> = {};
        const extractNumber = (address: string | null) => address ? `Apto/Casa ${address.match(/\d+/)?.[0] || address}` : 'Endereço não informado';
        
        // Filtrar clientes baseado no termo de busca
        const filteredClients = monthlyClients.filter(client => {
            if (!searchTerm.trim()) return true;
            
            const searchLower = searchTerm.toLowerCase().trim();
            const petName = (client.pet_name || '').toLowerCase();
            const ownerName = (client.owner_name || '').toLowerCase();
            const condominium = (client.condominium || '').toLowerCase();
            const address = (client.owner_address || '').toLowerCase();
            
            return petName.includes(searchLower) || 
                   ownerName.includes(searchLower) || 
                   condominium.includes(searchLower) ||
                   address.includes(searchLower);
        });
        
        filteredClients.forEach(client => {
            const condo = client.condominium || 'Sem Condomínio';
            const number = extractNumber(client.owner_address);
            if (!groups[condo]) groups[condo] = {};
            if (!groups[condo][number]) groups[condo][number] = [];
            groups[condo][number].push(client);
        });
        return groups;
    }, [monthlyClients, searchTerm]);

    const toggleCondo = (condoName: string) => {
        setExpandedCondos(prev => prev.includes(condoName) ? prev.filter(c => c !== condoName) : [...prev, condoName]);
    };

    // Expandir automaticamente todos os condomínios quando há busca ativa
    useEffect(() => {
        if (searchTerm.trim()) {
            const allCondos = Object.keys(groupedClients);
            setExpandedCondos(allCondos);
        }
    }, [searchTerm, groupedClients]);

    return (
        <div className="animate-fadeIn bg-gray-50 min-h-screen p-6">
            {selectedForEdit && <EditMonthlyClientModal client={selectedForEdit} onClose={() => setSelectedForEdit(null)} onMonthlyClientUpdated={handleClientUpdated} />}
            {selectedForDelete && <ConfirmationModal isOpen={!!selectedForDelete} onClose={() => setSelectedForDelete(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o mensalista ${selectedForDelete.pet_name}?`} confirmText="Excluir" variant="danger" isLoading={isDeleting} />}
            
            {/* Header com título e estatísticas */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold mb-2">Pet Móvel</h2>
                        <p className="text-pink-100">Gerencie seus clientes Pet Móvel</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center min-w-[100px]">
                            <div className="text-2xl font-bold">{Object.values(groupedClients).reduce((total, clients) => total + Object.values(clients).reduce((sum, list) => sum + list.length, 0), 0)}</div>
                            <div className="text-sm text-pink-100">Total Clientes</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center min-w-[100px]">
                            <div className="text-2xl font-bold">{Object.keys(groupedClients).length}</div>
                            <div className="text-sm text-pink-100">Condomínios</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de busca e filtros */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Digite sua busca"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-base"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        {/* Botão de visualização - apenas Lista */}
                        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                            <button 
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm sm:text-base bg-white text-pink-700 shadow-sm"
                            >
                                Lista
                            </button>
                        </div>
                        
                        {viewMode === 'list' && (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={() => setExpandedCondos(Object.keys(groupedClients))}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Expandir Todos
                                </button>
                                <button 
                                    onClick={() => setExpandedCondos([])}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                                >
                                    Recolher Todos
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {loading ? (
                <div className="flex justify-center py-16">
                    <LoadingSpinner />
                </div>
            ) : Object.keys(groupedClients).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SearchIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {searchTerm.trim() ? 'Nenhum resultado encontrado' : 'Nenhum cliente encontrado'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm.trim() ? 
                                `Não encontramos resultados para "${searchTerm}"` : 
                                'Não há mensalistas Pet Móvel cadastrados ainda.'
                            }
                        </p>
                        {searchTerm.trim() && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedClients).map(([condo, clients]) => (
                        <div key={condo} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                            <button 
                                onClick={() => toggleCondo(condo)} 
                                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                        {condo.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{condo}</h3>
                                        <p className="text-sm text-gray-500">
                                            {Object.values(clients).reduce((sum, list) => sum + list.length, 0)} clientes
                                        </p>
                                    </div>
                                </div>
                                <ChevronRightIcon className={`h-6 w-6 text-gray-400 transform transition-transform ${expandedCondos.includes(condo) ? 'rotate-90' : ''}`} />
                            </button>
                            
                            {expandedCondos.includes(condo) && (
                                <div className="border-t border-gray-100 bg-gray-50/50 animate-fadeIn">
                                    {Object.entries(clients).map(([number, clientList]) => (
                                        <div key={number} className="p-6 border-b border-gray-100 last:border-b-0">
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {clientList.map(client => (
                                                    <div 
                                                        key={client.id} 
                                                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                        onClick={() => handleOpenAppointmentsModal(client)}
                                                    >
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                    {client.pet_name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-bold text-gray-800">{client.pet_name}</h5>
                                                                    <p className="text-sm text-gray-500">{client.owner_name}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedForEdit(client);
                                                                    }} 
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-pink-600 hover:bg-pink-50 transition-colors" 
                                                                    aria-label="Editar"
                                                                >
                                                                    <EditIcon className="w-4 h-4" />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedForDelete(client);
                                                                    }} 
                                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
                                                                    aria-label="Excluir"
                                                                >
                                                                    <DeleteIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                                                                <p className="text-sm text-gray-600">{client.service}</p>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                                    <p className="text-sm text-gray-600">
                                                                        {client.recurrence_type === 'weekly' ? 'Semanal' : 
                                                                         client.recurrence_type === 'bi-weekly' ? 'Quinzenal' : 'Mensal'}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm font-semibold text-green-600">
                                                                    R$ {(client.price ?? 0).toFixed(2).replace('.', ',')}
                                                                </p>
                                                            </div>
                                                            
                                                            {client.owner_address && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                                                    <p className="text-xs text-gray-500 truncate">{client.owner_address}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modo Calendário */}
            {viewMode === 'calendar' && (
                <div className="space-y-4">
                    {loadingCalendar ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                        </div>
                    ) : calendarAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Nenhum agendamento encontrado para esta data.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {calendarAppointments.map((appointment) => (
                                <div key={appointment.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg text-gray-800">{appointment.pet_name}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {appointment.status === 'confirmed' ? 'Confirmado' :
                                                     appointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p><span className="font-medium">Dono:</span> {appointment.owner_name}</p>
                                                <p><span className="font-medium">Serviço:</span> {appointment.service}</p>
                                                <p><span className="font-medium">Horário:</span> {new Date(appointment.appointment_time).toLocaleString('pt-BR')}</p>
                                                <p><span className="font-medium">Endereço:</span> {appointment.address}</p>
                                                {appointment.condominium && (
                                                    <p><span className="font-medium">Condomínio:</span> {appointment.condominium}</p>
                                                )}
                                                <p><span className="font-medium">Preço:</span> R$ {(appointment.price ?? 0).toFixed(2).replace('.', ',')}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => setSelectedAppointmentForDetails(appointment)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setSelectedAppointmentForEdit(appointment)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setSelectedAppointmentForDelete(appointment)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Modal de Agendamentos do Cliente */}
            {selectedClientForAppointments && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold">Agendamentos de {selectedClientForAppointments.pet_name}</h2>
                                    <p className="text-pink-100 mt-1">Tutor: {selectedClientForAppointments.owner_name}</p>
                                </div>
                                <button 
                                    onClick={handleCloseAppointmentsModal} 
                                    className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                                >
                                    <CloseIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loadingAppointments ? (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner />
                                </div>
                            ) : clientAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid gap-4">
                                        {clientAppointments.map(appointment => (
                                            <div key={appointment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            <ClockIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">
                                                                {new Date(appointment.appointment_time).toLocaleDateString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: 'long',
                                                                    year: 'numeric',
                                                                    timeZone: 'America/Sao_Paulo'
                                                                })}
                                                            </h4>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(appointment.appointment_time).toLocaleTimeString('pt-BR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    timeZone: 'America/Sao_Paulo'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        appointment.status === 'CONCLUÍDO' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {appointment.status}
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 font-medium">Serviço</p>
                                                        <p className="text-gray-800">{appointment.service}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 font-medium">Peso</p>
                                                        <p className="text-gray-800">{appointment.weight}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-500 font-medium">Preço</p>
                                                        <p className="text-green-600 font-semibold">
                                                            R$ {Number(appointment.price || 0).toFixed(2).replace('.', ',')}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {appointment.addons && appointment.addons.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <p className="text-gray-500 font-medium text-sm mb-2">Adicionais</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {appointment.addons.map((addon, index) => (
                                                                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                                    {addon}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum agendamento encontrado</h3>
                                    <p className="text-gray-500">Este cliente ainda não possui agendamentos registrados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de Detalhes do Agendamento do Calendário */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Detalhes do Agendamento</h3>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Pet</h4>
                                    <p className="text-gray-700">{selectedAppointment.pet_name}</p>
                                    <p className="text-sm text-gray-500">{selectedAppointment.pet_breed}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Tutor</h4>
                                    <p className="text-gray-700">{selectedAppointment.owner_name}</p>
                                    <p className="text-sm text-gray-500">{selectedAppointment.whatsapp}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Serviço</h4>
                                    <p className="text-gray-700">{selectedAppointment.service}</p>
                                    <p className="text-sm text-green-600 font-medium">R$ {selectedAppointment.price}</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                        selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {selectedAppointment.status === 'confirmed' ? 'Confirmado' :
                                         selectedAppointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                                    </span>
                                </div>
                                
                                {selectedAppointment.pet_movel_appointments && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Pet Móvel</h4>
                                        <p className="text-sm text-gray-600">Endereço: {selectedAppointment.pet_movel_appointments.address}</p>
                                        {selectedAppointment.pet_movel_appointments.condo && (
                                            <p className="text-sm text-gray-600">Condomínio: {selectedAppointment.pet_movel_appointments.condo}</p>
                                        )}
                                    </div>
                                )}
                                
                                {selectedAppointment.addons && selectedAppointment.addons.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Adicionais</h4>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {selectedAppointment.addons.map((addon, index) => (
                                                <li key={index}>• {addon}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {selectedAppointment.notes && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                                        <p className="text-sm text-gray-600">{selectedAppointment.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const EditClientModal: React.FC<{ client: Client; onClose: () => void; onClientUpdated: (client: Client) => void; }> = ({ client, onClose, onClientUpdated }) => {
    const [name, setName] = useState(client.name);
    const [phone, setPhone] = useState(client.phone);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = await supabase
            .from('clients')
            .update({ name, phone })
            .eq('id', client.id)
            .select()
            .single();
        if (error) {
            alert("Erro ao atualizar cliente.");
            setIsSubmitting(false);
        } else {
            onClientUpdated(data as Client);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-scaleIn">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-3xl font-bold text-gray-800">Editar Cliente</h2></div>
                    <div className="p-6 space-y-6">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Cliente" required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        <input type="text" value={phone} onChange={e => setPhone(formatWhatsapp(e.target.value))} placeholder="Telefone / WhatsApp" required className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div className="p-6 bg-gray-50 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-pink-600 text-white font-bold py-3.5 px-4 rounded-lg disabled:bg-gray-400">
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ClientsView: React.FC<{ key?: number }> = ({ key }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clients').select('*').order('name');
        if (error) console.error('Error fetching clients:', error);
        else setClients(data as Client[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients, key]);

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = await supabase.from('clients').insert([{ name, phone: phone }]).select().single();
        if (error) {
            alert("Erro ao adicionar cliente. Verifique se a tabela 'clients' existe e tem as políticas de segurança corretas.");
        } else {
            setClients(prev => [...prev, data as Client].sort((a,b) => a.name.localeCompare(b.name)));
            setName(''); setPhone('');
        }
        setIsSubmitting(false);
    };
    
    const handleConfirmDelete = async () => {
        if (!clientToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('clients').delete().eq('id', clientToDelete.id);
        if (error) {
            alert("Erro ao excluir cliente.");
        } else {
            setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
        }
        setIsDeleting(false);
        setClientToDelete(null);
    };

    const handleClientUpdated = (updatedClient: Client) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c).sort((a,b) => a.name.localeCompare(b.name)));
        setEditingClient(null);
    };

    return (
        <div className="space-y-8">
            {editingClient && <EditClientModal client={editingClient} onClose={() => setEditingClient(null)} onClientUpdated={handleClientUpdated} />}
            {clientToDelete && <ConfirmationModal isOpen={!!clientToDelete} onClose={() => setClientToDelete(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o cliente ${clientToDelete.name}?`} confirmText="Excluir" variant="danger" isLoading={isDeleting} />}
            <div className="p-6 bg-white rounded-2xl shadow-sm">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Adicionar Novo Cliente</h2>
                <form onSubmit={handleAddClient} className="flex flex-col sm:flex-row gap-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do Cliente" required className="flex-grow w-full px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    <input type="text" value={phone} onChange={e => setPhone(formatWhatsapp(e.target.value))} placeholder="Telefone / WhatsApp" required className="w-full sm:w-52 px-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    <button type="submit" disabled={isSubmitting} className="bg-pink-600 text-white font-semibold py-3.5 px-6 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-400">
                        {isSubmitting ? 'Salvando...' : 'Salvar'}
                    </button>
                </form>
            </div>
            
            <div className="p-6 bg-white rounded-2xl shadow-sm">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Lista de Clientes</h2>
                {loading ? <div className="flex justify-center py-6 sm:py-8"><LoadingSpinner /></div> : (
                    <div className="divide-y divide-gray-200">
                        {clients.length > 0 ? clients.map(client => (
                            <div key={client.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{client.name}</p>
                                    <p className="text-base text-gray-500">{client.phone}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <button onClick={() => setEditingClient(client)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-700 transition-colors" aria-label="Editar cliente">
                                        <EditIcon />
                                    </button>
                                    <button onClick={() => setClientToDelete(client)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-700 transition-colors" aria-label="Excluir cliente">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-center text-gray-500 py-6 sm:py-8">Nenhum cliente cadastrado.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

const EditMonthlyClientModal: React.FC<{ client: MonthlyClient; onClose: () => void; onMonthlyClientUpdated: () => void; }> = ({ client, onClose, onMonthlyClientUpdated }) => {
    const serviceKey = Object.keys(SERVICES).find(key => SERVICES[key as ServiceType].label === client.service) as ServiceType | undefined;
    const weightKey = Object.keys(PET_WEIGHT_OPTIONS).find(key => PET_WEIGHT_OPTIONS[key as PetWeight] === (client as any).weight) as PetWeight | undefined;
    
    const [formData, setFormData] = useState({ 
        petName: client.pet_name, 
        ownerName: client.owner_name, 
        whatsapp: client.whatsapp, 
        petBreed: (client as any).pet_breed || '', 
        ownerAddress: (client as any).owner_address || '',
        condominium: (client as any).condominium || ''
    });
    const [selectedService, setSelectedService] = useState<ServiceType | null>(serviceKey || null);
    const [selectedWeight, setSelectedWeight] = useState<PetWeight | null>(weightKey || null);
    const [price, setPrice] = useState((client as any).price || 0);
    const [recurrence, setRecurrence] = useState({ type: client.recurrence_type, day: client.recurrence_day, time: client.recurrence_time });
    const [paymentDueDate, setPaymentDueDate] = useState(client.payment_due_date ? client.payment_due_date.split('T')[0] : '');
    const [isActive, setIsActive] = useState(client.is_active);
    const [paymentStatus, setPaymentStatus] = useState(client.payment_status || 'Pendente');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; variant: 'success' | 'error' } | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'price') setPrice(parseFloat(value) || 0);
        else setFormData(prev => ({ ...prev, [name]: name === 'whatsapp' ? formatWhatsapp(value) : value }));
    };

// FIX: Ensure recurrence day and time are stored as numbers to prevent comparison/arithmetic errors.
    const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setRecurrence(prev => ({ ...prev, [name]: name === 'type' ? value : Number(value) }));
    };

    const handleAlertClose = () => {
        const wasSuccess = alertInfo?.variant === 'success';
        setAlertInfo(null);
        if (wasSuccess) {
            onMonthlyClientUpdated();
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Permitir edição mesmo com campos incompletos
        setIsSubmitting(true);

        const today = new Date().toISOString();

        const { error: deleteError } = await supabase.from('appointments').delete().eq('monthly_client_id', client.id).gte('appointment_time', today);
        if (deleteError) {
            setAlertInfo({ title: 'Erro', message: "Erro ao limpar agendamentos antigos. A atualização foi cancelada.", variant: 'error' });
            setIsSubmitting(false);
            return;
        }

        const updatePayload = {
            pet_name: formData.petName,
            pet_breed: formData.petBreed,
            owner_name: formData.ownerName,
            owner_address: formData.ownerAddress,
            whatsapp: formData.whatsapp,
            condominium: formData.condominium,
            service: selectedService ? SERVICES[selectedService].label : client.service,
            weight: selectedWeight ? PET_WEIGHT_OPTIONS[selectedWeight] : (client as any).weight,
            price,
            recurrence_type: recurrence.type,
            recurrence_day: parseInt(String(recurrence.day), 10),
            recurrence_time: parseInt(String(recurrence.time), 10),
            payment_due_date: paymentDueDate,
            is_active: isActive,
            payment_status: paymentStatus,
        };
        const { error: updateError } = await supabase.from('monthly_clients').update(updatePayload).eq('id', client.id);
        if (updateError) {
            setAlertInfo({ title: 'Erro', message: "Erro ao atualizar os dados do mensalista.", variant: 'error' });
            setIsSubmitting(false);
            return;
        }

        if (isActive && selectedService && selectedWeight) {
            const appointmentsToCreate: { appointment_time: string }[] = [];
            const serviceDuration = SERVICES[selectedService].duration;
            const recurrenceDay = parseInt(String(recurrence.day), 10);
            const recurrenceTime = parseInt(String(recurrence.time), 10);
            const now = new Date();

            if (recurrence.type === 'weekly' || recurrence.type === 'bi-weekly') {
                let firstDate = new Date();
                const todaySaoPaulo = getSaoPauloTimeParts(firstDate);
                let firstDateDayOfWeek = todaySaoPaulo.day === 0 ? 7 : todaySaoPaulo.day;

                let daysToAdd = (recurrenceDay - firstDateDayOfWeek + 7) % 7;
                if (daysToAdd === 0 && todaySaoPaulo.hour >= recurrenceTime) {
                    daysToAdd = 7;
                }
                firstDate.setDate(firstDate.getDate() + daysToAdd);

                const appointmentsToGenerate = recurrence.type === 'weekly' ? 4 : 2;
                const intervalDays = recurrence.type === 'weekly' ? 7 : 15;

                for (let i = 0; i < appointmentsToGenerate; i++) {
                    const targetDate = new Date(firstDate);
                    targetDate.setDate(targetDate.getDate() + (i * intervalDays));
                    const appointmentTime = toSaoPauloUTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), recurrenceTime);
                    appointmentsToCreate.push({ appointment_time: appointmentTime.toISOString() });
                }
            } else { // monthly
                let targetDate = new Date();
                const todaySaoPaulo = getSaoPauloTimeParts(targetDate);
                targetDate.setDate(recurrenceDay);
                if (targetDate < now || (isSameSaoPauloDay(targetDate, now) && todaySaoPaulo.hour >= recurrenceTime)) {
                    targetDate.setMonth(targetDate.getMonth() + 1);
                }
                const appointmentTime = toSaoPauloUTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), recurrenceTime);
                appointmentsToCreate.push({ appointment_time: appointmentTime.toISOString() });
            }


            const supabasePayloads = appointmentsToCreate.map(app => ({
                pet_name: formData.petName,
                owner_name: formData.ownerName,
                whatsapp: formData.whatsapp,
                pet_breed: formData.petBreed,
                owner_address: formData.ownerAddress,
                service: SERVICES[selectedService!].label,
                weight: PET_WEIGHT_OPTIONS[selectedWeight!],
                addons: [],
                price: price / appointmentsToCreate.length, status: 'AGENDADO',
                appointment_time: app.appointment_time,
                monthly_client_id: client.id,
            }));

            if (supabasePayloads.length > 0) {
                const { error: insertError } = await supabase.from('appointments').insert(supabasePayloads);
                if (insertError) {
                    setAlertInfo({ title: 'Erro Parcial', message: "Os dados do mensalista foram atualizados, mas houve um erro ao recriar os agendamentos futuros.", variant: 'error' });
                } else {
                    setAlertInfo({ title: 'Sucesso!', message: "Mensalista atualizado e agendamentos futuros recriados com sucesso!", variant: 'success' });
                }
            } else {
                setAlertInfo({ title: 'Sucesso', message: "Dados do mensalista atualizados. Nenhum agendamento futuro foi criado com as novas regras.", variant: 'success' });
            }
        } else {
             setAlertInfo({ title: 'Sucesso', message: "Mensalista atualizado e marcado como inativo. Agendamentos futuros não foram criados.", variant: 'success' });
        }

        setIsSubmitting(false);
    };

    return (
        <>
            {alertInfo && <AlertModal isOpen={true} onClose={handleAlertClose} title={alertInfo.title} message={alertInfo.message} variant={alertInfo.variant} />}
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 border-b"><h2 className="text-3xl font-bold text-gray-800">Editar Mensalista</h2></div>
                        <div className="p-6 space-y-6">
                            <input type="text" name="petName" placeholder="Nome do Pet" value={formData.petName} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-lg"/>
                            <input type="text" name="ownerName" placeholder="Nome do Dono" value={formData.ownerName} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-lg"/>
                            <input type="text" name="whatsapp" placeholder="WhatsApp" value={formData.whatsapp} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-lg"/>
                            <input type="text" name="condominium" placeholder="Nome do Condomínio" value={formData.condominium} onChange={handleInputChange} className="w-full px-5 py-4 border rounded-lg"/>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select name="service" value={selectedService || ''} onChange={e => setSelectedService(e.target.value as ServiceType || null)} className="w-full px-5 py-4 border rounded-lg bg-white">
                                    <option value="">Selecione o serviço (opcional)</option>
                                    {Object.entries(SERVICES).map(([key, {label}]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                                <select name="weight" value={selectedWeight || ''} onChange={e => setSelectedWeight(e.target.value as PetWeight || null)} className="w-full px-5 py-4 border rounded-lg bg-white">
                                    <option value="">Selecione o peso (opcional)</option>
                                    {Object.entries(PET_WEIGHT_OPTIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                            </div>
                            <input type="number" name="price" placeholder="Preço Fixo (R$)" value={price} onChange={handleInputChange} required className="w-full px-5 py-4 border rounded-lg"/>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h3 className="font-semibold mb-2">Regra de Recorrência</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <select name="type" onChange={handleRecurrenceChange} value={recurrence.type} className="w-full px-5 py-4 border rounded-lg bg-white">
                                       <option value="weekly">Semanal</option>
                                       <option value="bi-weekly">Quinzenal</option>
                                       <option value="monthly">Mensal</option>
                                    </select>
                                    {recurrence.type === 'weekly' || recurrence.type === 'bi-weekly' ? (
                                        <select name="day" onChange={handleRecurrenceChange} value={recurrence.day} className="w-full px-5 py-4 border rounded-lg bg-white">
                                           <option value={1}>Segunda-feira</option><option value={2}>Terça-feira</option><option value={3}>Quarta-feira</option><option value={4}>Quinta-feira</option><option value={5}>Sexta-feira</option>
                                        </select>
                                    ) : <input type="number" name="day" min="1" max="31" value={recurrence.day} onChange={handleRecurrenceChange} className="w-full px-5 py-4 border rounded-lg"/>}
                                </div>
                                <select name="time" onChange={handleRecurrenceChange} value={recurrence.time} className="w-full px-5 py-4 border rounded-lg mt-4 bg-white">{WORKING_HOURS.map(h => <option key={h} value={h}>{`${h}:00`}</option>)}</select>
                                <div className="mt-4">
                                    <label htmlFor="paymentDueDateEdit" className="font-semibold text-gray-700 text-sm">Data de Vencimento do Pagamento</label>
                                    <input 
                                        type="date" 
                                        id="paymentDueDateEdit" 
                                        name="paymentDueDate" 
                                        value={paymentDueDate} 
                                        onChange={e => setPaymentDueDate(e.target.value)}
                                        required
                                        className="w-full px-5 py-4 border rounded-lg bg-white mt-1" 
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h3 className="font-semibold mb-2">Status</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                        <label className="font-semibold text-gray-700 text-sm">Status do Pagamento</label>
                                        <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as 'Pendente' | 'Pago')} className="w-full px-5 py-4 border rounded-lg bg-white mt-1">
                                            <option value="Pendente">Pendente</option>
                                            <option value="Pago">Pago</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <label htmlFor="is_active" className="flex items-center gap-3 text-gray-700 cursor-pointer">
                                            <input type="checkbox" id="is_active" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                                            Manter mensalista ativo
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 flex justify-end gap-4">
                            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-lg">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="bg-pink-600 text-white font-bold py-3.5 px-4 rounded-lg disabled:bg-gray-400">{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

const MonthlyClientsView: React.FC<{ onAddClient: () => void; onDataChanged: () => void; }> = ({ onAddClient, onDataChanged }) => {
    const [monthlyClients, setMonthlyClients] = useState<MonthlyClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingClient, setEditingClient] = useState<MonthlyClient | null>(null);
    const [deletingClient, setDeletingClient] = useState<MonthlyClient | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; variant: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
    
    // Estados para filtros
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filterCondominium, setFilterCondominium] = useState('');
    const [filterDueDate, setFilterDueDate] = useState('');
    const [sortBy, setSortBy] = useState(''); // 'pet-az', 'owner-az'
    
    // Estados para modal de serviços extras
    const [isMonthlyExtraServicesModalOpen, setIsMonthlyExtraServicesModalOpen] = useState(false);
    const [monthlyClientForExtraServices, setMonthlyClientForExtraServices] = useState<MonthlyClient | null>(null);


    const fetchMonthlyClients = useCallback(async () => {
        setLoading(true);
        // The database's default text sort is often case-sensitive ('Z' before 'a').
        // Sorting on the client-side with localeCompare ensures a natural, case-insensitive alphabetical order.
        const { data, error } = await supabase.from('monthly_clients').select('*');
        if (error) {
            console.error('Error fetching monthly clients:', error);
        } else {
            const sortedData = (data as MonthlyClient[]).sort((a, b) => a.owner_name.localeCompare(b.owner_name));
            setMonthlyClients(sortedData);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchMonthlyClients();
    }, []);
    
    const handleUpdateSuccess = () => { fetchMonthlyClients(); onDataChanged(); setEditingClient(null); };

    const handleConfirmDelete = async () => {
        if (!deletingClient) return;
        setIsDeleting(true);
        const today = new Date().toISOString();
    
        const { data: appointmentsToDelete, error: fetchError } = await supabase
            .from('appointments')
            .select('id')
            .eq('monthly_client_id', deletingClient.id)
            .gte('appointment_time', today);
    
        if (fetchError) {
            setAlertInfo({ title: 'Erro na Exclusão', message: 'Falha ao buscar agendamentos futuros. A exclusão foi cancelada.', variant: 'error' });
            setIsDeleting(false);
            setDeletingClient(null);
            return;
        }
    
        if (appointmentsToDelete && appointmentsToDelete.length > 0) {
            const idsToDelete = appointmentsToDelete.map(a => a.id);
            const { error: apptError } = await supabase
                .from('appointments')
                .delete()
                .in('id', idsToDelete);
    
            if (apptError) {
                setAlertInfo({ title: 'Erro na Exclusão', message: 'Não foi possível excluir os agendamentos futuros associados. A exclusão do mensalista foi cancelada.', variant: 'error' });
                setIsDeleting(false);
                setDeletingClient(null);
                return;
            }
        }
    
        const { error: clientError } = await supabase.from('monthly_clients').delete().eq('id', deletingClient.id);
    
        if (clientError) {
            setAlertInfo({ title: 'Erro na Exclusão', message: 'Os agendamentos foram removidos, mas ocorreu um erro ao excluir o cadastro do mensalista.', variant: 'error' });
        } else {
            setMonthlyClients(prev => prev.filter(c => c.id !== deletingClient.id));
            onDataChanged();
        }
    
        setIsDeleting(false);
        setDeletingClient(null);
    };
    
    const weekDays: Record<number, string> = { 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta" };
    
    const getRecurrenceText = (client: MonthlyClient) => {
        const time = `às ${client.recurrence_time}:00`;
        const day = client.recurrence_day;
        switch (client.recurrence_type) {
            case 'weekly': return `Toda ${weekDays[day]} ${time}`;
            case 'bi-weekly': return `Quinzenal, ${weekDays[day]} ${time}`;
            case 'monthly': return `Todo dia ${day} ${time}`;
            default: return '';
        }
    };

    // Filter and sort clients based on search term and filters
    const filteredClients = useMemo(() => {
        let filtered = monthlyClients;
        
        // Filtro por termo de busca
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(client =>
                client.pet_name.toLowerCase().includes(searchLower) ||
                client.owner_name.toLowerCase().includes(searchLower)
            );
        }
        
        // Filtro por condomínio
        if (filterCondominium) {
            filtered = filtered.filter(client => client.condominium === filterCondominium);
        }
        
        // Filtro por data de vencimento
        if (filterDueDate) {
            filtered = filtered.filter(client => client.payment_due_date === filterDueDate);
        }
        
        // Ordenação
        if (sortBy === 'pet-az') {
            filtered = [...filtered].sort((a, b) => a.pet_name.localeCompare(b.pet_name));
        } else if (sortBy === 'owner-az') {
            filtered = [...filtered].sort((a, b) => a.owner_name.localeCompare(b.owner_name));
        } else {
            // Ordenação padrão por nome do tutor
            filtered = [...filtered].sort((a, b) => a.owner_name.localeCompare(b.owner_name));
        }
        
        return filtered;
    }, [monthlyClients, searchTerm, filterCondominium, filterDueDate, sortBy]);

    const handleTogglePaymentStatus = async (client: MonthlyClient, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the card's onClick from firing
        const newStatus = client.payment_status === 'Pendente' ? 'Pago' : 'Pendente';
        const originalStatus = client.payment_status;

        // Optimistic UI update
        setMonthlyClients(prevClients =>
            prevClients.map(c =>
                c.id === client.id ? { ...c, payment_status: newStatus } : c
            )
        );

        const { error } = await supabase
            .from('monthly_clients')
            .update({ payment_status: newStatus })
            .eq('id', client.id);

        if (error) {
            // Revert on error
            setMonthlyClients(prevClients =>
                prevClients.map(c =>
                    c.id === client.id ? { ...c, payment_status: originalStatus } : c
                )
            );
            setAlertInfo({ title: 'Erro de Atualização', message: 'Não foi possível alterar o status do pagamento. Tente novamente.', variant: 'error' });
        }
    };

    const handleAddExtraServices = (client: MonthlyClient) => {
        setMonthlyClientForExtraServices(client);
        setIsMonthlyExtraServicesModalOpen(true);
    };

    const handleExtraServicesSuccess = (updatedClient: MonthlyClient) => {
        setMonthlyClients(prev => prev.map(client => client.id === updatedClient.id ? updatedClient : client));
        setIsMonthlyExtraServicesModalOpen(false);
        setMonthlyClientForExtraServices(null);
        onDataChanged();
    };

    return (
        <>
            {alertInfo && <AlertModal isOpen={!!alertInfo} onClose={() => setAlertInfo(null)} title={alertInfo.title} message={alertInfo.message} variant={alertInfo.variant} />}
            {editingClient && <EditMonthlyClientModal client={editingClient} onClose={() => setEditingClient(null)} onMonthlyClientUpdated={handleUpdateSuccess} />}
            {deletingClient && <ConfirmationModal isOpen={!!deletingClient} onClose={() => setDeletingClient(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o mensalista ${deletingClient.pet_name}? Todos os seus agendamentos futuros também serão removidos.`} confirmText="Excluir" variant="danger" isLoading={isDeleting} />}
            
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 truncate mb-4">Clientes Mensalistas</h2>
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nome do pet ou dono..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
                        />
                    </div>
                    
                    {/* Toggle de Visualização */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                                viewMode === 'cards' 
                                ? 'bg-white text-pink-600 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Cards
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
                                viewMode === 'list' 
                                ? 'bg-white text-pink-600 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                            Lista
                        </button>
                    </div>
                    
                    {/* Botão de Filtro */}
                    <button 
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`px-3 py-2.5 rounded-lg transition-colors flex items-center justify-center ${
                            showFilterPanel 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Filtros"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                    </button>
                    
                    <button onClick={onAddClient} className="bg-pink-600 text-white font-semibold py-2.5 px-3 rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Painel de Filtros */}
            {showFilterPanel && (
                <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtros e Ordenação
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Filtro por Condomínio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Condomínio</label>
                            <select
                                value={filterCondominium}
                                onChange={(e) => setFilterCondominium(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todos os condomínios</option>
                                {Array.from(new Set(monthlyClients.map(client => client.condominium))).sort().map(condo => (
                                    <option key={condo} value={condo}>{condo}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Filtro por Data de Vencimento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento</label>
                            <input
                                type="date"
                                value={filterDueDate}
                                onChange={(e) => setFilterDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        {/* Ordenação */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Padrão (Tutor A-Z)</option>
                                <option value="pet-az">Pet A-Z</option>
                                <option value="owner-az">Tutor A-Z</option>
                            </select>
                        </div>
                        
                        {/* Botão Limpar Filtros */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilterCondominium('');
                                    setFilterDueDate('');
                                    setSortBy('');
                                }}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : (
                filteredClients.length > 0 ? (
                    viewMode === 'cards' ? (
                        // Visualização em Cards
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClients.map(client => (
                                <MonthlyClientCard
                                    key={client.id}
                                    client={client}
                                    onEdit={() => setEditingClient(client)}
                                    onDelete={() => setDeletingClient(client)}
                                    onAddExtraServices={() => handleAddExtraServices(client)}
                                    onTogglePaymentStatus={(e) => handleTogglePaymentStatus(client, e)}
                                />
                            ))}
                        </div>
                    ) : (
                        // Visualização em Lista
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-100">
                                {filteredClients.map(client => (
                                    <div key={client.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-x-4 gap-y-2 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setEditingClient(client)}>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{client.pet_name}</p>
                                            <p className="text-base text-gray-600 truncate">{client.owner_name}</p>
                                            {client.condominium && (
                                                <p className="text-sm text-gray-500 truncate">
                                                    <span className="font-medium">Condomínio:</span> {client.condominium}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-full sm:w-auto flex items-center justify-between mt-2 sm:mt-0">
                                           <div className="flex items-center gap-3 flex-wrap">
                                                <p className="text-xs text-pink-800 bg-pink-100 font-semibold py-1 px-2 rounded-full truncate">
                                                   {getRecurrenceText(client)}
                                               </p>
                                               {client.payment_due_date && (
                                                   <p className="text-xs text-blue-800 bg-blue-100 font-semibold py-1 px-2 rounded-full truncate">
                                                       Vencimento: {formatDateToBR(client.payment_due_date)}
                                                   </p>
                                               )}
                                               <button
                                                    onClick={(e) => handleTogglePaymentStatus(client, e)}
                                                    className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${
                                                        client.payment_status === 'Pendente' 
                                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    }`}
                                                >
                                                    {client.payment_status === 'Pendente' ? 'Pagamento Pendente' : 'Pagamento Realizado'}
                                                </button>
                                           </div>
                                            <div className="flex-shrink-0 flex items-center gap-1 sm:ml-4" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => setEditingClient(client)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-700 transition-colors" aria-label="Editar mensalista"><EditIcon /></button>
                                                <button onClick={() => setDeletingClient(client)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-700 transition-colors" aria-label="Excluir mensalista"><DeleteIcon /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            {searchTerm.trim() ? 'Nenhum resultado encontrado' : 'Nenhum mensalista cadastrado'}
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm.trim() 
                                ? `Não encontramos mensalistas para "${searchTerm}".` 
                                : 'Comece adicionando seu primeiro cliente mensalista.'
                            }
                        </p>
                    </div>
                )
            )}

            {/* Modal de Serviços Extras para Mensalistas */}
            {isMonthlyExtraServicesModalOpen && monthlyClientForExtraServices && (
                <ExtraServicesModal
                    isOpen={isMonthlyExtraServicesModalOpen}
                    onClose={() => {
                        setIsMonthlyExtraServicesModalOpen(false);
                        setMonthlyClientForExtraServices(null);
                    }}
                    onSuccess={handleExtraServicesSuccess}
                    data={monthlyClientForExtraServices}
                    type="monthly"
                    title="Serviços Extras - Cliente Mensalista"
                />
            )}
        </>
    );
};

// Add Extra Services Modal for Hotel
// Monthly Client Card Component
const MonthlyClientCard: React.FC<{
    client: MonthlyClient;
    onClick: (client: MonthlyClient) => void;
    onEdit: (client: MonthlyClient) => void;
    onDelete: (client: MonthlyClient) => void;
    onAddExtraServices: (client: MonthlyClient) => void;
    onTogglePaymentStatus: (client: MonthlyClient, e: React.MouseEvent) => void;
}> = ({ client, onClick, onEdit, onDelete, onAddExtraServices, onTogglePaymentStatus }) => {
    
    const getRecurrenceText = (client: MonthlyClient) => {
        if (client.recurrence_type === 'weekly') return 'Semanal';
        if (client.recurrence_type === 'bi-weekly') return 'Quinzenal';
        if (client.recurrence_type === 'monthly') return 'Mensal';
        return 'Não definido';
    };

    const formatDateToBR = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const calculateTotalInvoiceValue = (client: MonthlyClient) => {
        let total = Number(client.price || 0);
        
        if (client.extra_services) {
            // Valores dos serviços extras (você pode ajustar estes valores conforme necessário)
            if (client.extra_services.pernoite) total += 50;
            if (client.extra_services.banho_tosa) total += 80;
            if (client.extra_services.so_banho) total += 40;
            if (client.extra_services.adestrador) total += 100;
            if (client.extra_services.despesa_medica) total += 150;
            if (client.extra_services.dias_extras) total += (client.extra_services.dias_extras * 30);
        }
        
        return total;
    };

    const totalInvoiceValue = calculateTotalInvoiceValue(client);

    return (
        <div 
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer overflow-hidden border border-gray-100"
            onClick={() => onClick(client)}
        >
            {/* Header do Card */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold truncate">{client.pet_name}</h3>
                            <p className="text-pink-100 text-sm truncate">{client.owner_name}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-pink-100">Valor Total</p>
                        <p className="text-lg font-bold">R$ {totalInvoiceValue.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-5 space-y-4">
                {/* Informações básicas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Serviço</p>
                        <p className="text-gray-800 font-medium">{client.service}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço Base</p>
                        <p className="text-gray-800 font-medium">R$ {Number(client.price || 0).toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>

                {/* Condomínio */}
                {client.condominium && (
                    <div className="flex items-center space-x-2 text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        <span className="text-sm font-medium">Condomínio:</span>
                        <span className="text-sm truncate">{client.condominium}</span>
                    </div>
                )}

                {/* Recorrência */}
                <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-pink-700 bg-pink-50 px-3 py-1 rounded-full">
                        {getRecurrenceText(client)}
                    </span>
                </div>

                {/* Data de Vencimento */}
                {client.payment_due_date && (
                    <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Vencimento:</span>
                        <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                            {formatDateToBR(client.payment_due_date)}
                        </span>
                    </div>
                )}

                {/* Serviços Extras */}
                {client.extra_services && Object.values(client.extra_services).some(value => value === true || (typeof value === 'number' && value > 0)) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-sm text-gray-600 font-semibold mb-2">Serviços Extras:</div>
                        <div className="flex flex-wrap gap-1">
                            {client.extra_services.pernoite && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Pernoite</span>
                            )}
                            {client.extra_services.banho_tosa && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Banho & Tosa</span>
                            )}
                            {client.extra_services.so_banho && (
                                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">Só banho</span>
                            )}
                            {client.extra_services.adestrador && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Adestrador</span>
                            )}
                            {client.extra_services.despesa_medica && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Despesa médica</span>
                            )}
                            {client.extra_services.dias_extras && client.extra_services.dias_extras > 0 && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                    {client.extra_services.dias_extras} dia{client.extra_services.dias_extras > 1 ? 's' : ''} extra{client.extra_services.dias_extras > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Status do Pagamento */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Status do Pagamento:</span>
                    <button
                        onClick={(e) => onTogglePaymentStatus(client, e)}
                        className={`px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                            client.payment_status === 'Pendente' 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 hover:shadow-md' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-md'
                        }`}
                    >
                        {client.payment_status === 'Pendente' ? '⏳ Pendente' : '✅ Pago'}
                    </button>
                </div>
            </div>

            {/* Footer com botões de ação */}
            <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddExtraServices(client); }}
                    className="px-3 py-2 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Serviços Extras
                </button>
                <div className="flex gap-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                        aria-label="Editar mensalista"
                    >
                        <EditIcon />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(client); }}
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                        aria-label="Excluir mensalista"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const DaycareEnrollmentCard: React.FC<{
    enrollment: DaycareRegistration;
    onClick: () => void;
    onEdit: (enrollment: DaycareRegistration) => void;
    onDelete: (enrollment: DaycareRegistration) => void;
    onAddExtraServices: (enrollment: DaycareRegistration) => void;
    isDraggable?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ enrollment, onClick, onEdit, onDelete, onAddExtraServices, isDraggable = false, onDragStart }) => {
    const { created_at, pet_name, tutor_name, contracted_plan, status } = enrollment;

    const statusStyles: Record<string, string> = {
        'Pendente': 'bg-blue-100 text-blue-800',
        'Aprovado': 'bg-green-100 text-green-800',
        'Rejeitado': 'bg-red-100 text-red-800',
    };

    const planLabels: Record<string, string> = {
      '2x_week': '2x por Semana',
      '3x_week': '3x por Semana',
      '4x_week': '4x por Semana',
      '5x_week': '5x por Semana',
    };

    return (
        <div 
            draggable={isDraggable}
            onDragStart={isDraggable ? onDragStart : undefined}
            onClick={onClick}
            className={`bg-white rounded-2xl shadow-md overflow-hidden transition-transform transform hover:scale-[1.02] flex flex-col ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        >
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center text-sm font-semibold text-pink-600">
                            <ClockIcon />
                            <span>
                                Solicitação em: {new Date(created_at!).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{pet_name}</p>
                        <p className="text-base text-gray-600">Tutor(a): {tutor_name}</p>
                    </div>
                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                        {status}
                    </div>
                </div>
                
                <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center text-base text-gray-700">
                        <TagIcon />
                        <span className="font-semibold mr-2">Plano:</span> {contracted_plan ? planLabels[contracted_plan] : 'Não informado'}
                    </div>
                    
                    {/* Serviços Extras */}
                    {enrollment.extra_services && Object.values(enrollment.extra_services).some(value => value === true || (typeof value === 'number' && value > 0)) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-sm text-gray-600 font-semibold mb-2">Serviços Extras:</div>
                            <div className="flex flex-wrap gap-1">
                                {enrollment.extra_services.pernoite && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Pernoite</span>
                                )}
                                {enrollment.extra_services.banho_tosa && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Banho & Tosa</span>
                                )}
                                {enrollment.extra_services.so_banho && (
                                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">Só banho</span>
                                )}
                                {enrollment.extra_services.adestrador && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Adestrador</span>
                                )}
                                {enrollment.extra_services.despesa_medica && (
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Despesa médica</span>
                                )}
                                {enrollment.extra_services.dia_extra && enrollment.extra_services.dia_extra > 0 && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                        {enrollment.extra_services.dia_extra} dia{enrollment.extra_services.dia_extra > 1 ? 's' : ''} extra{enrollment.extra_services.dia_extra > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
             <div className="p-2 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-1">
                <button 
                    onClick={(e) => { e.stopPropagation(); onAddExtraServices(enrollment); }}
                    className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                    title="Adicionar serviços extras"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(enrollment); }}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    aria-label="Editar matrícula"
                >
                    <EditIcon />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(enrollment); }}
                    className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                    aria-label="Excluir matrícula"
                >
                    <DeleteIcon />
                </button>
            </div>
        </div>
    );
};









const DaycareEnrollmentDetailsModal: React.FC<{
    enrollment: DaycareRegistration;
    onClose: () => void;
    onUpdateStatus: (id: string, status: 'Pendente' | 'Aprovado' | 'Rejeitado') => void;
    isUpdating: boolean;
    onAddExtraServices?: (enrollment: DaycareRegistration) => void;
}> = ({ enrollment, onClose, onUpdateStatus, isUpdating, onAddExtraServices }) => {
    const { id, status } = enrollment;

    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-gray-800">{value || 'Não informado'}</p>
        </div>
    );

    const planLabels: Record<string, string> = {
        '2x_week': '2x por Semana', '3x_week': '3x por Semana', '4x_week': '4x por Semana', '5x_week': '5x por Semana',
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-rose-50 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-gray-800">Detalhes da Matrícula</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><CloseIcon /></button>
                    </div>
                    <p className="text-gray-600">Revisão completa dos dados para {enrollment.pet_name}.</p>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Pet Info */}
                    <section>
                        <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-4">Dados do Pet</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <DetailItem label="Nome do Pet" value={enrollment.pet_name} />
                            <DetailItem label="Raça" value={enrollment.pet_breed} />
                            <DetailItem label="Idade" value={enrollment.pet_age} />
                            <DetailItem label="Sexo" value={enrollment.pet_sex} />
                            <DetailItem label="Castrado(a)" value={enrollment.is_neutered ? 'Sim' : 'Não'} />
                            <DetailItem label="Desconto Irmão" value={enrollment.has_sibling_discount ? 'Sim (10%)' : 'Não'} />
                        </div>
                    </section>
                     {/* Tutor Info */}
                    <section>
                        <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-4">Dados do Tutor</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <DetailItem label="Nome do Tutor" value={enrollment.tutor_name} />
                            <DetailItem label="RG" value={enrollment.tutor_rg} />
                            <DetailItem label="Telefone" value={enrollment.contact_phone} />
                            <DetailItem label="Contato de Emergência" value={enrollment.emergency_contact_name} />
                            <DetailItem label="Telefone do Veterinário" value={enrollment.vet_phone} />
                            <DetailItem label="Endereço" value={enrollment.address} />
                        </div>
                    </section>
                     {/* Health Info */}
                    <section>
                        <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-4">Saúde e Comportamento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                           <DetailItem label="Se dá bem com outros animais?" value={enrollment.gets_along_with_others ? 'Sim' : 'Não'} />
                           <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <DetailItem label="Última Vacina" value={formatDateToBR(enrollment.last_vaccine)} />
                              <DetailItem label="Último Vermífugo" value={formatDateToBR(enrollment.last_deworming)} />
                              <DetailItem label="Último Antipulgas" value={formatDateToBR(enrollment.last_flea_remedy)} />
                           </div>
                           <DetailItem label="Possui Alergias?" value={enrollment.has_allergies ? 'Sim' : 'Não'} />
                           {enrollment.has_allergies && <DetailItem label="Descrição da Alergia" value={enrollment.allergies_description} />}
                           <DetailItem label="Necessita de Cuidados Especiais?" value={enrollment.needs_special_care ? 'Sim' : 'Não'} />
                           {enrollment.needs_special_care && <DetailItem label="Descrição do Cuidado" value={enrollment.special_care_description} />}
                        </div>
                    </section>
                    {/* Plan & Belongings */}
                    <section>
                         <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-4">Plano, Pertences e Detalhes Financeiros</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                             <DetailItem label="Plano Contratado" value={enrollment.contracted_plan ? planLabels[enrollment.contracted_plan] : 'N/A'} />
                             <DetailItem label="Itens Entregues" value={enrollment.delivered_items.items.join(', ')} />
                             <DetailItem label="Outros Itens" value={enrollment.delivered_items.other} />
                             <DetailItem label="Valor Total" value={enrollment.total_price ? `R$ ${Number(enrollment.total_price).toFixed(2).replace('.', ',')}` : 'N/A'} />
                             <DetailItem label="Data Pagamento" value={formatDateToBR(enrollment.payment_date || null)} />
                         </div>
                    </section>
                    
                    {/* Extra Services */}
                    {enrollment.extra_services && Object.values(enrollment.extra_services).some(value => value === true || (typeof value === 'number' && value > 0)) && (
                        <section>
                            <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-4">Serviços Extras</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                {enrollment.extra_services.pernoite && (
                                    <DetailItem label="Pernoite" value="Sim" />
                                )}
                                {enrollment.extra_services.banho_tosa && (
                                    <DetailItem label="Banho & Tosa" value="Sim" />
                                )}
                                {enrollment.extra_services.so_banho && (
                                    <DetailItem label="Só banho" value="Sim" />
                                )}
                                {enrollment.extra_services.adestrador && (
                                    <DetailItem label="Adestrador" value="Sim" />
                                )}
                                {enrollment.extra_services.despesa_medica && (
                                    <DetailItem label="Despesa médica" value="Sim" />
                                )}
                                {enrollment.extra_services.dia_extra && enrollment.extra_services.dia_extra > 0 && (
                                    <DetailItem 
                                        label="Dias extras" 
                                        value={`${enrollment.extra_services.dia_extra} dia${enrollment.extra_services.dia_extra > 1 ? 's' : ''}`} 
                                    />
                                )}
                            </div>
                        </section>
                    )}
                </div>
                <div className="p-6 bg-white mt-auto rounded-b-2xl">
                    <div className="flex justify-between items-center">
                        {/* Botão Adicionar Serviços Extras */}
                        {onAddExtraServices && (
                            <button 
                                onClick={() => onAddExtraServices(enrollment)}
                                className="bg-purple-500 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                            >
                                <span>+</span>
                                Adicionar Serviços Extras
                            </button>
                        )}
                        
                        {/* Botões de Status */}
                        {status === 'Pendente' ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => onUpdateStatus(id!, 'Rejeitado')} disabled={isUpdating} className="bg-red-500 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300">Rejeitar</button>
                                <button onClick={() => onUpdateStatus(id!, 'Aprovado')} disabled={isUpdating} className="bg-green-500 text-white font-bold py-3.5 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300">{isUpdating ? <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mx-auto"></div> : 'Aprovar'}</button>
                            </div>
                        ) : (
                             <div className="text-gray-600 font-semibold">Esta matrícula já foi {status === 'Aprovado' ? 'aprovada' : 'rejeitada'}.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditDaycareEnrollmentModal: React.FC<{
    enrollment: DaycareRegistration;
    onClose: () => void;
    onUpdated: (updatedEnrollment: DaycareRegistration) => void;
}> = ({ enrollment, onClose, onUpdated }) => {
    const [formData, setFormData] = useState<DaycareRegistration>(enrollment);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Ensure date fields are in YYYY-MM-DD format for the input[type=date]
        const formattedEnrollment = {
            ...enrollment,
            last_vaccine: enrollment.last_vaccine?.split('T')[0] || '',
            last_deworming: enrollment.last_deworming?.split('T')[0] || '',
            last_flea_remedy: enrollment.last_flea_remedy?.split('T')[0] || '',
            payment_date: enrollment.payment_date?.split('T')[0] || '',
        };
        setFormData(formattedEnrollment);
    }, [enrollment]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'contact_phone' ? formatWhatsapp(value) : value }));
    };

    const handleRadioChange = (name: keyof DaycareRegistration, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleBelongingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newBelongings = checked
                ? [...prev.delivered_items.items, value]
                : prev.delivered_items.items.filter(item => item !== value);
            return { ...prev, delivered_items: { ...prev.delivered_items, items: newBelongings } };
        });
    };
    
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                last_vaccine: formData.last_vaccine || null,
                last_deworming: formData.last_deworming || null,
                last_flea_remedy: formData.last_flea_remedy || null,
                total_price: formData.total_price ? parseFloat(String(formData.total_price)) : null,
                payment_date: formData.payment_date || null,
                allergies_description: formData.has_allergies ? formData.allergies_description : null,
                special_care_description: formData.needs_special_care ? formData.special_care_description : null,

            };
            delete (payload as any).created_at; // Do not send created_at on update
            
            const { data, error } = await supabase.from('daycare_enrollments').update(payload).eq('id', enrollment.id).select().single();
            if (error) throw error;
            
            onUpdated(data as DaycareRegistration);

        } catch (error: any) {
            alert(`Erro ao atualizar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderRadioGroup = (label: string, name: keyof DaycareRegistration, options: { label: string, value: any }[]) => (
        <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button type="button" key={opt.label} onClick={() => handleRadioChange(name, opt.value)}
                        className={`px-4 py-3.5 rounded-lg border text-sm font-semibold transition-colors ${formData[name as keyof typeof formData] === opt.value ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 hover:bg-pink-50'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
    
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <form onSubmit={handleUpdate} className="bg-rose-50 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-3xl font-bold text-gray-800">Editar Matrícula</h2>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Pet and Tutor Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <h3 className="md:col-span-2 text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Dados do Pet</h3>
                        <div><label className="block text-base font-semibold text-gray-700">Nome</label><input type="text" name="pet_name" value={formData.pet_name} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div><label className="block text-base font-semibold text-gray-700">Raça</label><input type="text" name="pet_breed" value={formData.pet_breed} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div><label className="block text-base font-semibold text-gray-700">Idade</label><input type="text" name="pet_age" value={formData.pet_age} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div><label className="block text-base font-semibold text-gray-700">Sexo</label><input type="text" name="pet_sex" value={formData.pet_sex} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        {renderRadioGroup('Castrado (a)', 'is_neutered', [{label: 'Sim', value: true}, {label: 'Não', value: false}])}
                        <h3 className="md:col-span-2 text-lg font-semibold text-pink-700 border-b pb-2 mb-2 mt-4">Dados do Tutor</h3>
                        <div><label className="block text-base font-semibold text-gray-700">Tutor</label><input type="text" name="tutor_name" value={formData.tutor_name} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div><label className="block text-base font-semibold text-gray-700">RG</label><input type="text" name="tutor_rg" value={formData.tutor_rg} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block text-base font-semibold text-gray-700">Endereço</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div><label className="block text-base font-semibold text-gray-700">Telefone</label><input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div><label className="block text-base font-semibold text-gray-700">Emergência</label><input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} required className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        <div className="md:col-span-2"><label className="block text-base font-semibold text-gray-700">Telefone Vet.</label><input type="text" name="vet_phone" value={formData.vet_phone} onChange={handleInputChange} className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                    </div>
                     {/* Health & Plan */}
                     <div className="space-y-6">
                       <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Saúde, Plano e Status</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div><label className="block text-base font-semibold text-gray-700">Última vacina</label><input type="date" name="last_vaccine" value={formData.last_vaccine} onChange={handleInputChange} className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                           <div><label className="block text-base font-semibold text-gray-700">Último vermífugo</label><input type="date" name="last_deworming" value={formData.last_deworming} onChange={handleInputChange} className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                           <div><label className="block text-base font-semibold text-gray-700">Último antipulgas</label><input type="date" name="last_flea_remedy" value={formData.last_flea_remedy} onChange={handleInputChange} className="mt-1 block w-full p-2 bg-gray-50 border rounded-md"/></div>
                        </div>
                        {renderRadioGroup('Plano', 'contracted_plan', [ {label: '2x Semana', value: '2x_week'}, {label: '3x Semana', value: '3x_week'}, {label: '4x Semana', value: '4x_week'}, {label: '5x Semana', value: '5x_week'}])}
                        
                        {/* Extra Services */}
                        <div className="space-y-4">
                            <h4 className="text-base font-semibold text-pink-700 border-b pb-1">Serviços Extras</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 text-gray-700 font-medium bg-white p-3 rounded-lg border">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.extra_services?.pernoite || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            extra_services: {
                                                ...prev.extra_services,
                                                pernoite: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                    />
                                    Pernoite
                                </label>
                                <label className="flex items-center gap-2 text-gray-700 font-medium bg-white p-3 rounded-lg border">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.extra_services?.banho_tosa || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            extra_services: {
                                                ...prev.extra_services,
                                                banho_tosa: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                    />
                                    Banho & Tosa
                                </label>
                                <label className="flex items-center gap-2 text-gray-700 font-medium bg-white p-3 rounded-lg border">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.extra_services?.so_banho || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            extra_services: {
                                                ...prev.extra_services,
                                                so_banho: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                    />
                                    Só banho
                                </label>
                                <label className="flex items-center gap-2 text-gray-700 font-medium bg-white p-3 rounded-lg border">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.extra_services?.adestrador || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            extra_services: {
                                                ...prev.extra_services,
                                                adestrador: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                    />
                                    Adestrador
                                </label>
                                <label className="flex items-center gap-2 text-gray-700 font-medium bg-white p-3 rounded-lg border">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.extra_services?.despesa_medica || false}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            extra_services: {
                                                ...prev.extra_services,
                                                despesa_medica: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                    />
                                    Despesa médica
                                </label>
                                <div className="flex items-center gap-2 text-gray-700 font-medium bg-white p-3 rounded-lg border">
                                    <input 
                                        type="checkbox" 
                                        checked={(formData.extra_services?.dia_extra || 0) > 0}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            extra_services: {
                                                ...prev.extra_services,
                                                dia_extra: e.target.checked ? 1 : 0
                                            }
                                        }))}
                                        className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                                    />
                                    <span>Dia extra</span>
                                    {(formData.extra_services?.dia_extra || 0) > 0 && (
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={formData.extra_services?.dia_extra || 1}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                extra_services: {
                                                    ...prev.extra_services,
                                                    dia_extra: parseInt(e.target.value) || 1
                                                }
                                            }))}
                                            className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-base font-semibold text-gray-700">Status</label>
                            <select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full p-2 bg-gray-50 border rounded-md">
                                <option value="Pendente">Pendente</option>
                                <option value="Aprovado">Aprovado</option>
                                <option value="Rejeitado">Rejeitado</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-white mt-auto rounded-b-2xl flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="bg-pink-600 text-white font-bold py-3.5 px-4 rounded-lg disabled:bg-gray-400">{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</button>
                </div>
            </form>
        </div>
    );
};

const HotelRegistrationForm: React.FC<{
    setView?: (view: 'scheduler' | 'login' | 'hotelRegistration') => void;
    onSuccess?: () => void;
}> = ({ setView, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [formData, setFormData] = useState<HotelRegistration>({
        pet_name: '', pet_sex: null, pet_breed: '', is_neutered: null, pet_age: '',
        tutor_name: '', tutor_rg: '', tutor_address: '', tutor_phone: '', tutor_email: '', tutor_social_media: '',
        vet_phone: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
        has_rg_document: false, has_residence_proof: false, has_vaccination_card: false, has_vet_certificate: false,
        has_flea_tick_remedy: false, flea_tick_remedy_date: '', photo_authorization: false, retrieve_at_checkout: false,
        preexisting_disease: '', allergies: '', behavior: '', fears_traumas: '', wounds_marks: '',
        food_brand: '', food_quantity: '', feeding_frequency: '', accepts_treats: '', special_food_care: '',
        check_in_date: '', check_in_time: '', check_out_date: '', check_out_time: '',
        service_bath: false, service_transport: false, service_daily_rate: false, service_extra_hour: false,
        service_vet: false, service_training: false, total_services_price: 0, additional_info: '',
        professional_name: '', registration_date: new Date().toISOString().split('T')[0],
        tutor_check_in_signature: '', tutor_check_out_signature: '', declaration_accepted: false, status: 'Ativo',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [checkInDate, setCheckInDate] = useState(new Date());
    const [checkOutDate, setCheckOutDate] = useState(new Date());
    const [checkInHour, setCheckInHour] = useState<number | null>(null);
    const [checkOutHour, setCheckOutHour] = useState<number | null>(null);
    const [serviceBathText, setServiceBathText] = useState('');
    const [serviceTransportText, setServiceTransportText] = useState('');
    const [serviceDailyText, setServiceDailyText] = useState('');
    const [serviceExtraHourText, setServiceExtraHourText] = useState('');
    const [serviceTrainingText, setServiceTrainingText] = useState('');
    const [vaccinationCardFile, setVaccinationCardFile] = useState<string>('');
    const [vetCertificateFile, setVetCertificateFile] = useState<string>('');
    const [woundsPhotoFile, setWoundsPhotoFile] = useState<string>('');

    const changeStep = (nextStep: number) => {
        setIsAnimating(true);
        setTimeout(() => {
            setStep(nextStep);
            setIsAnimating(false);
        }, 300);
    };

    useEffect(() => {
        if (checkInDate && checkInHour !== null) {
            const dateStr = checkInDate.toISOString().split('T')[0];
            const timeStr = `${checkInHour.toString().padStart(2, '0')}:00`;
            setFormData(prev => ({ ...prev, check_in_date: dateStr, check_in_time: timeStr }));
        }
    }, [checkInDate, checkInHour]);

    useEffect(() => {
        if (checkOutDate && checkOutHour !== null) {
            const dateStr = checkOutDate.toISOString().split('T')[0];
            const timeStr = `${checkOutHour.toString().padStart(2, '0')}:00`;
            setFormData(prev => ({ ...prev, check_out_date: dateStr, check_out_time: timeStr }));
        }
    }, [checkOutDate, checkOutHour]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: name === 'tutor_phone' ? formatWhatsapp(value) : value }));
        }
    };

    const handleRadioChange = (name: keyof HotelRegistration, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.declaration_accepted) {
            alert('Por favor, aceite a declaração antes de prosseguir');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                flea_tick_remedy_date: formData.flea_tick_remedy_date || null,
                check_in_date: formData.check_in_date || null,
                check_in_time: formData.check_in_time || null,
                check_out_date: formData.check_out_date || null,
                check_out_time: formData.check_out_time || null,
            };
            
            const { error } = await supabase.from('hotel_registrations').insert(payload);
            if (error) throw error;
            setIsSuccess(true);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            alert(`Erro ao criar registro de hotel: ${error.message}`);
            setIsSubmitting(false);
        }
    };
    
    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-pink-600 bg-opacity-90 flex items-center justify-center z-50 animate-fadeIn p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-full sm:max-w-sm mx-auto">
                    <SuccessIcon />
                    <h2 className="text-3xl font-bold text-gray-800 mt-2">Check-in Realizado!</h2>
                    <p className="text-gray-600 mt-2">Registro de hospedagem criado com sucesso.</p>
                    <button onClick={() => setView && setViewWithLog('scheduler')} className="mt-6 bg-pink-600 text-white font-bold py-3.5 px-8 rounded-lg hover:bg-pink-700 transition-colors">OK</button>
                </div>
            </div>
        );
    }

    const renderRadioGroup = (label: string, name: keyof HotelRegistration, options: { label: string, value: any }[]) => (
        <div>
            <label className="block text-base font-semibold text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button type="button" key={opt.label} onClick={() => handleRadioChange(name, opt.value)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${formData[name as keyof typeof formData] === opt.value ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const hotelHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    const onBack = () => {
        if (step > 1) {
            changeStep(step - 1);
        } else {
            setView && setViewWithLog('scheduler');
        }
    };

    const isStep1Valid = formData.pet_name && formData.tutor_name && formData.tutor_phone && formData.pet_breed && formData.tutor_address;
    const isStep2Valid = true;
    const isStep3Valid = true;
    const isStep4Valid = formData.check_in_date && formData.check_in_time && formData.check_out_date && formData.check_out_time;
    const isStep5Valid = true;

    return (
        <div className="w-full max-w-3xl mx-auto bg-rose-50 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
                    {['Pet/Tutor', 'Documentos', 'Alimentação', 'Hospedagem', 'Serviços', 'Assinatura'].map((name, index) => (
                        <div key={name} className={`flex items-center gap-1 ${step > index + 1 ? 'text-pink-600' : ''} ${step === index + 1 ? 'text-pink-600 font-bold' : ''}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${step >= index + 1 ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-500'} text-xs`}>
                                {step > index + 1 ? '✓' : index + 1}
                            </div>
                            <span className="hidden sm:inline">{name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className={`relative p-6 sm:p-8 transition-all duration-300 ${isAnimating ? 'animate-slideOutToLeft' : 'animate-slideInFromRight'}`}>
                {step === 1 && (
                    <div className="space-y-7">
                        <h2 className="text-3xl font-bold text-gray-800">Dados do Pet e Tutor</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Informações do Pet</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="pet_name" className="block text-base font-semibold text-gray-700">Nome do Pet</label>
                                        <input type="text" name="pet_name" id="pet_name" value={formData.pet_name} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="pet_breed" className="block text-base font-semibold text-gray-700">Raça</label>
                                        <input type="text" name="pet_breed" id="pet_breed" value={formData.pet_breed} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="pet_age" className="block text-base font-semibold text-gray-700">Idade</label>
                                        <input type="text" name="pet_age" id="pet_age" value={formData.pet_age} onChange={handleInputChange} required placeholder="Ex: 2 anos" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div className="md:col-span-1">{renderRadioGroup('Sexo', 'pet_sex', [{label: 'Macho', value: 'Macho'}, {label: 'Fêmea', value: 'Fêmea'}])}</div>
                                    <div className="md:col-span-2">{renderRadioGroup('Castrado(a)', 'is_neutered', [{label: 'Sim', value: true}, {label: 'Não', value: false}])}</div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Informações do Tutor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="tutor_name" className="block text-base font-semibold text-gray-700">Nome do Tutor</label>
                                        <input type="text" name="tutor_name" id="tutor_name" value={formData.tutor_name} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label htmlFor="tutor_address" className="block text-base font-semibold text-gray-700">Endereço</label>
                                        <input type="text" name="tutor_address" id="tutor_address" value={formData.tutor_address} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="tutor_phone" className="block text-base font-semibold text-gray-700">Telefone</label>
                                        <input type="tel" name="tutor_phone" id="tutor_phone" value={formData.tutor_phone} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="tutor_email" className="block text-base font-semibold text-gray-700">Email</label>
                                        <input type="email" name="tutor_email" id="tutor_email" value={formData.tutor_email} onChange={handleInputChange} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-7">
                        <h2 className="text-3xl font-bold text-gray-800">Documentos e Anamnese</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Documentos</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="tutor_rg" className="block text-base font-semibold text-gray-700">RG (número)</label>
                                        <input type="text" name="tutor_rg" id="tutor_rg" value={formData.tutor_rg} onChange={handleInputChange} placeholder="Digite o número do RG" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-base font-semibold text-gray-700 mb-2">Carteira de Vacinação (opcional)</label>
                                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setVaccinationCardFile(e.target.files?.[0]?.name || '')} className="block w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                                        {vaccinationCardFile && <p className="mt-1 text-base text-gray-600">Arquivo selecionado: {vaccinationCardFile}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-base font-semibold text-gray-700 mb-2">Atestado Veterinário</label>
                                        <input type="file" accept="image/*,application/pdf" onChange={(e) => setVetCertificateFile(e.target.files?.[0]?.name || '')} className="block w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                                        {vetCertificateFile && <p className="mt-1 text-base text-gray-600">Arquivo selecionado: {vetCertificateFile}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                            <input type="checkbox" name="has_flea_tick_remedy" checked={formData.has_flea_tick_remedy} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                            <span className="font-semibold">Remédio Pulga/Carrapato</span>
                                        </label>
                                        {formData.has_flea_tick_remedy && (
                                            <div className="mt-2 ml-7">
                                                <label htmlFor="flea_tick_remedy_date" className="block text-base font-semibold text-gray-700">Data de aplicação</label>
                                                <input type="date" name="flea_tick_remedy_date" id="flea_tick_remedy_date" value={formData.flea_tick_remedy_date} onChange={handleInputChange} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Anamnese</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="preexisting_disease" className="block text-base font-semibold text-gray-700">Doença preexistente</label>
                                        <textarea name="preexisting_disease" id="preexisting_disease" value={formData.preexisting_disease} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="allergies" className="block text-base font-semibold text-gray-700">Alergias</label>
                                        <textarea name="allergies" id="allergies" value={formData.allergies} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="behavior" className="block text-base font-semibold text-gray-700">Comportamento</label>
                                        <textarea name="behavior" id="behavior" value={formData.behavior} onChange={handleInputChange} rows={2} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="fears_traumas" className="block text-base font-semibold text-gray-700">Algum medo ou trauma?</label>
                                        <textarea name="fears_traumas" id="fears_traumas" value={formData.fears_traumas} onChange={handleInputChange} rows={2} placeholder="Descreva medos ou traumas do pet" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-base font-semibold text-gray-700 mb-2">Feridas: marque na foto</label>
                                        <input type="file" accept="image/*" onChange={(e) => setWoundsPhotoFile(e.target.files?.[0]?.name || '')} className="block w-full text-base text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"/>
                                        {woundsPhotoFile && <p className="mt-1 text-base text-gray-600">Foto selecionada: {woundsPhotoFile}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-7">
                        <h2 className="text-3xl font-bold text-gray-800">Alimentação</h2>
                        <div className="space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="food_brand" className="block text-base font-semibold text-gray-700">Ração</label>
                                    <input type="text" name="food_brand" id="food_brand" value={formData.food_brand} onChange={handleInputChange} placeholder="Marca e tipo da ração" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                <div>
                                    <label htmlFor="food_quantity" className="block text-base font-semibold text-gray-700">Quantidade</label>
                                    <input type="text" name="food_quantity" id="food_quantity" value={formData.food_quantity} onChange={handleInputChange} placeholder="Ex: 200g, 1 xícara" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                <div>
                                    <label htmlFor="feeding_frequency" className="block text-base font-semibold text-gray-700">1 ou 2x por dia</label>
                                    <input type="text" name="feeding_frequency" id="feeding_frequency" value={formData.feeding_frequency} onChange={handleInputChange} placeholder="Ex: 1x ao dia, 2x ao dia" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                <div>
                                    <label htmlFor="accepts_treats" className="block text-base font-semibold text-gray-700">Petisco ok?</label>
                                    <input type="text" name="accepts_treats" id="accepts_treats" value={formData.accepts_treats} onChange={handleInputChange} placeholder="Sim/Não, quais tipos" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                <div>
                                    <label htmlFor="special_food_care" className="block text-base font-semibold text-gray-700">Algum cuidado especial?</label>
                                    <textarea name="special_food_care" id="special_food_care" value={formData.special_food_care} onChange={handleInputChange} rows={3} placeholder="Descreva cuidados especiais com alimentação" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-7">
                        <h2 className="text-3xl font-bold text-gray-800">Hospedagem</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Check-in</h3>
                                <div className="bg-white p-6 sm:p-5 rounded-lg border border-gray-200">
                                    <Calendar selectedDate={checkInDate} onDateChange={setCheckInDate} disablePast={true} />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-base font-semibold text-gray-700 mb-2">Horário do Check-in</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                        {hotelHours.map(hour => (
                                            <button type="button" key={hour} onClick={() => setCheckInHour(hour)}
                                                className={`p-2 rounded-lg text-center font-semibold transition-colors ${checkInHour === hour ? 'bg-pink-600 text-white' : 'bg-gray-50 border border-gray-300 hover:border-pink-500'}`}>
                                                {`${hour}:00`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">Check-out</h3>
                                <div className="bg-white p-6 sm:p-5 rounded-lg border border-gray-200">
                                    <Calendar selectedDate={checkOutDate} onDateChange={setCheckOutDate} disablePast={true} />
                                </div>
                                <div className="mt-4">
                                    <label className="block text-base font-semibold text-gray-700 mb-2">Horário do Check-out</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                                        {hotelHours.map(hour => (
                                            <button type="button" key={hour} onClick={() => setCheckOutHour(hour)}
                                                className={`p-2 rounded-lg text-center font-semibold transition-colors ${checkOutHour === hour ? 'bg-pink-600 text-white' : 'bg-gray-50 border border-gray-300 hover:border-pink-500'}`}>
                                                {`${hour}:00`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-7">
                        <h2 className="text-3xl font-bold text-gray-800">Serviços Adicionais</h2>
                        <div className="space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <input type="checkbox" name="service_bath" checked={formData.service_bath} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                        <span className="font-semibold">Banho</span>
                                    </label>
                                    {formData.service_bath && (
                                        <input type="text" value={serviceBathText} onChange={(e) => setServiceBathText(e.target.value)} placeholder="Detalhes do banho" className="mt-2 ml-7 w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <input type="checkbox" name="service_transport" checked={formData.service_transport} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                        <span className="font-semibold">Transporte</span>
                                    </label>
                                    {formData.service_transport && (
                                        <input type="text" value={serviceTransportText} onChange={(e) => setServiceTransportText(e.target.value)} placeholder="Endereço/detalhes do transporte" className="mt-2 ml-7 w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <input type="checkbox" name="service_daily_rate" checked={formData.service_daily_rate} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                        <span className="font-semibold">Diária</span>
                                    </label>
                                    {formData.service_daily_rate && (
                                        <input type="text" value={serviceDailyText} onChange={(e) => setServiceDailyText(e.target.value)} placeholder="Número de diárias" className="mt-2 ml-7 w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <input type="checkbox" name="service_extra_hour" checked={formData.service_extra_hour} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                        <span className="font-semibold">Hora extra</span>
                                    </label>
                                    {formData.service_extra_hour && (
                                        <input type="text" value={serviceExtraHourText} onChange={(e) => setServiceExtraHourText(e.target.value)} placeholder="Quantidade de horas extras" className="mt-2 ml-7 w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    )}
                                </div>
                                
                                <div>
                                    <label htmlFor="service_vet" className="block text-base font-semibold text-gray-700">Médico(a) veterinário(a)</label>
                                    <textarea name="vet_phone" id="vet_phone" value={formData.vet_phone} onChange={handleInputChange} rows={2} placeholder="Nome e telefone do veterinário" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                
                                <div>
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                                        <input type="checkbox" name="service_training" checked={formData.service_training} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                        <span className="font-semibold">Adestramento</span>
                                    </label>
                                    {formData.service_training && (
                                        <input type="text" value={serviceTrainingText} onChange={(e) => setServiceTrainingText(e.target.value)} placeholder="Tipo de adestramento" className="mt-2 ml-7 w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                    )}
                                </div>
                                
                                <div>
                                    <label htmlFor="total_services_price" className="block text-base font-semibold text-gray-700">Total Serviços: R$</label>
                                    <input type="number" name="total_services_price" id="total_services_price" value={formData.total_services_price} onChange={handleInputChange} step="0.01" placeholder="0.00" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                
                                <div>
                                    <label htmlFor="additional_info" className="block text-base font-semibold text-gray-700">Informações Adicionais</label>
                                    <textarea name="additional_info" id="additional_info" value={formData.additional_info} onChange={handleInputChange} rows={3} placeholder="Outras observações importantes" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="space-y-7">
                        <h2 className="text-3xl font-bold text-gray-800">Assinatura e Resumo</h2>
                        <div className="p-4 bg-white rounded-lg space-y-2 text-gray-700 border">
                            <h3 className="font-semibold mb-2 text-gray-700">Resumo do Check-in</h3>
                            <p><strong>Pet:</strong> {formData.pet_name} ({formData.pet_breed})</p>
                            <p><strong>Tutor:</strong> {formData.tutor_name}</p>
                            <p><strong>Telefone:</strong> {formData.tutor_phone}</p>
                            <p><strong>Check-in:</strong> {formData.check_in_date} às {formData.check_in_time}</p>
                            <p><strong>Check-out:</strong> {formData.check_out_date} às {formData.check_out_time}</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-6 sm:p-5 rounded-lg border border-gray-200">
                                <p className="text-base text-gray-700 mb-3">Declaro estar ciente, de ter recebido o pet em perfeito estado, bem como os serviços solicitados realizados de acordo com o combinado.</p>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" name="declaration_accepted" checked={formData.declaration_accepted} onChange={handleInputChange} required className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                    <span className="text-base font-semibold text-gray-700">Li e aceito os termos acima</span>
                                </label>
                            </div>
                            
                            <div className="bg-gray-50 p-6 sm:p-5 rounded-lg border border-gray-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" name="photo_authorization" checked={formData.photo_authorization} onChange={handleInputChange} className="h-7 w-7 rounded border-gray-300 text-pink-600"/>
                                    <span className="text-base text-gray-700">Autorizo registro fotográfico, para documentação e divulgação publicitária em veículos de comunicação e redes sociais</span>
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="tutor_check_in_signature" className="block text-base font-semibold text-gray-700">Tutor (check in)</label>
                                    <input type="text" name="tutor_check_in_signature" id="tutor_check_in_signature" value={formData.tutor_check_in_signature} onChange={handleInputChange} placeholder="Nome completo" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                                <div>
                                    <label htmlFor="tutor_check_out_signature" className="block text-base font-semibold text-gray-700">Tutor (check out)</label>
                                    <input type="text" name="tutor_check_out_signature" id="tutor_check_out_signature" value={formData.tutor_check_out_signature} onChange={handleInputChange} placeholder="Nome completo" className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-between items-center">
                    <button type="button" onClick={onBack} className="bg-gray-200 text-gray-800 font-bold py-3.5 px-5 rounded-lg hover:bg-gray-300 transition-colors">{step === 1 ? 'Cancelar' : 'Voltar'}</button>
                    <div className="flex-grow"></div>
                    {step < 6 && <button type="button" onClick={() => changeStep(step + 1)} disabled={(step === 1 && !isStep1Valid) || (step === 4 && !isStep4Valid)} className="w-full md:w-auto bg-pink-600 text-white font-bold py-3.5 px-5 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-gray-300">Avançar</button>}
                    {step === 6 && <button type="submit" disabled={isSubmitting || !formData.declaration_accepted} className="w-full md:w-auto bg-green-500 text-white font-bold py-3.5 px-5 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300">{isSubmitting ? 'Salvando...' : 'Finalizar Check-in'}</button>}
                </div>
            </form>
        </div>
    );
};

// FIX: Renamed AddDaycareEnrollmentModal to DaycareRegistrationForm and converted it from a modal to a full-page component.
const DaycareRegistrationForm: React.FC<{
    setView?: (view: 'scheduler' | 'login' | 'daycareRegistration') => void;
    onBack?: () => void;
    onSuccess?: (newEnrollment: DaycareRegistration) => void;
    isAdmin?: boolean;
}> = ({ setView, onBack, onSuccess, isAdmin = false }) => {
    const [formData, setFormData] = useState<DaycareRegistration>({
        pet_name: '', pet_breed: '', is_neutered: null, pet_sex: '', pet_age: '', has_sibling_discount: false,
        tutor_name: '', tutor_rg: '', address: '', contact_phone: '', emergency_contact_name: '', vet_phone: '',
        gets_along_with_others: null, last_vaccine: '', last_deworming: '', last_flea_remedy: '',
        has_allergies: null, allergies_description: '', needs_special_care: null, special_care_description: '',
        delivered_items: { items: [], other: '' }, contracted_plan: null, total_price: undefined, payment_date: '',
        status: 'Pendente',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'contact_phone' ? formatWhatsapp(value) : value }));
    };

    const handleRadioChange = (name: keyof DaycareRegistration, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleBelongingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const newItems = checked ? [...prev.delivered_items.items, value] : prev.delivered_items.items.filter(item => item !== value);
            return { ...prev, delivered_items: { ...prev.delivered_items, items: newItems } };
        });
    };
    
    const handleOtherBelongingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setFormData(prev => ({ ...prev, delivered_items: { ...prev.delivered_items, other: value }}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                last_vaccine: formData.last_vaccine || null,
                last_deworming: formData.last_deworming || null,
                last_flea_remedy: formData.last_flea_remedy || null,
                total_price: formData.total_price ? parseFloat(String(formData.total_price)) : null,
                payment_date: formData.payment_date || null,
            };
            
            const { data, error } = await supabase.from('daycare_enrollments').insert(payload).select().single();
            if (error) throw error;
            
            if (isAdmin && onSuccess) {
                onSuccess(data as DaycareRegistration);
            } else {
                setIsSuccess(true);
            }

        } catch (error: any) {
            alert(`Erro ao criar matrícula: ${error.message}`);
            setIsSubmitting(false);
        }
    };
    
    if (isSuccess) {
      return (
        <div className="fixed inset-0 bg-pink-600 bg-opacity-90 flex items-center justify-center z-50 animate-fadeIn p-4">
            <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-full sm:max-w-sm mx-auto">
                <SuccessIcon />
                <h2 className="text-3xl font-bold text-gray-800 mt-2">Solicitação Enviada!</h2>
                <p className="text-gray-600 mt-2">Recebemos seu pedido. Entraremos em contato em breve para os próximos passos.</p>
                <button onClick={() => setView && setViewWithLog('scheduler')} className="mt-6 bg-pink-600 text-white font-bold py-3.5 px-8 rounded-lg hover:bg-pink-700 transition-colors">OK</button>
            </div>
        </div>
      );
    }

    const renderRadioGroup = (label: string, name: keyof DaycareRegistration, options: { label: string, value: any }[]) => (
        <div>
            <label className="block text-base font-semibold text-gray-700 mb-1">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button type="button" key={opt.label} onClick={() => handleRadioChange(name, opt.value)}
                        className={`px-4 py-3.5 rounded-lg border text-sm font-semibold transition-colors ${formData[name as keyof typeof formData] === opt.value ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-700 hover:bg-pink-50'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const formContent = (
        <form onSubmit={handleSubmit} className="bg-rose-50 rounded-2xl shadow-xl w-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800">Formulário de Matrícula</h2>
            </div>
            <div className="p-6 space-y-8 overflow-y-auto" style={{maxHeight: isAdmin ? '70vh' : '65vh' }}>
                {/* Pet and Tutor Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <h3 className="md:col-span-2 text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Dados do Pet</h3>
                    <div><label className="block text-base font-semibold text-gray-700">Nome do pet</label><input type="text" name="pet_name" value={formData.pet_name} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div><label className="block text-base font-semibold text-gray-700">Raça</label><input type="text" name="pet_breed" value={formData.pet_breed} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div><label className="block text-base font-semibold text-gray-700">Idade</label><input type="text" name="pet_age" value={formData.pet_age} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div><label className="block text-base font-semibold text-gray-700">Sexo</label><input type="text" name="pet_sex" value={formData.pet_sex} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    {renderRadioGroup('Castrado (a)', 'is_neutered', [{label: 'Sim', value: true}, {label: 'Não', value: false}])}
                    <div>
                       <label className="flex items-center gap-3 text-base font-semibold text-gray-700">
                           <input type="checkbox" name="has_sibling_discount" checked={formData.has_sibling_discount} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                           Desconto irmão (10%)
                       </label>
                    </div>
                    
                    <h3 className="md:col-span-2 text-lg font-semibold text-pink-700 border-b pb-2 mb-2 mt-6">Dados do Tutor</h3>
                    <div><label className="block text-base font-semibold text-gray-700">Tutor</label><input type="text" name="tutor_name" value={formData.tutor_name} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div><label className="block text-base font-semibold text-gray-700">RG</label><input type="text" name="tutor_rg" value={formData.tutor_rg} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div className="md:col-span-2"><label className="block text-base font-semibold text-gray-700">Endereço</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div><label className="block text-base font-semibold text-gray-700">Telefone contato</label><input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div><label className="block text-base font-semibold text-gray-700">Telefone e nome (emergencial)</label><input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} required className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    <div className="md:col-span-2"><label className="block text-base font-semibold text-gray-700">Telefone do veterinário(a)</label><input type="text" name="vet_phone" value={formData.vet_phone} onChange={handleInputChange} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                </div>
                {/* Health Info */}
                <div className="space-y-6">
                   <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Saúde e Comportamento</h3>
                   {renderRadioGroup('Se dá bem com outros animais', 'gets_along_with_others', [{label: 'Sim', value: true}, {label: 'Não', value: false}])}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div><DatePicker value={formData.last_vaccine} onChange={(value) => setFormData(prev => ({ ...prev, last_vaccine: value }))} label="Última vacina" className="mt-1" /></div>
                       <div><DatePicker value={formData.last_deworming} onChange={(value) => setFormData(prev => ({ ...prev, last_deworming: value }))} label="Último vermífugo" className="mt-1" /></div>
                       <div><DatePicker value={formData.last_flea_remedy} onChange={(value) => setFormData(prev => ({ ...prev, last_flea_remedy: value }))} label="Último remédio de pulgas e carrapatos" className="mt-1" /></div>
                   </div>
                    {renderRadioGroup('Alergia?', 'has_allergies', [{label: 'Sim', value: true}, {label: 'Não', value: false}])}
                    {formData.has_allergies && (
                       <div><label className="block text-base font-semibold text-gray-700">Descreva a alergia:</label><textarea name="allergies_description" value={formData.allergies_description} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    )}
                    {renderRadioGroup('Cuidados especiais', 'needs_special_care', [{label: 'Sim', value: true}, {label: 'Não', value: false}])}
                    {formData.needs_special_care && (
                       <div><label className="block text-base font-semibold text-gray-700">Descreva o cuidado especial:</label><textarea name="special_care_description" value={formData.special_care_description} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                    )}
                </div>
                {/* Belongings */}
                 <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Objetos entregues sempre</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Bolinha', 'Pelucia', 'Cama', 'Coleira', 'Comedouro'].map(item => (
                           <label key={item} className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-6 sm:p-5 rounded-lg border-2 border-gray-200">
                               <input type="checkbox" value={item} onChange={handleBelongingsChange} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                               {item}
                           </label>
                        ))}
                    </div>
                    <div><label className="block text-base font-semibold text-gray-700">Outros:</label><input type="text" name="other_belongings" value={formData.delivered_items.other} onChange={handleOtherBelongingsChange} className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/></div>
                </div>
                {/* Plan */}
                {renderRadioGroup('Plano contratado', 'contracted_plan', [
                    {label: '2 X SEMANA', value: '2x_week'}, 
                    {label: '3 X SEMANA', value: '3x_week'},
                    {label: '4 X SEMANA', value: '4x_week'},
                    {label: '5 X SEMANA', value: '5x_week'},
                ])}
                
                {/* Extra Services */}
                <div className="space-y-6 pt-6 border-t border-gray-200 mt-6">
                    <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Serviços Extras</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-4 rounded-lg border-2 border-gray-200">
                            <input 
                                type="checkbox" 
                                checked={formData.extra_services?.pernoite || false}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    extra_services: {
                                        ...prev.extra_services,
                                        pernoite: e.target.checked
                                    }
                                }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                            />
                            Pernoite
                        </label>
                        <label className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-4 rounded-lg border-2 border-gray-200">
                            <input 
                                type="checkbox" 
                                checked={formData.extra_services?.banho_tosa || false}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    extra_services: {
                                        ...prev.extra_services,
                                        banho_tosa: e.target.checked
                                    }
                                }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                            />
                            Banho & Tosa
                        </label>
                        <label className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-4 rounded-lg border-2 border-gray-200">
                            <input 
                                type="checkbox" 
                                checked={formData.extra_services?.so_banho || false}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    extra_services: {
                                        ...prev.extra_services,
                                        so_banho: e.target.checked
                                    }
                                }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                            />
                            Só banho
                        </label>
                        <label className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-4 rounded-lg border-2 border-gray-200">
                            <input 
                                type="checkbox" 
                                checked={formData.extra_services?.adestrador || false}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    extra_services: {
                                        ...prev.extra_services,
                                        adestrador: e.target.checked
                                    }
                                }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                            />
                            Adestrador
                        </label>
                        <label className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-4 rounded-lg border-2 border-gray-200">
                            <input 
                                type="checkbox" 
                                checked={formData.extra_services?.despesa_medica || false}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    extra_services: {
                                        ...prev.extra_services,
                                        despesa_medica: e.target.checked
                                    }
                                }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                            />
                            Despesa médica
                        </label>
                        <div className="flex items-center gap-3 text-gray-700 font-semibold bg-white p-4 rounded-lg border-2 border-gray-200">
                            <input 
                                type="checkbox" 
                                checked={(formData.extra_services?.dia_extra || 0) > 0}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    extra_services: {
                                        ...prev.extra_services,
                                        dia_extra: e.target.checked ? 1 : 0
                                    }
                                }))}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                            />
                            <span>Dia extra</span>
                            {(formData.extra_services?.dia_extra || 0) > 0 && (
                                <input 
                                    type="number" 
                                    min="1"
                                    value={formData.extra_services?.dia_extra || 1}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        extra_services: {
                                            ...prev.extra_services,
                                            dia_extra: parseInt(e.target.value) || 1
                                        }
                                    }))}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Payment Details */}
                <div className="space-y-6 pt-6 border-t border-gray-200 mt-6">
                    <h3 className="text-lg font-semibold text-pink-700 border-b pb-2 mb-2">Detalhes Financeiros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="total_price" className="block text-base font-semibold text-gray-700">Valor Total (R$)</label>
                            <input 
                                type="number" 
                                id="total_price"
                                name="total_price" 
                                value={formData.total_price || ''} 
                                onChange={handleInputChange} 
                                placeholder="Ex: 500.00"
                                step="0.01"
                                className="mt-1 block w-full px-5 py-4 bg-gray-50 border border-gray-300 rounded-md"/>
                        </div>
                        <div>
                            <DatePicker 
                                value={formData.payment_date || ''} 
                                onChange={(value) => setFormData(prev => ({ ...prev, payment_date: value }))}
                                label="Data de Pagamento"
                                className="mt-1" 
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6 bg-white flex justify-between items-center mt-auto rounded-b-2xl">
                <button type="button" onClick={onBack || (() => setView && setViewWithLog('scheduler'))} className="w-auto bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                    {isAdmin ? 'Cancelar' : 'Voltar'}
                </button>
                <button type="submit" disabled={isSubmitting} className="w-auto bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400">
                    {isSubmitting ? 'Enviando...' : (isAdmin ? 'Adicionar Matrícula' : 'Realizar solicitação de matrícula')}
                </button>
            </div>
        </form>
    );

    if (isAdmin) {
        return formContent;
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <header className="text-center mb-6">
                <img src="https://i.imgur.com/M3Gt3OA.png" alt="Sandy's Pet Shop Logo" className="h-20 w-20 mx-auto mb-2"/>
                <h1 className="font-brand text-5xl text-pink-800">Sandy's Pet Shop</h1>
                <p className="text-gray-600 text-lg">Matrícula na Creche</p>
            </header>
            <main className="w-full max-w-3xl">
                {formContent}
            </main>
        </div>
    );
};


// FIX: Define the missing TimeSlotPicker component
const TimeSlotPicker: React.FC<{
    selectedDate: Date;
    selectedService: ServiceType | null;
    appointments: Appointment[];
    onTimeSelect: (time: number) => void;
    selectedTime: number | null;
    workingHours: number[];
    isPetMovel: boolean;
  }> = ({ selectedDate, selectedService, appointments, onTimeSelect, selectedTime, workingHours, isPetMovel }) => {
    const getAvailability = useMemo(() => {
        if (!selectedService) {
            const finalAvailability = new Map<number, boolean>();
            workingHours.forEach(hour => finalAvailability.set(hour, false));
            return finalAvailability;
        }
        const duration = SERVICES[selectedService].duration;

        // Determine capacity and filter appointments based on service type
        const capacity = isPetMovel ? 1 : MAX_CAPACITY_PER_SLOT;
        const dayAppointments = appointments.filter(app => 
            isSameSaoPauloDay(app.appointmentTime, selectedDate) && 
            (isPetMovel ? app.service.startsWith('PET_MOBILE') : !app.service.startsWith('PET_MOBILE'))
        );

        // Initialize availability map
        const availability = new Map<number, number>();
        workingHours.forEach(hour => availability.set(hour, capacity));

        // Decrement availability based on existing appointments
        dayAppointments.forEach(app => {
            const { hour: startHour } = getSaoPauloTimeParts(app.appointmentTime);
            // Ensure service exists in SERVICES constant to prevent crash
            const appDuration = app.service && SERVICES[app.service] ? SERVICES[app.service].duration : 1; 
            for (let h = startHour; h < startHour + Math.ceil(appDuration); h++) {
                if (availability.has(h)) {
                    availability.set(h, availability.get(h)! - 1);
                }
            }
        });

        // Todos os horários estão disponíveis
        const finalAvailability = new Map<number, boolean>();
        workingHours.forEach(hour => {
            finalAvailability.set(hour, true);
        });

        return finalAvailability;
    }, [selectedDate, selectedService, appointments, workingHours, isPetMovel]);
    
    const now = new Date();
    const todaySaoPaulo = getSaoPauloTimeParts(now);
  
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {workingHours.map(hour => {
          // Todos os horários estão disponíveis
          const isDisabled = false;
          
          return (
            <button
              key={hour}
              type="button"
              disabled={isDisabled}
              onClick={() => onTimeSelect(hour)}
              className={`p-5 rounded-lg text-center font-semibold transition-colors border-2
                ${selectedTime === hour ? 'bg-pink-600 text-white border-pink-600' : ''}
                ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white hover:bg-pink-50 border-gray-200'}
              `}
            >
              {`${hour}:00`}
            </button>
          );
        })}
      </div>
    );
  };

// --- MAIN APP COMPONENT ---
const Scheduler: React.FC<{ setView: (view: 'scheduler' | 'login' | 'daycareRegistration' | 'hotelRegistration') => void }> = ({ setView }) => {
  const [step, setStep] = useState(1);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState({ petName: '', ownerName: '', whatsapp: '', petBreed: '', ownerAddress: '' });
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [serviceStepView, setServiceStepView] = useState<'main' | 'bath_groom' | 'pet_movel' | 'pet_movel_condo' | 'hotel_pet'>('main');
  const [selectedCondo, setSelectedCondo] = useState<string | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<PetWeight | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allowedDays, setAllowedDays] = useState<number[] | undefined>(undefined);
  
  const isVisitService = useMemo(() => 
    selectedService === ServiceType.VISIT_DAYCARE || selectedService === ServiceType.VISIT_HOTEL,
    [selectedService]
  );
  
  const isPetMovel = useMemo(() => serviceStepView === 'pet_movel', [serviceStepView]);

  useEffect(() => {
    const syncAllAppointments = async () => {
        const { data: regularData, error: regularError } = await supabase
            .from('appointments')
            .select('*');

        if (regularError) {
            console.error('Error fetching appointments:', regularError);
        }

        const { data: petMovelData, error: petMovelError } = await supabase
            .from('pet_movel_appointments')
            .select('*');

        if (petMovelError) {
            console.error('Error fetching pet_movel_appointments:', petMovelError);
        }
        
        const combinedData = [...(regularData || []), ...(petMovelData || [])];

        if (combinedData.length > 0) {
            const allAppointments: Appointment[] = combinedData
                .map((dbRecord: any) => {
                    const serviceKey = Object.keys(SERVICES).find(key => SERVICES[key as ServiceType].label === dbRecord.service) as ServiceType | undefined;
                    
                    if (!serviceKey) {
                        return null;
                    }
            
                    return {
                        id: dbRecord.id,
                        petName: dbRecord.pet_name,
                        ownerName: dbRecord.owner_name,
                        whatsapp: dbRecord.whatsapp,
                        service: serviceKey,
                        appointmentTime: new Date(dbRecord.appointment_time),
                    };
                })
                .filter((app): app is Appointment => app !== null);
            
            setAppointments(allAppointments);
        }
    };

    syncAllAppointments();
}, []);

    useEffect(() => {
    // This effect handles the calendar day restrictions based on service type.
    if (step === 3) {
      if (serviceStepView === 'bath_groom') {
        // Regular Bath & Grooming is only on Mondays and Tuesdays
        setAllowedDays([1, 2]);
      } else if (serviceStepView === 'pet_movel' && selectedCondo) {
        // Pet Móvel availability depends on the selected condominium
        switch (selectedCondo) {
          case 'Vitta Parque':
            setAllowedDays([3]); // Wednesday
            break;
          case 'Maxhaus':
            setAllowedDays([4]); // Thursday
            break;
          case 'Paseo':
            setAllowedDays([5]); // Friday
            break;
          default:
            setAllowedDays(undefined); // No restrictions if condo is not specified
        }
      } else {
        // No specific restrictions for other services, default will apply (e.g., disable weekends)
        setAllowedDays(undefined);
      }
    }
  }, [step, serviceStepView, selectedCondo]);


  useEffect(() => { setSelectedTime(null); }, [selectedDate, selectedService]);
  
  useEffect(() => {
    if (isVisitService) {
        setTotalPrice(0);
        return;
    }
    
    if (!selectedService || !selectedWeight) {
        setTotalPrice(0);
        return;
    }

    let basePrice = 0;
    
    const isRegularService = [ServiceType.BATH, ServiceType.GROOMING_ONLY, ServiceType.BATH_AND_GROOMING].includes(selectedService);
    const isMobileService = [ServiceType.PET_MOBILE_BATH, ServiceType.PET_MOBILE_BATH_AND_GROOMING, ServiceType.PET_MOBILE_GROOMING_ONLY].includes(selectedService);

    if (isRegularService || isMobileService) {
        const prices = SERVICE_PRICES[selectedWeight];
        if (prices) {
            if (selectedService === ServiceType.BATH || selectedService === ServiceType.PET_MOBILE_BATH) {
                basePrice = prices[ServiceType.BATH] ?? 0;
            } else if (selectedService === ServiceType.GROOMING_ONLY || selectedService === ServiceType.PET_MOBILE_GROOMING_ONLY) {
                basePrice = prices[ServiceType.GROOMING_ONLY] ?? 0;
            } else if (selectedService === ServiceType.BATH_AND_GROOMING || selectedService === ServiceType.PET_MOBILE_BATH_AND_GROOMING) {
                basePrice = (prices[ServiceType.BATH] ?? 0) + (prices[ServiceType.GROOMING_ONLY] ?? 0);
            }
        }
    }
    
    let addonsPrice = 0;
    Object.keys(selectedAddons).forEach(addonId => {
        if (selectedAddons[addonId]) {
            const addon = ADDON_SERVICES.find(a => a.id === addonId);
            if (addon) addonsPrice += addon.price;
        }
    });
    setTotalPrice(basePrice + addonsPrice);
  }, [selectedService, selectedWeight, selectedAddons, isVisitService]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'whatsapp' ? formatWhatsapp(value) : value }));
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newWeight = e.target.value as PetWeight;
      setSelectedWeight(newWeight);
      const newAddons = {...selectedAddons};
      ADDON_SERVICES.forEach(addon => {
          if (selectedAddons[addon.id]) {
            const isExcluded = addon.excludesWeight?.includes(newWeight);
            const requiresNotMet = addon.requiresWeight && !addon.requiresWeight.includes(newWeight);
            if(isExcluded || requiresNotMet) newAddons[addon.id] = false;
          }
      });
      setSelectedAddons(newAddons);
  }
  
  const handleAddonToggle = (addonId: string) => {
    const newAddons = { ...selectedAddons };
    newAddons[addonId] = !newAddons[addonId];
    if (addonId === 'patacure1' && newAddons[addonId]) newAddons['patacure2'] = false;
    else if (addonId === 'patacure2' && newAddons[addonId]) newAddons['patacure1'] = false;
    setSelectedAddons(newAddons);
  };

  const changeStep = (nextStep: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsAnimating(false);
    }, 300); // Animation duration
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedTime) return;
    setIsSubmitting(true);
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();
    const appointmentTime = toSaoPauloUTC(year, month, day, selectedTime);

    const isPetMovelSubmit = !!selectedCondo;
    const targetTable = isPetMovelSubmit ? 'pet_movel_appointments' : 'appointments';
    
    const basePayload = {
      appointment_time: appointmentTime.toISOString(),
      pet_name: formData.petName,
      pet_breed: formData.petBreed,
      owner_name: formData.ownerName,
      whatsapp: formData.whatsapp,
      service: SERVICES[selectedService].label,
      weight: isVisitService ? 'N/A' : (selectedWeight ? PET_WEIGHT_OPTIONS[selectedWeight] : 'N/A'),
      addons: isVisitService ? [] : ADDON_SERVICES.filter(addon => selectedAddons[addon.id]).map(addon => addon.label),
      price: totalPrice,
      status: 'AGENDADO'
    };
    
    const supabasePayload = isPetMovelSubmit
        ? { ...basePayload, owner_address: formData.ownerAddress, condominium: selectedCondo }
        : { ...basePayload, owner_address: formData.ownerAddress };

    try {
        // Verificar conflitos de agendamento apenas para serviços regulares (não Pet Móvel)
        if (!isPetMovelSubmit) {
            const { data: existingAppointments, error: conflictError } = await supabase
                .from('appointments')
                .select('appointment_time, pet_name, owner_name')
                .eq('appointment_time', appointmentTime.toISOString())
                .eq('status', 'AGENDADO');

            if (conflictError) {
                console.error('Erro ao verificar conflitos:', conflictError);
            } else if (existingAppointments && existingAppointments.length >= MAX_CAPACITY_PER_SLOT) {
                throw new Error(`Este horário já está lotado! Máximo de ${MAX_CAPACITY_PER_SLOT} agendamentos simultâneos permitidos.`);
            }

            // Verificar se o mesmo pet já tem agendamento no mesmo horário
            const duplicateAppointment = existingAppointments?.find(apt => 
                apt.pet_name.toLowerCase() === formData.petName.toLowerCase() && 
                apt.owner_name.toLowerCase() === formData.ownerName.toLowerCase()
            );

            if (duplicateAppointment) {
                throw new Error(`O pet ${formData.petName} já possui um agendamento neste horário!`);
            }
        }

        const { data: newDbAppointment, error: supabaseError } = await supabase.from(targetTable).insert([supabasePayload]).select().single();
        if (supabaseError) throw supabaseError;

        try {
            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('phone', supabasePayload.whatsapp)
                .limit(1)
                .single();

            if (!existingClient) {
                const { error: clientInsertError } = await supabase
                    .from('clients')
                    .insert({ 
                        name: supabasePayload.owner_name, 
                        phone: supabasePayload.whatsapp 
                    });
                if (clientInsertError) {
                    console.error('Failed to auto-register client:', clientInsertError.message);
                }
            }
        } catch (error) {
            console.error('An error occurred during client auto-registration:', error);
        }
        
        try {
            const webhookUrl = 'https://n8n.intelektus.tech/webhook/servicoAgendado';
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(supabasePayload),
            });

            if (!response.ok) {
                throw new Error(`Webhook (servicoAgendado) failed with status ${response.status}`);
            }
        } catch (webhookError) {
            console.error('Error sending new appointment webhook:', webhookError);
        }

        const newAppointment: Appointment = {
            id: newDbAppointment.id,
            petName: newDbAppointment.pet_name,
            ownerName: newDbAppointment.owner_name,
            whatsapp: newDbAppointment.whatsapp,
            service: selectedService,
            appointmentTime: new Date(newDbAppointment.appointment_time),
        };

        setAppointments(prev => [...prev, newAppointment]);
        setIsModalOpen(true);
        setTimeout(() => {
            setIsModalOpen(false);
            setFormData({ petName: '', ownerName: '', whatsapp: '', petBreed: '', ownerAddress: '' });
            setSelectedService(null); setSelectedWeight(null); setSelectedAddons({}); setSelectedTime(null); setTotalPrice(0); setIsSubmitting(false);
            setSelectedCondo(null);
            setServiceStepView('main');
            changeStep(1);
        }, 3000);
    } catch (error: any) {
        console.error("Error submitting appointment:", error);
        let userMessage = 'Não foi possível concluir o agendamento. Tente novamente.';
        alert(userMessage);
        setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.petName && formData.ownerName && formData.whatsapp.length > 13 && formData.petBreed && formData.ownerAddress;
  const isStep2Valid = serviceStepView !== 'main' && selectedService && (isVisitService || selectedWeight);
  const isStep3Valid = selectedTime !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <header className="text-center mb-8 animate-fadeInUp">
          <img src="https://i.imgur.com/M3Gt3OA.png" alt="Sandy's Pet Shop Logo" className="h-24 w-24 mx-auto mb-4 drop-shadow-lg"/>
          <h1 className="font-brand text-6xl text-pink-800 mb-2">Sandy's Pet Shop</h1>
          <p className="text-gray-600 text-xl font-medium">Agendamento Online</p>
      </header>

      <main className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-pink-100/40 backdrop-blur-sm">
        <div className="px-8 py-6 bg-gradient-to-r from-pink-50 to-rose-50 border-b-2 border-pink-100">
            <div className="flex justify-between items-center relative">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                    <div className={`h-full bg-pink-600 transition-all duration-500`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
                </div>
                {['Dados', 'Serviços', 'Horário', 'Resumo'].map((name, index) => (
                    <div key={name} className="flex flex-col items-center gap-2 z-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${step >= index + 1 ? 'bg-gradient-to-br from-pink-500 to-pink-700 text-white scale-110' : 'bg-white text-gray-400 border-2 border-gray-300'}`}>
                            {step > index + 1 ? '✓' : index + 1}
                        </div>
                        <span className={`hidden sm:block text-xs font-bold ${step === index + 1 ? 'text-pink-700' : step > index + 1 ? 'text-pink-600' : 'text-gray-400'}`}>{name}</span>
                    </div>
                ))}
            </div>
        </div>

        <form onSubmit={handleSubmit} className={`relative p-6 sm:p-8 transition-all duration-300 ${isAnimating ? 'animate-slideOutToLeft' : 'animate-slideInFromRight'}`}>
          {step === 1 && (
            <div className="space-y-7">
              <h2 className="text-3xl font-bold text-gray-800">Informações do Pet e Dono</h2>
              <div>
                  <label htmlFor="petName" className="block text-base font-semibold text-gray-700">Nome do Pet</label>
                  <div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><PawIcon/></span><input type="text" name="petName" id="petName" value={formData.petName} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-gray-900"/></div>
              </div>
              <div>
                  <label htmlFor="petBreed" className="block text-base font-semibold text-gray-700">Raça do Pet</label>
                  <div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><BreedIcon/></span><input type="text" name="petBreed" id="petBreed" value={formData.petBreed} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-gray-900"/></div>
              </div>
              <div>
                  <label htmlFor="ownerName" className="block text-base font-semibold text-gray-700">Seu Nome</label>
                  <div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon/></span><input type="text" name="ownerName" id="ownerName" value={formData.ownerName} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-gray-900"/></div>
              </div>
              <div>
                  <label htmlFor="ownerAddress" className="block text-base font-semibold text-gray-700">Seu Endereço</label>
                  <div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><AddressIcon/></span><input type="text" name="ownerAddress" id="ownerAddress" value={formData.ownerAddress} onChange={handleInputChange} required className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-gray-900"/></div>
              </div>
              <div>
                  <label htmlFor="whatsapp" className="block text-base font-semibold text-gray-700">WhatsApp</label>
                  <div className="relative mt-1"><span className="absolute inset-y-0 left-0 flex items-center pl-3"><WhatsAppIcon/></span><input type="tel" name="whatsapp" id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} required placeholder="(XX) XXXXX-XXXX" maxLength={15} className="block w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-gray-900"/></div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800">Escolha os Serviços</h2>
                
                {serviceStepView === 'main' && (
                    <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-2">1. Selecione a Categoria</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <button type="button" onClick={() => { setServiceStepView('bath_groom'); setSelectedService(null); }} className="p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center min-h-[56px] sm:min-h-[64px] bg-white hover:bg-pink-50 border-gray-200">
                                <span className="text-lg">Banho & Tosa</span>
                            </button>
                            <button type="button" onClick={() => { console.log('Clicou em Creche Pet'); setViewWithLog('daycareRegistration'); }} className="p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center min-h-[56px] sm:min-h-[64px] bg-white hover:bg-pink-50 border-gray-200">
                                <span className="text-lg">{SERVICES[ServiceType.VISIT_DAYCARE].label}</span>
                            </button>
                             <button type="button" onClick={() => { console.log('Clicou em Hotel Pet'); setViewWithLog('hotelRegistration'); }} className="p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center min-h-[56px] sm:min-h-[64px] bg-white hover:bg-pink-50 border-gray-200">
                                <span className="text-lg">{SERVICES[ServiceType.VISIT_HOTEL].label}</span>
                            </button>
                            <button type="button" onClick={() => { console.log('Clicou em Pet Móvel'); setServiceStepView('pet_movel_condo'); }} className="p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center min-h-[56px] sm:min-h-[64px] bg-white hover:bg-pink-50 border-gray-200">
                                <span className="text-lg">Pet Móvel</span>
                            </button>
                        </div>
                    </div>
                )}

                {serviceStepView === 'pet_movel_condo' && (
                    <div className="space-y-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">1. Selecione o Condomínio</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {['Vitta Parque', 'Maxhaus', 'Paseo'].map(condo => (
                                <button
                                    key={condo}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCondo(condo);
                                        setServiceStepView('pet_movel');
                                    }}
                                    className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex items-center justify-center min-h-[56px] sm:min-h-[64px] bg-white hover:bg-pink-50 border-gray-200`}
                                >
                                    <span className="text-lg">{condo}</span>
                                </button>
                            ))}
                        </div>
                        <button type="button" onClick={() => { setServiceStepView('main'); setSelectedCondo(null); }} className="text-sm text-pink-600 hover:underline">← Voltar</button>
                    </div>
                )}
                
                {serviceStepView === 'bath_groom' && (
                    <div className="space-y-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">1. Serviço Principal</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button type="button" onClick={() => setSelectedService(ServiceType.BATH)} className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center h-full ${selectedService === ServiceType.BATH ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white hover:bg-pink-50 border-gray-200'}`}>
                                <span className="text-lg">{SERVICES[ServiceType.BATH].label}</span>
                            </button>
                             <button type="button" onClick={() => setSelectedService(ServiceType.BATH_AND_GROOMING)} className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center h-full ${selectedService === ServiceType.BATH_AND_GROOMING ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white hover:bg-pink-50 border-gray-200'}`}>
                                <span className="text-lg">{SERVICES[ServiceType.BATH_AND_GROOMING].label}</span>
                            </button>
                            <button type="button" onClick={() => setSelectedService(ServiceType.GROOMING_ONLY)} className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center h-full ${selectedService === ServiceType.GROOMING_ONLY ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white hover:bg-pink-50 border-gray-200'}`}>
                                <span className="text-lg">{SERVICES[ServiceType.GROOMING_ONLY].label}</span>
                            </button>
                        </div>
                        <button type="button" onClick={() => { setServiceStepView('main'); setSelectedService(null); }} className="text-sm text-pink-600 hover:underline">← Voltar</button>
                    </div>
                )}
                
                {serviceStepView === 'pet_movel' && (
                    <div className="space-y-6">
                        <h3 className="text-md font-semibold text-gray-700 mb-2">1. Serviço Principal (Pet Móvel)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button type="button" onClick={() => setSelectedService(ServiceType.PET_MOBILE_BATH)} className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center h-full ${selectedService === ServiceType.PET_MOBILE_BATH ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white hover:bg-pink-50 border-gray-200'}`}>
                                <span className="text-lg">Só Banho</span>
                            </button>
                            <button type="button" onClick={() => setSelectedService(ServiceType.PET_MOBILE_BATH_AND_GROOMING)} className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center h-full ${selectedService === ServiceType.PET_MOBILE_BATH_AND_GROOMING ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white hover:bg-pink-50 border-gray-200'}`}>
                                <span className="text-lg">Banho & Tosa</span>
                            </button>
                            <button type="button" onClick={() => setSelectedService(ServiceType.PET_MOBILE_GROOMING_ONLY)} className={`p-5 rounded-2xl text-center font-semibold transition-all border-2 flex flex-col items-center justify-center h-full ${selectedService === ServiceType.PET_MOBILE_GROOMING_ONLY ? 'bg-pink-600 text-white border-pink-600 shadow-lg' : 'bg-white hover:bg-pink-50 border-gray-200'}`}>
                                <span className="text-lg">Só Tosa</span>
                            </button>
                        </div>
                        <button type="button" onClick={() => { setServiceStepView('pet_movel_condo'); setSelectedService(null); }} className="text-sm text-pink-600 hover:underline">← Voltar</button>
                    </div>
                )}

                {serviceStepView === 'hotel_pet' && (
                    <div className="space-y-6">
                        <div className="bg-pink-50 p-6 sm:p-5 rounded-lg mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Check-list de Hospedagem - Hotel Pet</h3>
                            <p className="text-base text-gray-600 mt-1">Preencha todos os dados do pet e tutor para o check-in</p>
                        </div>
                        <button type="button" onClick={() => { console.log('Clicou em Preencher Formulário de Hotel Pet'); setViewWithLog('hotelRegistration'); }} className="w-full bg-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors">
                            Preencher Formulário de Hotel Pet
                        </button>
                        <button type="button" onClick={() => setServiceStepView('main')} className="text-sm text-pink-600 hover:underline">← Voltar</button>
                    </div>
                )}

                {selectedService && !isVisitService && (
                    <>
                        <div>
                            <label htmlFor="petWeight" className="block text-md font-semibold text-gray-700 mb-2 mt-6">2. Peso do Pet</label>
                            <select id="petWeight" value={selectedWeight || ''} onChange={handleWeightChange} required className="block w-full py-3 px-3 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 text-gray-900">
                                <option value="" disabled>Selecione o peso</option>
                                {(Object.keys(PET_WEIGHT_OPTIONS) as PetWeight[]).map(key => (<option key={key} value={key}>{PET_WEIGHT_OPTIONS[key]}</option>))}
                            </select>
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 mb-2 mt-6">3. Serviços Adicionais (Opcional)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                {ADDON_SERVICES.map(addon => {
                                    const isDisabled = !selectedWeight || !selectedService || addon.excludesWeight?.includes(selectedWeight!) || (addon.requiresWeight && !addon.requiresWeight.includes(selectedWeight!)) || (addon.requiresService && addon.requiresService !== selectedService);
                                    return (
                                        <label key={addon.id} className={`flex items-center p-6 sm:p-5 rounded-lg border-2 transition-all ${isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer hover:bg-pink-50'} ${selectedAddons[addon.id] ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                                            <input type="checkbox" onChange={() => handleAddonToggle(addon.id)} checked={!!selectedAddons[addon.id]} disabled={isDisabled} className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                                            <span className="ml-2.5">{addon.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
                
                {selectedService && !isVisitService && selectedWeight && totalPrice > 0 && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Preço Total:</span>
                            <span className="text-2xl font-bold text-green-600">R$ {(totalPrice ?? 0).toFixed(2)}</span>
                        </div>
                        {Object.keys(selectedAddons).some(key => selectedAddons[key]) && (
                            <div className="mt-2 text-sm text-gray-600">
                                <div>Serviço base: R$ {(totalPrice - Object.keys(selectedAddons).reduce((sum, addonId) => {
                                    if (selectedAddons[addonId]) {
                                        const addon = ADDON_SERVICES.find(a => a.id === addonId);
                                        return sum + (addon?.price || 0);
                                    }
                                    return sum;
                                }, 0)).toFixed(2)}</div>
                                <div>Adicionais: R$ {Object.keys(selectedAddons).reduce((sum, addonId) => {
                                    if (selectedAddons[addonId]) {
                                        const addon = ADDON_SERVICES.find(a => a.id === addonId);
                                        return sum + (addon?.price || 0);
                                    }
                                    return sum;
                                }, 0).toFixed(2)}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800">Selecione Data e Hora</h2>
              {!([ServiceType.PET_MOBILE_BATH, ServiceType.PET_MOBILE_BATH_AND_GROOMING, ServiceType.PET_MOBILE_GROOMING_ONLY].includes(selectedService)) && (
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2 text-center">Data</h3>
                  <Calendar 
                    selectedDate={selectedDate} 
                    onDateChange={setSelectedDate} 
                    disablePast 
                    disableWeekends={!allowedDays}
                    allowedDays={allowedDays}
                  />
                </div>
              )}
              <div>
                <h3 className="text-md font-semibold text-gray-700 mb-4 text-center">Horários Disponíveis</h3>
                <TimeSlotPicker
                  selectedDate={selectedDate}
                  selectedService={selectedService}
                  appointments={appointments}
                  onTimeSelect={setSelectedTime}
                  selectedTime={selectedTime}
                  workingHours={isVisitService ? VISIT_WORKING_HOURS : WORKING_HOURS}
                  isPetMovel={!!selectedCondo}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Resumo do Agendamento</h2>
              <div className="p-6 bg-white rounded-lg space-y-2 text-gray-700 border border-gray-200">
                <p><strong>Pet:</strong> {formData.petName} ({formData.petBreed})</p>
                <p><strong>Responsável:</strong> {formData.ownerName}</p>
                <p><strong>WhatsApp:</strong> {formData.whatsapp}</p>
                <p><strong>Serviço:</strong> {selectedService ? SERVICES[selectedService].label : 'Nenhum'}</p>
                {!isVisitService && <p><strong>Peso:</strong> {selectedWeight ? PET_WEIGHT_OPTIONS[selectedWeight] : 'Nenhum'}</p>}
                {!isVisitService && selectedAddons && Object.keys(selectedAddons).some(k => selectedAddons[k]) && (
                    <p><strong>Adicionais:</strong> {ADDON_SERVICES.filter(a => selectedAddons[a.id]).map(a => a.label).join(', ')}</p>
                )}
                <p><strong>Data:</strong> {selectedDate.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'})} às {selectedTime}:00</p>
                 <div className="mt-4 pt-4 border-t border-gray-200">
                     <p className="text-2xl font-bold text-gray-900 text-right">Total: R$ {(totalPrice ?? 0).toFixed(2).replace('.', ',')}</p>
                 </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between items-center gap-4">
            {step > 1 ? (
              <button type="button" onClick={() => {
                  if (step === 2 && serviceStepView !== 'main') {
                      if (serviceStepView === 'pet_movel') {
                          setServiceStepView('pet_movel_condo');
                      } else {
                          setServiceStepView('main');
                      }
                      setSelectedService(null);
                  } else {
                      changeStep(step - 1);
                  }
              }} className="bg-white border-2 border-gray-300 text-gray-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow">
                ← Voltar
              </button>
            ) : <div />}

            {step < 4 && <button type="button" onClick={() => changeStep(step + 1)} disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid)} className="w-full md:w-auto bg-gradient-to-r from-pink-600 to-pink-700 text-white font-bold py-4 px-8 rounded-xl hover:from-pink-700 hover:to-pink-800 transition-all shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed">
              Próximo →
            </button>}
            {step === 4 && <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-8 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed">
              {isSubmitting ? 'Agendando...' : '✓ Confirmar Agendamento'}
            </button>}
          </div>
        </form>
      </main>

      <footer className="text-center mt-8 text-base">
        <button onClick={() => setViewWithLog('login')} className="text-gray-500 hover:text-pink-600 font-medium transition-colors underline-offset-4 hover:underline">Acesso Administrativo</button>
      </footer>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="text-center bg-white p-10 rounded-3xl shadow-2xl max-w-full sm:max-w-md mx-auto border-4 border-pink-200 animate-scaleIn">
            <SuccessIcon />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mt-4">Agendamento Confirmado!</h2>
            <p className="text-gray-600 mt-4 text-lg">Seu horário foi reservado com sucesso. Obrigado!</p>
            <div className="mt-6 p-4 bg-pink-50 rounded-xl">
              <p className="text-sm text-pink-800 font-medium">Você receberá uma confirmação via WhatsApp em breve</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hotel View Component for managing hotel registrations
const HotelView: React.FC<{ key?: number }> = ({ key }) => {
    const [registrations, setRegistrations] = useState<HotelRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegistration, setSelectedRegistration] = useState<HotelRegistration | null>(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [registrationToDelete, setRegistrationToDelete] = useState<HotelRegistration | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [registrationToEdit, setRegistrationToEdit] = useState<HotelRegistration | null>(null);
    const [isHotelExtraServicesModalOpen, setIsHotelExtraServicesModalOpen] = useState(false);
    const [hotelRegistrationForExtraServices, setHotelRegistrationForExtraServices] = useState<HotelRegistration | null>(null);

    const fetchRegistrations = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('hotel_registrations').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching hotel registrations:', error);
            alert('Falha ao buscar registros de hotel.');
        } else {
            setRegistrations(data as HotelRegistration[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations, key]);

    const handleToggleCheckIn = async (registration: HotelRegistration) => {
        if (!registration.id) return;
        setUpdatingId(registration.id);
        
        const currentStatus = registration.check_in_status || 'pending';
        let newStatus: 'pending' | 'checked_in' | 'checked_out';
        let updateData: any = {};
        
        if (currentStatus === 'pending') {
            newStatus = 'checked_in';
            updateData = {
                check_in_status: newStatus,
                checked_in_at: new Date().toISOString(),
                status: 'Ativo'
            };
        } else if (currentStatus === 'checked_in') {
            newStatus = 'checked_out';
            updateData = {
                check_in_status: newStatus,
                checked_out_at: new Date().toISOString(),
                status: 'Concluído'
            };
        } else {
            newStatus = 'pending';
            updateData = {
                check_in_status: newStatus,
                checked_in_at: null,
                checked_out_at: null,
                status: 'Ativo'
            };
        }
        
        const { data, error } = await supabase
            .from('hotel_registrations')
            .update(updateData)
            .eq('id', registration.id)
            .select()
            .single();
            
        if (error) {
            console.error('Error updating check-in status:', error);
            alert('Erro ao atualizar status de check-in/check-out');
        } else {
            setRegistrations(prev => prev.map(r => 
                r.id === registration.id ? { ...r, ...updateData } : r
            ));
        }
        setUpdatingId(null);
    };

    const handleConfirmDelete = async () => {
        if (!registrationToDelete || !registrationToDelete.id) return;
        setIsDeleting(true);
        const { error } = await supabase.from('hotel_registrations').delete().eq('id', registrationToDelete.id);
        if (error) {
            alert('Falha ao excluir o registro.');
        } else {
            setRegistrations(prev => prev.filter(r => r.id !== registrationToDelete.id));
        }
        setIsDeleting(false);
        setRegistrationToDelete(null);
    };

    const handleAddHotelExtraServices = (registration: HotelRegistration) => {
        setHotelRegistrationForExtraServices(registration);
        setIsHotelExtraServicesModalOpen(true);
        setSelectedRegistration(null);
    };

    const handleHotelExtraServicesUpdated = (updatedRegistration: HotelRegistration) => {
        setRegistrations(prev => prev.map(r => 
            r.id === updatedRegistration.id ? updatedRegistration : r
        ));
        setIsHotelExtraServicesModalOpen(false);
        setHotelRegistrationForExtraServices(null);
    };

    const filteredRegistrations = registrations.filter(reg => 
        reg.pet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.tutor_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;
    }

    if (isAddFormOpen) {
        return <HotelRegistrationForm setView={() => setIsAddFormOpen(false)} onSuccess={() => { fetchRegistrations(); setIsAddFormOpen(false); }} />;
    }

    const HotelRegistrationCard: React.FC<{ 
        registration: HotelRegistration;
        onAddExtraServices: (registration: HotelRegistration) => void;
    }> = ({ registration, onAddExtraServices }) => {
        const currentCheckInStatus = registration.check_in_status || 'pending';
        const isUpdating = updatingId === registration.id;
        
        const getCheckInButtonStyle = () => {
            if (currentCheckInStatus === 'pending') {
                return 'bg-green-500 hover:bg-green-600 text-white';
            } else if (currentCheckInStatus === 'checked_in') {
                return 'bg-red-500 hover:bg-red-600 text-white';
            } else {
                return 'bg-gray-500 hover:bg-gray-600 text-white';
            }
        };
        
        const getCheckInButtonText = () => {
            if (isUpdating) return 'Atualizando...';
            if (currentCheckInStatus === 'pending') return 'Check-in';
            if (currentCheckInStatus === 'checked_in') return 'Check-out';
            return 'Resetar';
        };
        
        const getStatusBadge = () => {
            if (currentCheckInStatus === 'checked_in') {
                return { bg: 'bg-green-100', text: 'text-green-800', label: 'Check-in Ativo' };
            } else if (currentCheckInStatus === 'checked_out') {
                return { bg: 'bg-red-100', text: 'text-red-800', label: 'Check-out Realizado' };
            } else {
                return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Aguardando Check-in' };
            }
        };
        
        const statusBadge = getStatusBadge();
        
        return (
            <div className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">{registration.pet_name}</h3>
                        <p className="text-base text-gray-600">{registration.pet_breed} • {registration.pet_age}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                    </span>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                        <UserIcon />
                        <span>{registration.tutor_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                        <WhatsAppIcon />
                        <span>{registration.tutor_phone}</span>
                    </div>
                    {registration.check_in_date && (
                        <div className="flex items-center gap-3 text-gray-600">
                            <CalendarIcon />
                            <span>Previsto: {new Date(registration.check_in_date).toLocaleDateString('pt-BR')} {registration.check_in_time}</span>
                        </div>
                    )}
                    {registration.checked_in_at && (
                        <div className="flex items-center gap-3 text-green-600 font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Check-in: {new Date(registration.checked_in_at).toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {registration.checked_out_at && (
                        <div className="flex items-center gap-3 text-red-600 font-semibold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Check-out: {new Date(registration.checked_out_at).toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-3 mt-4">
                    <button 
                        onClick={() => handleToggleCheckIn(registration)}
                        disabled={isUpdating}
                        className={`flex-1 py-3.5 px-3 rounded-lg transition-colors text-sm font-bold ${getCheckInButtonStyle()} disabled:opacity-50`}
                    >
                        {getCheckInButtonText()}
                    </button>
                    <button 
                        onClick={() => setSelectedRegistration(registration)}
                        className="bg-gray-100 text-gray-700 py-3.5 px-3 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                    >
                        Detalhes
                    </button>
                    <button
                        onClick={() => setRegistrationToEdit(registration)}
                        className="bg-blue-100 text-blue-700 py-3.5 px-3 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => onAddExtraServices(registration)}
                        className="bg-green-100 text-green-700 py-3.5 px-3 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                        title="Adicionar Serviços Extras"
                    >
                        +
                    </button>
                    <button
                        onClick={() => setRegistrationToDelete(registration)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <DeleteIcon />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Hotel Pet</h1>
                        <p className="text-gray-600 mt-1">Gerencie os registros de hospedagem</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowHotelStatistics(true)}
                            className="bg-blue-600 text-white font-bold py-3.5 px-5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Estatísticas</span>
                        </button>
                        <button
                            onClick={() => setIsAddFormOpen(true)}
                            className="bg-pink-600 text-white font-bold py-3.5 px-5 rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Novo Check-in
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome do pet ou tutor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                </div>
            </div>

            {filteredRegistrations.length > 0 ? (
                <div>
                    <h2 className="text-lg font-semibold text-gray-700 mb-3">
                        Pets Cadastrados ({filteredRegistrations.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRegistrations.map(reg => (
                            <HotelRegistrationCard 
                                key={reg.id} 
                                registration={reg} 
                                onAddExtraServices={handleAddHotelExtraServices}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl">
                    <p className="text-gray-500 text-lg">Nenhum pet cadastrado no Hotel Pet</p>
                </div>
            )}

            {registrationToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-full sm:max-w-md w-full">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h3>
                        <p className="text-gray-600 mb-6">
                            Tem certeza que deseja excluir o registro de <strong>{registrationToDelete.pet_name}</strong>?
                        </p>
                        <div className="flex gap-4 justify-end">
                            <button
                                onClick={() => setRegistrationToDelete(null)}
                                className="px-4 py-3.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-3.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
                            >
                                {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {registrationToEdit && (
                <EditHotelRegistrationModal
                    registration={registrationToEdit}
                    onClose={() => setRegistrationToEdit(null)}
                    onRegistrationUpdated={(updated) => {
                        setRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
                        setRegistrationToEdit(null);
                    }}
                />
            )}

            {isHotelExtraServicesModalOpen && hotelRegistrationForExtraServices && (
                <ExtraServicesModal
                    isOpen={isHotelExtraServicesModalOpen}
                    onClose={() => {
                        setIsHotelExtraServicesModalOpen(false);
                        setHotelRegistrationForExtraServices(null);
                    }}
                    onSuccess={handleHotelExtraServicesUpdated}
                    data={hotelRegistrationForExtraServices}
                    type="hotel"
                    title="Serviços Extras - Hotel Pet"
                />
            )}

            {selectedRegistration && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-2xl font-bold text-gray-800">Detalhes do Registro</h3>
                            <button
                                onClick={() => setSelectedRegistration(null)}
                                className="p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Informações do Pet</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div><span className="font-semibold">Nome:</span> {selectedRegistration.pet_name}</div>
                                    <div><span className="font-semibold">Raça:</span> {selectedRegistration.pet_breed}</div>
                                    <div><span className="font-semibold">Idade:</span> {selectedRegistration.pet_age}</div>
                                    <div><span className="font-semibold">Sexo:</span> {selectedRegistration.pet_sex}</div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Informações do Tutor</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div><span className="font-semibold">Nome:</span> {selectedRegistration.tutor_name}</div>
                                    <div><span className="font-semibold">Telefone:</span> {selectedRegistration.tutor_phone}</div>
                                    <div><span className="font-semibold">Email:</span> {selectedRegistration.tutor_email}</div>
                                    <div><span className="font-semibold">Endereço:</span> {selectedRegistration.tutor_address}</div>
                                </div>
                            </div>
                            {selectedRegistration.check_in_date && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Hospedagem</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                        <div><span className="font-semibold">Check-in:</span> {new Date(selectedRegistration.check_in_date).toLocaleDateString('pt-BR')} às {selectedRegistration.check_in_time}</div>
                                        {selectedRegistration.check_out_date && (
                                            <div><span className="font-semibold">Check-out:</span> {new Date(selectedRegistration.check_out_date).toLocaleDateString('pt-BR')} às {selectedRegistration.check_out_time}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {selectedRegistration.extra_services && (
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-2">Serviços Extras</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedRegistration.extra_services.pernoite && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Pernoite</span>
                                        )}
                                        {selectedRegistration.extra_services.banho_tosa && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Banho & Tosa</span>
                                        )}
                                        {selectedRegistration.extra_services.so_banho && (
                                            <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">Só banho</span>
                                        )}
                                        {selectedRegistration.extra_services.adestrador && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Adestrador</span>
                                        )}
                                        {selectedRegistration.extra_services.despesa_medica && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Despesa médica</span>
                                        )}
                                        {selectedRegistration.extra_services.dia_extra && selectedRegistration.extra_services.dia_extra > 0 && (
                                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                                {selectedRegistration.extra_services.dia_extra} dia{selectedRegistration.extra_services.dia_extra > 1 ? 's' : ''} extra{selectedRegistration.extra_services.dia_extra > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => handleAddHotelExtraServices(selectedRegistration)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Adicionar Serviços Extras
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Edit Hotel Registration Modal Component
const EditHotelRegistrationModal: React.FC<{
    registration: HotelRegistration;
    onClose: () => void;
    onRegistrationUpdated: (updated: HotelRegistration) => void;
}> = ({ registration, onClose, onRegistrationUpdated }) => {
    const [formData, setFormData] = useState<HotelRegistration>({ ...registration });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const updatePayload = { ...formData };
        delete updatePayload.id;
        delete updatePayload.created_at;
        delete updatePayload.updated_at;

        const { data, error } = await supabase
            .from('hotel_registrations')
            .update(updatePayload)
            .eq('id', registration.id!)
            .select()
            .single();

        if (error) {
            console.error('Error updating registration:', error);
            alert('Erro ao atualizar o registro. Por favor, tente novamente.');
            setIsSubmitting(false);
        } else {
            onRegistrationUpdated(data as HotelRegistration);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-bold text-white">Editar Registro - {formData.pet_name}</h2>
                        <button 
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-6">
                        {/* Pet Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informações do Pet</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Nome do Pet *</label>
                                    <input
                                        type="text"
                                        name="pet_name"
                                        value={formData.pet_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Raça</label>
                                    <input
                                        type="text"
                                        name="pet_breed"
                                        value={formData.pet_breed}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Idade</label>
                                    <input
                                        type="text"
                                        name="pet_age"
                                        value={formData.pet_age}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Sexo</label>
                                    <select
                                        name="pet_sex"
                                        value={formData.pet_sex || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Macho">Macho</option>
                                        <option value="Fêmea">Fêmea</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Castrado?</label>
                                    <select
                                        name="is_neutered"
                                        value={formData.is_neutered === null ? '' : formData.is_neutered.toString()}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_neutered: e.target.value === '' ? null : e.target.value === 'true' }))}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    >
                                        <option value="">Não informado</option>
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tutor Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informações do Tutor</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Nome do Tutor *</label>
                                    <input
                                        type="text"
                                        name="tutor_name"
                                        value={formData.tutor_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Telefone *</label>
                                    <input
                                        type="text"
                                        name="tutor_phone"
                                        value={formData.tutor_phone}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="tutor_email"
                                        value={formData.tutor_email}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">RG</label>
                                    <input
                                        type="text"
                                        name="tutor_rg"
                                        value={formData.tutor_rg}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Endereço</label>
                                    <input
                                        type="text"
                                        name="tutor_address"
                                        value={formData.tutor_address}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Health Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informações de Saúde</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Doenças Pré-existentes</label>
                                    <textarea
                                        name="preexisting_disease"
                                        value={formData.preexisting_disease}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Alergias</label>
                                    <textarea
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Comportamento</label>
                                    <textarea
                                        name="behavior"
                                        value={formData.behavior}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Medos ou Traumas</label>
                                    <textarea
                                        name="fears_traumas"
                                        value={formData.fears_traumas}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Food Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Alimentação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Marca da Ração</label>
                                    <input
                                        type="text"
                                        name="food_brand"
                                        value={formData.food_brand}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Quantidade</label>
                                    <input
                                        type="text"
                                        name="food_quantity"
                                        value={formData.food_quantity}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Frequência</label>
                                    <input
                                        type="text"
                                        name="feeding_frequency"
                                        value={formData.feeding_frequency}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-base font-semibold text-gray-700 mb-1">Aceita Petiscos?</label>
                                    <input
                                        type="text"
                                        name="accepts_treats"
                                        value={formData.accepts_treats}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Serviços Adicionais</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="service_bath"
                                        checked={formData.service_bath}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm">Banho</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="service_transport"
                                        checked={formData.service_transport}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm">Transporte</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="service_vet"
                                        checked={formData.service_vet}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm">Veterinário</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        name="service_training"
                                        checked={formData.service_training}
                                        onChange={handleInputChange}
                                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                    />
                                    <span className="text-sm">Adestramento</span>
                                </label>
                            </div>
                            <div className="mt-4">
                                <label className="block text-base font-semibold text-gray-700 mb-1">Valor Total dos Serviços (R$)</label>
                                <input
                                    type="number"
                                    name="total_services_price"
                                    value={formData.total_services_price}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className="w-full md:w-1/3 px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informações Adicionais</h3>
                            <textarea
                                name="additional_info"
                                value={formData.additional_info}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-5 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                placeholder="Observações importantes sobre o pet..."
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-4 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3.5 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// FIX: Add the missing DaycareView component to manage daycare enrollments.
const DaycareView: React.FC<{ key?: number }> = ({ key }) => {
    const [enrollments, setEnrollments] = useState<DaycareRegistration[]>([]);
    const [petsInDaycareNow, setPetsInDaycareNow] = useState<DaycareRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEnrollment, setSelectedEnrollment] = useState<DaycareRegistration | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [enrollmentToDelete, setEnrollmentToDelete] = useState<DaycareRegistration | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [draggingOver, setDraggingOver] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['inDaycare', 'approved', 'pending']);
    const [isExtraServicesModalOpen, setIsExtraServicesModalOpen] = useState(false);
    const [enrollmentForExtraServices, setEnrollmentForExtraServices] = useState<DaycareRegistration | null>(null);


    const fetchEnrollments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('daycare_enrollments').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching daycare enrollments:', error);
            alert('Falha ao buscar matrículas da creche.');
        } else {
            setEnrollments(data as DaycareRegistration[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments, key]);
    
    const handleUpdateStatus = async (id: string, status: 'Pendente' | 'Aprovado' | 'Rejeitado') => {
        setIsUpdatingStatus(true);
        const { data, error } = await supabase.from('daycare_enrollments').update({ status }).eq('id', id).select().single();
        if (error) {
            alert('Falha ao atualizar o status.');
        } else {
            setEnrollments(prev => prev.map(e => e.id === id ? data as DaycareRegistration : e));
            setSelectedEnrollment(data as DaycareRegistration);
        }
        setIsUpdatingStatus(false);
    };

    const handleConfirmDelete = async () => {
        if (!enrollmentToDelete || !enrollmentToDelete.id) return;
        setIsDeleting(true);
        const { error } = await supabase.from('daycare_enrollments').delete().eq('id', enrollmentToDelete.id);
        if (error) {
            alert('Falha ao excluir a matrícula.');
        } else {
            setEnrollments(prev => prev.filter(e => e.id !== enrollmentToDelete.id));
        }
        setIsDeleting(false);
        setEnrollmentToDelete(null);
    };
    
    const handleEnrollmentUpdated = (updated: DaycareRegistration) => {
        setEnrollments(prev => prev.map(e => e.id === updated.id ? updated : e));
        setIsEditModalOpen(false);
        setSelectedEnrollment(null);
    };

    const handleEnrollmentAdded = (added: DaycareRegistration) => {
        setEnrollments(prev => [added, ...prev]);
        setIsAddFormOpen(false);
    }

    const handleAddExtraServices = (enrollment: DaycareRegistration) => {
        setEnrollmentForExtraServices(enrollment);
        setIsExtraServicesModalOpen(true);
        setIsDetailsModalOpen(false);
    };

    const handleExtraServicesUpdated = (updated: DaycareRegistration) => {
        setEnrollments(prev => prev.map(e => e.id === updated.id ? updated : e));
        setIsExtraServicesModalOpen(false);
        setEnrollmentForExtraServices(null);
    };
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, enrollment: DaycareRegistration, source: 'pending' | 'approved' | 'inDaycare') => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ id: enrollment.id, source }));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, target: string) => {
        e.preventDefault();
        setDraggingOver(target);
    };
    
    const handleDragLeave = () => setDraggingOver(null);

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, target: 'pending' | 'approved' | 'inDaycare') => {
        e.preventDefault();
        setDraggingOver(null);
        const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
        const { id, source } = draggedData;

        if (source === target) return;

        const enrollmentToMove = [...enrollments, ...petsInDaycareNow].find(en => en.id === id);
        if (!enrollmentToMove) return;

        if (source === 'pending' && target === 'approved') {
            setIsUpdatingStatus(true);
            const { data, error } = await supabase.from('daycare_enrollments').update({ status: 'Aprovado' }).eq('id', id).select().single();
            setIsUpdatingStatus(false);
            if (error) {
                alert('Falha ao aprovar matrícula.');
            } else {
                setEnrollments(prev => prev.map(en => en.id === id ? data as DaycareRegistration : en));
            }
        } else if (source === 'approved' && target === 'inDaycare') {
            setPetsInDaycareNow(prev => [...prev, enrollmentToMove]);
        } else if (source === 'inDaycare' && target === 'approved') {
            setPetsInDaycareNow(prev => prev.filter(en => en.id !== id));
        }
    };
    
    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => 
            prev.includes(sectionId) 
                ? prev.filter(id => id !== sectionId) 
                : [...prev, sectionId]
        );
    };

    const categorizedEnrollments = useMemo(() => {
        const pending = enrollments.filter(e => e.status === 'Pendente');
        const inDaycareIds = new Set(petsInDaycareNow.map(p => p.id));
        const approved = enrollments.filter(e => e.status === 'Aprovado' && !inDaycareIds.has(e.id));
        return { pending, approved };
    }, [enrollments, petsInDaycareNow]);
    
    const AccordionSection: React.FC<{
        title: string;
        enrollments: DaycareRegistration[];
        sectionId: 'pending' | 'approved' | 'inDaycare';
        variant?: 'default' | 'online';
    }> = ({ title, enrollments, sectionId, variant = 'default' }) => {
        const isExpanded = expandedSections.includes(sectionId);
        const count = enrollments.length;
        
        const headerClasses = variant === 'online'
            ? 'bg-green-50 hover:bg-green-100'
            : 'bg-gray-50 hover:bg-gray-100';
            
        const titleClasses = variant === 'online'
            ? 'text-green-800'
            : 'text-pink-700';

        return (
            <div className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 ${draggingOver === sectionId ? 'ring-2 ring-pink-400 ring-offset-2' : ''}`}>
                <button 
                    onClick={() => toggleSection(sectionId)} 
                    className={`w-full text-left p-4 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors ${headerClasses}`}
                >
                    <h3 className={`text-lg font-bold flex items-center gap-4 ${titleClasses}`}>
                        {variant === 'online' && (
                           <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                           </span>
                        )}
                        {`${title} (${count})`}
                    </h3>
                    <ChevronRightIcon className={`h-8 w-8 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                {isExpanded && (
                    <div
                        onDragOver={(e) => handleDragOver(e, sectionId)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, sectionId)}
                        className="p-4 space-y-6 min-h-[100px] animate-fadeIn"
                    >
                        {enrollments.map(enrollment => (
                             <DaycareEnrollmentCard
                                key={enrollment.id}
                                enrollment={enrollment}
                                isDraggable={true}
                                onDragStart={(e) => handleDragStart(e, enrollment, sectionId)}
                                onClick={() => { setSelectedEnrollment(enrollment); setIsDetailsModalOpen(true); }}
                                onEdit={() => { setSelectedEnrollment(enrollment); setIsEditModalOpen(true); }}
                                onDelete={() => setEnrollmentToDelete(enrollment)}
                                onAddExtraServices={handleAddExtraServices}
                            />
                        ))}
                        {count === 0 && <div className="text-center text-gray-500 py-6 sm:py-8"><p>Nenhuma matrícula aqui.</p></div>}
                    </div>
                )}
            </div>
        );
    };
    
    if (isAddFormOpen) {
        return <DaycareRegistrationForm isAdmin onBack={() => setIsAddFormOpen(false)} onSuccess={handleEnrollmentAdded} />
    }
    
    return (
        <div className="animate-fadeIn">
            {isDetailsModalOpen && selectedEnrollment && (
                <DaycareEnrollmentDetailsModal
                    enrollment={selectedEnrollment}
                    onClose={() => { setIsDetailsModalOpen(false); setSelectedEnrollment(null); }}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={isUpdatingStatus}
                    onAddExtraServices={() => handleAddExtraServices(selectedEnrollment)}
                />
            )}
            {isEditModalOpen && selectedEnrollment && (
                <EditDaycareEnrollmentModal
                    enrollment={selectedEnrollment}
                    onClose={() => { setIsEditModalOpen(false); setSelectedEnrollment(null); }}
                    onUpdated={handleEnrollmentUpdated}
                />
            )}
            {isExtraServicesModalOpen && enrollmentForExtraServices && (
                <ExtraServicesModal
                    isOpen={isExtraServicesModalOpen}
                    onClose={() => { setIsExtraServicesModalOpen(false); setEnrollmentForExtraServices(null); }}
                    onSuccess={handleExtraServicesUpdated}
                    data={enrollmentForExtraServices}
                    type="daycare"
                    title="Serviços Extras - Creche"
                />
            )}
             {enrollmentToDelete && (
                <ConfirmationModal
                    isOpen={!!enrollmentToDelete}
                    onClose={() => setEnrollmentToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir a matrícula para ${enrollmentToDelete.pet_name}?`}
                    confirmText="Excluir"
                    variant="danger"
                    isLoading={isDeleting}
                />
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Matrículas da Creche</h2>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowDaycareStatistics(true)} 
                        className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-3.5 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <ChartBarIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Estatísticas</span>
                    </button>
                    <button onClick={() => setIsAddFormOpen(true)} className="flex items-center gap-3 bg-pink-600 text-white font-semibold py-3.5 px-4 rounded-lg hover:bg-pink-700 transition-colors">
                        <UserPlusIcon /> <span className="hidden sm:inline">Nova Matrícula</span>
                    </button>
                </div>
            </div>
            {loading ? <div className="flex justify-center py-16"><LoadingSpinner /></div> : (
                <div className="space-y-6">
                    <AccordionSection title="Pets na Creche agora" enrollments={petsInDaycareNow} sectionId="inDaycare" variant="online" />
                    <AccordionSection title="Matrículas aprovadas" enrollments={categorizedEnrollments.approved} sectionId="approved" />
                    <AccordionSection title="Matrículas para aprovação" enrollments={categorizedEnrollments.pending} sectionId="pending" />
                </div>
            )}
        </div>
    );
};

// FIX: Destructure the 'onLogout' prop to make it available within the component. This resolves 'Cannot find name' errors.
const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const [activeView, setActiveView] = useState('appointments');
    const [dataKey, setDataKey] = useState(Date.now()); // Used to force re-fetches
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleDataChanged = () => setDataKey(Date.now());
    const handleAddMonthlyClient = () => setActiveView('addMonthlyClient');
    
    const menuItems = [
        { id: 'appointments', label: 'Banho & Tosa', icon: <BathTosaIcon/> },
        { id: 'petMovel', label: 'Pet Móvel', icon: <PetMovelIcon/> },
        { id: 'daycare', label: 'Creche', icon: <DaycareIcon/> },
        { id: 'hotel', label: 'Hotel Pet', icon: <HotelIcon/> },
        { id: 'clients', label: 'Clientes', icon: <ClientsMenuIcon/> },
        { id: 'monthlyClients', label: 'Mensalistas', icon: <MonthlyIcon/> },
    ];
    
    const renderActiveView = () => {
        switch (activeView) {
            case 'appointments': return <AppointmentsView key={dataKey} />;
            case 'petMovel': return <PetMovelView key={dataKey} />;
            case 'daycare': return <DaycareView key={dataKey} />;
            case 'hotel': return <HotelView key={dataKey} />;
            case 'clients': return <ClientsView key={dataKey} />;
            case 'monthlyClients': return <MonthlyClientsView onAddClient={handleAddMonthlyClient} onDataChanged={handleDataChanged} />;
            case 'addMonthlyClient': return <AddMonthlyClientView onBack={() => setActiveView('monthlyClients')} onSuccess={() => { handleDataChanged(); setActiveView('monthlyClients'); }}/>;
            default: return <AppointmentsView key={dataKey} />;
        }
    };

    const NavMenu = () => (
         <nav className="flex flex-col gap-3">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => { setActiveView(item.id); setShowMobileMenu(false); }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl text-base font-semibold transition-all shadow-sm ${
                        activeView === item.id 
                            ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-lg scale-105' 
                            : 'text-gray-700 hover:bg-white hover:shadow-md bg-white/50'
                    }`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/20 to-gray-100">
            <header className="bg-white border-b-2 border-pink-100 shadow-lg sticky top-0 z-40 backdrop-blur-sm bg-white/95">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-4">
                             <img src="https://i.imgur.com/M3Gt3OA.png" alt="Logo" className="h-12 w-12 drop-shadow-md"/>
                             <div>
                                 <h1 className="font-brand text-4xl text-pink-800 hidden sm:block leading-none">Sandy's Pet Shop</h1>
                                 <span className="text-pink-600 text-sm font-semibold hidden lg:block">Painel Administrativo</span>
                             </div>
                        </div>
                        <div className="hidden md:block">
                            <button onClick={onLogout} className="flex items-center gap-3 text-base font-semibold text-gray-600 hover:text-pink-600 bg-gray-50 hover:bg-pink-50 px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow">
                                <LogoutIcon/> Sair
                            </button>
                        </div>
                        <div className="md:hidden">
                            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-3 rounded-xl text-gray-500 hover:bg-pink-50 hover:text-pink-600 transition-colors">
                                {showMobileMenu ? <CloseIcon /> : <MenuIcon />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {showMobileMenu && (
                 <div className="fixed inset-0 bg-gray-800 bg-opacity-50 z-30 md:hidden" onClick={() => setShowMobileMenu(false)}></div>
            )}

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className={`
                        md:w-64 flex-shrink-0
                        fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white p-4 z-40
                        transform transition-transform md:transform-none 
                        ${showMobileMenu ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
                        md:sticky md:top-24 md:h-auto md:bg-transparent md:p-0 md:z-0
                    `}>
                        <NavMenu />
                        <div className="mt-6 md:hidden">
                            <button onClick={onLogout} className="w-full flex items-center gap-4 text-base font-semibold text-gray-600 hover:text-pink-600 transition-colors p-2 rounded-lg hover:bg-gray-100">
                                <LogoutIcon/> Sair
                            </button>
                        </div>
                    </aside>
                    <main className="flex-1">
                        {renderActiveView()}
                    </main>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [view, setView] = useState<'scheduler' | 'login' | 'admin' | 'daycareRegistration' | 'hotelRegistration'>('scheduler');
    
    // Debug: Log mudanças de view
    const setViewWithLog = (newView: 'scheduler' | 'login' | 'admin' | 'daycareRegistration' | 'hotelRegistration') => {
        console.log('Mudando view de', view, 'para', newView);
        setView(newView);
    };
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showDaycareStatistics, setShowDaycareStatistics] = useState(false);
    const [showHotelStatistics, setShowHotelStatistics] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const checkAuth = async () => {
            try {
                // Verificar se o supabase está disponível
                if (!supabase || !supabase.auth) {
                    console.warn('Supabase não está disponível, continuando sem autenticação');
                    if (isMounted) {
                        setIsAuthenticated(false);
                        setLoadingAuth(false);
                    }
                    return;
                }
                
                const { data: { session } } = await supabase.auth.getSession();
                if (isMounted) {
                    setIsAuthenticated(!!session);
                    if (!!session) {
                        setViewWithLog('admin');
                    }
                }
            } catch (error) {
                console.warn('Auth check failed, continuing without authentication:', error);
                if (isMounted) {
                    setIsAuthenticated(false);
                }
            } finally {
                if (isMounted) {
                    setLoadingAuth(false);
                }
            }
        };
        
        checkAuth();
        
        // Setup auth listener com proteção adicional
        let authListener: any = null;
        try {
            if (supabase && supabase.auth && supabase.auth.onAuthStateChange) {
                const { data } = supabase.auth.onAuthStateChange((_event, session) => {
                    if (isMounted) {
                        setIsAuthenticated(!!session);
                    if (!session) {
                        setViewWithLog('scheduler');
                    }
                    }
                });
                authListener = data;
            }
        } catch (error) {
            console.warn('Auth listener setup failed:', error);
        }

        return () => {
            isMounted = false;
            if (authListener && authListener.subscription) {
                try {
                    authListener.subscription.unsubscribe();
                } catch (error) {
                    console.warn('Error unsubscribing auth listener:', error);
                }
            }
        };
    }, []);

    if (loadingAuth) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-100"><LoadingSpinner /></div>;
    }
    
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.warn('Logout failed:', error);
        }
        setIsAuthenticated(false);
        setViewWithLog('scheduler');
    };
    
    if (isAuthenticated) {
        return (
            <>
                <AdminDashboard onLogout={handleLogout} />
                {showDaycareStatistics && (
                    <DaycareStatisticsModal 
                        isOpen={showDaycareStatistics} 
                        onClose={() => setShowDaycareStatistics(false)} 
                    />
                )}
                {showHotelStatistics && (
                    <HotelStatisticsModal 
                        isOpen={showHotelStatistics} 
                        onClose={() => setShowHotelStatistics(false)} 
                    />
                )}
            </>
        );
    }

    if (view === 'login') {
        return <AdminLogin onLoginSuccess={() => { setIsAuthenticated(true); setViewWithLog('admin'); }} />;
    }
    
    if (view === 'daycareRegistration') {
        return <DaycareRegistrationForm setView={setViewWithLog} />;
    }

    if (view === 'hotelRegistration') {
        return <HotelRegistrationForm setView={setViewWithLog} />;
    }

    return <Scheduler setView={setViewWithLog} />;
};

export default App;
