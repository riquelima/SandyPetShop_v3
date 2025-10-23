import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-pink-600 mb-4">
          Sandy's Pet Shop
        </h1>
        <p className="text-lg text-gray-700">
          Aplicação funcionando corretamente!
        </p>
        <div className="mt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Teste de carregamento</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;