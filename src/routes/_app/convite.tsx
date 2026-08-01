import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { getReferrals } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/convite")({
  head: () => ({
    meta: [
      { title: "Convide amigos — InvestNatura" },
      { name: "description", content: "Partilhe o seu código e ganhe 10% do primeiro depósito de cada convidado." },
      { property: "og:title", content: "Convide amigos — InvestNatura" },
      { property: "og:description", content: "Ganhe 10% do primeiro depósito de cada pessoa que convidar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Convite,
});

function Convite() {
  const { data } = useQuery({ queryKey: ["referrals"], queryFn: () => getReferrals() });
  const link = typeof window !== "undefined" ? `${window.location.origin}/?ref=${data?.code ?? ""}` : "";

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <header>
        <h1 className="text-xl font-bold">Convide e ganhe</h1>
        <p className="text-sm text-muted-foreground">Receba 10% do primeiro depósito de cada convidado.</p>
      </header>

      <section
        className="rounded-3xl border border-border p-5 text-center"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-glow)" }}
      >
        <p className="text-sm text-muted-foreground">O seu código de convite</p>
        <p className="mt-2 text-3xl font-bold tracking-[0.3em] text-accent">{data?.code ?? "······"}</p>
        <Button
          variant="secondary"
          className="mt-4 w-full rounded-xl"
          onClick={() => {
            void navigator.clipboard.writeText(link);
            toast.success("Link copiado!");
          }}
        >
          <Copy className="mr-2 h-4 w-4" /> Copiar link de convite
        </Button>
        <p className="mt-3 break-all text-xs text-muted-foreground">{link}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Convidados</p>
          <p className="text-xl font-bold">{data?.invited.length ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Bónus recebido</p>
          <p className="text-xl font-bold text-primary">{formatMzn(data?.totalBonus ?? 0)}</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">A minha equipa</h2>
        {(data?.invited ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não convidou ninguém.</p>
        )}
        {(data?.invited ?? []).map((m, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-semibold">{m.full_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-PT")}</p>
            </div>
            <span className={`text-xs ${m.first_deposit_done ? "text-primary" : "text-muted-foreground"}`}>
              {m.first_deposit_done ? "Depositou" : "Sem depósito"}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}