
import React, { useState, useEffect } from 'react';

interface AdProps {
  type: 'banner' | 'interstitial' | 'rewarded';
  onClose?: () => void;
  onReward?: () => void;
  isVisible: boolean;
  isPremium?: boolean;
}

export const AdPlaceholder: React.FC<AdProps> = ({ type, onClose, onReward, isVisible, isPremium }) => {
  const [countdown, setCountdown] = useState(type === 'rewarded' ? 5 : 2);

  useEffect(() => {
    if (isVisible && (type === 'interstitial' || type === 'rewarded')) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible, type]);

  if (isPremium || !isVisible) return null;

  if (type === 'banner') {
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-800 h-16 flex items-center justify-center border-t border-gray-300 dark:border-gray-700 mt-auto">
        <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
          <i className="fas fa-ad mr-2"></i> Banner Ad Placement
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-center items-center justify-center p-6 text-white text-center">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-4">
            <i className={`fas ${type === 'rewarded' ? 'fa-gift' : 'fa-rocket'}`}></i>
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {type === 'rewarded' ? 'Assista para Desbloquear' : 'Carregando Oferta...'}
          </h2>
          <p className="text-gray-400">
            {type === 'rewarded' 
              ? 'Veja este vídeo rápido para acessar relatórios detalhados.' 
              : 'Espere alguns segundos para fechar este anúncio.'}
          </p>
        </div>

        <div className="relative pt-1">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
            <div 
              style={{ width: `${(1 - countdown / (type === 'rewarded' ? 5 : 2)) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"
            ></div>
          </div>
        </div>

        {countdown === 0 ? (
          <button 
            onClick={() => {
              if (type === 'rewarded' && onReward) onReward();
              if (onClose) onClose();
            }}
            className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            {type === 'rewarded' ? 'Coletar Recompensa' : 'Fechar Anúncio'}
          </button>
        ) : (
          <div className="text-sm font-medium text-gray-500">
            Disponível em {countdown}s...
          </div>
        )}
      </div>
    </div>
  );
};
