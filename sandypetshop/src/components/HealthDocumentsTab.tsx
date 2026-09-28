import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const DragDropFileInput: React.FC<{ onChange: (file: File) => void }> = ({ onChange }) => (
    <label className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-pink-200 border-dashed rounded-xl cursor-pointer bg-pink-50/30 hover:bg-pink-50 transition-colors">
        <div className="flex flex-col items-center justify-center pt-3 pb-4">
            <svg className="w-6 h-6 mb-2 text-pink-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="text-xs font-semibold text-pink-600">Clique para enviar</p>
            <p className="text-[10px] text-gray-500 mt-1">ou arraste e solte o arquivo</p>
        </div>
        <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => {
            if (e.target.files && e.target.files.length > 0) onChange(e.target.files[0]);
        }} />
    </label>
);

export const HealthDocumentsTab: React.FC<{ clientData: any, phone: string }> = ({ clientData, phone }) => {
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState<any>({});
    
    // We will use the extra_services jsonb column to store these health_docs if the columns don't exist yet,
    // but ideally we try to read from the columns first.
    // However, since we might not have added columns, let's use a dedicated table or just use extra_services.
    // For now, let's assume we can fetch from the main table (daycare_enrollments or hotel_registrations).
    // Or we can save them in 'clients' table? No, it's per pet.

    const targetTable = clientData.isHotel ? 'hotel_registrations' : 'daycare_enrollments';
    const pets = clientData.isHotel ? (clientData.hotelPets || [clientData.hotelData]) : (clientData.daycarePets || [clientData.daycareData]);
    
    const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || '');

    const fetchDocs = async () => {
        if (!selectedPetId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from(targetTable).select('*').eq('id', selectedPetId).single();
            if (data) {
                // If columns exist, they will be here. Otherwise we check extra_services.health_docs
                const healthDocs = data.health_docs || (data.extra_services ? data.extra_services.health_docs : {}) || {};
                setDocs({
                    carteira_vacinacao_url: data.carteira_vacinacao_url || healthDocs.carteira_vacinacao_url || '',
                    exame_coproparasitologico_url: data.exame_coproparasitologico_url || healthDocs.exame_coproparasitologico_url || '',
                    atestado_veterinario_url: data.atestado_veterinario_url || healthDocs.atestado_veterinario_url || '',
                    comprovante_pulga_url: data.comprovante_pulga_url || healthDocs.comprovante_pulga_url || '',
                    data_validade_pulga: data.data_validade_pulga || healthDocs.data_validade_pulga || '',
                    vet_name: data.vet_name || healthDocs.vet_name || '',
                    vet_phone: data.vet_phone || healthDocs.vet_phone || data.tutor_phone || ''
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, [selectedPetId]);

    const handleUpload = async (file: File, fieldName: string) => {
        if (!file || !selectedPetId) return;
        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedPetId}_${fieldName}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('pets-media')
                .upload(fileName, file);

            if (uploadError) {
                // If bucket doesn't exist, try monthly_pet_photos
                const { error: uploadError2 } = await supabase.storage
                    .from('monthly_pet_photos')
                    .upload(fileName, file);
                if (uploadError2) throw uploadError2;
                
                const { data: { publicUrl } } = supabase.storage.from('monthly_pet_photos').getPublicUrl(fileName);
                await updateField(fieldName, publicUrl);
                return;
            }

            const { data: { publicUrl } } = supabase.storage.from('pets-media').getPublicUrl(fileName);
            await updateField(fieldName, publicUrl);
        } catch (e) {
            console.error(e);
            alert('Erro ao enviar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = async (field: string, value: any) => {
        setDocs((prev: any) => ({ ...prev, [field]: value }));
        
        try {
            // We will save to the dedicated column AND to extra_services.health_docs as a fallback
            const { data: currentData } = await supabase.from(targetTable).select('extra_services').eq('id', selectedPetId).single();
            const currentExtra = currentData?.extra_services || {};
            const healthDocs = currentExtra.health_docs || {};
            healthDocs[field] = value;
            
            await supabase.from(targetTable).update({
                [field]: value,
                extra_services: { ...currentExtra, health_docs: healthDocs }
            }).eq('id', selectedPetId);
            
            alert('Salvo com sucesso!');
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar os dados.');
        }
    };

    const handleSaveText = () => {
        updateField('vet_name', docs.vet_name);
        updateField('vet_phone', docs.vet_phone);
        updateField('data_validade_pulga', docs.data_validade_pulga);
    };

    if (!selectedPetId) return null;

    return (
        <div className="space-y-6 animate-fadeIn">
            {pets.length > 1 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4">
                    {pets.map((p: any) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPetId(p.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${selectedPetId === p.id ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                        >
                            {p.pet_name}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Saúde e Documentos</h3>
                <p className="text-sm text-gray-500 mb-6">Mantenha os documentos do seu pet atualizados para a creche e hotel.</p>

                <div className="space-y-6">
                    {/* Carteira de Vacinação */}
                    <div className="border border-gray-100 p-4 rounded-xl">
                        <h4 className="font-bold text-gray-700 mb-2">Carteira de Vacinação</h4>
                        {docs.carteira_vacinacao_url ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    <a href={docs.carteira_vacinacao_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold text-sm hover:underline">Documento Enviado</a>
                                </div>
                                <button onClick={() => { if(window.confirm('Remover documento?')) updateField('carteira_vacinacao_url', ''); }} className="text-[10px] text-gray-400 hover:text-red-500 font-bold px-2 py-1 transition-colors uppercase tracking-wider" title="Remover documento">Excluir</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-red-500 mb-3 font-medium">Documento pendente!</p>
                                <DragDropFileInput onChange={file => handleUpload(file, 'carteira_vacinacao_url')} />
                            </>
                        )}
                    </div>

                    {/* Exame Coproparasitológico */}
                    <div className="border border-gray-100 p-4 rounded-xl">
                        <h4 className="font-bold text-gray-700 mb-2">Exame Coproparasitológico</h4>
                        {docs.exame_coproparasitologico_url ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    <a href={docs.exame_coproparasitologico_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold text-sm hover:underline">Documento Enviado</a>
                                </div>
                                <button onClick={() => { if(window.confirm('Remover documento?')) updateField('exame_coproparasitologico_url', ''); }} className="text-[10px] text-gray-400 hover:text-red-500 font-bold px-2 py-1 transition-colors uppercase tracking-wider" title="Remover documento">Excluir</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-red-500 mb-3 font-medium">Documento pendente!</p>
                                <DragDropFileInput onChange={file => handleUpload(file, 'exame_coproparasitologico_url')} />
                            </>
                        )}
                    </div>

                    {/* Atestado Veterinário */}
                    <div className="border border-gray-100 p-4 rounded-xl">
                        <h4 className="font-bold text-gray-700 mb-2">Atestado Veterinário</h4>
                        {docs.atestado_veterinario_url ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    <a href={docs.atestado_veterinario_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold text-sm hover:underline">Documento Enviado</a>
                                </div>
                                <button onClick={() => { if(window.confirm('Remover documento?')) updateField('atestado_veterinario_url', ''); }} className="text-[10px] text-gray-400 hover:text-red-500 font-bold px-2 py-1 transition-colors uppercase tracking-wider" title="Remover documento">Excluir</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-red-500 mb-3 font-medium">Documento pendente!</p>
                                <DragDropFileInput onChange={file => handleUpload(file, 'atestado_veterinario_url')} />
                            </>
                        )}
                    </div>

                    {/* Pulga e Carrapato */}
                    <div className="border border-gray-100 p-4 rounded-xl space-y-4">
                        <h4 className="font-bold text-gray-700">Remédio de Pulga e Carrapato</h4>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Comprovante</label>
                            {docs.comprovante_pulga_url ? (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        <a href={docs.comprovante_pulga_url} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold text-sm hover:underline">Documento Enviado</a>
                                    </div>
                                    <button onClick={() => { if(window.confirm('Remover documento?')) updateField('comprovante_pulga_url', ''); }} className="text-[10px] text-gray-400 hover:text-red-500 font-bold px-2 py-1 transition-colors uppercase tracking-wider" title="Remover documento">Excluir</button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-red-500 mb-3 font-medium">Documento pendente!</p>
                                    <div className="mb-3">
                                        <DragDropFileInput onChange={file => handleUpload(file, 'comprovante_pulga_url')} />
                                    </div>
                                </>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Data de Validade</label>
                            <input 
                                type="date" 
                                value={docs.data_validade_pulga || ''} 
                                onChange={e => setDocs({...docs, data_validade_pulga: e.target.value})} 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" 
                            />
                        </div>
                    </div>

                    {/* Veterinário */}
                    <div className="border border-gray-100 p-4 rounded-xl space-y-4">
                        <h4 className="font-bold text-gray-700">Veterinário(a) Responsável</h4>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Nome do(a) Veterinário(a)</label>
                            <input 
                                type="text" 
                                placeholder="Dr(a). Fulano" 
                                value={docs.vet_name || ''} 
                                onChange={e => setDocs({...docs, vet_name: e.target.value})} 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Telefone do(a) Veterinário(a)</label>
                            <input 
                                type="tel" 
                                placeholder="(00) 00000-0000" 
                                value={docs.vet_phone || ''} 
                                onChange={e => setDocs({...docs, vet_phone: e.target.value})} 
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveText} 
                        disabled={loading}
                        className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : 'Salvar Dados de Saúde'}
                    </button>
                </div>
            </div>
        </div>
    );
};
