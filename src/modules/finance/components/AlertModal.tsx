import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

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
    <ModalPortal open={open} onClose={onClose}>
      <div className="bg-white/90 dark:bg-[#212121]/90 backdrop-blur-xl w-full max-w-xs rounded-[28px] shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 transition-colors slide-up">
        <div className="p-7 flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              type === 'danger'
                ? 'bg-red-500/10 text-red-500'
                : 'bg-foreground/15 text-foreground'
            }`}
          >
            {type === 'danger' ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
          </div>

          <h3 className="text-lg font-bold text-foreground tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex flex-col w-full gap-2.5">
            {onConfirm && (
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ios-spring ${
                  type === 'danger'
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                    : 'bg-foreground text-background shadow-md shadow-black/20
                }`}
              >
                {confirmText || 'Confirmar'}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {onConfirm ? 'Cancelar' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
