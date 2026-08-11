import type { Lancamento } from './supabase';
import { formatBRL } from './date';

export function exportFinanceToCSV(transactions: Lancamento[], periodLabel: string) {
  if (!transactions || transactions.length === 0) return;

  const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor (R$)', 'Recorrente'];
  const rows = transactions.map((t) => [
    t.data,
    t.tipo === 'entrada' ? 'Receita' : 'Despesa',
    `"${(t.descricao || '').replace(/"/g, '""')}"`,
    `"${(t.categoria || 'Outros').replace(/"/g, '""')}"`,
    t.valor.toFixed(2).replace('.', ','),
    t.is_recorrente ? 'Sim' : 'Não',
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `lifeos-extrato-financeiro-${periodLabel.replace(/[\/\s]/g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printFinanceReport(
  transactions: Lancamento[],
  periodLabel: string,
  income: number,
  expense: number,
  balance: number
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rowsHtml = transactions
    .map(
      (t) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.data}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${t.tipo === 'entrada' ? '#10B981' : '#EF4444'}; font-weight: bold;">
          ${t.tipo === 'entrada' ? 'Receita' : 'Despesa'}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.descricao}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${t.categoria || 'Outros'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">
          ${formatBRL(t.valor)}
        </td>
      </tr>
    `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Relatório Financeiro LifeOS - ${periodLabel}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #111; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          p.subtitle { color: #666; font-size: 14px; margin-top: 0; }
          .summary { display: flex; gap: 20px; margin: 20px 0; padding: 16px; background: #f4f4f5; border-radius: 12px; }
          .metric { flex: 1; }
          .metric-label { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; }
          .metric-value { font-size: 20px; font-weight: 800; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { text-align: left; padding: 8px; background: #e4e4e7; border-bottom: 2px solid #ccc; font-size: 11px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h1>LifeOS — Relatório Financeiro</h1>
        <p class="subtitle">Período: ${periodLabel} | Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>

        <div class="summary">
          <div class="metric">
            <div class="metric-label">Receitas Totais</div>
            <div class="metric-value" style="color: #10B981;">${formatBRL(income)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Despesas Totais</div>
            <div class="metric-value" style="color: #EF4444;">${formatBRL(expense)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Saldo do Período</div>
            <div class="metric-value">${formatBRL(balance)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhum lançamento no período.</td></tr>'}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
