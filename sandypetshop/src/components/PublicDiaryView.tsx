import React, { useEffect, useState, useRef } from 'react';
import Rive from '@rive-app/react-canvas';
import { supabase } from '../../supabaseClient';

interface DiaryEntry {
    id?: string;
    enrollment_id: string;
    date: string;
    mood?: string;
    behavior?: number;
    feeding?: string;
    obs?: string;
    needs_logs?: { type: string; time: string }[];
    social_notes?: string[];
    emotional_notes?: string[];
    media_urls?: string[] | null;
}

interface Enrollment {
    id: string;
    pet_name: string;
    tutor_name: string;
    pet_photo_url?: string;
}

interface Props {
    enrollment: Enrollment;
    date: string;
    onDateChange: (d: string) => void;
    skipSplash?: boolean;
}

const getBehaviorLabel = (n: number) => {
    const map: Record<number, { label: string; emoji: string }> = {
        1: { label: 'Muito Calmo', emoji: '😇' },
        2: { label: 'Dócil & Sossegado', emoji: '🥰' },
        3: { label: 'Energia Média', emoji: '😊' },
        4: { label: 'Ativo & Brincalhão', emoji: '🎉' },
        5: { label: 'Alta Energia / Reativo', emoji: '⚡' },
    };
    return map[n] ?? { label: '', emoji: '🐾' };
};

const getMoodConfig = (mood: string) => {
    const map: Record<string, { emoji: string; color: string; bg: string }> = {
        'Animado': { emoji: '✨', color: 'text-amber-700', bg: 'from-amber-100 to-yellow-50' },
        'Normal': { emoji: '🐾', color: 'text-stone-700', bg: 'from-stone-100 to-gray-50' },
        'Sonolento': { emoji: '💤', color: 'text-indigo-700', bg: 'from-indigo-100 to-blue-50' },
        'Agitado': { emoji: '⚡', color: 'text-rose-700', bg: 'from-rose-100 to-pink-50' },
    };
    return map[mood] ?? { emoji: '🐶', color: 'text-gray-700', bg: 'from-gray-100 to-gray-50' };
};

const getFeedingConfig = (feeding: string) => {
    const map: Record<string, { emoji: string; color: string }> = {
        'Comeu tudo': { emoji: '🍽️', color: 'text-emerald-700' },
        'Comeu pouco': { emoji: '🥣', color: 'text-amber-700' },
        'Não comeu': { emoji: '😕', color: 'text-rose-700' },
    };
    return map[feeding] ?? { emoji: '🍽️', color: 'text-gray-700' };
};

const cleanDateStr = (raw: string) => {
    if (!raw) return new Date().toISOString().slice(0, 10);
    return String(raw).replace(/["']/g, '').trim();
};

const formatDateBR = (d: string) => {
    const clean = cleanDateStr(d);
    const parts = clean.split('-');
    if (parts.length !== 3) return clean;
    const [y, m, day] = parts;
    return `${day}/${m}/${y}`;
};

const getDayOfWeek = (d: string) => {
    const clean = cleanDateStr(d);
    const parts = clean.split('-');
    if (parts.length !== 3) return '';
    const [y, m, day] = parts;
    const dateObj = new Date(`${y}-${m}-${day}T12:00:00`);
    if (isNaN(dateObj.getTime())) return '';
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[dateObj.getDay()];
};

const formatDateDisplay = (raw: string) => {
    const clean = cleanDateStr(raw);
    const dow = getDayOfWeek(clean);
    const br = formatDateBR(clean);
    return dow ? `${dow}, ${br}` : br;
};

// ── Elegant Confetti Rain (60 FPS Canvas) ──
const ConfettiRain: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        const colors = [
            '#F59E0B', '#FBBF24', '#FDE68A', // Dourado Champagne
            '#F43F5E', '#FB7185', '#FDA4AF', // Rose Gold / Rosa
            '#A43073', '#D946EF', '#C026D3', // Magenta Sandy
            '#EC4899', '#F472B6', '#FFFFFF', // Holográfico branco e pink
            '#60A5FA', '#A78BFA'
        ];

        const particleCount = 80;
        const particles: Array<{
            x: number;
            y: number;
            w: number;
            h: number;
            color: string;
            speedY: number;
            speedX: number;
            angle: number;
            angleSpeed: number;
            tilt: number;
            tiltAngle: number;
            tiltAngleSpeed: number;
            shape: 'rect' | 'circle' | 'star';
        }> = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: (Math.random() * height * 1.5) - height,
                w: 7 + Math.random() * 8,
                h: 12 + Math.random() * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: 2.2 + Math.random() * 3.5,
                speedX: (Math.random() - 0.5) * 1.6,
                angle: Math.random() * Math.PI * 2,
                angleSpeed: (Math.random() - 0.5) * 0.08,
                tilt: 0,
                tiltAngle: Math.random() * Math.PI,
                tiltAngleSpeed: 0.04 + Math.random() * 0.07,
                shape: Math.random() > 0.35 ? 'rect' : (Math.random() > 0.5 ? 'circle' : 'star'),
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particleCount; i++) {
                const p = particles[i];
                p.y += p.speedY;
                p.x += Math.sin(p.angle) * 1.2 + p.speedX;
                p.angle += p.angleSpeed;
                p.tiltAngle += p.tiltAngleSpeed;
                p.tilt = Math.sin(p.tiltAngle);

                if (p.y > height + 25) {
                    p.y = -20 - Math.random() * 50;
                    p.x = Math.random() * width;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.scale(1, p.tilt); // Efeito de tombamento 3D

                ctx.fillStyle = p.color;

                if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.w * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === 'star') {
                    // Estrela cintilante de 4 pontas
                    ctx.beginPath();
                    const s = p.w * 0.65;
                    ctx.moveTo(0, -s);
                    ctx.quadraticCurveTo(0, 0, s, 0);
                    ctx.quadraticCurveTo(0, 0, 0, s);
                    ctx.quadraticCurveTo(0, 0, -s, 0);
                    ctx.quadraticCurveTo(0, 0, 0, -s);
                    ctx.fill();
                } else {
                    // Fita de confete com cantos arredondados
                    ctx.beginPath();
                    ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, 2);
                    ctx.fill();
                }

                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 105,
            }}
        />
    );
};

