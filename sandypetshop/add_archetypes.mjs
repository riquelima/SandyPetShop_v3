import fs from 'fs';

let content = fs.readFileSync('src/components/DaycareDiaryPage.tsx', 'utf-8');

// 1. State
content = content.replace(
    'const [socialTags, setSocialTags] = useState<string[]>([]);',
    'const [socialTags, setSocialTags] = useState<string[]>([]);\n    const [archetypes, setArchetypes] = useState<string[]>([]);'
);

// 2. Load
content = content.replace(
    'const loadedAchievements: string[] = [];\n                    const loadedTags: string[] = [];',
    'const loadedAchievements: string[] = [];\n                    const loadedTags: string[] = [];\n                    const loadedArchetypes: string[] = [];'
);

content = content.replace(
    "else if (note.startsWith('🏷️ Social: ')) loadedTags.push(note.replace('🏷️ Social: ', ''));",
    "else if (note.startsWith('🏷️ Social: ')) loadedTags.push(note.replace('🏷️ Social: ', ''));\n                        else if (note.startsWith('🎭 Arquétipo: ')) loadedArchetypes.push(note.replace('🎭 Arquétipo: ', ''));"
);

content = content.replace(
    'setAchievements(loadedAchievements);\n                    setSocialTags(loadedTags);',
    'setAchievements(loadedAchievements);\n                    setSocialTags(loadedTags);\n                    setArchetypes(loadedArchetypes);'
);

// clear on no entry
content = content.replace(
    "setEnergy(null); setAchievements([]); setBestFriend(''); setFavoriteActivity(null); setSocialTags([]);",
    "setEnergy(null); setAchievements([]); setBestFriend(''); setFavoriteActivity(null); setSocialTags([]); setArchetypes([]);"
);

// 3. Save
content = content.replace(
    '...socialTags.map(t => `🏷️ Social: ${t}`)',
    '...socialTags.map(t => `🏷️ Social: ${t}`),\n                ...archetypes.map(a => `🎭 Arquétipo: ${a}`)'
);

// 4. Options
content = content.replace(
    "const socialOpts = ['Brincou com outros', 'Relaxado', 'Ficou quieto', 'Hiperativo', 'Um pouco tímido'];",
    "const socialOpts = ['Brincou com outros', 'Relaxado', 'Ficou quieto', 'Hiperativo', 'Um pouco tímido'];\n    const archetypeOpts = ['🛋️ Batata de Sofá', '🧸 Grude / Carente', '🎾 Fissurado em Bolinha', '🕵️ Curioso / Explorador', '🛡️ Segurança do Bairro', '🫣 Tímido / Desconfiado', '👑 Rei/Rainha do Pedaço'];"
);

// 5. UI Render - Under Socialização & Bem Estar
const newUI = `                        <div className="flex flex-col gap-2 mt-2">
                            <label className="font-['Quicksand'] font-bold text-[13px] text-[#544249]">Arquétipos (Máx 3)</label>
                            <div className="grid grid-rows-3 grid-flow-col gap-2 py-1 overflow-x-auto no-scrollbar pb-2 w-full auto-cols-max">
                                {archetypeOpts.map(opt => {
                                    const active = archetypes.includes(opt);
                                    return <button key={opt} onClick={() => {
                                        if (active) setArchetypes(archetypes.filter(a => a !== opt));
                                        else if (archetypes.length < 3) setArchetypes([...archetypes, opt]);
                                    }} className={\`h-8 px-3 rounded-full font-['Quicksand'] font-bold text-[11px] flex items-center justify-center transition-all flex-shrink-0 \${active ? 'bg-[#ffd8e7] text-[#a43073] shadow-sm' : 'bg-[#f6ece6] text-[#544249]'}\`}>
                                        {opt}
                                    </button>
                                })}
                            </div>
                        </div>
                    </section>`;

content = content.replace(
    '                        </div>\n                    </section>',
    '                        </div>\n' + newUI
);

fs.writeFileSync('src/components/DaycareDiaryPage.tsx', content);
