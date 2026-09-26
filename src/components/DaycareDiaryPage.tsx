import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { DaycareRegistration } from '../../types';

interface Props {
    enrollment: DaycareRegistration;
    date: string;
    onDateChange: (d: string) => void;
    onBack: () => void;
}

const DaycareDiaryPage: React.FC<Props> = ({ enrollment, date, onDateChange, onBack }) => {
    // 1. Estados
    const [energy, setEnergy] = useState<'100' | '50' | '0' | null>(null);
    const [mood, setMood] = useState<'Animado' | 'Normal' | 'Sonolento' | 'Agitado' | null>(null);
    const [achievements, setAchievements] = useState<string[]>([]);
    const [bestFriend, setBestFriend] = useState('');
    const [favoriteActivity, setFavoriteActivity] = useState<string | null>(null);
    const [behavior, setBehavior] = useState<number>(3);
    const [socialTags, setSocialTags] = useState<string[]>([]);
    const [archetypes, setArchetypes] = useState<string[]>([]);
    
    const [feeding, setFeeding] = useState<'Comeu tudo' | 'Comeu pouco' | 'Não comeu' | null>(null);
    const [pee, setPee] = useState<string | null>(null);
    const [poop, setPoop] = useState<string | null>(null);
    const [nap, setNap] = useState<string | null>(null);
    
    const [obs, setObs] = useState('');
    const [media, setMedia] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

    const [hasEntry, setHasEntry] = useState(false);
    const [saving, setSaving] = useState(false);
    const [shareSent, setShareSent] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Animação de transição
    const [isExiting, setIsExiting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleBack = () => {
        setIsExiting(true);
        setTimeout(() => onBack(), 300); // 300ms = tempo da animação slideOutToRight
    };

    // Toggle array
    const toggleArray = (arr: string[], val: string, setArr: any) => {
        if (arr.includes(val)) {
            setArr(arr.filter(a => a !== val));
        } else {
            setArr([...arr, val]);
        }
    };

    // Formatar data local
    useEffect(() => {
        if (!date) {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            onDateChange(todayStr);
        }
    }, []);

    // Media previews
    useEffect(() => {
        const urls = media.map(file => URL.createObjectURL(file));
        setMediaPreviews(urls);
    
    return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [media]);

    // Load do Banco de Dados (opcional para simplificar se não precisar restaurar a UI exata, mas é bom carregar as notas se existirem)
    useEffect(() => {
        (async () => {
            if (!date) return;
            const { data } = await supabase
                .from('daycare_diary_entries')
                .select('*')
                .eq('enrollment_id', enrollment.id)
                .eq('date', date)
                .maybeSingle();

            if (data) {
                setHasEntry(true);
                setMood((data.mood as any) ?? null);
                setBehavior(data.behavior ?? 3);
                setFeeding((data.feeding as any) ?? null);
                setObs(data.obs ?? '');
                setExistingMediaUrls(data.media_urls || []);
                
                // Nós salvamos os dados novos em social_notes e emotional_notes
                if (data.emotional_notes) {
                    const em = data.emotional_notes as string[];
                    em.forEach(note => {
                        if (note.startsWith('⚡ Energia: ')) setEnergy(note.replace('⚡ Energia: ', '').replace('%', '') as any);
                        if (note.startsWith('😴 Soneca: ')) setNap(note.replace('😴 Soneca: ', ''));
                    });
                }
                if (data.social_notes) {
                    const sn = data.social_notes as string[];
                    const loadedAchievements: string[] = [];
                    const loadedTags: string[] = [];
                    const loadedArchetypes: string[] = [];
                    sn.forEach(note => {
                        if (note.startsWith('❤️ Melhor Amigo: ')) setBestFriend(note.replace('❤️ Melhor Amigo: ', ''));
                        else if (note.startsWith('🎾 Ativ. Favorita: ')) setFavoriteActivity(note.replace('🎾 Ativ. Favorita: ', ''));
                        else if (note.startsWith('⭐ Conquista: ')) loadedAchievements.push(note.replace('⭐ Conquista: ', ''));
                        else if (note.startsWith('🏷️ Social: ')) loadedTags.push(note.replace('🏷️ Social: ', ''));
                        else if (note.startsWith('🎭 Arquétipo: ')) loadedArchetypes.push(note.replace('🎭 Arquétipo: ', ''));
                    });
                    setAchievements(loadedAchievements);
                    setSocialTags(loadedTags);
                    setArchetypes(loadedArchetypes);
                }
                
                if (data.needs_logs) {
                    const logs = data.needs_logs as any[];
                    logs.forEach(l => {
                        if (l.type?.startsWith('Xixi')) {
                            setPee(l.type.replace('Xixi (', '').replace(')', '').trim());
                        } else if (l.type?.startsWith('Cocô')) {
                            setPoop(l.type.replace('Cocô (', '').replace(')', '').trim());
                        }
                    });
                }
            } else {
                setHasEntry(false);
                setMood(null); setBehavior(3); setFeeding(null); setObs(''); setExistingMediaUrls([]);
                setEnergy(null); setAchievements([]); setBestFriend(''); setFavoriteActivity(null); setSocialTags([]); setArchetypes([]);
                setPee(null); setPoop(null); setNap(null); setMedia([]);
            }
        })();
    }, [enrollment.id, date]);

    const handleAddMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = Array.from(e.target.files || []);
        setMedia(prev => [...prev, ...f]);
    };
    const removeSelectedMedia = (idx: number) => setMedia(prev => prev.filter((_, i) => i !== idx));

    const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) onDateChange(val);
    };

    const saveDiary = async () => {
        setSaving(true);
        try {
            // Upload files
            let uploadedUrls: string[] = [];
            const uploadErrors: string[] = [];
            for (const file of media) {
                const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                const fileName = `daycare/${enrollment.id}/${date}_${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from('daycare_pet_photos')
                    .upload(fileName, file, {
                        upsert: true,
                        contentType: file.type || (ext === 'mp4' ? 'video/mp4' : 'image/jpeg'),
                    });
                if (uploadError) {
                    console.error('[DaycareDiary] Upload error:', uploadError);
                    uploadErrors.push(`${file.name}: ${uploadError.message}`);
                } else {
                    const { data } = supabase.storage.from('daycare_pet_photos').getPublicUrl(fileName);
                    if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
                }
            }
            if (uploadErrors.length > 0) {
                const proceed = window.confirm(
                    `⚠️ Erro ao enviar ${uploadErrors.length} arquivo(s):\n\n${uploadErrors.join('\n')}\n\nDeseja salvar o diário sem essas mídias?`
                );
                if (!proceed) { setSaving(false); return; }
            }
            const allMediaUrls = [...existingMediaUrls, ...uploadedUrls];


            const emotionalNotes = [
                energy ? `⚡ Energia: ${energy}%` : null,
                nap ? `😴 Soneca: ${nap}` : null
            ].filter(Boolean);

            const socialNotes = [
                bestFriend ? `❤️ Melhor Amigo: ${bestFriend}` : null,
                favoriteActivity ? `🎾 Ativ. Favorita: ${favoriteActivity}` : null,
                ...achievements.map(a => `⭐ Conquista: ${a}`),
                ...socialTags.map(t => `🏷️ Social: ${t}`),
                ...archetypes.map(a => `🎭 Arquétipo: ${a}`)
            ].filter(Boolean);

            const needs_logs = [];
            if (pee) needs_logs.push({ type: `Xixi (${pee})`, time: '' });
            if (poop) needs_logs.push({ type: `Cocô (${poop})`, time: '' });
            if (poop === 'Não Fez') needs_logs.push({ type: 'Não Fez Cocô', time: '' });

            const payload = {
                enrollment_id: enrollment.id,
                date,
                mood,
                behavior,
                feeding,
                obs,
                needs_logs,
                social_notes: socialNotes,
                emotional_notes: emotionalNotes,
                media_urls: allMediaUrls
            };

            const { error } = await supabase.from('daycare_diary_entries').upsert(payload, { onConflict: 'enrollment_id, date' });
            if (error) throw error;
            
            setHasEntry(true);
            setMedia([]); // clear uploaded queue since they are now in existingMediaUrls
            setExistingMediaUrls(allMediaUrls);
            
            // Tenta enviar o Webhook no fundo
            fetch('https://n8n.intelektus.tech/webhook/diarioCrechePet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'daycare_diary_shared',
                    diary_link: `${window.location.origin}/diario/${enrollment.id}?date=${date}`,
                    enrollment,
                    diary: payload
                })
            }).catch(() => {});

            setTimeout(() => handleBack(), 800); // go back on success
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar diário.");
        } finally {
            setSaving(false);
        }
    };

    // Opções
    const achievementOpts = ['Nota 10 no banho', 'Fez um novo amigo', 'Comeu tudinho', 'Comportamento exemplar', 'Soneca tranquila', 'Rei da brincadeira', 'Cãozinho Simpatia'];
    const activityOpts = ['Bolinha', 'Cabo de guerra', 'Piscina bolinhas', 'Caça-petisco'];
    const socialOpts = ['Brincou com outros', 'Relaxado', 'Ficou quieto', 'Hiperativo', 'Um pouco tímido'];
    const archetypeOpts = ['🛋️ Batata de Sofá', '🧸 Grude / Carente', '🎾 Fissurado em Bolinha', '🕵️ Curioso / Explorador', '🛡️ Segurança do Bairro', '🫣 Tímido / Desconfiado', '👑 Rei/Rainha do Pedaço'];

    // UI Helpers
    const isEnergy = (val: string) => energy === val;

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        try {
            const apiKey = import.meta.env.VITE_MINIMAX_API_KEY;
            if (!apiKey) {
                alert('Chave da API do Minimax (VITE_MINIMAX_API_KEY) não configurada no .env');
                setIsGenerating(false);
                return;
            }

            const data = {
                energy: energy || 'Não informado',
                mood: mood || 'Não informado',
                archetypes: archetypes.length > 0 ? archetypes.join(', ') : 'Nenhum',
                achievements: achievements.length > 0 ? achievements.join(', ') : 'Nenhuma',
                social: socialTags.length > 0 ? socialTags.join(', ') : 'Não informado',
                activity: favoriteActivity || 'Não informado',
                nap: nap || 'Não informado',
                feeding: feeding || 'Não informado',
                pee: pee || 'Não informado',
                poop: poop || 'Não informado'
            };

            const prompt = `Escreva um recadinho carinhoso, fofo e curto (máximo de 3 parágrafos) sobre o dia do pet ${enrollment.pet_name} na creche.
Use as seguintes informações do dia dele:
Energia: ${data.energy}%
Humor: ${data.mood}
Arquétipos da vibe: ${data.archetypes}
Estrelinhas (Destaques): ${data.achievements}
Socialização: ${data.social}
Atividade Favorita: ${data.activity}
Soneca: ${data.nap}
Alimentação: ${data.feeding}
Xixi: ${data.pee} / Cocô: ${data.poop}

${obs ? `O administrador também rascunhou o seguinte texto: "${obs}". Integre essa ideia no texto de forma criativa, fluida e melhorada.` : ''}

Seja natural, use alguns emojis e demonstre carinho. Finalize assinando como "Tia Sandy".`;

            const response = await fetch('https://api.minimaxi.chat/v1/text/chatcompletion_v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'MiniMax-Text-01',
                    messages: [
                        { role: 'system', content: 'Você é a Tia Sandy, uma cuidadora super amorosa de pets em uma creche. Você escreve resumos fofos e divertidos sobre o dia do cãozinho para enviar aos tutores. Sempre use emojis e demonstre muito carinho e afeto.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });

            const resData = await response.json();
            if (resData.choices && resData.choices.length > 0) {
                setObs(resData.choices[0].message.content);
            } else {
                console.error(resData);
                alert('Erro ao gerar recadinho com IA.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão com a API da IA.');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatBR = (d: string) => {

        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}`;
    };

    const getBehaviorLabel = (n: number) => {
        switch (n) {
            case 1: return 'Muito Calmo';
            case 2: return 'Dócil & Sossegado';
            case 3: return 'Energia Média';
            case 4: return 'Ativo & Brincalhão';
            case 5: return 'Alta Energia / Reativo';
            default: return '';
        }
    };

    return (
        <div className={`bg-[#fff8f5] font-['Nunito_Sans'] text-[#1f1b17] flex flex-col min-h-screen ${isExiting ? 'animate-slideOutToRight' : 'animate-slideInFromRight'}`}>
            <header className="sticky top-0 w-full z-50 pt-safe bg-[#fff8f5]/85 backdrop-blur-xl shadow-sm">
                <div className="h-16 px-4 flex items-center justify-between gap-2">
                    <button onClick={handleBack} className="w-11 h-11 flex items-center justify-center rounded-full text-[#544249] hover:bg-[#f0e6e0] transition-colors">
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <div className="flex flex-col items-center justify-center text-center flex-1">
                        <h1 className="font-['Quicksand'] font-semibold text-[17px] text-[#1f1b17] leading-tight">Diário Da {enrollment.pet_name}</h1>
                        <span className="font-['Quicksand'] text-[11px] font-bold text-[#a43073] flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">pets</span> Creche & Diário
                        </span>
                    </div>
                    <div className="w-11 h-11"></div>
                </div>
            </header>

            <main className="flex-1 flex flex-col relative w-full pt-4 pb-28 bg-gradient-to-b from-[#ffd8e7]/30 via-[#fcf2eb]/60 to-[#fff8f5]">
                <div className="flex flex-col w-full px-4 gap-5 select-none max-w-lg mx-auto">
                    
                    {/* HEADER & PERFIL */}
                    <section className="w-full bg-white rounded-2xl p-3 shadow-[0_4px_16px_-2px_rgba(244,114,182,0.12)] flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#ffd8e7]/40 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-start justify-between gap-1 relative z-10">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative flex-shrink-0">
                                    <img src={enrollment.pet_photo_url || "https://i.imgur.com/vHq06fS.png"} className="w-16 h-16 rounded-full object-cover shadow-[0_2px_8px_-1px_rgba(244,114,182,0.25)]" alt="Pet"/>
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <h2 className="font-['Quicksand'] font-semibold text-[19px] text-[#1f1b17] truncate">{enrollment.pet_name}</h2>
                                    <p className="text-[12px] text-[#544249] truncate"><span className="font-bold text-[#1f1b17]">👤 {enrollment.tutor_name}</span></p>
                                </div>
                            </div>
                            <div className="relative flex-shrink-0 mt-1">
                                <input type="date" value={date} onChange={handleDateInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <button className="h-8 px-2.5 rounded-full bg-[#fcf2eb] flex items-center justify-center gap-1 text-[#1f1b17] pointer-events-none shadow-sm border border-[#fff8f5]">
                                    <span className="material-symbols-outlined text-[#a43073] text-[16px]">calendar_today</span>
                                    <span className="font-['Quicksand'] font-bold text-[11px]">{formatBR(date)}</span>
                                    <span className="material-symbols-outlined text-[#87717a] text-[14px]">expand_more</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Arquétipos (Máx 3)</label>
                            <div className="grid grid-rows-3 grid-flow-col gap-2 py-1 overflow-x-auto no-scrollbar pb-2 w-full auto-cols-max">
                                {archetypeOpts.map(opt => {
                                    const active = archetypes.includes(opt);
                                    return <button key={opt} onClick={() => {
                                        if (active) setArchetypes(archetypes.filter(a => a !== opt));
                                        else if (archetypes.length < 3) setArchetypes([...archetypes, opt]);
                                    }} className={`h-8 px-3 rounded-full font-['Quicksand'] font-bold text-[11px] flex items-center justify-center transition-all flex-shrink-0 ${active ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                        {opt}
                                    </button>
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ENERGIA & HUMOR */}
                    <section className="w-full bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center justify-start gap-2 w-full">
                            <img src="https://cdn-icons-png.flaticon.com/512/16725/16725843.png" className="w-8 h-8 drop-shadow-sm" alt="Energia" />
                                <h3 className="font-['Quicksand'] font-semibold text-[17px]">Nível de Energia</h3>
                            </div>
                            {energy === '100' && <span className="text-[13px] text-[#006c4b] font-bold">100% Turbinada</span>}
                            {energy === '50' && <span className="text-[13px] text-[#7b41b4] font-bold">50% Cansadinho</span>}
                            {energy === '0' && <span className="text-[13px] text-[#a43073] font-bold">0% Bateria Fraca</span>}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setEnergy('100')} className={`min-h-[46px] px-2 py-1.5 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex flex-col items-center justify-center transition-all ${isEnergy('100') ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                <span>⚡ 100%</span>
                            </button>
                            <button onClick={() => setEnergy('50')} className={`min-h-[46px] px-2 py-1.5 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex flex-col items-center justify-center transition-all ${isEnergy('50') ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                <span>🔋 50%</span>
                            </button>
                            <button onClick={() => setEnergy('0')} className={`min-h-[46px] px-2 py-1.5 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex flex-col items-center justify-center transition-all ${isEnergy('0') ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                <span>🪫 0%</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-2 mt-1">
                            <h4 className="font-['Quicksand'] font-bold text-[15px]">Humor do Dia</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setMood('Animado')} className={`min-h-[52px] p-3 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex items-center justify-center gap-2.5 transition-all ${mood==='Animado'?'bg-[#a43073] text-white shadow-sm':'bg-[#fcf2eb] text-[#544249]'}`}><span className="text-xl">✨</span> Animado</button>
                                <button onClick={() => setMood('Normal')} className={`min-h-[52px] p-3 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex items-center justify-center gap-2.5 transition-all ${mood==='Normal'?'bg-[#a43073] text-white shadow-sm':'bg-[#fcf2eb] text-[#544249]'}`}><span className="text-xl">🐾</span> Normal</button>
                                <button onClick={() => setMood('Sonolento')} className={`min-h-[52px] p-3 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex items-center justify-center gap-2.5 transition-all ${mood==='Sonolento'?'bg-[#a43073] text-white shadow-sm':'bg-[#fcf2eb] text-[#544249]'}`}><span className="text-xl">💤</span> Sonolento</button>
                                <button onClick={() => setMood('Agitado')} className={`min-h-[52px] p-3 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex items-center justify-center gap-2.5 transition-all ${mood==='Agitado'?'bg-[#a43073] text-white shadow-sm':'bg-[#fcf2eb] text-[#544249]'}`}><span className="text-xl">⚡</span> Agitado</button>
                            </div>
                        </div>
                    </section>

                    {/* DESTAQUES */}
                    <section className="w-full bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-start gap-2 w-full">
                            <img src="https://cdn-icons-png.flaticon.com/512/2107/2107957.png" className="w-8 h-8 drop-shadow-sm" alt="Estrelinha" />
                            <h3 className="font-['Quicksand'] font-semibold text-[17px]">Estrelinha do Dia</h3>
                        </div>
                        <div className="grid grid-rows-3 grid-flow-col gap-2 py-1 overflow-x-auto no-scrollbar pb-2 w-full auto-cols-max">
                            {achievementOpts.map(opt => {
                                const active = achievements.includes(opt);
                                return <button key={opt} onClick={() => toggleArray(achievements, opt, setAchievements)} className={`h-9 px-3.5 rounded-full font-['Quicksand'] font-bold text-[13px] flex items-center justify-center gap-1.5 transition-all flex-shrink-0 ${active ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                    ⭐ {opt}
                                </button>
                            })}
                        </div>
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Melhor Amigo de Hoje</label>
                            <div className="relative flex items-center">
                                <span className="material-symbols-outlined absolute left-3 text-[#a43073] text-[20px]">favorite</span>
                                <input value={bestFriend} onChange={e=>setBestFriend(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-2xl bg-[#fcf2eb] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#a43073]" placeholder="Com quem brinquei hoje?" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Atividade Favorita</label>
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 w-full whitespace-nowrap">
                                {activityOpts.map(opt => {
                                    const active = favoriteActivity === opt;
                                    return <button key={opt} onClick={() => setFavoriteActivity(active ? null : opt)} className={`h-10 px-3.5 rounded-2xl font-['Quicksand'] font-bold text-[13px] flex items-center justify-center gap-2 transition-all flex-shrink-0 ${active ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                        {opt}
                                    </button>
                                })}
                            </div>
                        </div>
                    </section>

                    {/* COMPORTAMENTO */}
                    <section className="w-full bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-start gap-2 w-full">
                            <img src="https://cdn-icons-png.flaticon.com/512/4117/4117609.png" className="w-8 h-8 drop-shadow-sm" alt="Comportamento" />
                            <h3 className="font-['Quicksand'] font-semibold text-[17px]">Comportamento & Vibe</h3>
                        </div>
                        <div className="flex flex-col gap-2 p-3 bg-[#fcf2eb] rounded-2xl">
                            <div className="flex items-center justify-between font-['Quicksand'] font-bold text-[11px] text-[#544249]">
                                <span>😇 (1)</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-[#ffd8e7] text-[#a43073] text-center">{behavior} - {getBehaviorLabel(behavior)}</span>
                                <span>(5) 🌪️</span>
                            </div>
                            <input type="range" min="1" max="5" value={behavior} onChange={e => setBehavior(Number(e.target.value))} className="w-full h-2 rounded-lg bg-[#f0e6e0] appearance-none cursor-pointer accent-[#a43073]" />
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Socialização & Bem-Estar</label>
                            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 w-full whitespace-nowrap">
                                {socialOpts.map(opt => {
                                    const active = socialTags.includes(opt);
                                    return <button key={opt} onClick={() => toggleArray(socialTags, opt, setSocialTags)} className={`h-8 px-3 rounded-full font-['Quicksand'] font-bold text-[11px] flex items-center justify-center transition-all flex-shrink-0 ${active ? 'bg-[#a43073] text-white shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}`}>
                                        {opt}
                                    </button>
                                })}
                            </div>
                        </div>
                    </section>

                    {/* ROTINA */}
                    <section className="w-full bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-start gap-2 w-full">
                            <img src="https://cdn-icons-png.flaticon.com/512/3170/3170733.png" className="w-8 h-8 drop-shadow-sm" alt="Rotina" />
                            <h3 className="font-['Quicksand'] font-semibold text-[17px]">Rotina Básica</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-['Quicksand'] font-bold text-[13px]">Alimentação / Ração</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Comeu tudo', 'Comeu pouco', 'Não comeu'].map(opt => (
                                    <button key={opt} onClick={() => setFeeding(opt as any)} className={`min-h-[48px] p-2 flex items-center justify-center text-center rounded-2xl font-['Quicksand'] font-bold text-[13px] transition-all ${feeding===opt?'bg-[#a43073] text-white shadow-sm':'bg-[#f6ece6] text-[#544249]'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px]">Necessidades Fisiológicas</label>
                            <div className="flex flex-col gap-1.5">
                                <span className="font-['Quicksand'] font-bold text-[11px] text-[#544249] flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-[#7b41b4]">water_drop</span> Xixi</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Lugar Certo', 'No Passeio', 'Errou o Alvo'].map(opt => (
                                        <button key={opt} onClick={() => setPee(opt)} className={`min-h-[44px] px-2 py-1.5 flex items-center justify-center text-center rounded-2xl font-['Quicksand'] font-bold text-[11px] transition-all ${pee===opt?'bg-[#a43073] text-white shadow-sm':'bg-[#f6ece6] text-[#544249]'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-2">
                                <span className="font-['Quicksand'] font-bold text-[11px] text-[#544249] flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-[#a43073]">check_circle</span> Cocô</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Tudo Normal', 'Meio Solto', 'Não Fez'].map(opt => (
                                        <button key={opt} onClick={() => setPoop(opt)} className={`min-h-[44px] px-2 py-1.5 flex items-center justify-center text-center rounded-2xl font-['Quicksand'] font-bold text-[11px] transition-all ${poop===opt?'bg-[#a43073] text-white shadow-sm':'bg-[#f6ece6] text-[#544249]'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px]">Momento Soneca</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Dormiu bastante', 'Cochilinho', 'No 220v'].map(opt => (
                                    <button key={opt} onClick={() => setNap(opt)} className={`min-h-[44px] px-2 py-1 flex items-center justify-center text-center rounded-2xl font-['Quicksand'] font-bold text-[11px] transition-all ${nap===opt?'bg-[#a43073] text-white shadow-sm':'bg-[#f6ece6] text-[#544249]'}`}>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* RECADINHO & MIDIA */}
                    <section className="w-full bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-start gap-2 w-full">
                            <img src="https://cdn-icons-png.flaticon.com/512/1042/1042390.png" className="w-8 h-8 drop-shadow-sm" alt="Midia" />
                            <h3 className="font-['Quicksand'] font-semibold text-[17px]">Mídias & Recadinho</h3>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Recadinho da Sandy</label>
                            <div className="relative">
                                <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={5} className="w-full p-3 pb-12 rounded-2xl bg-[#fcf2eb] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#a43073] resize-none" placeholder={`Ex: ${enrollment.pet_name} foi super carinhoso(a) hoje...`}></textarea>
                                <button onClick={handleGenerateAI} disabled={isGenerating} className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white h-8 px-3 rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-all disabled:opacity-50 z-10">
                                    {isGenerating ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="font-['Quicksand'] font-bold text-[12px] flex items-center gap-1">✨ IA</span>}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Fotos do Dia</label>
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                                {existingMediaUrls.map((url, i) => (
                                    <div key={url} className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                                        <img src={url} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                                {mediaPreviews.map((url, i) => (
                                    <div key={url} className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <button onClick={() => removeSelectedMedia(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">×</button>
                                    </div>
                                ))}
                                <label className="w-28 h-24 rounded-2xl flex-shrink-0 bg-[#ffd8e7]/40 hover:bg-[#ffd8e7] border-2 border-dashed border-[#a43073]/40 flex flex-col items-center justify-center justify-center gap-1 text-[#a43073] cursor-pointer transition-all">
                                    <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                                    <span className="font-['Quicksand'] font-bold text-[11px] text-center">Adicionar Foto</span>
                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAddMedia} />
                                </label>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <aside className="fixed bottom-0 w-full z-50 pb-safe bg-[#fff8f5]/90 backdrop-blur-xl border-t border-[#f0e6e0]">
                <div className="h-20 px-4 flex items-center justify-center max-w-lg mx-auto">
                    <button onClick={saveDiary} disabled={saving} className="w-full h-[52px] bg-[#a43073] hover:bg-[#85145a] text-white font-['Quicksand'] font-semibold text-[17px] rounded-full flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                        {saving ? <span className="animate-spin text-xl">⏳</span> : <span className="material-symbols-outlined text-[22px]">check_circle</span>}
                        {saving ? 'Salvando...' : 'Salvar Diário'}
                    </button>
                </div>
            </aside>
        </div>
    );
};
export default DaycareDiaryPage;