// ── Ultra-Luxury Splash Screen (5 Segundos com Foto Centralizada) ──
const SplashScreen: React.FC<{ petName: string; petPhoto?: string; onDone: () => void }> = ({ petName, petPhoto, onDone }) => {
    const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

    useEffect(() => {
        if (petPhoto) {
            const preImg = new Image();
            preImg.src = petPhoto;
        }
    }, [petPhoto]);

    useEffect(() => {
        // Exatamente 5 segundos totais de carregamento cinematográfico
        const t1 = setTimeout(() => setPhase('hold'), 100);
        const t2 = setTimeout(() => setPhase('exit'), 4400); // fade out a partir de 4.4s
        const t3 = setTimeout(onDone, 5000); // conclui aos 5.0s
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onDone]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'radial-gradient(circle at 50% 35%, #fff1f2 0%, #fce7f3 35%, #fae8ff 70%, #fef3c7 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '24px 20px',
            transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: phase === 'exit' ? 0 : 1,
            transform: phase === 'exit' ? 'scale(1.08)' : 'scale(1)',
            userSelect: 'none',
            overflow: 'hidden',
        }}>
            {/* Chuva de Confetes Realista e Contínua */}
            <ConfettiRain />

            {/* Halos de luz de fundo difusa */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position:'absolute', width:420, height:420, borderRadius:'50%', filter:'blur(90px)', opacity:0.45, top:'8%', left:'50%', transform:'translateX(-50%)', background:'radial-gradient(circle, #f43f5e 0%, transparent 70%)' }} />
                <div style={{ position:'absolute', width:350, height:350, borderRadius:'50%', filter:'blur(90px)', opacity:0.35, bottom:'8%', left:'10%', background:'radial-gradient(circle, #c084fc 0%, transparent 70%)' }} />
                <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', filter:'blur(80px)', opacity:0.3, bottom:'12%', right:'10%', background:'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />
            </div>

            {/* Conteúdo Central */}
            <div style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                maxWidth: 420, width: '100%',
                transition: 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: phase === 'enter' ? 0 : 1,
                transform: phase === 'enter' ? 'translateY(24px) scale(0.92)' : 'translateY(0) scale(1)',
                zIndex: 110,
            }}>
                {/* Brand Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 20px', borderRadius: 9999,
                    background: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(244, 114, 182, 0.45)',
                    boxShadow: '0 8px 24px rgba(164, 48, 115, 0.12)',
                }}>
                    <span style={{ fontSize: 13 }}>✨</span>
                    <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a43073', fontFamily: 'Quicksand, sans-serif' }}>
                        Sandy's Pet • Creche
                    </span>
                    <span style={{ fontSize: 13 }}>✨</span>
                </div>

                {/* CENTRO DA ANIMAÇÃO: FOTO DO PET NO MEIO CENTRALIZADA */}
                <div style={{ position: 'relative', width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Halo de luz pulsante externo */}
                    <div style={{
                        position: 'absolute',
                        width: 220,
                        height: 220,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(244, 63, 94, 0.45) 0%, rgba(217, 70, 239, 0.25) 45%, transparent 70%)',
                        filter: 'blur(18px)',
                        animation: 'pulseGlow 2.5s ease-in-out infinite',
                    }} />

                    {/* Anel Joia Dourado/Rose girando */}
                    <svg
                        viewBox="0 0 190 190"
                        style={{
                            position: 'absolute',
                            width: 190,
                            height: 190,
                            animation: 'spinSlow 10s linear infinite',
                            pointerEvents: 'none',
                        }}
                    >
                        <defs>
                            <linearGradient id="goldRoseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#F59E0B" />
                                <stop offset="30%" stopColor="#F43F5E" />
                                <stop offset="70%" stopColor="#D946EF" />
                                <stop offset="100%" stopColor="#FBBF24" />
                            </linearGradient>
                        </defs>
                        <circle
                            cx="95"
                            cy="95"
                            r="88"
                            fill="none"
                            stroke="url(#goldRoseGrad)"
                            strokeWidth="3.5"
                            strokeDasharray="22 10 6 10"
                            opacity="0.9"
                        />
                    </svg>

                    {/* Anel contra-rotativo delicado com pontilhados */}
                    <svg
                        viewBox="0 0 206 206"
                        style={{
                            position: 'absolute',
                            width: 206,
                            height: 206,
                            animation: 'spinReverse 14s linear infinite',
                            pointerEvents: 'none',
                        }}
                    >
                        <circle
                            cx="103"
                            cy="103"
                            r="98"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.75)"
                            strokeWidth="1.5"
                            strokeDasharray="8 14"
                            opacity="0.75"
                        />
                    </svg>

                    {/* Estrelas cintilantes orbitando a foto */}
                    <div style={{
                        position: 'absolute',
                        width: 190,
                        height: 190,
                        animation: 'spinSlow 5.5s linear infinite',
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: -4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: 20,
                            filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.7))',
                        }}>
                            ✨
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 18,
                            fontSize: 16,
                            filter: 'drop-shadow(0 2px 8px rgba(244, 63, 94, 0.7))',
                        }}>
                            ⭐
                        </div>
                    </div>

                    {/* Foto Centralizada do Pet */}
                    <div style={{
                        position: 'relative',
                        width: 144,
                        height: 144,
                        borderRadius: '50%',
                        border: '5px solid #ffffff',
                        boxShadow: '0 20px 50px rgba(164, 48, 115, 0.35), 0 0 0 2px rgba(244, 114, 182, 0.4)',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #fce4f0, #f8d7ea)',
                        animation: 'petHeroFloat 3s ease-in-out infinite',
                        zIndex: 2,
                    }}>
                        {petPhoto ? (
                            <img
                                src={petPhoto}
                                alt={petName || 'Pet'}
                                loading="eager"
                                decoding="sync"
                                {...({ fetchPriority: 'high', fetchpriority: 'high' } as any)}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 64,
                                background: 'linear-gradient(135deg, #fce4f0 0%, #fbcfe8 100%)',
                            }}>
                                🐶
                            </div>
                        )}
                    </div>
                </div>

                {/* Nome do Pet */}
                <div style={{ textAlign: 'center', padding: '0 12px' }}>
                    <h1 style={{
                        fontSize: 36, fontWeight: 900,
                        background: 'linear-gradient(135deg, #9d174d 0%, #be185d 50%, #c026d3 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1.15,
                        fontFamily: 'Quicksand, sans-serif',
                        margin: '0 0 4px',
                        letterSpacing: '-0.02em',
                        textShadow: '0 4px 18px rgba(164, 48, 115, 0.15)'
                    }}>
                        {(petName || 'Pet')} 🐾
                    </h1>
                </div>

                {/* Texto de Carregamento e Barra de Progresso de 4s */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    padding: '12px 24px', borderRadius: 20,
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(244, 114, 182, 0.35)',
                    boxShadow: '0 8px 24px rgba(164, 48, 115, 0.08)',
                }}>
                    <p style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: '#9d174d',
                        fontFamily: 'Quicksand, sans-serif',
                        margin: 0,
                        letterSpacing: '0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <span>Carregando o diário do seu pet</span>
                        <span style={{ display: 'inline-flex', gap: 3 }}>
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        background: '#a43073',
                                        animation: 'bounce 1s ease-in-out infinite',
                                        animationDelay: `${i * 0.18}s`
                                    }}
                                />
                            ))}
                        </span>
                    </p>

                    {/* Barra de Progresso elegante preenchendo ao longo dos 5s */}
                    <div style={{
                        width: 190,
                        height: 6,
                        borderRadius: 9999,
                        background: 'rgba(244, 114, 182, 0.2)',
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        <div style={{
                            height: '100%',
                            width: '100%',
                            background: 'linear-gradient(90deg, #f43f5e, #a43073, #f59e0b)',
                            borderRadius: 9999,
                            animation: 'progressFill 4.7s cubic-bezier(0.1, 0.5, 0.2, 1) forwards',
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Card ──
const Card: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number }> = ({ icon, title, children, delay = 0 }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, []);
    return (
        <div style={{
            background:'white', borderRadius:24,
            boxShadow:'0 4px 24px -4px rgba(164,48,115,0.10)',
            overflow:'hidden',
            transition:'opacity 0.5s ease, transform 0.5s ease',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)'
        }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:'1px solid #fce8f3', background:'linear-gradient(90deg,#fdf3fa,#fff8f5)' }}>
                <div style={{ width:36, height:36, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, background:'linear-gradient(135deg,#fce4f022,#f8d7ea11)', boxShadow:'0 1px 4px rgba(164,48,115,0.12)' }}>{icon}</div>
                <h3 style={{ fontWeight:800, fontSize:15, color:'#1f1b17', margin:0, fontFamily:'Quicksand,sans-serif' }}>{title}</h3>
            </div>
            <div style={{ padding:'16px' }}>{children}</div>
        </div>
    );
};

