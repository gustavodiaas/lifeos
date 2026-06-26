import type { Lancamento } from './supabase';

export interface SummaryData {
  rendaReal: number;
  custoVida: number;
  gastosDiarios: number;
  investimentos: number;
  totalSaidas: number;
  economizado: number;
  saldoFinal: number;
  porcentagemEconomy: number;
  diarioMedio: number;
}

export type DayRow = {
  date: string;
  day: number;
  entradas: Lancamento[];
  saidas: Lancamento[];
  totalEntradas: number;
  totalSaidas: number;
  saldoDia: number;
  saldoAcumulado: number;
};

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatMonthLabel(year: number, month: number): string {
  return `${MESES[month]}/${String(year).slice(-2)}`;
}

export function formatCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-R$ ${formatted}` : `R$ ${formatted}`;
}

export function expandRecorrentes(
  lancamentos: Lancamento[],
  year: number,
  month: number,
): Lancamento[] {
  const expanded: Lancamento[] = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  for (const l of lancamentos) {
    if (!l.is_recorrente) {
      const d = new Date(l.data + 'T00:00:00');
      if (d >= monthStart && d <= monthEnd) expanded.push(l);
    } else {
      const origDate = new Date(l.data + 'T00:00:00');
      if (origDate <= monthEnd) {
        const day = Math.min(origDate.getDate(), monthEnd.getDate());
        const expandedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const hasOverride = lancamentos.some(
          (other) =>
            !other.is_recorrente &&
            other.data === expandedDate &&
            other.descricao === l.descricao &&
            other.tipo === l.tipo &&
            Number(other.valor) === Number(l.valor),
        );

        if (!hasOverride) {
          expanded.push({ ...l, data: expandedDate, id: `${l.id}-rec-${year}-${month}` });
        }
      }
    }
  }

  return expanded;
}

export function buildDayRows(
  lancamentos: Lancamento[],
  year: number,
  month: number,
  saldoInicial: number,
): DayRow[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: DayRow[] = [];
  let acumulado = saldoInicial;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayLancamentos = lancamentos.filter((l) => l.data === dateStr);
    const entradas = dayLancamentos.filter((l) => l.tipo === 'entrada');
    const saidas = dayLancamentos.filter((l) => l.tipo === 'saida');
    const totalEntradas = entradas.reduce((s, l) => s + Number(l.valor), 0);
    const totalSaidas = saidas.reduce((s, l) => s + Number(l.valor), 0);
    const saldoDia = totalEntradas - totalSaidas;
    acumulado += saldoDia;

    rows.push({ date: dateStr, day, entradas, saidas, totalEntradas, totalSaidas, saldoDia, saldoAcumulado: acumulado });
  }

  return rows;
}

export function calcSaldoInicial(allLancamentos: Lancamento[], year: number, month: number): number {
  const targetDate = new Date(year, month, 1);
  let saldo = 0;

  for (const l of allLancamentos) {
    const origDate = new Date(l.data + 'T00:00:00');

    if (!l.is_recorrente) {
      if (origDate < targetDate) {
        saldo += l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor);
      }
    } else {
      let currentRec = new Date(origDate.getFullYear(), origDate.getMonth(), 1);
      while (currentRec < targetDate) {
        const expandedDate = `${currentRec.getFullYear()}-${String(currentRec.getMonth() + 1).padStart(2, '0')}-${String(origDate.getDate()).padStart(2, '0')}`;
        const hasOverride = allLancamentos.some(
          (other) =>
            !other.is_recorrente &&
            other.data === expandedDate &&
            other.descricao === l.descricao &&
            other.tipo === l.tipo &&
            Number(other.valor) === Number(l.valor),
        );
        if (!hasOverride) {
          saldo += l.tipo === 'entrada' ? Number(l.valor) : -Number(l.valor);
        }
        currentRec.setMonth(currentRec.getMonth() + 1);
      }
    }
  }

  return saldo;
}

export function calcSummary(
  rows: DayRow[],
  saldoInicial: number,
  year: number,
  month: number,
): SummaryData {
  const now = new Date();
  const totais = rows.reduce(
    (acc, row) => {
      const fixos = row.saidas.filter((s) => s.categoria === 'fixo').reduce((sum, s) => sum + Number(s.valor), 0);
      const diarios = row.saidas.filter((s) => s.categoria === 'diario').reduce((sum, s) => sum + Number(s.valor), 0);
      const invest = row.saidas.filter((s) => s.categoria === 'investimento').reduce((sum, s) => sum + Number(s.valor), 0);
      return {
        rendaReal: acc.rendaReal + row.totalEntradas,
        custoVida: acc.custoVida + fixos,
        gastosDiarios: acc.gastosDiarios + diarios,
        investimentos: acc.investimentos + invest,
      };
    },
    { rendaReal: 0, custoVida: 0, gastosDiarios: 0, investimentos: 0 },
  );

  const totalSaidas = totais.custoVida + totais.gastosDiarios + totais.investimentos;
  const economizado = totais.rendaReal - totalSaidas;
  const diasNoMes = new Date(year, month + 1, 0).getDate();

  const isPast = year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());

  let diarioMedio = 0;
  if (isPast) {
    diarioMedio = totalSaidas / diasNoMes;
  } else {
    const diasRestantes = Math.max(1, diasNoMes - now.getDate());
    diarioMedio = economizado / diasRestantes;
  }

  return {
    ...totais,
    totalSaidas,
    economizado,
    saldoFinal: saldoInicial + economizado,
    porcentagemEconomy: totais.rendaReal > 0 ? Math.round((economizado / totais.rendaReal) * 100) : 0,
    diarioMedio,
  };
}
