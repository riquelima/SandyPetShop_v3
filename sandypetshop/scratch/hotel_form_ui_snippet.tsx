    const inputClass = "block w-full px-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all";
    const inputWithIconClass = "block w-full pl-12 pr-5 py-4 bg-pink-50/50 border-2 border-pink-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-200 focus:border-pink-400 text-pink-950 font-medium transition-all";
    const labelClass = "block text-sm font-bold text-pink-900 uppercase tracking-widest mb-3";

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (setView) {
            setView('scheduler');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#fff0f5] animate-slideUpFull">
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-bl from-pink-200/40 via-rose-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-gradient-to-tr from-orange-100/30 via-pink-100/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

            <div className="absolute inset-0 overflow-y-auto pt-2 sm:pt-4 pb-8">
                <main className="relative w-full max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="bg-white/60 backdrop-blur-xl rounded-t-[0] sm:rounded-[2rem] rounded-b-[2rem] shadow-[0_20px_60px_-15px_rgba(236,72,153,0.15)] overflow-hidden border border-pink-100/60 min-h-screen sm:min-h-0">
                        <form ref={formRef} onSubmit={handleSubmit} className="relative p-6 sm:p-8 transition-all duration-300 animate-slideInFromRight">

                            {isAdmin && (
                                <div className="flex justify-between items-center mb-6 border-b border-pink-100 pb-4">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-semibold flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                        </svg>
                                        Voltar para Hotel
                                    </button>
                                    <span className="text-xs font-bold uppercase tracking-wider bg-pink-100 text-pink-700 px-3 py-1 rounded-full">Admin Mode</span>
                                </div>
                            )}

                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="absolute top-6 left-2 sm:top-8 sm:left-4 z-[110] flex items-center justify-center w-10 h-10 bg-pink-50 text-pink-700 font-bold rounded-full shadow-sm hover:bg-pink-100 hover:shadow-md transition-all duration-300"
                                    title="Voltar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                </button>
                            )}

                            <div className="mb-8 flex flex-col items-center justify-center min-h-[48px] animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <SafeImage src="https://cdn-icons-png.flaticon.com/512/3009/3009489.png" alt="Hotel Pet" className="w-10 h-10 rounded-full object-contain" />
                                    <span className="text-2xl font-extrabold text-pink-950">Hotel Pet</span>
                                </div>
                            </div>

                            <div className="space-y-10">
                                {/* FOTO DO PET + DADOS DO TUTOR */}
                                <div className="space-y-8 border-b border-pink-50 pb-12">
                                    <div className="flex flex-col items-center justify-center mb-2">
                                        <label htmlFor="hotel-pet-photo-upload" className="relative group cursor-pointer" title="Adicionar foto do pet">
                                            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center transition-all group-hover:scale-105 group-hover:shadow-xl">
                                                {formData.pet_photo_url ? (
                                                    <img src={formData.pet_photo_url} alt="Foto do pet" className="w-full h-full object-cover" />
                                                ) : (
                                                    <LottieAnimation
                                                        src="https://lottie.host/ee823306-d890-4936-8032-f1bae7614d82/A1LpnduBwz.json"
                                                        style={{ width: '100%', height: '100%' }}
                                                    />
                                                )}
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-pink-600 border-4 border-white shadow-md flex items-center justify-center group-hover:bg-pink-700 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 text-white">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                id="hotel-pet-photo-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => {
                                                        const dataUrl = ev.target?.result as string;
                                                        setFormData(prev => ({ ...prev, pet_photo_url: dataUrl }));
                                                    };
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                        </label>
                                        <p className="mt-3 text-xs sm:text-sm text-pink-700 font-bold uppercase tracking-wider">
                                            {formData.pet_photo_url ? 'Foto carregada com sucesso' : 'Adicione a foto do seu pet'}
                                        </p>
                                        {formData.pet_photo_url && (
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, pet_photo_url: null }))}
                                                className="mt-1 text-[11px] font-bold text-pink-500 hover:text-pink-700 underline underline-offset-2"
                                            >
                                                Remover foto
                                            </button>
                                        )}
                                    </div>

                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Dados do Tutor</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>WhatsApp</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4"><WhatsAppIcon /></span>
                                                <input type="tel" name="tutor_phone" value={formData.tutor_phone} onChange={handleInputChange} required placeholder="(XX) XXXXX-XXXX" className={inputWithIconClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Nome Completo</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4"><UserIcon /></span>
                                                <input type="text" name="tutor_name" value={formData.tutor_name} onChange={handleInputChange} required className={inputWithIconClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Endereço Residencial</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4"><AddressIcon /></span>
                                                <input type="text" name="tutor_address" value={formData.tutor_address} onChange={handleInputChange} required className={inputWithIconClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>RG</label>
                                            <input type="text" name="tutor_rg" value={formData.tutor_rg} onChange={handleInputChange} required className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>CPF/CNPJ (Fiscal)</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                                                    <SafeImage src="https://cdn-icons-png.flaticon.com/512/9881/9881335.png" alt="CPF/CNPJ Icon" className="h-4 w-4 opacity-60" />
                                                </span>
                                                <input type="text" name="owner_cpf" value={formData.owner_cpf || ''} onChange={handleInputChange} className={inputWithIconClass} placeholder="000.000.000-00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Email</label>
                                            <input type="email" name="tutor_email" value={formData.tutor_email} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Rede Social (Instagram)</label>
                                            <input type="text" name="tutor_social_media" value={formData.tutor_social_media || ''} onChange={handleInputChange} className={inputClass} placeholder="@perfil" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Contato de Emergência</label>
                                            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Tel. Emergência</label>
                                            <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Relação com o Pet</label>
                                            <input type="text" name="emergency_contact_relation" value={formData.emergency_contact_relation} onChange={handleInputChange} className={inputClass} placeholder="Ex: Tia, Vizinho..." />
                                        </div>
                                    </div>
                                </div>

                                {/* DADOS DO PET */}
                                <div className="space-y-8 border-b border-pink-50 pb-12">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Dados do Pet</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className={labelClass}>Nome do Pet</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4"><PawIcon /></span>
                                                <input type="text" name="pet_name" value={formData.pet_name} onChange={handleInputChange} required className={inputWithIconClass} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Raça</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"><BreedIcon /></span>
                                                <select
                                                    value={isOtherBreed ? "Outra" : formData.pet_breed}
                                                    onChange={(e) => {
                                                        if (e.target.value === "Outra") {
                                                            setIsOtherBreed(true);
                                                            setFormData(prev => ({ ...prev, pet_breed: '' }));
                                                        } else {
                                                            setIsOtherBreed(false);
                                                            setFormData(prev => ({ ...prev, pet_breed: e.target.value }));
                                                        }
                                                    }}
                                                    required
                                                    className={`${inputWithIconClass} appearance-none cursor-pointer pr-10`}
                                                >
                                                    <option value="">Selecione a Raça</option>
                                                    {POPULAR_BREEDS.map(breed => (
                                                        <option key={breed} value={breed}>{breed}</option>
                                                    ))}
                                                    <option value="Outra">Outra raça...</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-pink-400">
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {isOtherBreed && (
                                                <div className="relative mt-3 animate-fadeIn">
                                                    <input type="text" name="pet_breed" placeholder="Digite a raça do seu pet" value={formData.pet_breed} onChange={handleInputChange} required className="block w-full px-5 py-3 bg-white border-2 border-pink-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-200 text-pink-950 font-medium transition-all" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Idade</label>
                                            <input type="text" name="pet_age" value={formData.pet_age} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Peso do Pet</label>
                                            <select name="pet_weight" value={formData.pet_weight || ''} onChange={handleInputChange} className={`${inputClass} appearance-none cursor-pointer`}>
                                                <option value="">Selecione o peso</option>
                                                {(Object.keys(PET_WEIGHT_OPTIONS) as PetWeight[]).map(key => (
                                                    <option key={key} value={key}>{PET_WEIGHT_OPTIONS[key]}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Tel. Veterinário</label>
                                            <input type="tel" name="vet_phone" value={formData.vet_phone || ''} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Nome Veterinário</label>
                                            <input type="text" name="veterinarian" value={(formData as any).veterinarian || ''} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Sexo</label>
                                            <div className="flex gap-6 mt-2">
                                                {[{ label: 'Macho', value: 'Macho' }, { label: 'Fêmea', value: 'Fêmea' }].map(option => (
                                                    <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input type="radio" name="pet_sex" value={option.value} checked={formData.pet_sex === option.value} onChange={() => handleRadioChange('pet_sex', option.value)} className="sr-only" />
                                                            <div className={`w-6 h-6 rounded-full border-2 transition-all ${formData.pet_sex === option.value ? 'border-pink-600 bg-pink-600' : 'border-pink-200 bg-white group-hover:border-pink-400'}`}>
                                                                {formData.pet_sex === option.value && <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>}
                                                            </div>
                                                        </div>
                                                        <span className={`text-lg font-medium ${formData.pet_sex === option.value ? 'text-pink-900' : 'text-pink-800/60'}`}>{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Castrado?</label>
                                            <div className="flex gap-6 mt-2">
                                                {[{ label: 'Sim', value: true }, { label: 'Não', value: false }].map(option => (
                                                    <label key={String(option.value)} className="flex items-center gap-3 cursor-pointer group">
                                                        <div className="relative flex items-center justify-center">
                                                            <input type="radio" name="is_neutered" checked={formData.is_neutered === option.value} onChange={() => handleRadioChange('is_neutered', option.value)} className="sr-only" />
                                                            <div className={`w-6 h-6 rounded-full border-2 transition-all ${formData.is_neutered === option.value ? 'border-pink-600 bg-pink-600' : 'border-pink-200 bg-white group-hover:border-pink-400'}`}>
                                                                {formData.is_neutered === option.value && <div className="w-2.5 h-2.5 bg-white rounded-full absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"></div>}
                                                            </div>
                                                        </div>
                                                        <span className={`text-lg font-medium ${formData.is_neutered === option.value ? 'text-pink-900' : 'text-pink-800/60'}`}>{option.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SAÚDE E COMPORTAMENTO */}
                                <div className="space-y-10 border-b border-pink-50 pb-12">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-pink-950 tracking-tight">Saúde e Comportamento</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {[
                                            { label: 'Doença pré-existente?', state: hasPreexistingDisease, setState: setHasPreexistingDisease, field: 'preexisting_disease' as const },
                                            { label: 'Possui Alergias?', state: hasAllergies, setState: setHasAllergies, field: 'allergies' as const },
                                            { label: 'Comportamento especial?', state: hasBehavior, setState: setHasBehavior, field: 'behavior' as const },
                                            { label: 'Medos/Traumas?', state: hasFearsTraumas, setState: setHasFearsTraumas, field: 'fears_traumas' as const },
                                            { label: 'Feridas/Marcas?', state: hasWoundsMarks, setState: setHasWoundsMarks, field: 'wounds_marks' as const },
                                        ].map(field => (
                                            <div key={field.field} className="space-y-4">
                                                <label className="block text-sm font-bold text-pink-900 uppercase tracking-widest">{field.label}</label>
                                                <div className="flex gap-4">
                                                    {[true, false].map(option => {
                                                        const isSelected = field.state === option;
                                                        return (
                                                            <button
                                                                key={String(option)}
                                                                type="button"
                                                                onClick={() => {
                                                                    field.setState(option);
                                                                    if (!option) setFormData(prev => ({ ...prev, [field.field]: null }));
                                                                }}
                                                                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${isSelected ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'bg-white text-pink-900 border-pink-100 hover:border-pink-300 hover:bg-pink-50'}`}
                                                            >
                                                                {option ? 'Sim' : 'Não'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {(hasPreexistingDisease || hasAllergies || hasBehavior || hasFearsTraumas || hasWoundsMarks) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                                            {hasPreexistingDisease && (
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1">Descreva a doença</label>
                                                    <textarea name="preexisting_disease" value={formData.preexisting_disease || ''} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} placeholder="Ex: Diabetes, epilepsia..." />
                                                </div>
                                            )}
                                            {hasAllergies && (
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1">Descreva as alergias</label>
                                                    <textarea name="allergies" value={formData.allergies || ''} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} placeholder="Ex: Alergia a frango..." />
                                                </div>
                                            )}
                                            {hasBehavior && (
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1">Descreva o comportamento</label>
                                                    <textarea name="behavior" value={formData.behavior || ''} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} />
                                                </div>
                                            )}
                                            {hasFearsTraumas && (
                                                <div className="space-y-3">
                                                    <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1">Descreva medos/traumas</label>
                                                    <textarea name="fears_traumas" value={formData.fears_traumas || ''} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} />
                                                </div>
                                            )}
                                            {hasWoundsMarks && (
                                                <div className="space-y-3 md:col-span-2">
                                                    <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1">Feridas/Marcas</label>
                                                    <textarea name="wounds_marks" value={formData.wounds_marks || ''} onChange={handleInputChange} rows={2} className={`${inputClass} resize-none`} placeholder="Descreva e marque na foto durante o check-in" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-pink-900 uppercase tracking-widest px-1">Última Vacina</label>
                                            <DatePicker value={formData.last_vaccination_date || ''} onChange={(value) => setFormData(prev => ({ ...prev, last_vaccination_date: value }))} label="" />
                                        </div>
                                    </div>
                                </div>

                                {/* ALIMENTAÇÃO */}
                                <div className="space-y-8 border-b border-pink-50 pb-12">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Alimentação</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className={labelClass}>Marca da Ração</label>
                                            <input type="text" name="food_brand" value={formData.food_brand || ''} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Quantidade por Refeição</label>
                                            <input type="text" name="food_quantity" value={formData.food_quantity || ''} onChange={handleInputChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Frequência</label>
                                            <select name="feeding_frequency" value={formData.feeding_frequency || ''} onChange={handleInputChange} className={`${inputClass} appearance-none cursor-pointer`}>
                                                <option value="">Selecione a frequência</option>
                                                <option value="1x ao dia">1x ao dia</option>
                                                <option value="2x ao dia">2x ao dia</option>
                                                <option value="3x ao dia">3x ao dia</option>
                                                <option value="Livre demanda">Livre demanda</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className={labelClass}>Aceita petiscos?</label>
                                            <div className="flex gap-4">
                                                {['Sim', 'Não'].map(opt => {
                                                    const isSelected = (formData.accepts_treats || '') === opt;
                                                    return (
                                                        <button key={opt} type="button" onClick={() => setFormData(prev => ({ ...prev, accepts_treats: opt }))} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${isSelected ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'bg-white text-pink-900 border-pink-100 hover:border-pink-300 hover:bg-pink-50'}`}>
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className={labelClass}>Cuidado especial?</label>
                                            <div className="flex gap-4">
                                                {[true, false].map(opt => {
                                                    const isSelected = needsSpecialFoodCare === opt;
                                                    return (
                                                        <button key={String(opt)} type="button" onClick={() => { setNeedsSpecialFoodCare(opt); if (!opt) setFormData(prev => ({ ...prev, special_food_care: null })); }} className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all border-2 ${isSelected ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'bg-white text-pink-900 border-pink-100 hover:border-pink-300 hover:bg-pink-50'}`}>
                                                            {opt ? 'Sim' : 'Não'}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {needsSpecialFoodCare && (
                                            <div className="md:col-span-2 space-y-3 animate-fadeIn">
                                                <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1">Descreva o cuidado especial</label>
                                                <textarea name="special_food_care" value={formData.special_food_care || ''} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} />
                                            </div>
                                        )}
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>Observações sobre Alimentação</label>
                                            <textarea name="food_observations" value={formData.food_observations || ''} onChange={handleInputChange} rows={3} className={`${inputClass} resize-none`} />
                                        </div>
                                    </div>
                                </div>

                                {/* DATAS E HORÁRIOS */}
                                <div className="space-y-8 border-b border-pink-50 pb-12">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Datas e Horários</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1 text-center">Data Check-in</label>
                                            <DatePicker value={formData.check_in_date || ''} onChange={(value) => setFormData(prev => ({ ...prev, check_in_date: value }))} label="" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1 text-center">Data Check-out</label>
                                            <DatePicker value={formData.check_out_date || ''} onChange={(value) => setFormData(prev => ({ ...prev, check_out_date: value }))} label="" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1 text-center">Horário Check-in</label>
                                            <select name="check_in_time" value={formData.check_in_time || ''} onChange={handleInputChange} required className={inputClass}>
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: ((19 - 7) * 2) + 1 }, (_, i) => {
                                                    const h = 7 + Math.floor(i / 2);
                                                    const m = i % 2 ? '30' : '00';
                                                    const t = `${String(h).padStart(2, '0')}:${m}`;
                                                    return (<option key={t} value={t}>{t}</option>);
                                                })}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-pink-700 uppercase tracking-widest px-1 text-center">Horário Check-out</label>
                                            <select name="check_out_time" value={formData.check_out_time || ''} onChange={handleInputChange} required className={inputClass}>
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: ((19 - 7) * 2) + 1 }, (_, i) => {
                                                    const h = 7 + Math.floor(i / 2);
                                                    const m = i % 2 ? '30' : '00';
                                                    const t = `${String(h).padStart(2, '0')}:${m}`;
                                                    return (<option key={t} value={t}>{t}</option>);
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* SERVIÇOS ADICIONAIS */}
                                <div className="space-y-6 border-b border-pink-50 pb-12">
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between cursor-pointer hover:bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-100 transition-colors bg-white"
                                        onClick={() => setIsExtraServicesExpanded(!isExtraServicesExpanded)}
                                    >
                                        <h2 className="text-xl sm:text-2xl font-extrabold text-pink-950 tracking-tight">Serviços Adicionais</h2>
                                        <div className="flex items-center gap-2 text-pink-600">
                                            <span className="text-sm font-bold">{isExtraServicesExpanded ? 'Ocultar' : 'Mostrar'}</span>
                                            <svg className={`w-5 h-5 transition-transform duration-200 ${isExtraServicesExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {isExtraServicesExpanded && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 animate-fadeIn">
                                            {[
                                                { key: 'bath', label: 'Banho' },
                                                { key: 'transport', label: 'Transporte' },
                                                { key: 'vet', label: 'Veterinário' },
                                                { key: 'training', label: 'Adestramento' },
                                            ].map(item => {
                                                const isChecked = !!(formData.extra_services as any)?.[item.key];
                                                return (
                                                    <label key={item.key} className={`flex items-center gap-2 sm:gap-3 py-2 sm:py-3 px-3 sm:px-6 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${isChecked ? 'bg-pink-600 text-white border-pink-600 shadow-md transform scale-105' : 'bg-white text-pink-900 border-pink-100 hover:border-pink-300'}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, extra_services: { ...prev.extra_services, [item.key]: e.target.checked } as any }))}
                                                            className="sr-only"
                                                        />
                                                        {isChecked ? <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 bg-white text-pink-600 rounded-full flex items-center justify-center font-bold text-xs sm:text-base">✓</div> : <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 border-2 border-pink-200 rounded-full"></div>}
                                                        <span className="font-bold text-sm sm:text-base truncate">{item.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* INFORMAÇÕES ADICIONAIS */}
                                <div className="space-y-6 border-b border-pink-50 pb-12">
                                    <h2 className="text-3xl font-extrabold text-pink-950 tracking-tight">Informações Adicionais</h2>
                                    <textarea name="additional_info" value={formData.additional_info || ''} onChange={handleInputChange} rows={4} className={`${inputClass} resize-none`} placeholder="Observações gerais, comportamento do pet, preferências, etc." />
                                </div>

                                {/* TERMOS */}
                                <div className="space-y-6 pt-4">
                                    <div className="flex flex-col gap-4">
                                        <label className="flex items-start gap-4 p-5 rounded-[2rem] border-2 border-pink-100 bg-white hover:bg-pink-50 cursor-pointer transition-all group">
                                            <input id="agreed_to_checklist" name="declaration_accepted" type="checkbox" checked={formData.declaration_accepted || false} onChange={(e) => setFormData(prev => ({ ...prev, declaration_accepted: e.target.checked }))} className="sr-only" />
                                            <div className={`mt-1 min-w-[24px] h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.declaration_accepted ? 'bg-pink-600 border-pink-600 shadow-md' : 'border-pink-200 bg-white group-hover:border-pink-400'}`}>
                                                {formData.declaration_accepted && <div className="text-white text-sm font-black italic">✓</div>}
                                            </div>
                                            <span className="text-pink-950 font-medium leading-tight">
                                                Li e concordo com as regras de convivência, horários e condições do <a href="https://docs.google.com/document/d/1BE4UrgsUzXljtNkzLf-WmLyQn2lFOFde2DHkW2urXLQ/edit?usp=sharing" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-pink-600 underline font-bold hover:text-pink-800 transition-colors">Check List de Entrada</a>.
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-4 p-5 rounded-[2rem] border-2 border-pink-100 bg-white hover:bg-pink-50 cursor-pointer transition-all group">
                                            <input id="agreed_to_contract" name="contract_accepted" type="checkbox" checked={formData.contract_accepted || false} onChange={(e) => setFormData(prev => ({ ...prev, contract_accepted: e.target.checked }))} className="sr-only" />
                                            <div className={`mt-1 min-w-[24px] h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.contract_accepted ? 'bg-pink-600 border-pink-600 shadow-md' : 'border-pink-200 bg-white group-hover:border-pink-400'}`}>
                                                {formData.contract_accepted && <div className="text-white text-sm font-black italic">✓</div>}
                                            </div>
                                            <span className="text-pink-950 font-medium leading-tight">
                                                Declaro que as informações são verdadeiras e aceito os termos do <a href="https://docs.google.com/document/d/1YxMDR9dFdpdKv73dTiuFnktmcJ-cdV6CVIJIEdrpXyE/edit?usp=sharing" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-pink-600 underline font-bold hover:text-pink-800 transition-colors">Contrato de Prestação de Serviços</a>.
                                            </span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Assinatura do Tutor *</label>
                                        <SignaturePad value={formData.tutor_signature || undefined} onChange={(dataUrl) => setFormData(prev => ({ ...prev, tutor_signature: dataUrl }))} />
                                    </div>
                                </div>

                                {/* RESUMO */}
                                <div className="space-y-6 pt-6 animate-fadeIn">
                                    <h2 className="text-base sm:text-3xl font-extrabold text-pink-950 leading-tight tracking-tight mb-4 text-center">Resumo da Hospedagem</h2>
                                    <div className="relative overflow-hidden rounded-3xl border border-pink-200/70 bg-gradient-to-br from-white via-pink-50/60 to-rose-50 shadow-xl shadow-pink-200/40">
                                        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-500" />
                                        <div className="relative px-5 pt-5 pb-4 flex items-center gap-4 border-b border-pink-100/80 bg-white/60 backdrop-blur-sm">
                                            <div className="relative shrink-0">
                                                <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-lg ring-2 ring-pink-300 bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
                                                    {formData.pet_photo_url ? (
                                                        <img src={formData.pet_photo_url} alt={`Foto de ${formData.pet_name}`} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <LottieAnimation src="https://lottie.host/ee823306-d890-4936-8032-f1bae7614d82/A1LpnduBwz.json" style={{ width: '100%', height: '100%' }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="mt-0.5 text-xl font-extrabold text-pink-950 truncate leading-tight">{formData.pet_name || 'Pet'}</h3>
                                                {formData.pet_breed && <p className="text-xs text-pink-700/80 truncate">{formData.pet_breed}</p>}
                                            </div>
                                        </div>
                                        {(() => {
                                            const { total, nDiarias, holidayDates } = calculateTotal(formData.check_in_date || null, formData.check_out_date || null, formData.pet_weight);
                                            const pesoLabel = formData.pet_weight ? PET_WEIGHT_OPTIONS[formData.pet_weight as PetWeight] : '—';
                                            const feriados = holidayDates.map(d => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`).join(', ');
                                            const extras: string[] = [];
                                            if ((formData.extra_services as any)?.bath) extras.push('Banho');
                                            if ((formData.extra_services as any)?.transport) extras.push('Transporte');
                                            if ((formData.extra_services as any)?.vet) extras.push('Veterinário');
                                            if ((formData.extra_services as any)?.training) extras.push('Adestramento');
                                            return (
                                                <>
                                                    <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 text-sm">
                                                        <div className="flex items-start gap-3">
                                                            <img src="https://cdn-icons-png.flaticon.com/512/15494/15494722.png" alt="Tutor" className="mt-0.5 w-7 h-7 object-contain shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Tutor</p>
                                                                <p className="font-semibold text-pink-950 truncate">{formData.tutor_name || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <img src="https://cdn-icons-png.flaticon.com/512/1384/1384023.png" alt="WhatsApp" className="mt-0.5 w-7 h-7 object-contain shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">WhatsApp</p>
                                                                <p className="font-semibold text-pink-950 truncate">{formData.tutor_phone || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <img src="https://cdn-icons-png.flaticon.com/512/12887/12887924.png" alt="Check-in" className="mt-0.5 w-7 h-7 object-contain shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Check-in</p>
                                                                <p className="font-semibold text-pink-950 truncate">{formData.check_in_date ? formatDateToBR(formData.check_in_date) : '—'}{formData.check_in_time ? ` às ${formData.check_in_time}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <img src="https://cdn-icons-png.flaticon.com/512/12887/12887924.png" alt="Check-out" className="mt-0.5 w-7 h-7 object-contain shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Check-out</p>
                                                                <p className="font-semibold text-pink-950 truncate">{formData.check_out_date ? formatDateToBR(formData.check_out_date) : '—'}{formData.check_out_time ? ` às ${formData.check_out_time}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <img src="https://static.thenounproject.com/png/pet-icon-7326432-512.png" alt="Peso" className="mt-0.5 w-7 h-7 object-contain shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Peso</p>
                                                                <p className="font-semibold text-pink-950 truncate">{pesoLabel}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <img src="https://cdn-icons-png.flaticon.com/512/3652/3652191.png" alt="Diárias" className="mt-0.5 w-7 h-7 object-contain shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Diárias</p>
                                                                <p className="font-semibold text-pink-950 truncate">{nDiarias || 0}{feriados ? ` · Feriados: ${feriados}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        {extras.length > 0 && (
                                                            <div className="flex items-start gap-3 sm:col-span-2">
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 mb-1">Serviços Extras</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {extras.map(e => (
                                                                            <span key={e} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200">{e}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {total > 0 && (
                                                        <div className="mx-5 mb-5 p-4 sm:p-5 bg-gradient-to-r from-pink-100 to-rose-100 border-2 border-pink-200 rounded-2xl animate-fadeIn shadow-lg shadow-pink-200/50 w-[calc(100%-2.5rem)] overflow-hidden">
                                                            <div className="flex justify-between items-center gap-2 whitespace-nowrap overflow-hidden">
                                                                <span className="text-sm sm:text-lg font-bold text-pink-900 uppercase tracking-wider whitespace-nowrap">Estimativa:</span>
                                                                <span className="text-xl sm:text-3xl font-extrabold text-pink-700 drop-shadow-sm whitespace-nowrap">R$ {Number(total).toFixed(2).replace('.', ',')}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* BOTÕES */}
                                <div className="pt-12 flex flex-col sm:flex-row gap-5">
                                    {isAdmin && (
                                        <button type="button" onClick={handleBack} className="flex-1 px-8 py-5 rounded-[2rem] border-2 border-pink-200 text-pink-600 font-black uppercase tracking-widest hover:bg-pink-50 transition-all text-sm">
                                            Voltar
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        disabled={
                                            isSubmitting ||
                                            !formData.declaration_accepted ||
                                            !formData.contract_accepted ||
                                            !formData.tutor_signature ||
                                            !(formData.pet_name && formData.tutor_rg && formData.tutor_name && formData.tutor_phone && formData.tutor_address && formData.check_in_date && formData.check_out_date)
                                        }
                                        onClick={() => setShowCheckinWarning(true)}
                                        className="flex-[2] relative group overflow-hidden px-4 sm:px-8 py-4 sm:py-5 rounded-[2rem] bg-pink-600 hover:bg-pink-700 text-white font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] shadow-xl shadow-pink-200 transition-all hover:-translate-y-1 active:scale-95 disabled:grayscale disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Processando...</span>
                                                </>
                                            ) : (
                                                <span>Solicitar Check-in</span>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            </div>

            {showCheckinWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-[120] pb-24 sm:pb-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-pink-950">Antes de solicitar o check-in</h3>
                        <p className="text-pink-800/80 mt-2">No dia do check-in, o tutor deve levar:</p>
                        <ul className="mt-3 list-disc list-inside text-pink-900/80 space-y-1">
                            <li>RG</li>
                            <li>Comprovante de Residência</li>
                            <li>Carteira de Vacinação</li>
                            <li>Ração</li>
                            <li>Guia</li>
                            <li>Coberta</li>
                            <li>Comedouros</li>
                        </ul>
                        <div className="mt-6 flex gap-3 justify-end">
                            <button type="button" onClick={() => setShowCheckinWarning(false)} className="bg-pink-50 text-pink-800 font-bold py-2.5 px-5 rounded-xl hover:bg-pink-100 transition-colors">Voltar</button>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => formRef.current?.requestSubmit()}
                                className="bg-pink-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-pink-700 transition-colors disabled:bg-gray-300"
                            >
                                Solicitar Check-in
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showContractModal && createPortal(
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-xl font-bold text-gray-800">Contrato de hospedagem da Sandy Pet Hotel</h3>
                            <button type="button" onClick={() => setShowContractModal(false)} className="p-2 rounded-md hover:bg-gray-100">✕</button>
                        </div>
                        <div className="p-4 space-y-3 text-sm text-gray-700">
                            <p><span className="font-semibold">Nome do Pet:</span> {formData.pet_name || '—'}</p>
                            <p><span className="font-semibold">Nome do Cliente (tutor):</span> {formData.tutor_name || '—'}</p>
                            <h4 className="font-semibold mt-2">Cláusula 1</h4>
                            <p>Será de responsabilidade do Hotel Sandys Pet, a alimentação (fornecida pelo tutor), hidratação, guarda e integridade física e mental do hóspede, no tempo de permanência do pet no Hotel.</p>
                            <p>1.1 Será seguida à risca as informações contidas na ficha de Check in/check out do hóspede, acordadas com o tutor.</p>
                            <p>1.2 O tutor receberá acesso às câmeras 24h para a vigilância do seu pet.</p>
                            <h4 className="font-semibold mt-2">Cláusula 2</h4>
                            <p>Acompanhamento do médico(a) veterinário(a), se necessário, os custos serão repassados ao tutor. A não ser que, o veterinário(a) específico do tutor venha atender o hóspede no local.</p>
                            <h4 className="font-semibold mt-2">Cláusula 3</h4>
                            <p>Em caso de óbito do hóspede, por morte natural ou por agravamento de doenças crônicas ou preexistentes, o Hotel não tem responsabilidade nenhuma.</p>
                            <p>3.1 O tutor poderá solicitar necropsia para comprovação da morte, porém as despesas serão por sua conta.</p>
                            <p>3.2 Se comprovada morte por má hospedagem, manejo ou acidente no Hotel enquanto hospedado, o ressarcimento terá o valor de um animal filhote.</p>
                            <h4 className="font-semibold mt-2">Cláusula 4</h4>
                            <p>Será exigida no check-in cópias dos seguintes documentos: RG e Comprovante de residência do tutor, carteira de vacinação do pet, receituário de remédios ou procedimentos e um atestado veterinário da boa saúde do pet.</p>
                            <p>4.1 Não aceitamos pet no cio.</p>
                            <p>4.2 Pet vacinado a menos de 15 dias, antes do check-in (se contrair algum vírus, a responsabilidade será do tutor).</p>
                            <p>4.3 Não aceitamos pets agressivos ou de difícil manejo.</p>
                            <p>4.4 Somente o tutor poderá retirar o pet (a não ser que tenha deixado previamente avisado a recepção do Hotel e colocado no check-in).</p>
                            <h4 className="font-semibold mt-2">Cláusula 5</h4>
                            <p>Pagamento integral no check-in do pet.</p>
                            <p>5.1 No check-out, atente-se aos dias e horários estabelecidos, para que não gerem taxas extras.</p>
                            <p>5.2 Se o tutor retirar o pet antes da data de check-out o valor da diária ou diárias não será devolvido.</p>
                            <p>5.3 Feriados prolongados, o tutor deverá fazer reserva antecipada e deixar 50% pago.</p>
                            <h4 className="font-semibold mt-2">Cláusula 6</h4>
                            <p>Todo o ambiente do Hotel é lavado e higienizado com produtos específicos, 2 a 3 vezes ao dia.</p>
                            <h4 className="font-semibold mt-2">Cláusula 7</h4>
                            <p>Se contratado serviço de banho e tosa, o mesmo será feito apenas no dia da entrega.</p>
                            <p>7.1 Na devolução do pet o tutor deverá examinar o mesmo, pois não aceitaremos reclamações posteriores.</p>
                            <p>7.2 Brinquedos e pertences devem estar com o nome do pet.</p>
                            <h4 className="font-semibold mt-2">Cláusula 8</h4>
                            <p>O pet que não for retirado (e o Hotel não conseguir contato), após 24 horas poderá ser doado, e o tutor responderá criminalmente por abandono de animais.</p>
                            <h4 className="font-semibold mt-2">Cláusula 9</h4>
                            <p>Pendências decorrentes deste contrato serão determinadas pelo Foro Central da Comarca da Capital/SP.</p>
                            <h4 className="font-semibold mt-2">Cláusula 10</h4>
                            <p>Os valores deste contrato poderão ser corrigidos sem aviso prévio.</p>
                            <p>Estando todas as partes em comum acordo e anexado aqui: check list (CHECK IN - CHECK OUT), CÓPIA DOS DOCUMENTOS CLÁUSULA 4.</p>
                        </div>
                        <div className="p-4 border-t flex justify-end">
                            <button type="button" onClick={() => setShowContractModal(false)} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Fechar</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
