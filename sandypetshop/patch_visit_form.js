const fs = require('fs');

let content = fs.readFileSync('App.tsx', 'utf8');

// The outer wrapper replacement:
const oldOuter = `<div className="fixed inset-0 z-[100] bg-white sm:bg-[#fff0f5] animate-slideUpFull flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: \`
                .date-input-placeholder-override::-webkit-datetime-edit-text,
                .date-input-placeholder-override::-webkit-datetime-edit-month-field,
                .date-input-placeholder-override::-webkit-datetime-edit-day-field,
                .date-input-placeholder-override::-webkit-datetime-edit-year-field {
                    color: #9ca3af !important;
                }
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-text,
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-month-field,
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-day-field,
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-year-field {
                    color: #111827 !important;
                }
            \`}} />
            {/* Orbs decorativos - visible only on desktop */}
            <div className="hidden sm:block absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-bl from-pink-200/40 via-rose-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="hidden sm:block absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-gradient-to-tr from-orange-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            {/* Área de rolagem isolada */}
            <div className="absolute inset-0 overflow-y-auto sm:py-8 bg-white sm:bg-transparent">
                <main className="relative w-full max-w-3xl mx-auto px-0 sm:px-6">
                    <div className="bg-white w-full min-h-screen sm:min-h-0 sm:rounded-[2.5rem] shadow-none sm:shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] overflow-hidden border-0 sm:border border-pink-100/60 flex flex-col">
                        <form onSubmit={handleSubmit} className="relative p-6 sm:p-8 pt-10 sm:pt-8 flex flex-col flex-1 transition-all duration-300 animate-slideInFromRight">
                            {/* Botão de voltar premium padronizado no canto superior esquerdo */}
                            <button
                                type="button"
                                onClick={onBack}
                                className="absolute top-6 left-4 z-[110] flex items-center justify-center w-10 h-10 bg-pink-50 text-pink-700 font-bold rounded-full shadow-sm hover:bg-pink-100 hover:shadow-md transition-all duration-300"
                                title="Voltar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                            </button>

                            <div className="space-y-7 border-b border-gray-100 pb-8 pl-0 sm:pl-14">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight tracking-tight pl-12 sm:pl-0">Informações do Pet e Dono</h2>`;

