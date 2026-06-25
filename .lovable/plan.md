# LifeOS — Arquitetura & Roadmap

Sistema operacional pessoal: conhecimento, produtividade, finanças, metas e evolução. PWA local-first, preparado para sync futuro.

> Observação técnica: o template Lovable usa **TanStack Start + React 19 + Vite 7 + Tailwind v4 + shadcn/ui**, não Next.js. A stack pedida (TS, Tailwind, shadcn, IndexedDB, PWA, Recharts) é totalmente atendida — só troco Next por TanStack Start, que é o padrão da plataforma e suporta SSR/PWA igualmente bem. Se você fizer questão de Next.js, me avisa antes que eu paro.

---

## 1. Princípios de Arquitetura

- **Local-first**: IndexedDB via Dexie como fonte de verdade. Toda escrita é síncrona do ponto de vista da UI (otimista).
- **Modular**: cada domínio (habits, tasks, notes, finance...) é um módulo isolado com seu schema, repositório, hooks e UI.
- **Sync-ready**: cada registro carrega `id (uuid)`, `updatedAt`, `deletedAt`, `syncedAt`. Camada de repositório abstrai storage — trocar Dexie por Supabase no futuro é uma implementação nova, não uma refatoração.
- **Minimalista**: dark mode nativo, tipografia limpa, sem badges coloridas, sem confete, sem mascotes.
- **Sem streak como métrica primária**: consistência em janelas (7/30/90d).

---

## 2. Estrutura de Pastas

```text
src/
  routes/                      # TanStack Start file-based routing
    __root.tsx                 # shell, theme, nav
    index.tsx                  # Dashboard
    notes.tsx                  # layout do módulo
    notes.index.tsx            # lista
    notes.$noteId.tsx          # editor
    habits.tsx
    tasks.tsx
    goals.tsx
    finance.tsx
    journal.tsx
    stats.tsx
    settings.tsx
  modules/
    notes/      { db.ts, repo.ts, hooks.ts, components/, types.ts }
    habits/     { ... }
    tasks/      { ... }
    goals/      { ... }
    finance/    { ... }
    journal/    { ... }
    stats/      { ... }
    achievements/
  db/
    index.ts                   # instância Dexie + versionamento
    schema.ts                  # tabelas e índices
    sync-meta.ts               # tombstones, updatedAt
  components/
    ui/                        # shadcn
    layout/                    # AppShell, Sidebar, TopBar, CommandPalette
    charts/                    # wrappers Recharts
  lib/
    date.ts, markdown.ts, search.ts, id.ts, theme.ts
  pwa/
    register.ts                # registro guardado (sem registrar em preview)
  styles.css
public/
  manifest.webmanifest
  icons/
```

---

## 3. Banco de Dados (IndexedDB / Dexie)

Todas as tabelas compartilham: `id: string (uuid)`, `createdAt`, `updatedAt`, `deletedAt?`.

| Tabela | Campos principais |
|---|---|
| `notes` | title, content (md), parentId?, folderId?, tags[], backlinks[] (derivado) |
| `folders` | name, parentId? |
| `note_links` | fromId, toId (índice para backlinks/grafo) |
| `habits` | name, frequency (daily/weekly/custom), targetPerWeek, archivedAt? |
| `habit_logs` | habitId, date (YYYY-MM-DD), done |
| `tasks` | title, notes?, priority (low/med/high), dueDate?, projectId?, status, checklist[] |
| `projects` | name, color, archivedAt? |
| `goals` | title, scope (year/quarter/month), period (e.g. 2026-Q1), target?, unit?, progress, linkedHabitId?, linkedMetric? |
| `transactions` | type (income/expense), amount, currency, date, categoryId, note |
| `categories` | name, type, color, budget? |
| `financial_goals` | title, targetAmount, dueDate, currentAmount |
| `journal_entries` | date, mood (1–5), content (md), highlights[] |
| `metrics` | key (weight, study_hours...), date, value, unit |
| `achievements` | key, unlockedAt, meta |
| `kv` | chaves de config (tema, layout dashboard, idioma) |

Índices: `[habitId+date]`, `[date]` em transactions/logs, `tags` multi-entry em notes.

---

## 4. Mapa de Telas

