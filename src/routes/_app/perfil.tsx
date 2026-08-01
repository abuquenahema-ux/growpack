import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ShieldCheck, ReceiptText, Gift } from "lucide-react";
import { getDashboard } from "@/lib/app.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — InvestNatura" },
      { name: "description", content: "Dados da sua conta, totais investidos e definições da InvestNatura." },
      { property: "og:title", content: "Perfil — InvestNatura" },
      { property: "og:description", content: "Gerir a sua conta de investimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const p = data?.profile;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <section
        className="rounded-3xl border border-border p-5"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-soft)" }}
      >
        <h1 className="text-xl font-bold">{p?.full_name ?? "—"}</h1>
        <p className="text-sm text-muted-foreground">
          {p?.country_code} {p?.phone}
        </p>
        <p className="mt-3 text-sm">
          Código de convite: <span className="font-semibold text-accent">{p?.referral_code}</span>
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Saldo</p>
          <p className="text-sm font-bold">{formatMzn(Number(p?.balance ?? 0))}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Depositado</p>
          <p className="text-sm font-bold">{formatMzn(Number(p?.total_deposited ?? 0))}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-[11px] text-muted-foreground">Ganho</p>
          <p className="text-sm font-bold text-primary">{formatMzn(Number(p?.total_earned ?? 0))}</p>
        </div>
      </section>

      <nav className="space-y-2">
        <Link to="/transacoes" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <ReceiptText className="h-5 w-5 text-primary" /> Histórico de transações
        </Link>
        <Link to="/roleta" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <Gift className="h-5 w-5 text-accent" /> Roleta da sorte
        </Link>
        {data?.isAdmin && (
          <Link to="/admin" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <ShieldCheck className="h-5 w-5 text-accent" /> Painel de administração
          </Link>
        )}
      </nav>

      <Button
        variant="secondary"
        className="h-12 w-full rounded-xl"
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="mr-2 h-4 w-4" /> Terminar sessão
      </Button>
    </main>
  );
}