const newOuter = `<div className="fixed inset-0 z-[100] bg-white sm:bg-[#fff0f5] animate-slideUpFull flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: \`
                .date-input-placeholder-override::-webkit-datetime-edit-text,
                .date-input-placeholder-override::-webkit-datetime-edit-month-field,
                .date-input-placeholder-override::-webkit-datetime-edit-day-field,
                .date-input-placeholder-override::-webkit-datetime-edit-year-field {
                    color: #9ca3af !important;
                }
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-text,
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-month-field,
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-day-field,
                .date-input-placeholder-override.has-value::-webkit-datetime-edit-year-field {
                    color: #111827 !important;
                }
            \`}} />
            {/* Orbs decorativos - visible only on desktop */}
            <div className="hidden sm:block absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-bl from-pink-200/40 via-rose-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="hidden sm:block absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-gradient-to-tr from-orange-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            {/* Área de rolagem isolada */}
            <div className="absolute inset-0 overflow-y-auto pt-2 sm:pt-4 pb-8">
                <main className="relative w-full max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="bg-white/60 backdrop-blur-xl rounded-t-[0] sm:rounded-[2rem] rounded-b-[2rem] shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] overflow-hidden border border-pink-100/60 min-h-screen sm:min-h-0">
                        <form onSubmit={handleSubmit} className="relative p-6 sm:p-8 transition-all duration-300 animate-slideInFromRight">
                            {/* Botão voltar premium */}
                            <button
                                type="button"
                                onClick={onBack}
                                className="absolute top-6 left-2 sm:top-8 sm:left-4 z-[110] flex items-center justify-center w-10 h-10 bg-pink-50 text-pink-700 font-bold rounded-full shadow-sm hover:bg-pink-100 hover:shadow-md transition-all duration-300"
                                title="Voltar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                            </button>

                            <div className="mb-8 flex flex-col items-center justify-center min-h-[48px] animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <SafeImage src="https://cdn-icons-png.flaticon.com/512/11201/11201086.png" alt={serviceLabel} className="w-10 h-10 rounded-full object-contain" />
                                    <span className="text-2xl font-extrabold text-pink-950">{serviceLabel}</span>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {/* DADOS DO TUTOR */}
                                <div className="space-y-8 border-b border-pink-50 pb-12">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Dados do Tutor</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2">
                                            <label htmlFor="ownerName" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Nome Completo</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="User Icon" className="h-4 w-4 opacity-60" src="https://cdn-icons-png.flaticon.com/512/15494/15494722.png" />
                                                </span>
                                                <input id="ownerName" required value={ownerName} onChange={e => setOwnerName(e.target.value)} className="block w-full pl-12 pr-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all" type="text" placeholder="Nome completo" />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="whatsapp" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">WhatsApp</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="WhatsApp Icon" className="h-4 w-4 opacity-60" src="https://cdn-icons-png.flaticon.com/512/14051/14051811.png" />
                                                </span>
                                                <input id="whatsapp" required value={whatsapp} onChange={e => setWhatsapp(formatWhatsapp(e.target.value))} placeholder="(XX) XXXXX-XXXX" maxLength={15} className="block w-full pl-12 pr-10 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all" type="tel" />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="ownerAddress" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Endereço (Opcional)</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="Map Pin Icon" className="h-6 w-6 opacity-60" src="https://cdn-icons-png.flaticon.com/512/854/854878.png" />
                                                </span>
                                                <input id="ownerAddress" value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)} className="block w-full pl-12 pr-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all" type="text" placeholder="Rua, número, complemento" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* DADOS DO PET */}
                                <div className="space-y-8 border-b border-pink-50 pb-12">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Dados do Pet</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label htmlFor="petName" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Nome do Pet</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="Pet Icon" className="h-4 w-4 opacity-60" src="https://static.thenounproject.com/png/pet-icon-6939415-512.png" />
                                                </span>
                                                <input id="petName" required value={petName} onChange={e => setPetName(e.target.value)} className="block w-full pl-12 pr-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all" type="text" placeholder="Nome do seu pet" />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="petBreed" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Raça</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="Breed Icon" className="h-7 w-7 opacity-60" src="https://cdn-icons-png.flaticon.com/512/616/616408.png" />
                                                </span>
                                                <input id="petBreed" value={petBreed} onChange={e => setPetBreed(e.target.value)} className="block w-full pl-12 pr-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all" type="text" placeholder="Raça do seu pet (ex: Poodle)" />
                                            </div>
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label htmlFor="observation" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Observações Especiais (Opcional)</label>
                                            <div className="relative">
                                                <textarea id="observation" value={observation} onChange={e => setObservation(e.target.value)} className="block w-full px-6 py-5 bg-pink-50/50 border-2 border-pink-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all min-h-[120px] resize-y" placeholder="Ex: alergias, cuidados médicos, rotinas alimentares..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AGENDAMENTO */}
                                <div className="space-y-8 pb-4">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Agendamento</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Data</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="Date Icon" className="h-5 w-5 opacity-60" src="https://cdn-icons-png.flaticon.com/512/10754/10754041.png" />
                                                </span>
                                                <input id="date" type="date" required min={new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())} value={date} onChange={e => handleDateChange(e.target.value)} className={\`block w-full pl-12 pr-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all date-input-placeholder-override \${date ? 'has-value' : ''}\`} />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="time" className="block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3">Horário</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage alt="Time Icon" className="h-5 w-5 opacity-60" src="https://cdn-icons-png.flaticon.com/512/10754/10754020.png" />
                                                </span>
                                                <select id="time" required value={time} onChange={e => setTime(Number(e.target.value))} className="block w-full pl-12 pr-10 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all appearance-none">
                                                    <option value="" disabled>Selecione um horário</option>
                                                    {VISIT_WORKING_HOURS.map(h => (<option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>))}
                                                </select>
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-pink-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="pt-8">
                                    <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1">
                                        {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>
        </div>`;

const startIndex = content.indexOf(oldOuter.substring(0, 100));
const endIndex = content.indexOf('</main>', startIndex) + '</main>\n            </div>\n        </div>'.length;

if (startIndex > -1 && endIndex > startIndex) {
    const sectionToReplace = content.substring(startIndex, endIndex);
    if (sectionToReplace.includes('Informações do Pet e Dono')) {
        content = content.replace(sectionToReplace, newOuter);
        fs.writeFileSync('App.tsx', content, 'utf8');
        console.log('Successfully patched VisitAppointmentForm JSX');
    } else {
        console.error('Text block to replace not found correctly (did not contain Informações)');
    }
} else {
    console.error('Indices not found:', startIndex, endIndex);
}