const Chip: React.FC<{ label: string; color?: string }> = ({ label, color = '#a43073' }) => (
    <span style={{
        display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px',
        borderRadius:9999, fontSize:12, fontWeight:700, border:`1px solid ${color}30`,
        background:`${color}14`, color: color, fontFamily:'Quicksand,sans-serif'
    }}>{label}</span>
);

// ── Stylish Calendar Modal ──
interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: string;
    onSelectDate: (d: string) => void;
    datesWithDiary: string[];
    petName: string;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
    isOpen,
    onClose,
    currentDate,
    onSelectDate,
    datesWithDiary,
    petName,
}) => {
    const cleanCurrent = cleanDateStr(currentDate);
    const [selectedYear, selectedMonth] = cleanCurrent.split('-').map(Number);
    const [viewYear, setViewYear] = useState<number>(() => selectedYear || new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(() => (selectedMonth ? selectedMonth - 1 : new Date().getMonth()));

    useEffect(() => {
        if (isOpen) {
            const [y, m] = cleanDateStr(currentDate).split('-').map(Number);
            if (y && m) {
                setViewYear(y);
                setViewMonth(m - 1);
            }
        }
    }, [isOpen, currentDate]);

    if (!isOpen) return null;

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(v => v - 1);
        } else {
            setViewMonth(v => v - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(v => v + 1);
        } else {
            setViewMonth(v => v + 1);
        }
    };

    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr = new Date().toISOString().slice(0, 10);

    const handleDayClick = (day: number) => {
        const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onSelectDate(dStr);
        onClose();
    };

    const sortedDiaryDates = [...datesWithDiary].sort((a, b) => b.localeCompare(a));

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 120,
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px',
                animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: 28,
                    maxWidth: 420,
                    width: '100%',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(164, 48, 115, 0.35), 0 0 0 1px rgba(244, 114, 182, 0.25)',
                    animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div style={{
                    background: 'linear-gradient(135deg, #a43073 0%, #c7507f 50%, #e11d48 100%)',
                    padding: '20px 22px 18px',
                    color: 'white',
                    position: 'relative',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div>
                            <p style={{
                                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.14em', opacity: 0.9, margin: 0,
                                fontFamily: 'Quicksand, sans-serif'
                            }}>
                                Calendário de Diários 🐾
                            </p>
                            <h3 style={{
                                fontSize: 22, fontWeight: 900, margin: '2px 0 0',
                                fontFamily: 'Quicksand, sans-serif', letterSpacing: '-0.02em'
                            }}>
                                {monthNames[viewMonth]} {viewYear}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                width: 34, height: 34, borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.35)',
                                color: 'white', fontSize: 15, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Month switcher navigation */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 }}>
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            style={{
                                background: 'rgba(255, 255, 255, 0.18)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 12, padding: '6px 12px',
                                color: 'white', fontSize: 12, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                fontFamily: 'Quicksand, sans-serif'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
                        >
                            ◀ Mês anterior
                        </button>
                        <span style={{ fontSize: 11, opacity: 0.95, fontWeight: 700 }}>
                            {datesWithDiary.length} registro(s) encontrado(s)
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            style={{
                                background: 'rgba(255, 255, 255, 0.18)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: 12, padding: '6px 12px',
                                color: 'white', fontSize: 12, fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                fontFamily: 'Quicksand, sans-serif'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
                        >
                            Próximo mês ▶
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div style={{ padding: '18px 20px 20px' }}>
                    {/* Weekday headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8, textAlign: 'center' }}>
                        {weekDays.map((wd, i) => (
                            <span key={wd} style={{
                                fontSize: 11, fontWeight: 800,
                                color: i === 0 || i === 6 ? '#a43073' : '#94a3b8',
                                textTransform: 'uppercase', fontFamily: 'Quicksand, sans-serif'
                            }}>
                                {wd}
                            </span>
                        ))}
                    </div>

                    {/* Month Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
                        {/* Empty leading cells */}
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} style={{ height: 42 }} />
                        ))}

                        {/* Day numbers */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const dayNum = i + 1;
                            const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isSelected = dStr === cleanCurrent;
                            const hasDiary = datesWithDiary.includes(dStr);
                            const isToday = dStr === todayStr;

                            return (
                                <button
                                    key={dayNum}
                                    type="button"
                                    onClick={() => handleDayClick(dayNum)}
                                    title={hasDiary ? `Diário disponível em ${formatDateBR(dStr)} 🐾` : formatDateBR(dStr)}
                                    style={{
                                        height: 42,
                                        borderRadius: 14,
                                        border: isSelected
                                            ? '2px solid #a43073'
                                            : hasDiary
                                            ? '1.5px solid #f472b6'
                                            : isToday
                                            ? '1.5px dashed #cbd5e1'
                                            : '1px solid transparent',
                                        background: isSelected
                                            ? 'linear-gradient(135deg, #a43073 0%, #be185d 100%)'
                                            : hasDiary
                                            ? '#fdf2f8'
                                            : 'transparent',
                                        color: isSelected
                                            ? '#ffffff'
                                            : hasDiary
                                            ? '#9d174d'
                                            : '#334155',
                                        fontWeight: isSelected || hasDiary ? 800 : 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        padding: 0,
                                        transition: 'all 0.15s ease',
                                        boxShadow: isSelected
                                            ? '0 4px 12px rgba(164, 48, 115, 0.35)'
                                            : hasDiary
                                            ? '0 2px 6px rgba(244, 114, 182, 0.25)'
                                            : 'none',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) e.currentTarget.style.background = hasDiary ? '#fce7f3' : '#f1f5f9';
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) e.currentTarget.style.background = hasDiary ? '#fdf2f8' : 'transparent';
                                    }}
                                >
                                    <span style={{ fontSize: 13, lineHeight: 1.1, fontFamily: 'Quicksand, sans-serif' }}>
                                        {dayNum}
                                    </span>
                                    {hasDiary && (
                                        <span style={{ fontSize: 9, lineHeight: 1, marginTop: 2 }}>
                                            🐾
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 16, marginTop: 14, paddingTop: 10,
                        borderTop: '1px solid #f1f5f9', fontSize: 11, color: '#64748b',
                        fontFamily: 'Quicksand, sans-serif', fontWeight: 700
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                                width: 14, height: 14, borderRadius: 4,
                                background: '#fdf2f8', border: '1.5px solid #f472b6',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8
                            }}>🐾</span>
                            <span>Possui Diário</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                                width: 12, height: 12, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #a43073, #be185d)'
                            }} />
                            <span>Dia Selecionado</span>
                        </div>
                    </div>

                    {/* Quick Access to Previous Diaries */}
                    {sortedDiaryDates.length > 0 && (
                        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px dashed #fce7f3' }}>
                            <p style={{
                                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                                color: '#a43073', letterSpacing: '0.1em', margin: '0 0 8px',
                                fontFamily: 'Quicksand, sans-serif'
                            }}>
                                📜 Histórico de Diários ({petName}):
                            </p>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: 6,
                                maxHeight: 96, overflowY: 'auto', paddingRight: 4
                            }}>
                                {sortedDiaryDates.map(d => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => { onSelectDate(d); onClose(); }}
                                        style={{
                                            padding: '5px 11px',
                                            borderRadius: 9999,
                                            fontSize: 11,
                                            fontWeight: 800,
                                            fontFamily: 'Quicksand, sans-serif',
                                            border: d === cleanCurrent ? '1.5px solid #a43073' : '1px solid #fbcfe8',
                                            background: d === cleanCurrent ? '#a43073' : '#fdf2f8',
                                            color: d === cleanCurrent ? '#ffffff' : '#a43073',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={e => {
                                            if (d !== cleanCurrent) e.currentTarget.style.background = '#fce7f3';
                                        }}
                                        onMouseLeave={e => {
                                            if (d !== cleanCurrent) e.currentTarget.style.background = '#fdf2f8';
                                        }}
                                    >
                                        <span>🐾</span>
                                        <span>{formatDateBR(d)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main ──
const PublicDiaryView: React.FC<Props> = ({ enrollment, date, onDateChange, skipSplash = false }) => {
    const [entry, setEntry] = useState<DiaryEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(!skipSplash);
    const [contentVisible, setContentVisible] = useState(skipSplash);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [datesWithDiary, setDatesWithDiary] = useState<string[]>([]);
    const [currentPetPhoto, setCurrentPetPhoto] = useState<string | undefined>(enrollment.pet_photo_url);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentPetPhoto(enrollment.pet_photo_url);
    }, [enrollment.pet_photo_url]);

    // Fetch all diary dates for this pet to show in the calendar
    useEffect(() => {
        const fetchDates = async () => {
            try {
                const { data } = await supabase
                    .from('daycare_diary_entries')
                    .select('date')
                    .eq('enrollment_id', enrollment.id);
                if (data) {
                    const cleanDates = data.map(d => cleanDateStr(d.date)).filter(Boolean);
                    setDatesWithDiary(cleanDates);
                }
            } catch (err) {
                console.error('Error fetching diary dates:', err);
            }
        };
        if (enrollment.id) {
            fetchDates();
        }
    }, [enrollment.id]);

    useEffect(() => {
        setLoading(true); setEntry(null);
        const load = async () => {
            const clean = cleanDateStr(date);
            const { data, error } = await supabase
                .from('daycare_diary_entries')
                .select('*')
                .eq('enrollment_id', enrollment.id)
                .eq('date', clean)
                .maybeSingle();
            if (error) console.error('[PublicDiaryView] fetch error:', error);
            if (data) {
                // Normalize media_urls: pode vir como string JSON, array, ou null
                let normalizedUrls: string[] = [];
                const raw = (data as any).media_urls;
                if (Array.isArray(raw)) {
                    normalizedUrls = raw.filter(Boolean);
                } else if (typeof raw === 'string' && raw.trim().startsWith('[')) {
                    try { normalizedUrls = JSON.parse(raw).filter(Boolean); } catch {}
                } else if (typeof raw === 'string' && raw.trim()) {
                    normalizedUrls = [raw];
                }
                setEntry({ ...data, media_urls: normalizedUrls });
            } else {
                setEntry(null);
            }
            setLoading(false);
        };
        load();
    }, [enrollment.id, date]);

    const handleSplashDone = () => { setShowSplash(false); setTimeout(() => setContentVisible(true), 100); };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('A foto selecionada é muito grande. Escolha uma foto de até 10MB.');
            return;
        }

        setIsUploadingPhoto(true);
        try {
            const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
            const path = `${enrollment.id}_${Date.now()}.${ext}`;

            // 1. Upload to Supabase bucket 'daycare_pet_photos'
            const { error: upErr } = await supabase.storage
                .from('daycare_pet_photos')
                .upload(path, file, { upsert: true, contentType: file.type });
            if (upErr) throw upErr;

            // 2. Get Public URL
            const { data: urlData } = supabase.storage
                .from('daycare_pet_photos')
                .getPublicUrl(path);
            const newPhotoUrl = urlData.publicUrl;

            // 3. Update 'daycare_enrollments' table (atualiza a foto na creche)
            const { error: dbErr } = await supabase
                .from('daycare_enrollments')
                .update({ pet_photo_url: newPhotoUrl })
                .eq('id', enrollment.id);
            if (dbErr) throw dbErr;

            setCurrentPetPhoto(newPhotoUrl);
            setUploadFeedback('Foto atualizada na creche! 🐾');
            setTimeout(() => setUploadFeedback(null), 4000);
        } catch (err: any) {
            console.error('Error uploading pet photo:', err);
            alert('Erro ao atualizar a foto do pet. Tente novamente.');
        } finally {
            setIsUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const archetypes: string[] = []; const achievements: string[] = []; const socialTags: string[] = [];
    let bestFriend = '', favoriteActivity = '';
    (entry?.social_notes ?? []).forEach(note => {
        if (note.startsWith('🎭 Arquétipo: ')) archetypes.push(note.replace('🎭 Arquétipo: ', ''));
        else if (note.startsWith('⭐ Conquista: ')) achievements.push(note.replace('⭐ Conquista: ', ''));
        else if (note.startsWith('🏷️ Social: ')) socialTags.push(note.replace('🏷️ Social: ', ''));
        else if (note.startsWith('❤️ Melhor Amigo: ')) bestFriend = note.replace('❤️ Melhor Amigo: ', '');
        else if (note.startsWith('🎾 Ativ. Favorita: ')) favoriteActivity = note.replace('🎾 Ativ. Favorita: ', '');
    });
    let energy = '', nap = '';
    (entry?.emotional_notes ?? []).forEach(note => {
        if (note.startsWith('⚡ Energia: ')) energy = note.replace('⚡ Energia: ', '');
        if (note.startsWith('😴 Soneca: ')) nap = note.replace('😴 Soneca: ', '');
    });
    const behavior = entry?.behavior ?? null;
    const behaviorInfo = behavior !== null ? getBehaviorLabel(behavior) : null;
    const moodConfig = entry?.mood ? getMoodConfig(entry.mood) : null;
    const feedingConfig = entry?.feeding ? getFeedingConfig(entry.feeding) : null;
    const peeLog = (entry?.needs_logs ?? []).find(l => l.type.includes('Xixi'));
    const poopLog = (entry?.needs_logs ?? []).find(l => l.type.includes('Coc'));

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&family=Quicksand:wght@500;600;700;800&display=swap');
                @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
                @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes spinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                @keyframes pulseGlow { 0%, 100% { transform: scale(1); opacity: 0.45; } 50% { transform: scale(1.15); opacity: 0.85; } }
                @keyframes petHeroFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
                @keyframes progressFill { from { width: 0%; } to { width: 100%; } }
                .energy-bar { background:linear-gradient(90deg,#f472b6,#a43073); border-radius:9999px; transition:width 1.2s cubic-bezier(0.4,0,0.2,1); }
                .pet-float { animation: float 3s ease-in-out infinite; }
                .fade-up { animation: fadeInUp 0.6s ease both; }
            `}</style>

            {showSplash && <SplashScreen petName={enrollment.pet_name} petPhoto={currentPetPhoto} onDone={handleSplashDone} />}

            {/* Custom Stylish Calendar Modal */}
            <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                currentDate={date}
                onSelectDate={onDateChange}
                datesWithDiary={datesWithDiary}
                petName={enrollment.pet_name}
            />

            <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#fce4f0 0%,#fdf3ee 35%,#fff8f5 100%)', fontFamily:'Nunito Sans,sans-serif' }}>

                {/* Hero Header */}
                <div style={{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg,#a43073 0%,#c7507f 50%,#e07070 100%)', transition:'opacity 0.7s ease', opacity: contentVisible ? 1 : 0 }}>
                    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
                        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', filter:'blur(50px)', opacity:0.25, top:-40, right:-40, background:'rgba(255,255,255,0.4)' }} />
                        <div style={{ position:'absolute', width:150, height:150, borderRadius:'50%', filter:'blur(40px)', opacity:0.2, bottom:0, left:-20, background:'rgba(255,255,255,0.5)' }} />
                    </div>

                    <div style={{ position:'relative', padding:'44px 20px 68px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:10, maxWidth:480, margin:'0 auto' }}>
                        <p style={{ color:'rgba(255,255,255,0.78)', fontSize:11, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', fontFamily:'Quicksand,sans-serif' }}>
                            Sandy's Pet • Creche
                        </p>

                        {/* Pet Photo with Clean Border & Camera Change Button (NO EMOJI ON PHOTO) */}
                        <div className="pet-float" style={{ position:'relative', marginTop:2 }}>
                            <div style={{ position:'absolute', inset:0, borderRadius:'50%', filter:'blur(16px)', opacity:0.45, transform:'scale(1.1)', background:'rgba(255,255,255,0.5)' }} />
                            
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    position:'relative', width:96, height:96, borderRadius:'50%',
                                    border:'4px solid rgba(255,255,255,0.92)',
                                    boxShadow:'0 8px 32px rgba(0,0,0,0.22)',
                                    overflow:'hidden',
                                    cursor:'pointer',
                                    background: 'rgba(255,255,255,0.2)'
                                }}
                                title="Clique para alterar a foto do pet"
                            >
                                {currentPetPhoto ? (
                                    <img src={currentPetPhoto} alt={enrollment.pet_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                ) : (
                                    <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, background:'rgba(255,255,255,0.2)' }}>🐶</div>
                                )}

                                {isUploadingPhoto && (
                                    <div style={{
                                        position:'absolute', inset:0, background:'rgba(0,0,0,0.45)',
                                        display:'flex', alignItems:'center', justifyContent:'center'
                                    }}>
                                        <div style={{
                                            width:22, height:22, borderRadius:'50%',
                                            border:'3px solid #ffffff', borderTopColor:'transparent',
                                            animation:'spin 0.8s linear infinite'
                                        }} />
                                    </div>
                                )}
                            </div>

                            {/* Camera Edit Button (replaces the old emoji) */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingPhoto}
                                title="Alterar foto do pet na creche"
                                style={{
                                    position:'absolute', bottom:-2, right:-2,
                                    width:32, height:32, borderRadius:'50%',
                                    background:'#ffffff',
                                    border:'2.5px solid rgba(255,255,255,0.95)',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    boxShadow:'0 4px 14px rgba(0,0,0,0.22)',
                                    cursor:'pointer',
                                    transition:'transform 0.2s ease',
                                    zIndex: 5,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                                {isUploadingPhoto ? (
                                    <div style={{
                                        width:12, height:12, borderRadius:'50%',
                                        border:'2px solid #a43073', borderTopColor:'transparent',
                                        animation:'spin 0.8s linear infinite'
                                    }} />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a43073" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                        <circle cx="12" cy="13" r="4"/>
                                    </svg>
                                )}
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handlePhotoChange}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Floating toast notification after photo update */}
                        {uploadFeedback && (
                            <div style={{
                                background: '#ffffff',
                                color: '#a43073',
                                padding: '5px 14px',
                                borderRadius: 9999,
                                fontSize: 11,
                                fontWeight: 800,
                                boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                                animation: 'fadeInUp 0.3s ease',
                                fontFamily: 'Quicksand, sans-serif',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                <span>✅</span>
                                <span>{uploadFeedback}</span>
                            </div>
                        )}

                        <div>
                            <h1 style={{ color:'white', fontSize:28, fontWeight:900, lineHeight:1.2, margin:0, fontFamily:'Quicksand,sans-serif', textShadow:'0 1px 4px rgba(0,0,0,0.1)' }}>
                                {enrollment.pet_name}
                            </h1>
                            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:13, fontWeight:600, marginTop:2 }}>
                                Família {enrollment.tutor_name.split(' ')[0]}
                            </p>
                        </div>

                        {/* Date Button - Opens Custom Stylish Calendar Modal */}
                        <div style={{ marginTop:4 }}>
                            <button
                                type="button"
                                onClick={() => setIsCalendarOpen(true)}
                                style={{
                                    background: 'rgba(255,255,255,0.22)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    border: '1.5px solid rgba(255,255,255,0.4)',
                                    borderRadius: 9999,
                                    padding: '8px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.32)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                            >
                                <span style={{ fontSize: 14 }}>📅</span>
                                <span style={{ color: 'white', fontWeight: 800, fontSize: 13, fontFamily: 'Quicksand,sans-serif' }}>
                                    {formatDateDisplay(date)}
                                </span>
                                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>▼</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Wave divider */}
                <div style={{ position:'relative', marginTop:-32, zIndex:10 }}>
                    <svg viewBox="0 0 390 48" style={{ display:'block', width:'100%' }}>
                        <path d="M0,40 Q195,0 390,40 L390,48 L0,48 Z" fill="#fdf3ee" />
                    </svg>
                </div>

                {/* Cards */}
                <div style={{
                    padding:'0 16px 64px', maxWidth:480, margin:'0 auto',
                    display:'flex', flexDirection:'column', gap:16, marginTop:-8,
                    transition:'opacity 0.7s ease', opacity: contentVisible ? 1 : 0,
                }}>
                    {loading ? (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:16 }}>
                            <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid #a43073', borderTopColor:'transparent', animation:'spin 0.9s linear infinite' }} />
                            <p style={{ color:'#87717a', fontSize:14 }}>Carregando o diário...</p>
                        </div>
                    ) : !entry ? (
                        <div className="fade-up" style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'64px 0', gap:12, textAlign:'center' }}>
                            <div style={{ fontSize:60 }}>📭</div>
                            <h3 style={{ fontWeight:800, color:'#1f1b17', fontSize:18, margin:0, fontFamily:'Quicksand,sans-serif' }}>Nenhum registro ainda</h3>
                            <p style={{ color:'#87717a', fontSize:13, maxWidth:260, lineHeight:1.5 }}>O diário deste dia ainda não foi preenchido. Tente outro dia!</p>
                        </div>
                    ) : (
                        <>
                            {/* Humor */}
                            {moodConfig && (
                                <Card icon="😊" title="Humor do Dia" delay={100}>
                                    <div style={{ display:'flex', alignItems:'center', gap:16, padding:12, borderRadius:16, background:`linear-gradient(to right, var(--tw-gradient-from, #f5f5f4), var(--tw-gradient-to, #fafaf9))`, backgroundImage:`linear-gradient(to right, #fef3c7, #fefce8)` }}>
                                        <div style={{ fontSize:40 }}>{moodConfig.emoji}</div>
                                        <div>
                                            <p style={{ fontSize:20, fontWeight:800, color:'#92400e', margin:0, fontFamily:'Quicksand,sans-serif' }}>{entry.mood}</p>
                                            <p style={{ fontSize:11, color:'#87717a', margin:0 }}>como estava o bichinho hoje</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Comportamento */}
                            <Card icon={<img src="https://cdn-icons-png.flaticon.com/512/16725/16725843.png" alt="" style={{ width:20, height:20 }} />} title="Nível de Energia" delay={180}>
                                {behaviorInfo ? (
                                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                            <span style={{ fontSize:13, color:'#544249', fontWeight:600 }}>Comportamento</span>
                                            <span style={{ fontSize:18, fontWeight:900, color:'#a43073', fontFamily:'Quicksand,sans-serif' }}>{behaviorInfo.emoji} {behaviorInfo.label}</span>
                                        </div>
                                        <div style={{ height:12, borderRadius:9999, background:'#f0e6e0', overflow:'hidden' }}>
                                            <div className="energy-bar" style={{ height:'100%', width:`${((behavior ?? 1)/5)*100}%` }} />
                                        </div>
                                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#b09ca6', fontWeight:700 }}>
                                            <span>😇 (1) Calmo</span>
                                            <span>⚡ (5) Reativo</span>
                                        </div>
                                    </div>
                                ) : <p style={{ fontSize:13, color:'#b09ca6', fontStyle:'italic', textAlign:'center', padding:8 }}>Sem registro</p>}
                            </Card>

                            {/* Vibe / Arquétipos */}
                            {(archetypes.length > 0 || socialTags.length > 0) && (
                                <Card icon={<img src="https://cdn-icons-png.flaticon.com/512/4117/4117609.png" alt="" style={{ width:20, height:20 }} />} title="Comportamento & Vibe" delay={240}>
                                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                                        {archetypes.length > 0 && (
                                            <div>
                                                <p style={{ fontSize:11, color:'#87717a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Arquétipo do dia</p>
                                                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                                    {archetypes.map((a, i) => <Chip key={i} label={a} color="#a43073" />)}
                                                </div>
                                            </div>
                                        )}
                                        {socialTags.length > 0 && (
                                            <div>
                                                <p style={{ fontSize:11, color:'#87717a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Socialização</p>
                                                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                                    {socialTags.map((t, i) => <Chip key={i} label={t} color="#7c3aed" />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Estrelinhas */}
                            {(achievements.length > 0 || favoriteActivity || bestFriend) && (
                                <Card icon={<img src="https://cdn-icons-png.flaticon.com/512/2107/2107957.png" alt="" style={{ width:20, height:20 }} />} title="Estrelinhas do Dia" delay={300}>
                                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                                        {achievements.map((a, i) => (
                                            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, background:'#fff9ec', borderRadius:16, padding:'10px 12px', border:'1px solid rgba(253,230,138,0.4)' }}>
                                                <span style={{ fontSize:20 }}>⭐</span>
                                                <span style={{ fontSize:13, fontWeight:700, color:'#92400e', fontFamily:'Quicksand,sans-serif' }}>{a}</span>
                                            </div>
                                        ))}
                                        {favoriteActivity && (
                                            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#fdf4ff', borderRadius:16, padding:'10px 12px', border:'1px solid rgba(232,121,249,0.25)' }}>
                                                <span style={{ fontSize:20 }}>🎾</span>
                                                <div>
                                                    <p style={{ fontSize:10, color:'#87717a', fontWeight:700, textTransform:'uppercase', margin:0 }}>Atividade favorita</p>
                                                    <p style={{ fontSize:13, fontWeight:700, color:'#6b21a8', fontFamily:'Quicksand,sans-serif', margin:0 }}>{favoriteActivity}</p>
                                                </div>
                                            </div>
                                        )}
                                        {bestFriend && (
                                            <div style={{ display:'flex', alignItems:'center', gap:12, background:'#fff1f5', borderRadius:16, padding:'10px 12px', border:'1px solid rgba(253,164,175,0.3)' }}>
                                                <span style={{ fontSize:20 }}>❤️</span>
                                                <div>
                                                    <p style={{ fontSize:10, color:'#87717a', fontWeight:700, textTransform:'uppercase', margin:0 }}>Melhor amigo do dia</p>
                                                    <p style={{ fontSize:13, fontWeight:700, color:'#9f1239', fontFamily:'Quicksand,sans-serif', margin:0 }}>{bestFriend}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Rotina Básica */}
                            <Card icon={<img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" alt="" style={{ width:20, height:20 }} />} title="Rotina Básica" delay={360}>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                    {[
                                        { bg:'#f0fdf4', border:'#bbf7d030', label:'🍽️ Alimentação', content: feedingConfig ? `${feedingConfig.emoji} ${entry.feeding}` : null, color:'#065f46' },
                                        { bg:'#eff6ff', border:'#bfdbfe30', label:'😴 Soneca', content: nap ? `💤 ${nap}` : null, color:'#1e3a8a' },
                                        { bg:'#fefce8', border:'#fde04730', label:'💧 Xixi', content: peeLog ? peeLog.type.replace('Xixi (','').replace(')','') : null, color:'#78350f' },
                                        { bg:'#fff7ed', border:'#fed7aa30', label:'💩 Cocô', content: poopLog ? poopLog.type.replace('Cocô (','').replace(')','') : null, color:'#9a3412' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ background:item.bg, borderRadius:16, padding:12, border:`1px solid ${item.border}` }}>
                                            <p style={{ fontSize:10, color:'#87717a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{item.label}</p>
                                            {item.content
                                                ? <p style={{ fontSize:13, fontWeight:800, color:item.color, margin:0, fontFamily:'Quicksand,sans-serif' }}>{item.content}</p>
                                                : <p style={{ fontSize:12, color:'#b09ca6', fontStyle:'italic', margin:0 }}>—</p>
                                            }
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Recadinho da Sandy */}
                            {entry.obs && (
                                <Card icon={<img src="https://cdn-icons-png.flaticon.com/512/1042/1042390.png" alt="" style={{ width:20, height:20 }} />} title="Recadinho da Sandy" delay={420}>
                                    <div style={{ position:'relative' }}>
                                        <div style={{ position:'absolute', top:-4, left:-4, fontSize:52, color:'#ffd8e7', fontFamily:'serif', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>"</div>
                                        <div style={{ position:'relative', zIndex:1, paddingLeft:20 }}>
                                            <p style={{ fontSize:14, color:'#544249', lineHeight:1.7, whiteSpace:'pre-wrap', margin:0 }}>{entry.obs}</p>
                                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid #fce8f3' }}>
                                                <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#f472b6,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'white', fontWeight:800 }}>S</div>
                                                <span style={{ fontSize:12, fontWeight:700, color:'#a43073', fontFamily:'Quicksand,sans-serif' }}>Tia Sandy</span>
                                                <span style={{ fontSize:11, color:'#b09ca6' }}>• Sandy's Pet Creche</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Mídias */}
                            {(entry.media_urls?.length ?? 0) > 0 && (
                                <Card icon="📸" title="Fotos & Vídeos do Dia" delay={480}>
                                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                                        {entry.media_urls!.map((url, i) => {
                                            // Detecta vídeo por extensão OU por parte do path do Supabase storage
                                            const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url)
                                                || /video/i.test(url);
                                            return isVideo ? (
                                                <div key={i} style={{ position:'relative', borderRadius:16, overflow:'hidden', background:'#111', aspectRatio:'1' }}>
                                                    <video
                                                        src={url}
                                                        controls
                                                        playsInline
                                                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                                        onError={(e) => {
                                                            // Fallback: mostra link se vídeo não carrega
                                                            const parent = e.currentTarget.parentElement;
                                                            if (parent) parent.innerHTML = `<a href="${url}" target="_blank" style="display:flex;align-items:center;justify-content:center;height:100%;color:#a43073;font-size:12px;font-weight:700;text-decoration:none;padding:8px;text-align:center;">🎥 Ver Vídeo</a>`;
                                                        }}
                                                    />
                                                    <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.55)', borderRadius:6, padding:'2px 6px' }}>
                                                        <span style={{ color:'white', fontSize:10, fontWeight:700 }}>🎥 Vídeo</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <a key={i} href={url} target="_blank" rel="noreferrer"
                                                    style={{ position:'relative', aspectRatio:'1', borderRadius:16, overflow:'hidden', background:'#fce8f3', display:'block', boxShadow:'0 2px 8px rgba(164,48,115,0.1)' }}>
                                                    <img
                                                        src={url}
                                                        alt={`Foto ${i+1}`}
                                                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            // Se imagem falhar, tenta mostrar como link
                                                            e.currentTarget.style.display = 'none';
                                                            const parent = e.currentTarget.parentElement;
                                                            if (parent) {
                                                                parent.style.display = 'flex';
                                                                parent.style.alignItems = 'center';
                                                                parent.style.justifyContent = 'center';
                                                                parent.innerHTML = `<span style="font-size:13px;color:#a43073;font-weight:700;text-align:center;padding:8px;">📷 Foto ${i+1}</span>`;
                                                            }
                                                        }}
                                                    />
                                                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.18))', pointerEvents:'none' }} />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </Card>
                            )}

                            {/* Footer */}
                            <div className="fade-up" style={{ textAlign:'center', padding:'16px 0 8px' }}>
                                <p style={{ fontSize:12, color:'#b09ca6', margin:0 }}>Feito com 💕 pela</p>
                                <p style={{ fontSize:13, fontWeight:700, color:'#a43073', margin:0, fontFamily:'Quicksand,sans-serif' }}>Sandy's Pet Creche</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export { SplashScreen };
export default PublicDiaryView;
