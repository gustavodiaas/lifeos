import { useState, useMemo, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { formatBRL } from "@/lib/date";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { ModalPortal } from "@/components/ui/ModalPortal";
import { toast } from "@/lib/toast";
import {
  ShoppingCart,
  Sparkles,
  History,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  Tag,
  DollarSign,
  Calendar,
  Filter,
  Check,
  RotateCcw,
  Star,
  Package,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
export type ItemType = "shopping" | "wishlist";

export interface ShoppingSegment {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  segmentId: string;
  type: ItemType; // "shopping" = Lista Ativa | "wishlist" = Lista de Desejos
  estimatedPrice?: number;
  paidPrice?: number;
  quantity?: string; // ex: "2 kg", "1 un"
  url?: string;
  imageUrl?: string;
  notes?: string;
  priority?: "low" | "medium" | "high";
  isPurchased: boolean;
  purchasedAt?: string; // YYYY-MM-DD
  createdAt: string;
}

const DEFAULT_SEGMENTS: ShoppingSegment[] = [
  { id: "seg-1", name: "Mercado & Feira", color: "#10b981" },
  { id: "seg-2", name: "Perfumes & Beleza", color: "#ec4899" },
  { id: "seg-3", name: "Roupas & Estilo", color: "#3b82f6" },
  { id: "seg-4", name: "Eletrônicos & Tech", color: "#f59e0b" },
  { id: "seg-5", name: "Casa & Decoração", color: "#8b5cf6" },
  { id: "seg-6", name: "Farmácia & Saúde", color: "#14b8a6" },
];

const DEFAULT_ITEMS: ShoppingItem[] = [
  {
    id: "item-1",
    name: "Arroz Integral 5kg",
    segmentId: "seg-1",
    type: "shopping",
    estimatedPrice: 28.90,
    quantity: "1 pacote",
    isPurchased: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "item-2",
    name: "Azeite de Oliva Extra Virgem",
    segmentId: "seg-1",
    type: "shopping",
    estimatedPrice: 42.00,
    quantity: "2 garrafas",
    isPurchased: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "item-3",
    name: "Perfume Sauvage Dior EDP",
    segmentId: "seg-2",
    type: "wishlist",
    estimatedPrice: 750.00,
    url: "https://www.google.com",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80",
    priority: "high",
    notes: "Aguardar promoção na Black Friday",
    isPurchased: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "item-4",
    name: "Jaqueta de Linho Off-White",
    segmentId: "seg-3",
    type: "wishlist",
    estimatedPrice: 299.00,
    priority: "medium",
    isPurchased: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "item-5",
    name: "Café Especial Moído 500g",
    segmentId: "seg-1",
    type: "shopping",
    estimatedPrice: 35.00,
    paidPrice: 34.50,
    isPurchased: true,
    purchasedAt: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
];

type MainTab = "shopping" | "wishlist" | "history";

// ── Main Component ────────────────────────────────────────────────────────────
export function ShoppingModule() {
  const { user } = useAuthContext();
  const { activeUserId } = useWorkspace();
  const userId = activeUserId || user?.id || "guest";

  const storageKeyItems = `lifeos_${userId}_shopping_items_v1`;
  const storageKeySegments = `lifeos_${userId}_shopping_segments_v1`;

  // State
  const [activeTab, setActiveTab] = useState<MainTab>("shopping");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Segments State
  const [segments, setSegments] = useState<ShoppingSegment[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeySegments);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SEGMENTS;
  });

  // Items State
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyItems);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ITEMS;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeySegments);
      if (saved) setSegments(JSON.parse(saved));
      else setSegments(DEFAULT_SEGMENTS);
    } catch {}
  }, [storageKeySegments]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKeyItems);
      if (saved) setItems(JSON.parse(saved));
      else setItems(DEFAULT_ITEMS);
    } catch {}
  }, [storageKeyItems]);

  useEffect(() => {
    localStorage.setItem(storageKeySegments, JSON.stringify(segments));
  }, [segments, storageKeySegments]);

  useEffect(() => {
    localStorage.setItem(storageKeyItems, JSON.stringify(items));
  }, [items, storageKeyItems]);

  // Modal Item State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemSegmentId, setItemSegmentId] = useState(segments[0]?.id || "");
  const [itemType, setItemType] = useState<ItemType>("shopping");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<ShoppingItem["priority"]>("medium");

  // Modal Segment State
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentColor, setNewSegmentColor] = useState("#a78bfa");

  // Modal Purchase Confirm State
  const [purchasingItem, setPurchasingItem] = useState<ShoppingItem | null>(null);
  const [confirmPricePaid, setConfirmPricePaid] = useState("");
  const [confirmPurchaseDate, setConfirmPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  // Map for fast segment lookup
  const segmentMap = useMemo(() => {
    const map: Record<string, ShoppingSegment> = {};
    segments.forEach((s) => { map[s.id] = s; });
    return map;
  }, [segments]);

  // Helper open item modal
  const handleOpenItemModal = (itemToEdit?: ShoppingItem, defaultType: ItemType = "shopping") => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setItemName(itemToEdit.name);
      setItemSegmentId(itemToEdit.segmentId);
      setItemType(itemToEdit.type);
      setEstimatedPrice(itemToEdit.estimatedPrice ? String(itemToEdit.estimatedPrice) : "");
      setQuantity(itemToEdit.quantity || "");
      setItemUrl(itemToEdit.url || "");
      setImageUrl(itemToEdit.imageUrl || "");
      setNotes(itemToEdit.notes || "");
      setPriority(itemToEdit.priority || "medium");
    } else {
      setEditingItem(null);
      setItemName("");
      setItemSegmentId(selectedSegmentId !== "all" ? selectedSegmentId : segments[0]?.id || "");
      setItemType(defaultType);
      setEstimatedPrice("");
      setQuantity("");
      setItemUrl("");
      setImageUrl("");
      setNotes("");
      setPriority("medium");
    }
    setShowItemModal(true);
  };

  // Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const estNum = estimatedPrice ? parseFloat(estimatedPrice.replace(",", ".")) : undefined;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: itemName.trim(),
                segmentId: itemSegmentId,
                type: itemType,
                estimatedPrice: estNum,
                quantity: quantity.trim() || undefined,
                url: itemUrl.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                notes: notes.trim() || undefined,
                priority,
              }
            : i
        )
      );
      toast.success("Item atualizado!");
    } else {
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        name: itemName.trim(),
        segmentId: itemSegmentId,
        type: itemType,
        estimatedPrice: estNum,
        quantity: quantity.trim() || undefined,
        url: itemUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        priority,
        isPurchased: false,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      toast.success(itemType === "shopping" ? "Item adicionado à Lista de Compras!" : "Desejo salvo na Wishlist!");
    }

    setShowItemModal(false);
  };

  // Delete Item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item removido.");
  };

  // Move from Wishlist to Active Shopping List
  const handleMoveToShopping = (item: ShoppingItem) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, type: "shopping" } : i))
    );
    toast.success(`"${item.name}" movido para a Lista de Compras!`);
  };

  // Open Purchase Confirmation Modal
  const handleStartPurchase = (item: ShoppingItem) => {
    setPurchasingItem(item);
    setConfirmPricePaid(item.estimatedPrice ? String(item.estimatedPrice) : "");
    setConfirmPurchaseDate(new Date().toISOString().slice(0, 10));
  };

  // Confirm Purchase (Moves to History)
  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasingItem) return;

    const paidNum = confirmPricePaid ? parseFloat(confirmPricePaid.replace(",", ".")) : (purchasingItem.estimatedPrice || 0);

    setItems((prev) =>
      prev.map((i) =>
        i.id === purchasingItem.id
          ? {
              ...i,
              isPurchased: true,
              paidPrice: paidNum,
              purchasedAt: confirmPurchaseDate,
            }
          : i
      )
    );

    setPurchasingItem(null);
    toast.success(`🎉 "${purchasingItem.name}" marcado como comprado e salvo no Histórico!`);
  };

  // Re-add to active list from history
  const handleReAddFromHistory = (item: ShoppingItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              isPurchased: false,
              type: "shopping",
            }
          : i
      )
    );
    toast.success(`"${item.name}" adicionado novamente à Lista de Compras!`);
  };

  // Save new segment
  const handleSaveSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName.trim()) return;

    const newSeg: ShoppingSegment = {
      id: crypto.randomUUID(),
      name: newSegmentName.trim(),
      color: newSegmentColor,
    };
    setSegments((prev) => [...prev, newSeg]);
    setNewSegmentName("");
    setShowSegmentModal(false);
    toast.success(`Segmento "${newSeg.name}" criado!`);
  };

  // Filtered Items Calculation
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSegment = selectedSegmentId === "all" || item.segmentId === selectedSegmentId;
      return matchesSearch && matchesSegment;
    });
  }, [items, searchQuery, selectedSegmentId]);

  // Tab splits
  const activeShoppingItems = useMemo(() => {
    return filteredItems.filter((i) => i.type === "shopping" && !i.isPurchased);
  }, [filteredItems]);

  const wishlistItems = useMemo(() => {
    return filteredItems.filter((i) => i.type === "wishlist" && !i.isPurchased);
  }, [filteredItems]);

  const historyItems = useMemo(() => {
    return filteredItems
      .filter((i) => i.isPurchased)
      .sort((a, b) => (b.purchasedAt || "").localeCompare(a.purchasedAt || ""));
  }, [filteredItems]);

  // Total Calculations
  const totalShoppingEst = activeShoppingItems.reduce((acc, i) => acc + (i.estimatedPrice || 0), 0);
  const totalWishlistEst = wishlistItems.reduce((acc, i) => acc + (i.estimatedPrice || 0), 0);
  const totalHistorySpent = historyItems.reduce((acc, i) => acc + (i.paidPrice || i.estimatedPrice || 0), 0);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16) || 100;
    const g = parseInt(hex.slice(3, 5), 16) || 100;
    const b = parseInt(hex.slice(5, 7), 16) || 100;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="space-y-6 fade-in select-none pb-12">

      {/* ── 1. Top Header Banner ────────────────────────────────────────── */}
      <div className="glass-card p-6 md:p-7 rounded-3xl border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg shadow-black/10 shrink-0">
            <ShoppingCart size={24} />
          </div>
          <div>
            <span className="badge-ios text-[10px]">Gestão de Compras & Desejos</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Lista de Compras & Wishlist
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSegmentModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Layers size={15} />
            <span>+ Novo Segmento</span>
          </button>

          <button
            onClick={() => handleOpenItemModal(undefined, activeTab === "wishlist" ? "wishlist" : "shopping")}
            className="btn-ios text-xs py-2.5 px-4 shadow-sm"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Novo Item / Desejo</span>
          </button>
        </div>
      </div>

      {/* ── 2. Filtro de Segmentos (Pills de Segmento) ──────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setSelectedSegmentId("all")}
          className={cn(
            "px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 border",
            selectedSegmentId === "all"
              ? "bg-foreground text-background border-foreground shadow-xs"
              : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Todos os Segmentos
        </button>

        {segments.map((seg) => {
          const isSelected = selectedSegmentId === seg.id;
          return (
            <button
              key={seg.id}
              onClick={() => setSelectedSegmentId(seg.id)}
              className={cn(
                "px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 border flex items-center gap-1.5",
                isSelected
                  ? "shadow-xs"
                  : "bg-card/70 border-border text-muted-foreground hover:text-foreground"
              )}
              style={{
                backgroundColor: isSelected ? hexToRgba(seg.color, 0.2) : undefined,
                borderColor: isSelected ? seg.color : undefined,
                color: isSelected ? seg.color : undefined,
              }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span>{seg.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Tabs Principais & Barra de Pesquisa ─────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Main Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-2xl border border-border/50 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("shopping")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              activeTab === "shopping"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ShoppingCart size={15} />
            <span>Lista de Compras</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-black">
              {activeShoppingItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("wishlist")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              activeTab === "wishlist"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles size={15} className="text-amber-400" />
            <span>Lista de Desejos</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-black">
              {wishlistItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
              activeTab === "history"
                ? "bg-foreground text-background shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History size={15} />
            <span>Histórico</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-black">
              {historyItems.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar itens ou notas..."
            className="input-ios pl-9 py-2 text-xs w-full font-bold"
          />
        </div>
      </div>

      {/* ── 4. CONTEÚDO DAS TABS ────────────────────────────────────────── */}

      {/* ── TAB 1: LISTA DE COMPRAS ATIVA ───────────────────────────────── */}
      {activeTab === "shopping" && (
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="glass-card p-4 rounded-2xl border border-border/70 flex items-center justify-between text-xs">
            <span className="font-extrabold text-muted-foreground uppercase tracking-wider">
              Total Estimado da Lista de Compras:
            </span>
            <span className="text-sm font-black text-emerald-500">
              {formatBRL(totalShoppingEst)}
            </span>
          </div>

          {activeShoppingItems.length === 0 ? (
            <div className="glass-card p-12 text-center text-xs text-muted-foreground font-medium rounded-3xl border border-dashed border-border flex flex-col items-center gap-3">
              <ShoppingCart size={36} className="opacity-30" />
              Sua Lista de Compras está vazia no momento.
              <button
                onClick={() => handleOpenItemModal(undefined, "shopping")}
                className="btn-ios text-xs py-2 px-4 mt-1"
              >
                <Plus size={14} /> Adicionar Item de Mercado
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeShoppingItems.map((item) => {
                const seg = segmentMap[item.segmentId];
                return (
                  <div
                    key={item.id}
                    className="glass-card p-4 rounded-3xl border border-border/70 flex flex-col justify-between space-y-3 relative group transition-all hover:border-foreground/30 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Interactive Checkbox for purchasing */}
                        <button
                          onClick={() => handleStartPurchase(item)}
                          className="w-6 h-6 rounded-xl border-2 border-border hover:border-emerald-500 hover:bg-emerald-500/10 transition-all flex items-center justify-center shrink-0 mt-0.5"
                          title="Marcar como Comprado"
                        >
                          <Check size={14} className="opacity-0 hover:opacity-100 text-emerald-500 transition-opacity" />
                        </button>

                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-foreground leading-snug truncate">
                            {item.name}
                          </h4>
                          {seg && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold mt-1 border"
                              style={{
                                backgroundColor: hexToRgba(seg.color, 0.15),
                                color: seg.color,
                                borderColor: hexToRgba(seg.color, 0.3),
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: seg.color }} />
                              {seg.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenItemModal(item)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Details row */}
                    <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2.5">
                      <span className="text-[10px] font-extrabold text-muted-foreground">
                        {item.quantity || "1 unidade"}
                      </span>
                      {item.estimatedPrice !== undefined && (
                        <span className="font-black text-foreground">
                          {formatBRL(item.estimatedPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: LISTA DE DESEJOS (WISHLIST) ─────────────────────────── */}
      {activeTab === "wishlist" && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-border/70 flex items-center justify-between text-xs">
            <span className="font-extrabold text-muted-foreground uppercase tracking-wider">
              Total Estimado dos Desejos:
            </span>
            <span className="text-sm font-black text-amber-500">
              {formatBRL(totalWishlistEst)}
            </span>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="glass-card p-12 text-center text-xs text-muted-foreground font-medium rounded-3xl border border-dashed border-border flex flex-col items-center gap-3">
              <Sparkles size={36} className="text-amber-400 opacity-40" />
              Sua Lista de Desejos está vazia.
              <button
                onClick={() => handleOpenItemModal(undefined, "wishlist")}
                className="btn-ios text-xs py-2 px-4 mt-1"
              >
                <Plus size={14} /> Adicionar Novo Desejo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistItems.map((item) => {
                const seg = segmentMap[item.segmentId];
                return (
                  <div
                    key={item.id}
                    className="glass-card p-5 rounded-3xl border border-border/70 flex flex-col justify-between space-y-4 relative group transition-all hover:border-foreground/30 shadow-md"
                  >
                    {/* Top image or Segment badge */}
                    <div className="flex items-start gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-2xl shadow-sm border border-black/10 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <Sparkles size={20} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-foreground leading-tight truncate">
                          {item.name}
                        </h4>
                        {seg && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold mt-1 border"
                            style={{
                              backgroundColor: hexToRgba(seg.color, 0.15),
                              color: seg.color,
                              borderColor: hexToRgba(seg.color, 0.3),
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: seg.color }} />
                            {seg.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenItemModal(item)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Notes & Price */}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                        {item.notes}
                      </p>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block">
                          Preço Estimado
                        </span>
                        <span className="text-sm font-black text-foreground">
                          {item.estimatedPrice !== undefined ? formatBRL(item.estimatedPrice) : "A definir"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-muted hover:bg-secondary text-foreground transition-colors"
                            title="Abrir Link do Produto"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}

                        <button
                          onClick={() => handleMoveToShopping(item)}
                          className="btn-ios text-[11px] py-1.5 px-3 font-bold flex items-center gap-1"
                          title="Mover para a Lista de Compras"
                        >
                          <ShoppingCart size={13} />
                          <span>Comprar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: HISTÓRICO DE COMPRAS ──────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-border/70 flex items-center justify-between text-xs">
            <span className="font-extrabold text-muted-foreground uppercase tracking-wider">
              Total Investido no Histórico:
            </span>
            <span className="text-sm font-black text-foreground">
              {formatBRL(totalHistorySpent)}
            </span>
          </div>

          {historyItems.length === 0 ? (
            <div className="glass-card p-12 text-center text-xs text-muted-foreground font-medium rounded-3xl border border-dashed border-border flex flex-col items-center gap-3">
              <History size={36} className="opacity-30" />
              Nenhuma compra concluída no histórico ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => {
                const seg = segmentMap[item.segmentId];
                return (
                  <div
                    key={item.id}
                    className="glass-card p-4 rounded-2xl border border-border/60 flex items-center justify-between gap-4 hover:border-foreground/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-foreground truncate">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {seg && (
                            <span className="text-[10px] font-extrabold text-muted-foreground">
                              {seg.name}
                            </span>
                          )}
                          {item.purchasedAt && (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              • Comprado em {item.purchasedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-emerald-500">
                        {formatBRL(item.paidPrice || item.estimatedPrice || 0)}
                      </span>

                      <button
                        onClick={() => handleReAddFromHistory(item)}
                        className="p-1.5 rounded-xl bg-muted hover:bg-secondary text-foreground text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="Comprar Novamente"
                      >
                        <RotateCcw size={13} />
                        <span className="hidden sm:inline">Comprar Novamente</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CRIAR / EDITAR ITEM ────────────────────────────────────── */}
      <ModalPortal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        title={editingItem ? "Editar Item" : itemType === "shopping" ? "Novo Item para Comprar" : "Novo Desejo na Wishlist"}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Nome do Produto / Item
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: Arroz 5kg, Perfume Dior, Camisa de Linho..."
              className="input-ios text-xs font-bold"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Segmento / Categoria
              </label>
              <CustomSelect
                value={itemSegmentId}
                onChange={(val) => setItemSegmentId(val)}
                options={segments.map((s) => ({ value: s.id, label: s.name }))}
                className="text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Tipo de Item
              </label>
              <CustomSelect
                value={itemType}
                onChange={(val) => setItemType(val as ItemType)}
                options={[
                  { value: "shopping", label: "🛒 Lista de Compras Ativa" },
                  { value: "wishlist", label: "✨ Lista de Desejos (Wishlist)" },
                ]}
                className="text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Preço Estimado (R$)
              </label>
              <input
                type="text"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="Ex: 45.90"
                className="input-ios text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                Quantidade / Unidade
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 2 un, 1 kg, 500g"
                className="input-ios text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Link da Loja / Produto (Opcional)
            </label>
            <input
              type="url"
              value={itemUrl}
              onChange={(e) => setItemUrl(e.target.value)}
              placeholder="https://..."
              className="input-ios text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              URL da Imagem / Capa (Opcional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="input-ios text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Notas / Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes, tamanho, cor, cupom..."
              className="input-ios text-xs font-medium min-h-[60px] resize-none"
            />
          </div>

          <button type="submit" className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider shadow-md shadow-black/10 mt-2">
            Salvar Item
          </button>
        </form>
      </ModalPortal>

      {/* ── MODAL MARCAR COMO COMPRADO & SALVAR NO HISTÓRICO ────────────── */}
      <ModalPortal
        open={!!purchasingItem}
        onClose={() => setPurchasingItem(null)}
        title="🎉 Marcar como Comprado"
      >
        {purchasingItem && (
          <form onSubmit={handleConfirmPurchase} className="space-y-4">
            <p className="text-xs text-muted-foreground font-medium">
              Confirme o valor final pago por <strong>{purchasingItem.name}</strong> para arquivá-lo no seu Histórico de Compras.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Valor Pago (R$)
                </label>
                <input
                  type="text"
                  value={confirmPricePaid}
                  onChange={(e) => setConfirmPricePaid(e.target.value)}
                  placeholder="Ex: 34.50"
                  className="input-ios text-xs font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={confirmPurchaseDate}
                  onChange={(e) => setConfirmPurchaseDate(e.target.value)}
                  className="input-ios text-xs font-bold"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-ios w-full py-4 text-xs font-black uppercase tracking-wider shadow-md shadow-black/10">
              Confirmar Compra & Salvar no Histórico
            </button>
          </form>
        )}
      </ModalPortal>

      {/* ── MODAL ADICIONAR NOVO SEGMENTO ───────────────────────────────── */}
      <ModalPortal
        open={showSegmentModal}
        onClose={() => setShowSegmentModal(false)}
        title="Criar Novo Segmento"
      >
        <form onSubmit={handleSaveSegment} className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Nome do Segmento
            </label>
            <input
              type="text"
              value={newSegmentName}
              onChange={(e) => setNewSegmentName(e.target.value)}
              placeholder="Ex: Suplementos, Livros, Games..."
              className="input-ios text-xs font-bold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block mb-1">
              Cor do Segmento
            </label>
            <input
              type="color"
              value={newSegmentColor}
              onChange={(e) => setNewSegmentColor(e.target.value)}
              className="w-full h-10 rounded-xl border border-border cursor-pointer bg-transparent"
            />
          </div>

          <button type="submit" className="btn-ios w-full py-3.5 text-xs font-black uppercase tracking-wider">
            Criar Segmento
          </button>
        </form>
      </ModalPortal>

    </div>
  );
}
