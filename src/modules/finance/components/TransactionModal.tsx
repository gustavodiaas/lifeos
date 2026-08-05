import { useState, useEffect } from 'react';
import { X, Save, Repeat, AlertCircle } from 'lucide-react';
import type { Lancamento } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: any, mode?: 'one' | 'all') => void;
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
    descricao,
    categoria: tipo === 'saida' ? categoria : 'entrada',
    data,
    is_recorrente: isRecorrente,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(numValor)) return;

    const payload = buildPayload();

    // Se é uma edição de lançamento recorrente original, pergunta ao usuário
    if (editingTransaction?.is_recorrente && editingTransaction?.id && !editingTransaction.id.includes('-rec-')) {
      setPendingData(payload);
      setShowRecChoice(true);
      return;
    }

    onSave(payload);
  };

  const handleValorChange = (val: string) => {
    setValor(val.replace(/[^0-9.,]/g, ''));
  };

  return (
    <div className="fixed inset-0 bg-[#0a1128]/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-[#0a1128] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-transparent dark:border-gray-800 transition-colors duration-300">

        {/* Painel de escolha para recorrentes */}
        {showRecChoice && pendingData ? (
          <div className="p-8 flex flex-col gap-4">
            <h2 className="text-xl font-black text-[#0a1128] dark:text-white tracking-tighter">
              Editar Lançamento Fixo
            </h2>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500">
              Este é um lançamento fixo mensal. Deseja editar apenas esta ocorrência ou todas as futuras?
            </p>
            <button
              onClick={() => { onSave(pendingData, 'one'); }}
              className="w-full py-4 bg-gray-50 dark:bg-[#111827] rounded-2xl font-black text-sm text-[#0a1128] dark:text-white border-2 border-transparent hover:border-[#FCA311] transition-all"
            >
              Só este mês
            </button>
            <button
              onClick={() => { onSave(pendingData, 'all'); }}
              className="w-full py-4 bg-[#FCA311] text-white rounded-2xl font-black text-sm active:scale-95 transition-all"
            >
              Todos os futuros
            </button>
            <button
              onClick={() => { setShowRecChoice(false); setPendingData(null); }}
              className="w-full py-3 font-black text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-[#0a1128] dark:text-white tracking-tighter">
                {editingTransaction ? 'Editar Registro' : 'Novo Registro'}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 active:scale-95 transition-all"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="flex p-1 bg-gray-100 dark:bg-[#111827] rounded-2xl transition-colors">
                <button
                  type="button"
                  onClick={() => setTipo('saida')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipo === 'saida' ? 'bg-white dark:bg-gray-800 text-red-500 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('entrada')}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipo === 'entrada' ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                >
                  Entrada
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest ml-2 mb-1 block">Valor</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => handleValorChange(e.target.value)}
                    placeholder="0,00"
                    className="w-full p-4 bg-gray-50 dark:bg-[#111827] border-2 border-transparent focus:border-[#FCA311] dark:focus:border-[#FCA311] rounded-2xl text-2xl font-black outline-none transition-all text-[#0a1128] dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest ml-2 mb-1 block">Descrição</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Aluguel, Mercado..."
                    className="w-full p-4 bg-gray-50 dark:bg-[#111827] border-2 border-transparent focus:border-[#FCA311] rounded-2xl text-sm font-bold outline-none transition-all text-[#0a1128] dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest ml-2 mb-1 block">Data do Lançamento</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full h-[58px] px-4 bg-gray-50 dark:bg-[#111827] border-2 border-transparent focus:border-[#FCA311] rounded-2xl text-sm font-bold outline-none transition-all text-[#0a1128] dark:text-white appearance-none"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsRecorrente(!isRecorrente)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${isRecorrente ? 'bg-orange-50 dark:bg-orange-500/10 border-[#FCA311] text-[#FCA311]' : 'bg-gray-50 dark:bg-[#111827] border-transparent text-gray-400 dark:text-gray-500'}`}
                >
                  <div className="flex items-center gap-3">
                    <Repeat size={20} strokeWidth={isRecorrente ? 3 : 2} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Lançamento Fixo Mensal</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${isRecorrente ? 'bg-[#FCA311] border-[#FCA311]' : 'border-gray-300 dark:border-gray-600'}`} />
                </button>

                {tipo === 'saida' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest ml-2 mb-1 block">Categoria</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full p-4 bg-gray-50 dark:bg-[#111827] border-2 border-transparent focus:border-[#FCA311] rounded-2xl text-sm font-bold outline-none transition-all appearance-none text-[#0a1128] dark:text-white"
                    >
                      <option value="diario">Gasto Diário (Variável)</option>
                      <option value="fixo">Custo Fixo (Essencial)</option>
                      <option value="investimento">Investimento (Patrimônio)</option>
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span className="text-xs font-bold text-red-500">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-5 bg-[#FCA311] text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {editingTransaction ? 'Atualizar Dados' : 'Confirmar Lançamento'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
