import React, { useState, useEffect, useRef } from 'react';

// Chuva de confete realista (60 FPS Canvas) - reutilizavel
export const ConfettiRain: React.FC = () => {
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
            '#F59E0B', '#FBBF24', '#FDE68A',
            '#F43F5E', '#FB7185', '#FDA4AF',
            '#A43073', '#D946EF', '#C026D3',
            '#EC4899', '#F472B6', '#FFFFFF',
            '#60A5FA', '#A78BFA'
        ];

        const particleCount = 80;
        const particles: Array<{
            x: number; y: number; w: number; h: number;
            color: string; speedY: number; speedX: number;
            angle: number; angleSpeed: number;
            tilt: number; tiltAngle: number; tiltAngleSpeed: number;
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
                ctx.scale(1, p.tilt);

                ctx.fillStyle = p.color;

                if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.w * 0.42, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === 'star') {
                    ctx.beginPath();
                    const s = p.w * 0.65;
                    ctx.moveTo(0, -s);
                    ctx.quadraticCurveTo(0, 0, s, 0);
                    ctx.quadraticCurveTo(0, 0, 0, s);
                    ctx.quadraticCurveTo(0, 0, -s, 0);
                    ctx.quadraticCurveTo(0, 0, 0, -s);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    const radius = 2;
                    const w = p.w;
                    const h = p.h;
                    ctx.moveTo(-w / 2 + radius, -h / 2);
                    ctx.lineTo(w / 2 - radius, -h / 2);
                    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
                    ctx.lineTo(w / 2, h / 2 - radius);
                    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
                    ctx.lineTo(-w / 2 + radius, h / 2);
                    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
                    ctx.lineTo(-w / 2, -h / 2 + radius);
                    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
                    ctx.closePath();
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

// Splash de confirmacao de agendamento com confete + foto do pet centralizada
interface AppointmentSuccessSplashProps {
    petName: string;
    petPhoto?: string | null;
    onDone: () => void;
    durationMs?: number;
}

export const AppointmentSuccessSplash: React.FC<AppointmentSuccessSplashProps> = ({
    petName,
    petPhoto,
    onDone,
    durationMs = 4000
}) => {
    const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

    useEffect(() => {
        const exitAt = Math.max(800, durationMs - 500);
        const t1 = setTimeout(() => setPhase('hold'), 100);
        const t2 = setTimeout(() => setPhase('exit'), exitAt);
        const t3 = setTimeout(onDone, durationMs);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [onDone, durationMs]);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                background: 'radial-gradient(circle at 50% 35%, #fff1f2 0%, #fce7f3 35%, #fae8ff 70%, #fef3c7 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 20px',
                transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: phase === 'exit' ? 0 : 1,
                transform: phase === 'exit' ? 'scale(1.08)' : 'scale(1)',
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            {/* Chuva de confete */}
            <ConfettiRain />

            {/* Halos de luz difusa ao fundo */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Card central com a foto do pet e a mensagem */}
            <div
                className="relative z-10 flex flex-col items-center text-center animate-splash-slide-up"
                style={{
                    opacity: phase === 'enter' ? 0 : 1,
                    transform: phase === 'enter' ? 'translateY(20px)' : 'translateY(0)',
                    transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                }}
            >
                {/* Foto do pet centralizada */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-pink-200/50 rounded-full blur-2xl animate-pulse scale-110" />
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
                        {petPhoto ? (
                            <img
                                src={petPhoto}
                                alt={petName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src="https://cdn-icons-png.flaticon.com/512/616/616408.png"
                                alt="Pet"
                                className="w-24 h-24 object-contain opacity-60"
                            />
                        )}
                    </div>
                    {/* Selo de check sobreposto */}
                    <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8 text-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    </div>
                </div>

                {/* Nome do pet */}
                <h1 className="font-brand text-4xl sm:text-5xl text-pink-900 tracking-tight leading-none mb-3 drop-shadow-sm">
                    {petName}
                </h1>

                {/* Mensagem de sucesso */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-pink-100/60 max-w-sm">
                    <p className="text-pink-700 font-extrabold text-lg sm:text-xl mb-1">
                        Agendamento confirmado!
                    </p>
                    <p className="text-pink-600/80 text-sm font-medium">
                        Estamos ansiosos para receber seu pet ��
                    </p>
                </div>

                {/* Submensagem */}
                <p className="mt-4 text-pink-500/70 text-xs font-bold uppercase tracking-wider">
                    Redirecionando...
                </p>
            </div>
        </div>
    );
};
