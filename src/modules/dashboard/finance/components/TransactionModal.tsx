import { useState, useEffect } from 'react';
import { X, Save, Repeat, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Lancamento } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  defaultDate: string;
  editingTransaction?: Lancamento | null;
  error?: string | null;
}

export function TransactionModal({ open, onClose, onSave, defaultDate, editingTransaction, error }: Props) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('diario');
  const [data, setData] = useState(defaultDate);
  const [isRecorrente, setIsRecorrente] = useState(false);

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
  }, [editingTransaction, defaultDate, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(numValor)) return;
    onSave({
      id: editingTransaction?.id,
      tipo,
      valor: numValor,
      descricao,
      categoria: tipo === 'saida' ? categoria : 'entrada',
      data,
      is_recorrente: isRecorrente,
    });
  };

  const handleValorChange = (val: string) => {
    setValor(val.replace(/[^0-9.,]/g, ''));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-background w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-border">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="text-base font-black text-foreground tracking-tight">
            {editingTransaction ? 'Editar Registro' : 'Novo Registro'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Tipo */}
          <div className="flex p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => setTipo('saida')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                tipo === 'saida' ? 'bg-background text-red-500 shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                tipo === 'entrada' ? 'bg-background text-emerald-500 shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Entrada
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
              Valor
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="0,00"
              className="w-full p-4 bg-muted border-2 border-transparent focus:border-primary rounded-xl text-2xl font-black outline-none transition-all text-foreground"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
              Descrição
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aluguel, Mercado..."
              className="w-full p-3.5 bg-muted border-2 border-transparent focus:border-primary rounded-xl text-sm font-bold outline-none transition-all text-foreground"
              required
            />
          </div>

          {/* Data */}
          <div>
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
              Data
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full h-[52px] px-4 bg-muted border-2 border-transparent focus:border-primary rounded-xl text-sm font-bold outline-none transition-all text-foreground appearance-none"
              required
            />
          </div>

          {/* Recorrente */}
          <button
            type="button"
            onClick={() => setIsRecorrente(!isRecorrente)}
            className={`w-full p-3.5 rounded-xl flex items-center justify-between border-2 transition-all ${
              isRecorrente
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-muted border-transparent text-muted-foreground'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Repeat size={18} strokeWidth={isRecorrente ? 2.5 : 2} />
              <span className="text-[10px] font-black uppercase tracking-widest">Fixo Mensal</span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                isRecorrente ? 'bg-primary border-primary' : 'border-muted-foreground'
              }`}
            />
          </button>

          {/* Categoria (só saída) */}
          {tipo === 'saida' && (
            <div>
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-3.5 bg-muted border-2 border-transparent focus:border-primary rounded-xl text-sm font-bold outline-none transition-all appearance-none text-foreground"
              >
                <option value="diario">Gasto Diário (Variável)</option>
                <option value="fixo">Custo Fixo (Essencial)</option>
                <option value="investimento">Investimento (Patrimônio)</option>
              </select>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
              <AlertCircle size={15} className="text-destructive shrink-0" />
              <span className="text-xs font-bold text-destructive">{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full h-12 font-black text-xs uppercase tracking-widest">
            <Save size={16} className="mr-2" />
            {editingTransaction ? 'Atualizar' : 'Confirmar Lançamento'}
          </Button>
        </form>
      </div>
    </div>
  );
}
