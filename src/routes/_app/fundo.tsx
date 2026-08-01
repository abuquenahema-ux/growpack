import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getDashboard, purchaseProduct } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/fundo")({
  head: () => ({
    meta: [
      { title: "Fundo de Investimento — InvestNatura" },
      { name: "description", content: "Produtos B1 a B8 de 365 dias com rendimento diário de 10% do valor investido." },
      { property: "og:title", content: "Fundo de Investimento — InvestNatura" },
      { property: "og:description", content: "Escolha entre os produtos B1 a B8 com duração de 365 dias." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fundo,
});

function Fundo() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const buy = useMutation({
    mutationFn: (code: string) => purchaseProduct({ data: { code } }),
    onSuccess: () => {
      toast.success("Produto ativado com sucesso!");
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível comprar"),
  });

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-6">
      <header>
        <h1 className="text-xl font-bold">Fundo de investimento</h1>
        <p className="text-sm text-muted-foreground">
          Saldo: <span className="text-primary">{formatMzn(Number(data?.profile?.balance ?? 0))}</span>
        </p>
      </header>

      {(data?.products ?? []).map((p) => (
        <article
          key={p.code}
          className="rounded-3xl border border-border p-5"
          style={{ background: "var(--gradient-surface)" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="text-sm text-muted-foreground">Duração: {p.duration_days} dias</p>
            </div>
            <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">{p.code}</span>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-xl bg-secondary/60 p-2">
              <dt className="text-muted-foreground">Preço</dt>
              <dd className="font-semibold">{formatMzn(Number(p.price))}</dd>
            </div>
            <div className="rounded-xl bg-secondary/60 p-2">
              <dt className="text-muted-foreground">Por dia</dt>
              <dd className="font-semibold text-primary">{formatMzn(Number(p.daily_income))}</dd>
            </div>
            <div className="rounded-xl bg-secondary/60 p-2">
              <dt className="text-muted-foreground">Total</dt>
              <dd className="font-semibold text-accent">
                {formatMzn(Number(p.daily_income) * p.duration_days)}
              </dd>
            </div>
          </dl>
          <Button
            className="mt-4 h-11 w-full rounded-xl font-semibold"
            disabled={buy.isPending}
            onClick={() => buy.mutate(p.code)}
          >
            Investir agora
          </Button>
        </article>
      ))}
    </main>
  );
}