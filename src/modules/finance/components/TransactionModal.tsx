import { useState, useEffect } from 'react';
import { X, Save, Repeat, AlertCircle } from 'lucide-react';
import type { Lancamento } from '@/lib/supabase';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { CustomDatePicker } from '@/components/ui/CustomDatePicker';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any, mode?: 'one' | 'all') => void;
  defaultDate: string;
  editingTransaction?: Lancamento | null;
  error?: string | null;
}

const CATEGORY_OPTIONS = [
  { value: 'diario', label: 'Gasto Diário (Variável)' },
  { value: 'fixo', label: 'Custo Fixo (Essencial)' },
  { value: 'investimento', label: 'Investimento (Patrimônio)' },
];

export function TransactionModal({ open, onClose, onSave, defaultDate, editingTransaction, error }: Props) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('diario');
  const [data, setData] = useState(defaultDate);
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [showRecChoice, setShowRecChoice] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  useEffect(() => {
    if (editingTransaction) {
      setTipo(editingTransaction.tipo);
      setValor(editingTransaction.valor?.toString().replace('.', ',') || '');
      setDescricao(editingTransaction.descricao || '');
      setCategoria(editingTransaction.categoria || 'diario');
      setData(editingTransaction.data || defaultDate);
      setIsRecorrente(editingTransaction.is_recorrente || false);
    } else {
      setValor('');
      setDescricao('');
      setCategoria('diario');
      setTipo('saida');
      setData(defaultDate);
      setIsRecorrente(false);
    }
    setShowRecChoice(false);
    setPendingData(null);
  }, [editingTransaction, defaultDate, open]);

  if (!open) return null;

  const buildPayload = () => ({
    id: editingTransaction?.id,
    tipo,
    valor: parseFloat(valor.replace(',', '.')),
    descricao: descricao.trim(),
    categoria: tipo === 'entrada' ? null : categoria,
    data,
    is_recorrente: isRecorrente,
    grupo_recorrencia_id: editingTransaction?.grupo_recorrencia_id || (isRecorrente ? crypto.randomUUID() : null),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || parseFloat(valor.replace(',', '.')) <= 0) return;

    const payload = buildPayload();

    if (editingTransaction && editingTransaction.is_recorrente && editingTransaction.grupo_recorrencia_id) {
      setPendingData(payload);
      setShowRecChoice(true);
    } else {
      onSave(payload);
    }
  };

  const handleValorChange = (val: string) => {
    const clean = val.replace(/[^0-9,]/g, '');
    setValor(clean);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 fade-in">
      <div className="bg-card w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-border overflow-hidden slide-up">
        <div className="flex items-center justify-between p-6 border-b border-border/60">
          <h2 className="text-base font-extrabold text-foreground tracking-tight">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {showRecChoice ? (
          <div className="p-6 space-y-4">
            <p className="text-sm font-bold text-foreground text-center">
              Este lançamento é recorrente. Deseja alterar apenas este mês ou todos os futuros?
            </p>
            <button
              onClick={() => { onSave(pendingData, 'one'); }}
              className="w-full py-4 bg-muted rounded-2xl font-bold text-sm text-foreground border border-border hover:border-[#FCA311] transition-all"
            >
              Só este mês
            </button>
            <button
              onClick={() => { onSave(pendingData, 'all'); }}
              className="w-full py-4 bg-[#FCA311] text-black rounded-2xl font-black text-sm active:scale-95 transition-all shadow-md shadow-[#FCA311]/30"
            >
              Todos os futuros
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-2xl border border-border/50">
              <button
                type="button"
                onClick={() => setTipo('saida')}
                className={`py-3 rounded-xl font-bold text-xs transition-all ${
                  tipo === 'saida' ? 'bg-red-500 text-white shadow-sm font-black' : 'text-muted-foreground'
                }`}
              >
                Saída (Gasto)
              </button>
              <button
                type="button"
                onClick={() => setTipo('entrada')}
                className={`py-3 rounded-xl font-bold text-xs transition-all ${
                  tipo === 'entrada' ? 'bg-emerald-500 text-white shadow-sm font-black' : 'text-muted-foreground'
                }`}
              >
                Entrada (Receita)
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => handleValorChange(e.target.value)}
                  placeholder="0,00"
                  className="input-ios text-2xl font-black"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
                  Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Aluguel, Mercado..."
                  className="input-ios text-sm font-semibold"
                  required
                />
              </div>

              <CustomDatePicker
                label="Data do Lançamento"
                value={data}
                onChange={setData}
              />

              <button
                type="button"
                onClick={() => setIsRecorrente(!isRecorrente)}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between border-2 transition-all ${
                  isRecorrente
                    ? 'bg-amber-500/15 border-[#FCA311] text-[#FCA311]'
                    : 'bg-muted/40 border-border/50 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Repeat size={18} strokeWidth={isRecorrente ? 2.5 : 1.75} />
                  <span className="text-xs font-bold uppercase tracking-wider">Lançamento Fixo Mensal</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    isRecorrente ? 'bg-[#FCA311] border-[#FCA311]' : 'border-border'
                  }`}
                />
              </button>

              {tipo === 'saida' && (
                <div>
                  <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
                    Categoria
                  </label>
                  <CustomSelect
                    options={CATEGORY_OPTIONS}
                    value={categoria}
                    onChange={setCategoria}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/15 border border-red-500/30 rounded-2xl">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span className="text-xs font-bold text-red-500">{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-ios w-full py-4 text-xs uppercase tracking-widest font-black"
            >
              <Save size={18} />
              <span>{editingTransaction ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
