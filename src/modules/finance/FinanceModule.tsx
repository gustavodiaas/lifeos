import { useState, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLancamentos } from '@/hooks/useLancamentos';
import { supabase } from '@/lib/supabase';
import { AppleFinanceView } from './components/AppleFinanceView';
import { SpreadsheetTable } from './components/SpreadsheetTable';
import { MonthSummary } from './components/MonthSummary';
import { HorizonView } from './components/HorizonView';
import { TagsView } from './components/TagsView';
import { TransactionModal } from './components/TransactionModal';
import { AlertModal } from './components/AlertModal';
import { FinanceChart } from './components/FinanceChart';
import {
  expandRecorrentes,
  buildDayRows,
  calcSaldoInicial,
  calcSummary,
  formatMonthLabel,
} from '@/lib/finance';
import type { Lancamento, Profile } from '@/lib/supabase';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  Wallet,
  PieChart,
  Layers,
  AlertCircle,
  X,
  Table,
} from 'lucide-react';

function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] md:left-auto md:right-6 md:w-80">
      <div className="bg-red-500 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
        <AlertCircle size={16} className="shrink-0" />
        <span className="text-xs font-bold flex-1">{message}</span>
        <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

type Tab = 'extrato' | 'planilha' | 'totais' | 'tags' | 'horizon';

export function FinanceModule() {
  const { user } = useAuthContext();
  const { lancamentos, setLancamentos, loading, error, add, remove, update } = useLancamentos(user?.id);

  const [perfil, setPerfil] = useState<Profile | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<Tab>('extrato');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPerfil(data);
      });
  }, [user?.id]);

  const expanded = useMemo(() => expandRecorrentes(lancamentos, year, month), [lancamentos, year, month]);
  const saldoInicial = useMemo(
    () => calcSaldoInicial(lancamentos, year, month),
    [lancamentos, year, month]
  );
  const rows = useMemo(() => buildDayRows(expanded, year, month, saldoInicial), [expanded, year, month, saldoInicial]);

  const rawForMonth = useMemo(() => {
    const mmStr = String(month + 1).padStart(2, '0');
    return expanded.filter((l) => (l.data || '').slice(0, 7) === `${year}-${mmStr}`);
  }, [expanded, year, month]);

  const summary = useMemo(
    () => calcSummary(rows, saldoInicial, year, month, perfil?.monthly_income ?? 0),
    [rows, saldoInicial, year, month, perfil]
  );

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const handleSave = async (data: any, mode: 'one' | 'all' = 'one') => {
    setModalError(null);
    try {
      if (editingLancamento) {
        if (mode === 'all' && editingLancamento.grupo_recorrencia_id) {
          const { error: err } = await supabase
            .from('lancamentos')
            .update({
              tipo: data.tipo,
              valor: data.valor,
              descricao: data.descricao,
              categoria: data.categoria,
            })
            .eq('grupo_recorrencia_id', editingLancamento.grupo_recorrencia_id);

          if (err) throw err;
          setLancamentos((prev) =>
            prev.map((l) =>
              l.grupo_recorrencia_id === editingLancamento.grupo_recorrencia_id
                ? { ...l, ...data }
                : l
            )
          );
        } else {
          await update(editingLancamento.id, data);
        }
      } else {
        await add(data);
      }
      setModalOpen(false);
      setEditingLancamento(null);
    } catch (err: any) {
      setModalError(err.message || 'Erro ao salvar lançamento.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await remove(deleteConfirmId);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setToastMessage(err.message || 'Erro ao excluir.');
      setDeleteConfirmId(null);
    }
  };

  const handleRemoveClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleOpenEdit = (l: Lancamento) => {
    setEditingLancamento(l);
    setModalError(null);
    setModalOpen(true);
  };

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  // Cálculos do Apple Card
  const totalIncome = rawForMonth.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0);
  const totalExpense = rawForMonth.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col space-y-4 relative">
      {toastMessage && (
        <ErrorToast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Header Compacto do módulo de Finanças */}
      <div className="glass-card p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 sticky top-0 z-20 backdrop-blur-xl border border-white/10 shadow-sm">
        {/* Navegação de Mês Compacta */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/40">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <span className="text-xs font-black tracking-tight text-foreground min-w-[70px] text-center capitalize">
              {formatMonthLabel(year, month)}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingLancamento(null);
              setModalError(null);
              setModalOpen(true);
            }}
            className="sm:hidden btn-ios text-xs py-1 px-3"
          >
            <Plus size={14} />
            <span>Novo</span>
          </button>
        </div>

        {/* Pílulas de Sub-telas Compactas (Extrato, Totais, Tags, Previsão, Planilha) */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('extrato')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'extrato'
                ? 'bg-foreground text-background shadow-md font-extrabold scale-[1.02]'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Wallet size={13} />
            <span>Extrato</span>
          </button>

          <button
            onClick={() => setActiveTab('totais')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'totais'
                ? 'bg-foreground text-background shadow-md font-extrabold scale-[1.02]'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <PieChart size={13} />
            <span>Totais</span>
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'tags'
                ? 'bg-foreground text-background shadow-md font-extrabold scale-[1.02]'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Layers size={13} />
            <span>Tags</span>
          </button>

          <button
            onClick={() => setActiveTab('horizon')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'horizon'
                ? 'bg-foreground text-background shadow-md font-extrabold scale-[1.02]'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <LayoutGrid size={13} />
            <span>Previsão</span>
          </button>

          <button
            onClick={() => setActiveTab('planilha')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'planilha'
                ? 'bg-foreground text-background shadow-md font-extrabold scale-[1.02]'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Table size={13} />
            <span>Planilha</span>
          </button>

          <button
            onClick={() => {
              setEditingLancamento(null);
              setModalError(null);
              setModalOpen(true);
            }}
            className="hidden sm:flex btn-ios text-xs py-1.5 px-3.5 ml-2 shrink-0 shadow-sm active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="space-y-4">
        {!loading && rawForMonth.length > 0 && activeTab !== 'extrato' && (
          <FinanceChart transactions={rawForMonth} />
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-semibold">Sincronizando finanças...</p>
          </div>
        ) : (
          <>
            {activeTab === 'extrato' && (
              <AppleFinanceView
                transactions={rawForMonth}
                income={totalIncome}
                expense={totalExpense}
                balance={netBalance}
                onNewTransaction={() => {
                  setEditingLancamento(null);
                  setModalError(null);
                  setModalOpen(true);
                }}
                onEditTransaction={handleOpenEdit}
                onDeleteTransaction={handleRemoveClick}
              />
            )}
            {activeTab === 'planilha' && (
              <SpreadsheetTable rows={rows} today={today} onDelete={handleRemoveClick} onEdit={handleOpenEdit} />
            )}
            {activeTab === 'horizon' && (
              <HorizonView lancamentos={lancamentos} currentMonth={month} currentYear={year} />
            )}
            {activeTab === 'totais' && (
              <MonthSummary summary={summary} selectedMonth={month} selectedYear={year} />
            )}
            {activeTab === 'tags' && <TagsView rows={rows} />}
          </>
        )}
      </div>

      {/* Modal de Lançamento */}
      <TransactionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingLancamento(null);
        }}
        onSave={handleSave}
        defaultDate={defaultDate}
        editingTransaction={editingLancamento}
        error={modalError}
      />

      {/* Modal de Alerta para Exclusão */}
      <AlertModal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Lançamento?"
        message="Tem certeza que deseja excluir este lançamento financeiro?"
        type="danger"
        confirmText="Sim, Excluir"
      />
    </div>
  );
}
