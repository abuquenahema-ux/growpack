import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Gift, ReceiptText } from "lucide-react";
import { AdPlayer } from "@/components/AdPlayer";
import { getDashboard } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";

export const Route = createFileRoute("/_app/inicio")({
  head: () => ({
    meta: [
      { title: "Início — InvestNatura" },
      { name: "description", content: "Veja o seu saldo, rendimento diário e os anúncios de natureza da InvestNatura." },
      { property: "og:title", content: "Início — InvestNatura" },
      { property: "og:description", content: "Saldo, rendimento diário e anúncios de natureza." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const profile = data?.profile;
  const dailyTotal = (data?.investments ?? [])
    .filter((i) => i.active)
    .reduce((sum, i) => sum + Number(i.daily_income), 0);

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <header>
        <p className="text-sm text-muted-foreground">Olá,</p>
        <h1 className="text-xl font-bold">{profile?.full_name ?? "Investidor"}</h1>
      </header>

      <section
        className="rounded-3xl border border-border p-5"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-glow)" }}
      >
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="mt-1 text-3xl font-bold">{formatMzn(Number(profile?.balance ?? 0))}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-secondary/60 p-3">
            <p className="text-muted-foreground">Rendimento diário</p>
            <p className="font-semibold text-primary">{formatMzn(dailyTotal)}</p>
          </div>
          <div className="rounded-2xl bg-secondary/60 p-3">
            <p className="text-muted-foreground">Total ganho</p>
            <p className="font-semibold text-accent">{formatMzn(Number(profile?.total_earned ?? 0))}</p>
          </div>
        </div>
      </section>

      <nav className="grid grid-cols-4 gap-3">
        {[
          { to: "/carteira", label: "Depositar", icon: ArrowDownToLine },
          { to: "/carteira", label: "Levantar", icon: ArrowUpFromLine },
          { to: "/roleta", label: "Roleta", icon: Gift },
          { to: "/transacoes", label: "Transações", icon: ReceiptText },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-[11px] font-medium"
          >
            <Icon className="h-5 w-5 text-primary" />
            {label}
          </Link>
        ))}
      </nav>

      <AdPlayer />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Os meus produtos ativos</h2>
        {(data?.investments ?? []).filter((i) => i.active).length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Ainda não tem produtos. Visite o separador <Link to="/fundo" className="text-primary underline">Fundo</Link> para
            começar a investir.
          </p>
        )}
        {(data?.investments ?? [])
          .filter((i) => i.active)
          .map((inv) => (
            <div key={inv.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{inv.product_code}</span>
                <span className="text-sm text-primary">{formatMzn(Number(inv.daily_income))}/dia</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {inv.days_paid} de {inv.duration_days} dias pagos • investido {formatMzn(Number(inv.amount))}
              </p>
            </div>
          ))}
      </section>
    </main>
  );
}