```text
/                Dashboard
/notes           Árvore + editor (split)
/notes/:id       Editor de página
/habits          Grade de hábitos + heatmap 7/30/90
/tasks           Inbox / Hoje / Próximos / Projetos
/goals           Anuais / Trimestrais / Mensais
/finance         Overview / Transações / Categorias / Metas
/journal         Calendário + entrada do dia
/stats           Gráficos consolidados
/settings        Tema, export/import JSON, sobre
```

**Navegação global**: sidebar (desktop) / bottom tabs (mobile) + Command Palette (⌘K) para criar nota/tarefa/transação e navegar.

---

## 5. Fluxos-Chave

- **Captura rápida**: ⌘K → "nova tarefa/nota/transação" sem sair da tela atual.
- **Dashboard**: leitura agregada de repositórios; widgets reordenáveis (config em `kv`).
- **Notes**: parser markdown detecta `[[link]]` → grava em `note_links` → backlinks calculados por query reversa.
- **Habits**: marcar dia = upsert em `habit_logs`; consistência = `done / esperado` na janela.
- **Achievements**: avaliador roda após escritas relevantes; sem moedas, só marcos (`100h italiano`, `30 treinos`, `50 notas`).

---

## 6. Design System

- Tailwind v4 + tokens `oklch` em `src/styles.css`.
- Tema escuro nativo (default), claro opcional. Sem toggle infantil — switch discreto em Settings.
- Paleta neutra (zinc/slate) + 1 accent sóbrio. Tipografia: Inter (UI) + JetBrains Mono (editor/código).
- Componentes shadcn customizados; zero cores hardcoded em className.

---

## 7. PWA

- `manifest.webmanifest` + ícones (192, 512, maskable).
- Instalável em desktop/mobile.
- v0.1: **manifest-only** (sem service worker) para não quebrar preview.
- Offline real entra em fase posterior (vite-plugin-pwa com guardas de preview).

---

## 8. Sync-Ready (sem implementar agora)

- Todo registro tem `updatedAt` + tombstone `deletedAt`.
- Repositórios expõem `listChangedSince(ts)` e `applyRemote(records)`.
- Quando Cloud entrar: adaptador Supabase implementa a mesma interface; resolução last-write-wins por padrão, com hook para CRDT em notes se necessário.

---

## 9. Roadmap por Fases

**v0.1 — Fundação (esta entrega)**
- Stack, design system dark, AppShell (sidebar desktop + bottom nav mobile), rotas vazias dos módulos.
- Dexie configurado com todas as tabelas e repositórios base.
- PWA manifest + ícones (instalável).
- Dashboard com widgets placeholder lendo dados reais (vazios no início).
- Settings: tema, export/import JSON do banco inteiro.
- Command Palette básico (navegação).

**v0.2 — Hábitos & Tarefas**
- CRUD hábitos, marcação diária, consistência 7/30/90.
- CRUD tarefas, prioridade, due date, projetos, checklist.
- Widgets do dashboard ligados.

**v0.3 — Conhecimento**
- Editor markdown, árvore de pastas/subpáginas, tags.
- `[[links]]`, backlinks, busca full-text local.

**v0.4 — Financeiro**
- Receitas/despesas, categorias, dashboard financeiro, metas financeiras.

**v0.5 — Metas & Diário**
- Metas anuais/trimestrais/mensais com vínculo a hábito/métrica.
- Diário com humor, calendário, highlights.

**v0.6 — Estatísticas & Conquistas**
- Recharts: peso, estudos, finanças, hábitos, metas.
- Motor de marcos/níveis/horas acumuladas.

**v0.7 — Polimento**
- Atalhos, drag-and-drop no dashboard, importadores (CSV finance, markdown notes).

**v1.0 — Cloud Sync**
- Lovable Cloud + adaptador Supabase, login, sync incremental, offline real com service worker.

---

## 10. O que entrego ao aprovar este plano (v0.1)

1. Configuração de design tokens dark e AppShell responsivo.
2. Dexie + schema completo + repositórios base + export/import JSON.
3. Rotas de todos os módulos (telas estruturadas, ainda sem CRUD completo).
4. Dashboard com widgets reais lendo do banco vazio.
5. PWA instalável (manifest + ícones).
6. Command Palette para navegação e ações rápidas básicas.

Confirma para eu começar pela v0.1? Se quiser ajustar escopo (ex.: já incluir Hábitos completos na v0.1), me diz antes.
