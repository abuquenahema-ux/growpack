import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getNotifications, readNotifications } from "@/lib/app.functions";

export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string>>(new Set());
  const first = useRef(true);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: () => readNotifications(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];
  const unread = data?.unread ?? 0;

  useEffect(() => {
    for (const n of items) {
      if (seen.current.has(n.id)) continue;
      seen.current.add(n.id);
      if (!first.current && !n.read) {
        if (n.kind === "erro") toast.error(n.title, { description: n.body });
        else toast.success(n.title, { description: n.body });
      }
    }
    if (items.length) first.current = false;
  }, [items]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead.mutate();
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notificações"
        onClick={toggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-lg">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Notificações</p>
            {items.length === 0 && <p className="px-2 py-4 text-sm text-muted-foreground">Ainda sem avisos.</p>}
            {items.map((n) => (
              <div key={n.id} className="rounded-xl px-2 py-2 hover:bg-secondary/60">
                <p
                  className={`text-sm font-semibold ${n.kind === "erro" ? "text-destructive" : "text-primary"}`}
                >
                  {n.title}
                </p>
                <p className="text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("pt-PT")}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}