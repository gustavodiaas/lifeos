import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckSquare,
  Plus,
  Repeat,
  Wallet,
} from "lucide-react";

import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useHabits } from "@/hooks/useHabits";
import { useLancamentos } from "@/hooks/useLancamentos";
import { useTasks } from "@/hooks/useTasks";
import { formatBRL, monthIso, todayIso } from "@/lib/date";

export function Dashboard() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const { habits, logs } = useHabits(activeUserId);
  const { tasks } = useTasks(activeUserId);
  const { lancamentos } = useLancamentos(activeUserId);

  const today = todayIso();
  const month = monthIso();

  const summary = useMemo(() => {
    const activeHabits = habits.filter((habit) => !habit.archivedAt && !habit.archived_at);
    const completedHabitIds = new Set(
      logs.filter((log) => log.date === today && log.done).map((log) => log.habitId),
    );
    const openTasks = tasks.filter((task) => task.status !== "done");
    const monthEntries = lancamentos.filter((entry) => entry.data?.startsWith(month));
    const income = monthEntries
      .filter((entry) => entry.tipo === "entrada")
      .reduce((total, entry) => total + Number(entry.valor), 0);
    const expense = monthEntries
      .filter((entry) => entry.tipo === "saida")
      .reduce((total, entry) => total + Number(entry.valor), 0);

    return {
      activeHabits,
      completedHabitIds,
      openTasks,
      tasksToday: openTasks.filter((task) => (task.dueDate || task.due_date) === today),
      income,
      expense,
    };
  }, [habits, lancamentos, logs, month, tasks, today]);

  const firstName = String(
    user?.user_metadata?.username ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "você",
  ).split(/[\s.]/)[0];

  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const visibleTasks =
    summary.tasksToday.length > 0 ? summary.tasksToday.slice(0, 5) : summary.openTasks.slice(0, 5);
  const balance = summary.income - summary.expense;

  return (
    <div className="mx-auto w-full max-w-6xl pb-10">
      <header className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm capitalize text-muted-foreground">{todayLabel}</p>
          <h1 className="sf-display text-[34px] font-semibold leading-none tracking-[-0.045em] md:text-[42px]">
            Olá, {firstName}.
          </h1>
        </div>
        <Link to="/tasks" className="btn-ios h-10 self-start px-4 text-[13px] sm:self-auto">
          <Plus className="size-4" />
          Nova tarefa
        </Link>
      </header>

      <section className="mb-10 grid border-y border-border md:grid-cols-3">
        <SummaryMetric
          label="Tarefas em aberto"
          value={summary.openTasks.length}
          detail={
            summary.tasksToday.length > 0
              ? summary.tasksToday.length + " para hoje"
              : "Nenhuma para hoje"
          }
        />
        <SummaryMetric
          label="Hábitos"
          value={summary.completedHabitIds.size + "/" + summary.activeHabits.length}
          detail="concluídos hoje"
        />
        <SummaryMetric
          label="Saldo do mês"
          value={formatBRL(balance)}
          detail={formatBRL(summary.income) + " em entradas"}
          compact
        />
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <SectionHeading
            title={summary.tasksToday.length > 0 ? "Hoje" : "Próximas tarefas"}
            href="/tasks"
            linkLabel="Ver tarefas"
          />

          <div className="mt-3 divide-y divide-border border-y border-border">
            {visibleTasks.length === 0 ? (
              <EmptyRow
                icon={CheckSquare}
                title="Tudo em ordem"
                description="Não há tarefas pendentes."
              />
            ) : (
              visibleTasks.map((task) => (
                <Link
                  key={task.id}
                  to="/tasks"
                  className="group flex min-h-14 items-center gap-3 py-3"
                >
                  <span className="grid size-5 shrink-0 place-items-center rounded-full border border-border text-transparent transition-colors group-hover:border-[var(--system-blue)] group-hover:text-[var(--system-blue)]">
                    <Check className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{task.title}</span>
                  {(task.dueDate || task.due_date) && (
                    <time className="text-xs text-muted-foreground">
                      {(task.dueDate || task.due_date) === today
                        ? "Hoje"
                        : new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "short",
                          }).format(new Date((task.dueDate || task.due_date) + "T12:00:00"))}
                    </time>
                  )}
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <SectionHeading title="Hábitos" href="/habits" linkLabel="Ver hábitos" />

          <div className="mt-3 divide-y divide-border border-y border-border">
            {summary.activeHabits.length === 0 ? (
              <EmptyRow
                icon={Repeat}
                title="Nenhum hábito ativo"
                description="Crie uma rotina quando fizer sentido."
              />
            ) : (
              summary.activeHabits.slice(0, 5).map((habit) => {
                const completed = summary.completedHabitIds.has(habit.id);
                return (
                  <Link
                    key={habit.id}
                    to="/habits"
                    className="flex min-h-14 items-center gap-3 py-3"
                  >
                    <span
                      className={
                        completed
                          ? "grid size-5 shrink-0 place-items-center rounded-full bg-[var(--system-green)] text-white"
                          : "size-5 shrink-0 rounded-full border border-border"
                      }
                    >
                      {completed && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{habit.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {completed ? "Concluído" : "Pendente"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="mt-12 flex flex-col gap-5 border-t border-border pt-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="size-5 text-muted-foreground" strokeWidth={1.8} />
          <div>
            <h2 className="text-sm font-semibold">Finanças deste mês</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatBRL(summary.income)} em entradas · {formatBRL(summary.expense)} em saídas
            </p>
          </div>
        </div>
        <Link
          to="/finance"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--system-blue)]"
        >
          Abrir finanças
          <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
  compact = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className="py-5 md:border-r md:border-border md:px-7 md:first:pl-0 md:last:border-r-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          compact
            ? "sf-display mt-2 text-2xl font-semibold tracking-[-0.035em]"
            : "sf-display mt-2 text-3xl font-semibold tracking-[-0.04em]"
        }
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: "/tasks" | "/habits";
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="sf-display text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <Link to={href} className="text-xs font-medium text-[var(--system-blue)]">
        {linkLabel}
      </Link>
    </div>
  );
}

function EmptyRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckSquare;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-24 items-center gap-3 py-5">
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.7} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
