import re

with open("scratch/originalDaycareCard.tsx", "r") as f:
    old_code = f.read()

new_code = r"""const DaycareEnrollmentCard: React.FC<{
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

    const planLabels: Record<string, string> = {
        '4x_month': '4x no Mês', '8x_month': '8x no Mês', '12x_month': '12x no Mês',
        '16x_month': '16x no Mês', '20x_month': '20x no Mês',
        '2x_week': '2x por Semana', '3x_week': '3x por Semana', '4x_week': '4x por Semana', '5x_week': '5x por Semana',
    };

    const buildWhatsAppLink = (phone: string) => {
        const digits = String(phone || '').replace(/\D/g, '');
        const withCountry = digits ? (digits.startsWith('55') ? digits : `55${digits}`) : '';
        return withCountry ? `https://wa.me/${withCountry}` : '#';
    };

    const formatPhoneStr = (phone: string) => {
        const d = String(phone || '').replace(/\D/g, '');
        if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        return phone || '-';
    };

    const invoiceTotal = calculateDaycareInvoiceTotal(enrollment);
    
    const isVaccineExpired = (() => {
        const raw = String(enrollment.last_vaccine || '');
        if (!raw) return false;
        const datePart = raw.split('T')[0];
        const parts = datePart.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return false;
        const last = new Date(parts[0], parts[1] - 1, parts[2]);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 365;
    })();

    const startDateText = enrollment.check_in_date ? formatDateToBR(enrollment.check_in_date) : 'Não definido';

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

    const weekDaysArr = enrollment.attendance_days && enrollment.attendance_days.length > 0 
        ? (enrollment.attendance_days as number[]).map(idx => (['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][idx]))
        : [];

    const paymentStatus = (enrollment.payment_status === 'Pago') ? 'Pago' : 'Pendente';

    return (
        <article 
            draggable={isDraggable}
            onDragStart={isDraggable ? onDragStart : undefined}
            onClick={onClick}
            className={`relative bg-white overflow-hidden border border-gray-100 rounded-3xl transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} font-jakarta`}
        >
            {/* Top Decorative Ambient Glow */}
            <div aria-hidden="true" className="h-2.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400"></div>
            
            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                {/* Cabeçalho */}
                <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0 isolate">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 via-pink-100 to-emerald-200 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity pointer-events-none z-0" />
                            <div className="relative w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-full p-[2px] bg-gradient-to-tr from-purple-200 via-gray-100 to-emerald-200 shadow-sm hover:scale-105 transition-transform z-10">
                                <SafeImage 
                                    src={enrollment.pet_photo_url || 'https://cdn-icons-png.flaticon.com/512/11201/11201086.png'}
                                    alt={pet_name} 
                                    className="w-full h-full object-cover rounded-full bg-gray-100 border-2 border-white"
                                    onClick={(e) => { e.stopPropagation(); onChangePhoto(enrollment); }} 
                                />
                            </div>
                        </div>
                        {/* Nome & Status */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 truncate uppercase">{pet_name}</h1>
                                {isVaccineExpired && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0" title="Vacina Vencida">⚠️</span>
                                )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    sectionId === 'history' || status === 'Encerrado' || status === 'Inativo' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                    status === 'Aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' :
                                    status === 'Rejeitado' ? 'bg-red-50 text-red-700 border-red-200/80' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200/80'
                                }`}>
                                    {status === 'Aprovado' && sectionId !== 'history' && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    )}
                                    {sectionId === 'history' && status === 'Aprovado' ? 'Encerrado' : status}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Preço & Status Pagamento */}
                    <div className="text-right shrink-0">
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-wide uppercase">Total Plano</div>
                        <div className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight leading-none mt-0.5 whitespace-nowrap">
                            R$ {Math.floor(invoiceTotal)}<span className="text-[10px] sm:text-xs font-bold text-gray-500">,{((invoiceTotal % 1) * 100).toFixed(0).padStart(2, '0')}</span>
                        </div>
                        <div className="mt-1 flex justify-end">
                            <button
                                onClick={(e) => { e.stopPropagation(); onTogglePaymentStatus?.(enrollment); }}
                                disabled={paymentUpdatingId === enrollment.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border transition-colors ${
                                    paymentStatus === 'Pago' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-amber-50 text-amber-800 border-amber-200/70 hover:bg-amber-100'
                                }`}
                                title={paymentStatus === 'Pago' ? 'Marcar como pendente' : 'Marcar como pago'}
                            >
                                {paymentUpdatingId === enrollment.id ? '...' : (
                                    <>
                                        {paymentStatus === 'Pendente' && (
                                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                        )}
                                        {paymentStatus}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Grid Metadados */}
                <section className="bg-gray-50/50 border border-gray-200/60 rounded-2xl p-3 sm:p-4 shadow-inner space-y-3 sm:space-y-3.5">
                    {/* Linha 1 */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-gray-200/60">
                        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Tutor(a)</span>
                                <span className="block text-[11px] sm:text-xs font-semibold text-gray-800 truncate" title={tutor_name}>{tutor_name}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                <PhoneIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">WhatsApp</span>
                                {enrollment.contact_phone ? (
                                    <a className="block text-[11px] sm:text-xs font-semibold text-emerald-700 hover:text-emerald-800 truncate transition-colors" href={buildWhatsAppLink(enrollment.contact_phone)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                        {formatPhoneStr(enrollment.contact_phone)}
                                    </a>
                                ) : (
                                    <span className="block text-[11px] sm:text-xs font-semibold text-gray-500">-</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Linha 2 */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-gray-200/60">
                        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                <TagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Plano</span>
                                <span className="block text-[11px] sm:text-xs font-semibold text-gray-800">{contracted_plan ? planLabels[contracted_plan] : 'Não info.'}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Início</span>
                                <span className="block text-[11px] sm:text-xs font-bold text-rose-600">{startDateText}</span>
                            </div>
                        </div>
                    </div>
                    {/* Linha 3 */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-100/70 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                                <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Entrada</span>
                                <span className="block text-[11px] sm:text-xs font-bold text-gray-800 tracking-tight">{checkInTimeText}</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">Saída</span>
                                <span className="block text-[11px] sm:text-xs font-bold text-gray-800 tracking-tight">{checkOutTimeText}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dias da semana e Documentos */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="col-span-1 md:col-span-7 bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Dias da Semana</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {weekDaysArr.length > 0 ? (
                                <>
                                    {weekDaysArr.map((d, i) => (
                                        <span key={i} className="px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-white text-purple-700 border border-purple-100 shadow-sm">{d}</span>
                                    ))}
                                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 ml-1">({weekDaysArr.length}x/sem)</span>
                                </>
                            ) : <span className="text-[10px] sm:text-xs text-gray-500">Não informado</span>}
                        </div>
                    </div>
                    <div className="col-span-1 md:col-span-5 bg-gray-50 border border-gray-100 rounded-2xl p-3 flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">Documentos</span>
                        <div className="flex flex-col gap-1.5">
                            {checklists.map((doc, idx) => (
                                <div key={idx} className="relative group">
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-full flex items-center justify-between px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 text-[9px] sm:text-[10px] font-semibold shadow-sm transition-colors">
                                        <span className="flex items-center gap-1.5 truncate">
                                            <DocumentTextIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                            <span className="truncate">{doc.name}</span>
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    </a>
                                    <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Remover documento?')) onRemoveChecklist?.(enrollment, idx); }} className="absolute -right-1 -top-1 p-0.5 text-red-500 bg-white border border-red-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" title="Remover">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            <label onClick={e => e.stopPropagation()} className={`w-full flex items-center justify-center px-2 py-1 rounded-lg border border-dashed transition-colors text-[9px] sm:text-[10px] font-semibold ${isUploadingChecklist ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300' : 'bg-white text-purple-600 hover:bg-purple-50 cursor-pointer border-purple-200'}`} title="Anexar documento">
                                {isUploadingChecklist ? 'Enviando...' : '+ Anexar'}
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,image/*" disabled={isUploadingChecklist} onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && onUploadChecklist) {
                                        if (file.size > 50 * 1024 * 1024) return alert('Máx 50MB.');
                                        onUploadChecklist(enrollment, file);
                                    }
                                    e.target.value = '';
                                }} />
                            </label>
                        </div>
                    </div>
                </section>

                <hr className="border-t border-gray-100 my-1" />

                {/* Action Buttons */}
                <section className="space-y-2 sm:space-y-3">
                    {/* Main Action: Check-in / Check-out */}
                    {status === 'Aprovado' && sectionId !== 'history' && onTogglePresence && (
                        <div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onTogglePresence(enrollment); }}
                                className={`w-full py-2.5 sm:py-3 px-4 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] ${
                                    isInDaycare 
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700' 
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                                }`}
                                type="button"
                            >
                                {isInDaycare ? (
                                    <>
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                        Realizar Check-out
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 text-emerald-100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        Realizar Check-in
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    {status === 'Pendente' && onApprove && (
                        <div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onApprove(enrollment); }}
                                className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm tracking-wide shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                                type="button"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                Aprovar Matrícula
                            </button>
                        </div>
                    )}

                    {/* Secondary Actions Grid */}
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                        {/* Extras */}
                        <button onClick={(e) => { e.stopPropagation(); onAddExtraServices(enrollment); }} className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold border border-purple-100 transition-colors" type="button">
                            <PlusOutlineIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Extras</span>
                        </button>
                        
                        {/* Diário */}
                        {(sectionId === 'approved' || sectionId === 'inDaycare' || sectionId === 'history') && onOpenDiary ? (
                            <button onClick={(e) => { e.stopPropagation(); onOpenDiary(enrollment); }} className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold border border-sky-100 transition-colors" type="button">
                                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" x2="9.01" y1="9" y2="9"></line><line x1="15" x2="15.01" y1="9" y2="9"></line></svg>
                                <span className="truncate">Diário</span>
                            </button>
                        ) : <div />}

                        {/* Pernoite */}
                        {status === 'Aprovado' && sectionId !== 'history' && onAddPernoite ? (
                            <button onClick={(e) => { e.stopPropagation(); onAddPernoite(enrollment); }} className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-100 transition-colors" type="button">
                                <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                                <span className="truncate">Pernoite</span>
                            </button>
                        ) : <div />}

                        {/* Diária */}
                        {status === 'Aprovado' && sectionId !== 'history' && onAddDiaria ? (
                            <button onClick={(e) => { e.stopPropagation(); onAddDiaria(enrollment); }} className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold border border-amber-100 transition-colors" type="button">
                                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" x2="12" y1="1" y2="3"></line><line x1="12" x2="12" y1="21" y2="23"></line><line x1="4.22" x2="5.64" y1="4.22" y2="5.64"></line><line x1="18.36" x2="19.78" y1="18.36" y2="19.78"></line><line x1="1" x2="3" y1="12" y2="12"></line><line x1="21" x2="23" y1="12" y2="12"></line></svg>
                                <span className="truncate">Diária</span>
                            </button>
                        ) : <div />}

                        {/* Nota */}
                        {status === 'Aprovado' && sectionId !== 'history' && onFiscalNote ? (
                            <button disabled={isEmittingNFe} onClick={(e) => { e.stopPropagation(); onFiscalNote(enrollment); }} className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold border border-rose-100 transition-colors disabled:opacity-50" type="button">
                                {isEmittingNFe ? <div className="animate-spin h-3.5 w-3.5 border-2 border-rose-500 border-t-transparent rounded-full shrink-0" /> : <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line></svg>}
                                <span className="truncate">Nota</span>
                            </button>
                        ) : <div />}

                        {/* Editar */}
                        <button onClick={(e) => { e.stopPropagation(); onEdit(enrollment); }} className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-2 rounded-lg sm:rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold border border-gray-200 transition-colors" type="button">
                            <EditIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Editar</span>
                        </button>
                    </div>

                    {/* Excluir (Discreto) */}
                    <div className="pt-1 flex justify-center">
                        <button onClick={(e) => { e.stopPropagation(); onDelete(enrollment); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors group" type="button">
                            <DeleteIcon className="w-3.5 h-3.5 group-hover:text-red-600 transition-colors shrink-0" />
                            Excluir Registro
                        </button>
                    </div>
                </section>
            </div>
        </article>
    );
};"""

with open("App.tsx", "r") as f:
    app_text = f.read()

# Make sure old_code exists in app_text
if old_code not in app_text:
    print("Error: old_code not found in App.tsx! Check exact match.")
    exit(1)

app_text = app_text.replace(old_code, new_code)

with open("App.tsx", "w") as f:
    f.write(app_text)

print("Done replacing.")
