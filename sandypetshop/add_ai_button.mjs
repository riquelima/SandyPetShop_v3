import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// 1. Add State
content = content.replace(
    'const [isExiting, setIsExiting] = useState(false);',
    'const [isExiting, setIsExiting] = useState(false);\n    const [isGenerating, setIsGenerating] = useState(false);'
);

// 2. Add handleGenerateAI
const aiFunction = `
    const handleGenerateAI = async () => {
        setIsGenerating(true);
        try {
            const apiKey = import.meta.env.MINIMAX_API_KEY || import.meta.env.VITE_MINIMAX_API_KEY;
            if (!apiKey) {
                alert('Chave da API do Minimax (MINIMAX_API_KEY) não configurada no ambiente.');
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

            const prompt = \`Escreva um recadinho carinhoso, fofo e curto (máximo de 3 parágrafos) sobre o dia do pet \${enrollment.pet_name} na creche.
Use as seguintes informações do dia dele:
Energia: \${data.energy}%
Humor: \${data.mood}
Arquétipos da vibe: \${data.archetypes}
Estrelinhas (Destaques): \${data.achievements}
Socialização: \${data.social}
Atividade Favorita: \${data.activity}
Soneca: \${data.nap}
Alimentação: \${data.feeding}
Xixi: \${data.pee} / Cocô: \${data.poop}

\${obs ? \`O administrador também rascunhou o seguinte texto: "\${obs}". Integre essa ideia no texto de forma criativa, fluida e melhorada.\` : ''}

Seja natural, use alguns emojis e demonstre carinho. Finalize assinando como "Tia Sandy".\`;

            const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': \`Bearer \${apiKey}\`
                },
                body: JSON.stringify({
                    model: 'abab6.5s-chat',
                    messages: [
                        { role: 'system', content: 'Você é a Tia Sandy, uma cuidadora super amorosa de pets em uma creche. Você escreve resumos fofos e divertidos sobre o dia do cãozinho para enviar aos tutores.' },
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
`;
content = content.replace('    const formatBR = (d: string) => {', aiFunction);

// 3. UI Replacement
content = content.replace(
    '<textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3} className="w-full p-3 rounded-2xl bg-[#fcf2eb] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#a43073] resize-none" placeholder="Ex: A Chiara foi super carinhosa hoje..."></textarea>',
    `<div className="relative">
                                <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={5} className="w-full p-3 pb-12 rounded-2xl bg-[#fcf2eb] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#a43073] resize-none" placeholder={\`Ex: \${enrollment.pet_name} foi super carinhoso(a) hoje...\`}></textarea>
                                <button onClick={handleGenerateAI} disabled={isGenerating} className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white h-8 px-3 rounded-xl flex items-center justify-center shadow-md hover:scale-105 transition-all disabled:opacity-50 z-10">
                                    {isGenerating ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="font-['Quicksand'] font-bold text-[12px] flex items-center gap-1">✨ IA</span>}
                                </button>
                            </div>`
);

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
