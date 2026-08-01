import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getWallet } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";

export const Route = createFileRoute("/_app/transacoes")({
  head: () => ({
    meta: [
      { title: "Transações — InvestNatura" },
      { name: "description", content: "Histórico completo de rendimentos, compras, depósitos e bónus da sua conta." },
      { property: "og:title", content: "Transações — InvestNatura" },
      { property: "og:description", content: "Histórico de movimentos da sua conta de investimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Transacoes,
});

function Transacoes() {
  const { data } = useQuery({ queryKey: ["wallet"], queryFn: () => getWallet() });
  const items = data?.transactions ?? [];

  return (
    <main className="mx-auto max-w-md space-y-3 px-4 pt-6">
      <h1 className="text-xl font-bold">Transações</h1>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há movimentos registados.</p>}
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="pr-3">
            <p className="text-sm font-semibold capitalize">{t.type.replace("_", " ")}</p>
            <p className="text-xs text-muted-foreground">{t.description}</p>
            <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-PT")}</p>
          </div>
          <p className={`text-sm font-bold ${Number(t.amount) < 0 ? "text-destructive" : "text-primary"}`}>
            {Number(t.amount) < 0 ? "-" : "+"}
            {formatMzn(Math.abs(Number(t.amount)))}
          </p>
        </div>
      ))}
    </main>
  );
}