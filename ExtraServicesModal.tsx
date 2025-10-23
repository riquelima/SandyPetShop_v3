import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from './supabaseClient';

interface ExtraServicesData {
  pernoite: { enabled: boolean; value: number };
  banho_tosa: { enabled: boolean; value: number };
  so_banho: { enabled: boolean; value: number };
  adestrador: { enabled: boolean; value: number };
  despesa_medica: { enabled: boolean; value: number };
  dias_extras: { quantity: number; value: number };
}

interface ExtraServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedData: any) => void;
  data: any; // Pode ser AdminAppointment, MonthlyClient, DaycareRegistration ou HotelRegistration
  type: 'appointment' | 'monthly' | 'daycare' | 'hotel';
  title?: string;
}

const ExtraServicesModal: React.FC<ExtraServicesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  data,
  type,
  title = 'Serviços Extras'
}) => {
  const [extraServices, setExtraServices] = useState<ExtraServicesData>({
    pernoite: { 
      enabled: data.extra_services?.pernoite?.enabled || false, 
      value: data.extra_services?.pernoite?.value || 0 
    },
    banho_tosa: { 
      enabled: data.extra_services?.banho_tosa?.enabled || false, 
      value: data.extra_services?.banho_tosa?.value || 0 
    },
    so_banho: { 
      enabled: data.extra_services?.so_banho?.enabled || false, 
      value: data.extra_services?.so_banho?.value || 0 
    },
    adestrador: { 
      enabled: data.extra_services?.adestrador?.enabled || false, 
      value: data.extra_services?.adestrador?.value || 0 
    },
    despesa_medica: { 
      enabled: data.extra_services?.despesa_medica?.enabled || false, 
      value: data.extra_services?.despesa_medica?.value || 0 
    },
    dias_extras: { 
      quantity: data.extra_services?.dias_extras?.quantity || 0, 
      value: data.extra_services?.dias_extras?.value || 0 
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleServiceToggle = (service: keyof ExtraServicesData) => {
    if (service === 'dias_extras') {
      setExtraServices(prev => ({
        ...prev,
        dias_extras: {
          ...prev.dias_extras,
          quantity: prev.dias_extras.quantity > 0 ? 0 : 1
        }
      }));
    } else {
      setExtraServices(prev => ({
        ...prev,
        [service]: {
          ...prev[service],
          enabled: !prev[service].enabled
        }
      }));
    }
  };

  const handleValueChange = (service: keyof ExtraServicesData, value: number) => {
    setExtraServices(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        value: value
      }
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    setExtraServices(prev => ({
      ...prev,
      dias_extras: {
        ...prev.dias_extras,
        quantity: quantity
      }
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    if (extraServices.pernoite.enabled) total += extraServices.pernoite.value;
    if (extraServices.banho_tosa.enabled) total += extraServices.banho_tosa.value;
    if (extraServices.so_banho.enabled) total += extraServices.so_banho.value;
    if (extraServices.adestrador.enabled) total += extraServices.adestrador.value;
    if (extraServices.despesa_medica.enabled) total += extraServices.despesa_medica.value;
    if (extraServices.dias_extras.quantity > 0) {
      total += extraServices.dias_extras.quantity * extraServices.dias_extras.value;
    }
    return total;
  };

  const getTableName = () => {
    switch (type) {
      case 'appointment': return 'appointments';
      case 'monthly': return 'monthly_clients';
      case 'daycare': return 'daycare_registrations';
      case 'hotel': return 'hotel_registrations';
      default: return '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const tableName = getTableName();
      
      // Log para debug
      console.log('Salvando serviços extras:', {
        tableName,
        dataId: data.id,
        extraServices,
        type
      });

      const { data: updatedData, error } = await supabase
        .from(tableName)
        .update({ extra_services: extraServices })
        .eq('id', data.id)
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Dados atualizados:', updatedData);

      // Calcular novo total se for mensalista
      if (type === 'monthly') {
        const extraServicesTotal = calculateTotal();
        const newTotal = (data.price || 0) + extraServicesTotal;
        
        const { error: priceUpdateError } = await supabase
          .from('monthly_clients')
          .update({ price: newTotal })
          .eq('id', data.id);
          
        if (priceUpdateError) {
          console.error('Erro ao atualizar preço do mensalista:', priceUpdateError);
          throw priceUpdateError;
        }
          
        updatedData.price = newTotal;
      }

      onSuccess({ ...data, ...updatedData });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar serviços extras:', error);
      
      // Mostrar erro mais detalhado
      let errorMessage = 'Erro ao salvar serviços extras. ';
      if (error.message) {
        errorMessage += `Detalhes: ${error.message}`;
      } else {
        errorMessage += 'Tente novamente.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pernoite */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={extraServices.pernoite.enabled}
                onChange={() => handleServiceToggle('pernoite')}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Pernoite</label>
            </div>
            {extraServices.pernoite.enabled && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraServices.pernoite.value}
                  onChange={(e) => handleValueChange('pernoite', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Banho & Tosa */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={extraServices.banho_tosa.enabled}
                onChange={() => handleServiceToggle('banho_tosa')}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Banho & Tosa</label>
            </div>
            {extraServices.banho_tosa.enabled && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraServices.banho_tosa.value}
                  onChange={(e) => handleValueChange('banho_tosa', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Só Banho */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={extraServices.so_banho.enabled}
                onChange={() => handleServiceToggle('so_banho')}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Só Banho</label>
            </div>
            {extraServices.so_banho.enabled && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraServices.so_banho.value}
                  onChange={(e) => handleValueChange('so_banho', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Adestrador */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={extraServices.adestrador.enabled}
                onChange={() => handleServiceToggle('adestrador')}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Adestrador</label>
            </div>
            {extraServices.adestrador.enabled && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraServices.adestrador.value}
                  onChange={(e) => handleValueChange('adestrador', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Despesa Médica */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={extraServices.despesa_medica.enabled}
                onChange={() => handleServiceToggle('despesa_medica')}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">Despesa Médica</label>
            </div>
            {extraServices.despesa_medica.enabled && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraServices.despesa_medica.value}
                  onChange={(e) => handleValueChange('despesa_medica', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Dias Extras */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={extraServices.dias_extras.quantity > 0}
                  onChange={() => handleServiceToggle('dias_extras')}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Dias Extras</label>
              </div>
            </div>
            {extraServices.dias_extras.quantity > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quantidade de dias</label>
                  <input
                    type="number"
                    min="1"
                    value={extraServices.dias_extras.quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Valor por dia (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraServices.dias_extras.value}
                    onChange={(e) => handleValueChange('dias_extras', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500"
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">Total dos Serviços Extras:</span>
              <span className="text-xl font-bold text-pink-600">
                R$ {calculateTotal().toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtraServicesModal;