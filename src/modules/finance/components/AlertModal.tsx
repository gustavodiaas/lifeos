import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'success' | 'info';
  confirmText?: string;
}

export function AlertModal({ open, onClose, onConfirm, title, message, type = 'info', confirmText }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-[#0a1128]/60 dark:bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="bg-white dark:bg-[#0a1128] w-full max-w-xs rounded-[32px] shadow-2xl overflow-hidden border border-transparent dark:border-gray-800 transition-colors">
        <div className="p-8 flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${
              type === 'danger'
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                : 'bg-orange-50 dark:bg-orange-500/10 text-[#ff4d00]'
            }`}
          >
            {type === 'danger' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
          </div>

          <h3 className="text-xl font-black text-[#0a1128] dark:text-white tracking-tighter mb-2 transition-colors">
            {title}
          </h3>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 leading-relaxed mb-8 transition-colors">
            {message}
          </p>

          <div className="flex flex-col w-full gap-3">
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                  type === 'danger' ? 'bg-red-500 text-white' : 'bg-[#ff4d00] text-white'
                }`}
              >
                {confirmText || 'Confirmar'}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              {onConfirm ? 'Cancelar' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
