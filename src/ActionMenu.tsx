import React from 'react';

const ActionMenu: React.FC<{ 
    isOpen: boolean;
    position: { top: number; left: number };
    onClose: () => void;
    onAddObservation: () => void;
    onAddExtraServices: () => void;
}> = ({ isOpen, position, onClose, onAddObservation, onAddExtraServices }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed bg-white rounded-md shadow-lg border border-gray-200 animate-fadeIn"
            style={{ top: position.top, left: position.left, zIndex: 9999 }}
        >
            <div className="py-1">
                <button 
                    onClick={onAddObservation}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    Adicionar Observação
                </button>
                <button 
                    onClick={onAddExtraServices}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                    Adicionar Serviço Extra
                </button>
            </div>
        </div>
    );
};

export default ActionMenu;