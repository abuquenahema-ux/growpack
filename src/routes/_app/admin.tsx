import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { decideDeposit, decideWithdrawal, getAdminQueue } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Administração — InvestNatura" },
      { name: "description", content: "Aprovação manual de depósitos e levantamentos da plataforma." },
      { property: "og:title", content: "Administração — InvestNatura" },
      { property: "og:description", content: "Painel interno de aprovação de pagamentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const { data, error } = useQuery({ queryKey: ["admin"], queryFn: () => getAdminQueue(), retry: false });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin"] });
  const dep = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => decideDeposit({ data: v }),
    onSuccess: () => {
      toast.success("Depósito atualizado");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const wd = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => decideWithdrawal({ data: v }),
    onSuccess: () => {
      toast.success("Levantamento atualizado");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (error) return <main className="p-6 text-sm text-muted-foreground">Acesso restrito a administradores.</main>;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <h1 className="text-xl font-bold">Administração</h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Depósitos</h2>
        {(data?.deposits ?? []).map((d) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">
              {formatMzn(Number(d.amount))} • {d.method}
            </p>
            <p className="text-xs text-muted-foreground">Ref: {d.reference || "—"} • {d.status}</p>
            {d.status === "pendente" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => dep.mutate({ id: d.id, approve: true })}>
                  Aprovar
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => dep.mutate({ id: d.id, approve: false })}>
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Levantamentos</h2>
        {(data?.withdrawals ?? []).map((w) => (
          <div key={w.id} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">
              {formatMzn(Number(w.amount))} • {w.method}
            </p>
            <p className="text-xs text-muted-foreground">Para: {w.destination || "—"} • {w.status}</p>
            {w.status === "pendente" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1" onClick={() => wd.mutate({ id: w.id, approve: true })}>
                  Marcar pago
                </Button>
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => wd.mutate({ id: w.id, approve: false })}>
                  Rejeitar
                </Button>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}