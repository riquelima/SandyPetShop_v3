const DaycareEnrollmentCard: React.FC<{
    enrollment: DaycareRegistration;
    onClick: () => void;
    onEdit: (enrollment: DaycareRegistration) => void;
    onDelete: (enrollment: DaycareRegistration) => void;
    onAddExtraServices: (enrollment: DaycareRegistration) => void;
    sectionId: 'pending' | 'approved' | 'inDaycare' | 'history';
    isDraggable?: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
    onChangePhoto: (enrollment: DaycareRegistration) => void;
    onOpenDiary?: (enrollment: DaycareRegistration) => void;
    onApprove?: (enrollment: DaycareRegistration) => void;
    onTogglePaymentStatus?: (enrollment: DaycareRegistration) => void;
    paymentUpdatingId?: string | null;
    onTogglePresence?: (enrollment: DaycareRegistration) => void;
    isInDaycare?: boolean;
    onUploadChecklist?: (enrollment: DaycareRegistration, file: File) => void;
    onRemoveChecklist?: (enrollment: DaycareRegistration, docIndex: number) => void;
    isUploadingChecklist?: boolean;
    onFiscalNote?: (enrollment: DaycareRegistration) => void;
    isEmittingNFe?: boolean;
    fiscalNotesMap?: Record<string, string>;
    onAddPernoite?: (enrollment: DaycareRegistration) => void;
    onAddDiaria?: (enrollment: DaycareRegistration) => void;
}> = ({ enrollment, onClick, onEdit, onDelete, onAddExtraServices, sectionId, isDraggable = false, onDragStart, onChangePhoto, onOpenDiary, onApprove, onTogglePaymentStatus, paymentUpdatingId, onTogglePresence, isInDaycare, onUploadChecklist, onRemoveChecklist, isUploadingChecklist, onFiscalNote, isEmittingNFe, fiscalNotesMap, onAddPernoite, onAddDiaria }) => {
    const { created_at, pet_name, tutor_name, contracted_plan, status } = enrollment;
    const formatTimeText = (time: string | null | undefined): string => {
        if (!time) return 'Não definido';
        const s = String(time);
        const m = s.match(/^(\d{1,2}):(\d{2})/);
        return m ? `${m[1].padStart(2, '0')}:${m[2]}` : s;
    };
    const checkInTimeText = formatTimeText(enrollment.check_in_time);
    const checkOutTimeText = formatTimeText(enrollment.check_out_time);

    const statusStyles: Record<string, string> = {
        'Pendente': 'bg-blue-100 text-blue-800',
        'Aprovado': 'bg-green-100 text-green-800',
        'Rejeitado': 'bg-red-100 text-red-800',
    };

    const planLabels: Record<string, string> = {
        '4x_month': '4x no Mês',
        '8x_month': '8x no Mês',
        '12x_month': '12x no Mês',
        '16x_month': '16x no Mês',
        '20x_month': '20x no Mês',
        '2x_week': '2x por Semana',
        '3x_week': '3x por Semana',
        '4x_week': '4x por Semana',
        '5x_week': '5x por Semana',
    };

    const buildWhatsAppLink = (phone: string) => {
        const digits = String(phone || '').replace(/\D/g, '');
        const withCountry = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
        return withCountry ? `https://wa.me/${withCountry}` : '#';
    };

    // Calcular o valor total da fatura
    const invoiceTotal = calculateDaycareInvoiceTotal(enrollment);

    return (
        <div
            draggable={isDraggable}
            onDragStart={isDraggable ? onDragStart : undefined}
            onClick={onClick}
            className={`group relative bg-white rounded-3xl shadow-sm hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 overflow-hidden flex flex-col h-full font-jakarta ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
        >
            {/* --- Status Bar --- */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-purple-500" />

            <div className="p-4 sm:p-5 flex flex-col h-full flex-grow">
                {/* Header Section */}
                        <div className="flex items-center justify-between mb-4 gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="relative flex-shrink-0 isolate">
                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity pointer-events-none z-0" />
                                    <SafeImage 
                                        src={enrollment.pet_photo_url || 'https://cdn-icons-png.flaticon.com/512/11201/11201086.png'} 
                                        alt={enrollment.pet_name} 
                                        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform z-10 opacity-100 brightness-100" 
                                        loading="eager" 
                                        onClick={(e) => { e.stopPropagation(); onChangePhoto(enrollment); }} 
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-outfit font-bold text-lg sm:text-xl text-gray-900 leading-tight group-hover:text-pink-600 transition-colors truncate">
                                        {pet_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-x-auto custom-scrollbar-hide">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide flex-shrink-0 ${
                                            sectionId === 'history' || status === 'Encerrado' || status === 'Inativo' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                            status === 'Aprovado' ? 'bg-green-50 text-green-600 border-green-100' :
                                            status === 'Rejeitado' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                                        }`}>
                                            {sectionId === 'history' && status === 'Aprovado' ? 'Encerrado' : status}
                                        </span>
                                        {(() => {
                                            const raw = String(enrollment.last_vaccine || '');
                                            if (!raw) return null;
                                            const datePart = raw.split('T')[0];
                                            const parts = datePart.split('-').map(Number);
                                            if (parts.length !== 3 || parts.some(isNaN)) return null;
                                            const last = new Date(parts[0], parts[1] - 1, parts[2]);
                                            const now = new Date();
                                            const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                                            if (diffDays > 365) {
                                                return (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center gap-1 flex-shrink-0" title="Vacina Vencida">
                                                        ⚠️ Vacina
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            </div>
        
                            {/* Price & Payment Tag */}
                            <div className="text-right flex flex-col items-end flex-shrink-0 pl-2">
                                <div className="font-outfit font-bold text-lg sm:text-xl text-gray-900 whitespace-nowrap">
                                    R$ {invoiceTotal.toFixed(2).replace('.', ',')}
                                </div>
                                <div className="mt-1 flex flex-col items-end gap-1">
                                    {(() => {
                                        const current = (enrollment.payment_status === 'Pago') ? 'Pago' : 'Pendente';
                                        const cls = current === 'Pago'
                                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                            : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
                                        return (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onTogglePaymentStatus && onTogglePaymentStatus(enrollment); }}
                                                disabled={paymentUpdatingId === enrollment.id}
                                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap truncate border ${cls} transition-colors`}
                                                title={current === 'Pago' ? 'Marcar como pendente' : 'Marcar como pago'}
                                            >
                                                {paymentUpdatingId === enrollment.id ? '...' : current}
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 bg-gray-50/50 p-2.5 sm:p-3 rounded-xl border border-gray-100">
                    <div className="flex items-start sm:items-center gap-2 overflow-hidden">
                        <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Tutor</span>
                            <span className="text-xs font-medium text-gray-700 truncate">{tutor_name}</span>
                        </div>
                    </div>
                    <div className="flex items-start sm:items-center gap-2 overflow-hidden">
                        <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">WhatsApp</span>
                            {enrollment.contact_phone ? (
                                <a href={buildWhatsAppLink(enrollment.contact_phone)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-600 hover:underline truncate" onClick={e => e.stopPropagation()}>
                                    {enrollment.contact_phone.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}
                                </a>
                            ) : (
                                <span className="text-xs font-medium text-gray-700 truncate">-</span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start sm:items-center gap-2 overflow-hidden">
                        <TagIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Plano</span>
                            <span className="text-xs font-medium text-gray-700 truncate">{contracted_plan ? planLabels[contracted_plan] : 'Não info.'}</span>
                        </div>
                    </div>
                    <div className="flex items-start sm:items-center gap-2 overflow-hidden">
                        <CalendarIcon className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Início</span>
                            <span className="text-xs font-bold text-pink-600 truncate">{formatDateToBR(enrollment.check_in_date || null)}</span>
                        </div>
                    </div>

                    <div className="flex items-start sm:items-center gap-2 overflow-hidden">
                        <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Entrada</span>
                            <span className="text-xs font-medium text-gray-700 truncate">{checkInTimeText}</span>
                        </div>
                    </div>
                    <div className="flex items-start sm:items-center gap-2 overflow-hidden">
                        <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Saída</span>
                            <span className="text-xs font-medium text-gray-700 truncate">{checkOutTimeText}</span>
                        </div>
                    </div>
                </div>

                {/* Dias da semana */}
                <div className="mb-4">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Dias da semana</span>
                    <div className="flex flex-wrap gap-1">
                        {(enrollment.attendance_days && enrollment.attendance_days.length > 0)
                            ? (enrollment.attendance_days as any[]).map((idx: number) => (
                                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][idx]}
                                </span>
                            ))
                            : <span className="text-xs text-gray-500">Não informado</span>}
                    </div>
                </div>

                {/* Checklist de Entrada & Contrato */}
                <div className="mb-4">
                    <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                        Checklist e Contrato 
                    </span>
                    <div className="flex flex-col gap-2">
                        {(() => {
                            let checklists: {name: string, url: string}[] = [];
                            if (enrollment.checklist_url) {
                                try {
                                    const parsed = JSON.parse(enrollment.checklist_url);
                                    if (Array.isArray(parsed)) checklists = parsed;
                                    else checklists = [{ name: 'Documento Anexado', url: enrollment.checklist_url }];
                                } catch {
                                    checklists = [{ name: 'Documento Anexado', url: enrollment.checklist_url }];
                                }
                            }
                            return (
                                <div className="flex flex-nowrap overflow-x-auto items-center gap-1.5 pb-1 -mb-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                    <label onClick={(e) => e.stopPropagation()} className={`inline-flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-lg border transition-all shadow-sm ${isUploadingChecklist ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-400 border-gray-200 hover:bg-pink-50 hover:text-pink-600 cursor-pointer hover:border-pink-200 hover:shadow-pink-100'}`} title="Anexar arquivo PDF ou Imagem">
                                        {isUploadingChecklist ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        )}
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,image/*" disabled={isUploadingChecklist} onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file && onUploadChecklist) {
                                                if (file.size > 50 * 1024 * 1024) {
                                                    alert('O arquivo deve ter no máximo 50MB.');
                                                    return;
                                                }
                                                onUploadChecklist(enrollment, file);
                                            }
                                            e.target.value = '';
                                        }} />
                                    </label>

                                    {checklists.map((doc, idx) => (
                                        <div key={idx} className="relative group inline-flex flex-shrink-0">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 pl-2 pr-6 py-1 rounded-md text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors shadow-sm max-w-[130px]" title={doc.name}>
                                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                <span className="truncate">{doc.name}</span>
                                            </a>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Tem certeza que deseja remover este documento?')) {
                                                        onRemoveChecklist?.(enrollment, idx);
                                                    }
                                                }}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-green-600 hover:text-red-500 hover:bg-red-100 rounded-md transition-all opacity-0 group-hover:opacity-100 bg-green-50"
                                                title="Remover anexo"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                </div>


                {/* Serviços Extras (Chips) */}
                {enrollment.extra_services && Object.keys(enrollment.extra_services).length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                        {((enrollment as any).extra_services?.pernoite?.enabled || (enrollment as any).extra_services?.pernoite === true) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">Pernoite</span>
                        )}
                        {((enrollment as any).extra_services?.banho_tosa?.enabled || (enrollment as any).extra_services?.banho_tosa === true) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">Banho & Tosa</span>
                        )}
                        {((enrollment as any).extra_services?.so_banho?.enabled || (enrollment as any).extra_services?.so_banho === true) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-100">Só banho</span>
                        )}
                        {((enrollment as any).extra_services?.adestrador?.enabled || (enrollment as any).extra_services?.adestrador === true) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">Adestrador</span>
                        )}
                        {((enrollment as any).extra_services?.despesa_medica?.enabled || (enrollment as any).extra_services?.despesa_medica === true) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">Desp. médica</span>
                        )}
                        {(((enrollment as any).extra_services?.dias_extras?.enabled !== false) && ((enrollment as any).extra_services?.dias_extras?.quantity ?? 0) > 0) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">
                                {(enrollment as any).extra_services.dias_extras.quantity} dia{(enrollment as any).extra_services.dias_extras.quantity > 1 ? 's' : ''} extra
                            </span>
                        )}
                    </div>
                )}
                
                <div className="flex-grow"></div>

                {/* Ações (Action Bar) */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap sm:grid sm:grid-cols-4 gap-1.5">
                    {status === 'Aprovado' && sectionId !== 'history' && onTogglePresence && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onTogglePresence(enrollment); }}
                            className={`w-full py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none ${
                                isInDaycare 
                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={isInDaycare ? "Fazer Check-out" : "Fazer Check-in"}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isInDaycare ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                                )}
                            </svg>
                            <span className="hidden sm:inline">{isInDaycare ? 'Check-out' : 'Check-in'}</span>
                        </button>
                    )}
                    {status === 'Pendente' && onApprove && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onApprove(enrollment); }}
                            className="w-full bg-green-100 text-green-700 py-1.5 px-2 rounded-md hover:bg-green-200 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <span className="hidden sm:inline">Aprovar</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddExtraServices(enrollment); }}
                        className="w-full bg-indigo-50 text-indigo-700 py-1.5 px-2 rounded-md hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                        title="Adicionar Serviços Extras"
                    >
                        <PlusOutlineIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Extras</span>
                    </button>
                    {(sectionId === 'approved' || sectionId === 'inDaycare' || sectionId === 'history') && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenDiary && onOpenDiary(enrollment); }}
                            className="w-full bg-purple-100 text-purple-700 py-1.5 px-2 rounded-md hover:bg-purple-200 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                            title="Diário"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                                <circle cx="9" cy="10" r="1" fill="currentColor" />
                                <circle cx="15" cy="10" r="1" fill="currentColor" />
                                <path d="M8 14c1.5 1 3 1.5 4 1.5s2.5-.5 4-1.5" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            <span className="hidden sm:inline">Diário</span>
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(enrollment); }}
                        className="w-full bg-blue-50 text-blue-700 py-1.5 px-2 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                        aria-label="Editar matrícula"
                        title="Editar"
                    >
                        <EditIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                    </button>

                    {/* Botão Pernoite */}
                    {status === 'Aprovado' && sectionId !== 'history' && onAddPernoite && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddPernoite(enrollment); }}
                            className="w-full bg-purple-50 text-purple-700 py-1.5 px-2 rounded-md hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                            title="Agendar Pernoite"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                            </svg>
                            <span className="hidden sm:inline">Pernoite</span>
                        </button>
                    )}

                    {/* Botão Diária */}
                    {status === 'Aprovado' && sectionId !== 'history' && onAddDiaria && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddDiaria(enrollment); }}
                            className="w-full bg-amber-50 text-amber-700 py-1.5 px-2 rounded-md hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                            title="Agendar Diária"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M17.72 17.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M17.72 6.28l1.06-1.06M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
                            </svg>
                            <span className="hidden sm:inline">Diária</span>
                        </button>
                    )}

                    {/* Botão Emitir Nota Fiscal (Sempre permite gerar nova nota para Creche Pet) */}
                    {status === 'Aprovado' && sectionId !== 'history' && onFiscalNote && (
                        <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onFiscalNote(enrollment); 
                            }}
                            disabled={isEmittingNFe}
                            className={`w-full py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none border ${
                                isEmittingNFe 
                                ? 'bg-pink-100 text-pink-400 border-pink-200 cursor-not-allowed' 
                                : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100'
                            }`}
                            title="Emitir Nota Fiscal"
                        >
                            {isEmittingNFe ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="hidden sm:inline">Gerando...</span>
                                </>
                            ) : (
                                <>
                                    <DocumentTextIcon className="w-4 h-4 shrink-0" />
                                    <span className="hidden sm:inline">Nota</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(enrollment); }}
                        className="w-full bg-red-50 text-red-600 py-1.5 px-2 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 text-center whitespace-nowrap text-xs font-medium flex-1 sm:flex-none"
                        aria-label="Excluir matrícula"
                        title="Excluir"
                    >
                        <DeleteIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Excluir</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
