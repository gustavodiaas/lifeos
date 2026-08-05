import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useLancamentos } from '@/hooks/useLancamentos';
import { supabase } from '@/lib/supabase';
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
} from 'lucide-react';

// Toast de erro simples
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

type Tab = 'saldos' | 'totais' | 'tags' | 'horizon';

export function FinanceModule() {
  const { user } = useAuthContext();
  const { lancamentos, setLancamentos, loading, error, add, remove, update } = useLancamentos(user?.id);

  const [perfil, setPerfil] = useState<Profile | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<Tab>('saldos');
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

  const expanded = useMemo(() => expandRecorrentes(lancamentos), [lancamentos]);
  const saldoInicial = useMemo(
    () => calcSaldoInicial(expanded, year, month, perfil?.monthly_income ?? 0),
    [expanded, year, month, perfil]
  );
  const rows = useMemo(() => buildDayRows(expanded, year, month, saldoInicial), [expanded, year, month, saldoInicial]);

  const rawForMonth = useMemo(() => {
    const mmStr = String(month + 1).padStart(2, '0');
    return expanded.filter((l) => l.data.startsWith(`${year}-${mmStr}`));
  }, [expanded, year, month]);

  const summary = useMemo(() => calcSummary(rawForMonth), [rawForMonth]);

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

  return (
    <div className="flex flex-col h-full relative space-y-4 pb-12">
      {toastMessage && (
        <ErrorToast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Header do módulo com Seleção de Mês e Pílulas de Navegação */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-10">
        {/* Navegação de mês */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <span className="text-base font-black tracking-tight text-foreground min-w-[70px] text-center capitalize">
            {formatMonthLabel(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Pílulas de Abas do Módulo (Saldos, Totais, Tags, Horizonte) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('saldos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'saldos'
                ? 'bg-[#FCA311] text-black shadow-sm font-extrabold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Wallet size={14} />
            <span>Saldos</span>
          </button>

          <button
            onClick={() => setActiveTab('totais')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'totais'
                ? 'bg-[#FCA311] text-black shadow-sm font-extrabold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <PieChart size={14} />
            <span>Totais</span>
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tags'
                ? 'bg-[#FCA311] text-black shadow-sm font-extrabold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Layers size={14} />
            <span>Tags</span>
          </button>

          <button
            onClick={() => setActiveTab('horizon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'horizon'
                ? 'bg-[#FCA311] text-black shadow-sm font-extrabold'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Horizonte</span>
          </button>

          <button
            onClick={() => {
              setEditingLancamento(null);
              setModalError(null);
              setModalOpen(true);
            }}
            className="btn-ios text-xs py-1.5 px-3.5 ml-2"
          >
            <Plus size={14} />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {!loading && lancamentos.length > 0 && (
          <FinanceChart transactions={lancamentos} />
        )}

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-[#FCA311] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Sincronizando...</p>
          </div>
        ) : (
          <>
            {activeTab === 'saldos' && (
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
