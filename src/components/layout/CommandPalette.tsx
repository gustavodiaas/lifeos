import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  Repeat,
  Target,
  Wallet,
  NotebookPen,
  BarChart3,
  Settings,
} from "lucide-react";

const ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/notes", label: "Knowledge", icon: BookOpen },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {ITEMS.map(({ to, label, icon: Icon }) => (
            <CommandItem
              key={to}
              value={label}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to });
              }}
            >
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}