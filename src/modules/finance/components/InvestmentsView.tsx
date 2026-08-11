import { useState, useEffect, useMemo } from 'react';
import { formatBRL } from '@/lib/date';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RefreshCw,
  Coins,
  Building2,
  DollarSign,
  Landmark,
  Sparkles,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

export interface InvestmentAsset {
  id: string;
  ticker: string; // Ex: PETR4, BTC, USD, HGLG11, CDB 120%
  name: string;
  type: 'acao' | 'fii' | 'cripto' | 'renda_fixa' | 'moeda';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

const DEFAULT_ASSETS: InvestmentAsset[] = [
  {
    id: '1',
    ticker: 'BTC',
    name: 'Bitcoin',
    type: 'cripto',
    quantity: 0.025,
    averagePrice: 320000,
    currentPrice: 355000,
  },
  {
    id: '2',
    ticker: 'USD',
    name: 'Dólar Comercial',
    type: 'moeda',
    quantity: 500,
    averagePrice: 5.15,
    currentPrice: 5.45,
  },
  {
    id: '3',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: 'acao',
    quantity: 100,
    averagePrice: 34.5,
    currentPrice: 38.2,
  },
  {
    id: '4',
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    type: 'fii',
    quantity: 30,
    averagePrice: 158.0,
    currentPrice: 164.5,
  },
  {
    id: '5',
    ticker: 'CDB 120% CDI',
    name: 'CDB Banco Sofisa',
    type: 'renda_fixa',
    quantity: 1,
    averagePrice: 5000,
    currentPrice: 5420,
  },
];

const ASSET_TYPES = [
  { value: 'acao', label: 'Ação (B3)', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10' },
  { value: 'fii', label: 'Fundo Imobiliário (FII)', icon: Building2, color: 'text-blue-500 bg-blue-500/10' },
  { value: 'cripto', label: 'Criptomoeda', icon: Coins, color: 'text-amber-500 bg-amber-500/10' },
  { value: 'moeda', label: 'Moeda Estrangeira', icon: DollarSign, color: 'text-purple-500 bg-purple-500/10' },
  { value: 'renda_fixa', label: 'Renda Fixa / Tesouro', icon: Landmark, color: 'text-rose-500 bg-rose-500/10' },
] as const;

interface RealtimeRates {
  USDBRL?: number;
  EURBRL?: number;
  BTCBRL?: number;
  ETHBRL?: number;
}

export function InvestmentsView() {
  const [assets, setAssets] = useState<InvestmentAsset[]>(() => {
    try {
      const saved = localStorage.getItem('lifeos_investments');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ASSETS;
  });

  const [rates, setRates] = useState<RealtimeRates>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Formulário de Novo Ativo
  const [showAddForm, setShowAddForm] = useState(false);
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentAsset['type']>('acao');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPriceInput, setCurrentPriceInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('lifeos_investments', JSON.stringify(assets));
  }, [assets]);

  // Buscar cotações em tempo real via AwesomeAPI (Dólar, Euro, BTC, ETH)
  const fetchQuotes = async () => {
    setLoadingQuotes(true);
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL');
      if (!res.ok) throw new Error('Falha ao obter cotações');
      const data = await res.json();

      const newRates: RealtimeRates = {
        USDBRL: parseFloat(data.USDBRL?.bid || '5.45'),
        EURBRL: parseFloat(data.EURBRL?.bid || '5.95'),
        BTCBRL: parseFloat(data.BTCBRL?.bid || '355000'),
        ETHBRL: parseFloat(data.ETHBRL?.bid || '16500'),
      };
      setRates(newRates);

      // Atualizar preços dos ativos da carteira se baterem com moedas/cripto
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.ticker === 'USD' && newRates.USDBRL) return { ...asset, currentPrice: newRates.USDBRL };
          if (asset.ticker === 'EUR' && newRates.EURBRL) return { ...asset, currentPrice: newRates.EURBRL };
          if (asset.ticker === 'BTC' && newRates.BTCBRL) return { ...asset, currentPrice: newRates.BTCBRL };
          if (asset.ticker === 'ETH' && newRates.ETHBRL) return { ...asset, currentPrice: newRates.ETHBRL };
          return asset;
        })
      );
      toast.success('Cotações em tempo real atualizadas!');
    } catch {
      toast.error('Erro ao buscar cotações em tempo real.');
    } finally {
      setLoadingQuotes(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  // Cálculos consolidados da carteira
  const totals = useMemo(() => {
    let totalInvested = 0;
    let currentValue = 0;

    assets.forEach((a) => {
      totalInvested += a.quantity * a.averagePrice;
      currentValue += a.quantity * a.currentPrice;
    });

    const profitBrl = currentValue - totalInvested;
    const profitPct = totalInvested > 0 ? (profitBrl / totalInvested) * 100 : 0;

    return { totalInvested, currentValue, profitBrl, profitPct };
  }, [assets]);

  // Adicionar novo ativo
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity.replace(',', '.'));
    const avgNum = parseFloat(avgPrice.replace(',', '.'));
    const curNum = parseFloat(currentPriceInput.replace(',', '.')) || avgNum;

    if (!ticker.trim() || isNaN(qtyNum) || isNaN(avgNum) || qtyNum <= 0 || avgNum <= 0) {
      toast.error('Preencha os campos de ticker, quantidade e preço médio corretamente.');
      return;
    }

    const newAsset: InvestmentAsset = {
      id: crypto.randomUUID(),
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || ticker.trim().toUpperCase(),
      type,
      quantity: qtyNum,
      averagePrice: avgNum,
      currentPrice: curNum,
    };

    setAssets((prev) => [newAsset, ...prev]);
    setShowAddForm(false);
    setTicker('');
    setName('');
    setQuantity('');
    setAvgPrice('');
    setCurrentPriceInput('');
    toast.success(`Ativo ${newAsset.ticker} adicionado à carteira!`);
  };

  const handleRemoveAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success('Ativo removido.');
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (a) =>
        a.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assets, searchQuery]);

  return (
    <div className="space-y-5 fade-in pb-8">
      {/* ── 1. Ticker de Cotações em Tempo Real (AwesomeAPI) ───────────── */}
      <div className="glass-card p-3 rounded-2xl border border-border/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            <span className="text-xs font-black text-foreground tracking-tight uppercase">
              Cotações em Tempo Real
            </span>
          </div>
          <button
            onClick={fetchQuotes}
            disabled={loadingQuotes}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/60 hover:bg-muted text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            <RefreshCw size={12} className={cn(loadingQuotes && 'animate-spin')} />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[10px] font-extrabold text-muted-foreground block">USD/BRL (Dólar)</span>
            <span className="text-sm font-black text-foreground">{rates.USDBRL ? `R$ ${rates.USDBRL.toFixed(2)}` : 'R$ 5.45'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[10px] font-extrabold text-muted-foreground block">EUR/BRL (Euro)</span>
            <span className="text-sm font-black text-foreground">{rates.EURBRL ? `R$ ${rates.EURBRL.toFixed(2)}` : 'R$ 5.95'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[10px] font-extrabold text-muted-foreground block">BTC/BRL (Bitcoin)</span>
            <span className="text-sm font-black text-foreground">{rates.BTCBRL ? formatBRL(rates.BTCBRL) : 'R$ 355.000'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-[10px] font-extrabold text-muted-foreground block">ETH/BRL (Ethereum)</span>
            <span className="text-sm font-black text-foreground">{rates.ETHBRL ? formatBRL(rates.ETHBRL) : 'R$ 16.500'}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Cards Consolidados de Rendimento da Carteira ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-2xl border border-border/60 space-y-1">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
            Patrimônio Atual
          </span>
          <p className="text-2xl font-black text-foreground">{formatBRL(totals.currentValue)}</p>
          <span className="text-[10px] text-muted-foreground font-medium block">
            Total investido: {formatBRL(totals.totalInvested)}
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-border/60 space-y-1">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
            Rendimento Total (P&L)
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-2xl font-black',
                totals.profitBrl >= 0 ? 'text-emerald-500' : 'text-red-500'
              )}
            >
              {totals.profitBrl >= 0 ? `+${formatBRL(totals.profitBrl)}` : formatBRL(totals.profitBrl)}
            </span>
            <span
              className={cn(
                'text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 border',
                totals.profitBrl >= 0
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-500 border-red-500/30'
              )}
            >
              {totals.profitBrl >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {totals.profitPct.toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium block">
            Lucro/Prejuízo sobre o custo médio
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-border/60 space-y-1 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
              Ativos Cadastrados
            </span>
            <p className="text-xl font-black text-foreground">{assets.length} ativos na carteira</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-ios text-xs py-2 px-3 w-full"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Adicionar Ativo</span>
          </button>
        </div>
      </div>

      {/* ── 3. Formulário Modal / Collapsible para Adicionar Ativo ───────── */}
      {showAddForm && (
        <form
          onSubmit={handleAddAsset}
          className="glass-card p-5 rounded-3xl border border-border space-y-4 fade-in"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <h3 className="text-sm font-extrabold text-foreground">Novo Ativo no Portfolio</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="input-ios py-2.5 text-xs font-bold w-full"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-card text-foreground">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Ticker / Código
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="Ex: PETR4, BTC, HGLG11"
                className="input-ios py-2 text-xs font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Nome do Ativo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Petrobras, Bitcoin"
                className="input-ios py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Quantidade
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^0-9,.]/g, ''))}
                placeholder="Ex: 100 ou 0.05"
                className="input-ios py-2 text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Preço Médio (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value.replace(/[^0-9,.]/g, ''))}
                placeholder="Ex: 34.50"
                className="input-ios py-2 text-xs font-bold"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Preço Atual (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentPriceInput}
                onChange={(e) => setCurrentPriceInput(e.target.value.replace(/[^0-9,.]/g, ''))}
                placeholder="Ex: 38.20 (opcional)"
                className="input-ios py-2 text-xs font-bold"
              />
            </div>
          </div>

          <button type="submit" className="btn-ios w-full py-3 text-xs font-black uppercase tracking-wider">
            <Plus size={15} />
            <span>Confirmar Ativo</span>
          </button>
        </form>
      )}

      {/* ── 4. Tabela de Ativos da Carteira ────────────────────────────── */}
      <div className="glass-card p-4 rounded-3xl border border-border/60 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <PieChart size={18} className="text-foreground" />
            <h3 className="text-sm font-extrabold text-foreground">Composição da Carteira</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ativo..."
              className="input-ios pl-9 py-1.5 text-xs w-full"
            />
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs font-medium">
            Nenhum ativo encontrado na carteira.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-[10px] font-extrabold uppercase text-muted-foreground">
                  <th className="py-2 px-3">Ativo</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3 text-right">Qtd</th>
                  <th className="py-2 px-3 text-right">Preço Médio</th>
                  <th className="py-2 px-3 text-right">Preço Atual</th>
                  <th className="py-2 px-3 text-right">Valor Total</th>
                  <th className="py-2 px-3 text-right">Lucro/Prejuízo</th>
                  <th className="py-2 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-semibold">
                {filteredAssets.map((asset) => {
                  const invested = asset.quantity * asset.averagePrice;
                  const currentVal = asset.quantity * asset.currentPrice;
                  const profitBrl = currentVal - invested;
                  const profitPct = invested > 0 ? (profitBrl / invested) * 100 : 0;
                  const typeMeta = ASSET_TYPES.find((t) => t.value === asset.type) || ASSET_TYPES[0];

                  return (
                    <tr key={asset.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-extrabold text-foreground block text-sm">{asset.ticker}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{asset.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full border', typeMeta.color)}>
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">{asset.quantity}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{formatBRL(asset.averagePrice)}</td>
                      <td className="py-3 px-3 text-right text-foreground font-extrabold">{formatBRL(asset.currentPrice)}</td>
                      <td className="py-3 px-3 text-right font-black text-foreground">{formatBRL(currentVal)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn('font-extrabold', profitBrl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                            {profitBrl >= 0 ? `+${formatBRL(profitBrl)}` : formatBRL(profitBrl)}
                          </span>
                          <span className={cn('text-[10px] font-bold', profitBrl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                            {profitPct.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleRemoveAsset(asset.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-muted transition-colors"
                          title="Remover Ativo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
