import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getDashboard, getWallet, submitDeposit, submitWithdrawal } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_app/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira — InvestNatura" },
      { name: "description", content: "Deposite por M-Pesa ou e-Mola e peça levantamentos do seu saldo InvestNatura." },
      { property: "og:title", content: "Carteira — InvestNatura" },
      { property: "og:description", content: "Depósitos e levantamentos da sua conta de investimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Carteira,
});

const METHODS = ["M-Pesa", "e-Mola", "mKesh"];

function Carteira() {
  const qc = useQueryClient();
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => getWallet() });
  const [tab, setTab] = useState<"deposito" | "levantamento">("deposito");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(METHODS[0]!);
  const [detail, setDetail] = useState("");

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["wallet"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
    setAmount("");
    setDetail("");
  };

  const deposit = useMutation({
    mutationFn: () => submitDeposit({ data: { amount: Number(amount), method, reference: detail } }),
    onSuccess: () => {
      toast.success("Depósito enviado. Aguarde a confirmação do administrador.");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const withdraw = useMutation({
    mutationFn: () => submitWithdrawal({ data: { amount: Number(amount), method, destination: detail } }),
    onSuccess: () => {
      toast.success("Pedido de levantamento registado.");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const busy = deposit.isPending || withdraw.isPending;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <section
        className="rounded-3xl border border-border p-5"
        style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-glow)" }}
      >
        <p className="text-sm text-muted-foreground">Saldo da carteira</p>
        <p className="mt-1 text-3xl font-bold">{formatMzn(Number(dashboard.data?.profile?.balance ?? 0))}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Depositado: {formatMzn(Number(dashboard.data?.profile?.total_deposited ?? 0))}
        </p>
      </section>

      <div className="grid grid-cols-2 rounded-2xl bg-secondary p-1">
        {(["deposito", "levantamento"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "deposito" ? "Depositar" : "Levantar"}
          </button>
        ))}
      </div>

      <form
        className="space-y-4 rounded-3xl border border-border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!Number(amount)) {
            toast.error("Indique um valor válido");
            return;
          }
          if (tab === "deposito") deposit.mutate();
          else withdraw.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="valor">Valor (MZN)</Label>
          <Input id="valor" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="600" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="metodo">Método</Label>
          <select
            id="metodo"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-input/40 px-3 text-sm"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="detalhe">{tab === "deposito" ? "Referência do comprovativo" : "Número que recebe"}</Label>
          <Input
            id="detalhe"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={tab === "deposito" ? "Ex: PP2409.1234.A5678" : "Ex: 84xxxxxxx"}
          />
        </div>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl font-semibold">
          {tab === "deposito" ? "Enviar depósito" : "Pedir levantamento"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {tab === "deposito"
            ? "Depósito mínimo 50 MZN. O saldo é creditado após confirmação manual."
            : "Levantamento mínimo 100 MZN. Processado manualmente pela equipa."}
        </p>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pedidos recentes</h2>
        {[...(wallet.data?.deposits ?? []).map((d) => ({ ...d, kind: "Depósito" })),
          ...(wallet.data?.withdrawals ?? []).map((w) => ({ ...w, kind: "Levantamento" }))]
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
          .slice(0, 15)
          .map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold">
                  {item.kind} • {item.method}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-PT")}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatMzn(Number(item.amount))}</p>
                <p className="text-xs capitalize text-muted-foreground">{item.status}</p>
              </div>
            </div>
          ))}
      </section>
    </main>
  );
}