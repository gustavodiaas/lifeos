import { useState, useMemo, useCallback } from 'react';
import { useLancamentos } from '@/hooks/useLancamentos';
import { SpreadsheetTable } from './components/SpreadsheetTable';
import { MonthSummary } from './components/MonthSummary';
import { HorizonView } from './components/HorizonView';
import { TagsView } from './components/TagsView';
import { TransactionModal } from './components/TransactionModal';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { expandRecorrentes, buildDayRows, calcSaldoInicial, calcSummary, formatMonthLabel } from '@/lib/finance';
import type { Lancamento } from '@/lib/supabase';
import {
  ChevronLeft, ChevronRight, Plus, LayoutGrid,
  Wallet, PieChart, Layers, AlertCircle, X,
} from 'lucide-react';
import { useEffect } from 'react';

// Toast de erro simples
function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] md:left-auto md:right-6 md:w-80">
      <div className="bg-destructive text-destructive-foreground rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
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
  const { lancamentos, setLancamentos, loading, error, add, remove, update } = useLancamentos();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<Tab>('saldos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Lancamento | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    if (error && !modalOpen) setToastMessage(error);
    if (error && modalOpen) setModalError(error);
  }, [error, modalOpen]);

  const prevMonth = useCallback(
    () => setMonth((m) => (m === 0 ? (setYear((y) => y - 1), 11) : m - 1)),
    [],
  );
  const nextMonth = useCallback(
    () => setMonth((m) => (m === 11 ? (setYear((y) => y + 1), 0) : m + 1)),
    [],
  );

  const saldoInicial = useMemo(() => calcSaldoInicial(lancamentos, year, month), [lancamentos, year, month]);
  const expanded = useMemo(() => expandRecorrentes(lancamentos, year, month), [lancamentos, year, month]);
  const rows = useMemo(() => buildDayRows(expanded, year, month, saldoInicial), [expanded, year, month, saldoInicial]);
  const summary = useMemo(() => calcSummary(rows, saldoInicial, year, month), [rows, saldoInicial, year, month]);

  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const handleOpenEdit = (transaction: Lancamento) => {
    setModalError(null);
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
    setModalError(null);
  };

  const handleSave = async (data: any) => {
    setModalError(null);
    const sucesso = data.id ? await update(data.id, data) : await add(data);
    if (sucesso) handleCloseModal();
  };

  const handleRemoveClick = (id: string) => {
    setDeleteConfig({ open: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfig.id) await remove(deleteConfig.id);
    setDeleteConfig({ open: false, id: null });
  };

  return (
    <div className="flex flex-col h-full relative">
      {toastMessage && (
        <ErrorToast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}

      {/* Header do módulo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
        {/* Navegação de mês */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <span className="text-base font-black tracking-tight text-foreground min-w-[60px] text-center">
            {formatMonthLabel(year, month)}
          </span>
          <button
            onClick={nextMonth}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Toggle horizon view */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab((t) => (t === 'horizon' ? 'saldos' : 'horizon'))}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              activeTab === 'horizon'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Visão Horizonte"
          >
            <LayoutGrid size={16} />
          </button>

          {/* Botão novo lançamento (desktop) */}
          <button
            onClick={() => { setModalError(null); setModalOpen(true); }}
            className="hidden md:flex items-center gap-1.5 h-8 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Novo
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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

      {/* Bottom nav do módulo (mobile) */}
      <nav className="md:hidden flex items-center justify-around px-2 py-2 bg-background border-t border-border fixed bottom-16 inset-x-0 z-30">
        <button
          onClick={() => setActiveTab('saldos')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-black uppercase transition-colors ${
            activeTab === 'saldos' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Wallet size={20} />
          <span>Saldos</span>
        </button>
        <button
          onClick={() => setActiveTab('totais')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-black uppercase transition-colors ${
            activeTab === 'totais' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <PieChart size={20} />
          <span>Totais</span>
        </button>

        {/* FAB central */}
        <div className="relative">
          <button
            onClick={() => { setModalError(null); setModalOpen(true); }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all border-4 border-background"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('tags')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-black uppercase transition-colors ${
            activeTab === 'tags' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Layers size={20} />
          <span>Tags</span>
        </button>
        <div className="w-16" /> {/* espaço para equilibrar o FAB */}
      </nav>

      {/* Desktop tab bar */}
      <div className="hidden md:flex border-t border-border bg-background px-4 gap-1 py-1">
        {([
          { key: 'saldos', label: 'Saldos', icon: Wallet },
          { key: 'totais', label: 'Totais', icon: PieChart },
          { key: 'tags', label: 'Categorias', icon: Layers },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-colors ${
              activeTab === key
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Modal de lançamento */}
      <TransactionModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        defaultDate={today}
        editingTransaction={editingTransaction}
        error={modalError}
      />

      {/* Confirm delete */}
      <DeleteConfirmDialog
        open={deleteConfig.open}
        onClose={() => setDeleteConfig({ open: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
