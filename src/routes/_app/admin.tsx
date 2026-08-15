import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminResetUserPassword,
  adminUpdateBalance,
  decideDeposit,
  decideWithdrawal,
  getAdminQueue,
  getDashboard,
} from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return <AdminInner />;
}

type ProfileRow = {
  id: string;
  full_name: string;
  phone: string;
  country_code: string;
  balance: number | string;
  total_deposited: number | string;
  total_earned: number | string;
  referral_code: string;
};

function UserCard({ user, onDone }: { user: ProfileRow; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [bal, setBal] = useState(String(Number(user.balance)));

  const resetPw = useMutation({
    mutationFn: () => adminResetUserPassword({ data: { userId: user.id, password: pw } }),
    onSuccess: () => {
      toast.success("Senha redefinida");
      setPw("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });
  const setBalance = useMutation({
    mutationFn: () => adminUpdateBalance({ data: { userId: user.id, balance: Number(bal) } }),
    onSuccess: () => {
      toast.success("Saldo atualizado");
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">{user.full_name || "—"}</p>
      <p className="text-xs text-muted-foreground">
        {user.country_code} {user.phone} • convite {user.referral_code}
      </p>
      <p className="mt-1 text-xs">
        Saldo <span className="font-semibold">{formatMzn(Number(user.balance))}</span> • Depositado{" "}
        {formatMzn(Number(user.total_deposited))} • Ganho {formatMzn(Number(user.total_earned))}
      </p>
      <div className="mt-3 flex gap-2">
        <Input value={bal} onChange={(e) => setBal(e.target.value)} inputMode="decimal" placeholder="Saldo" />
        <Button size="sm" variant="secondary" onClick={() => setBalance.mutate()}>
          Guardar
        </Button>
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Nova senha (mín. 6)" />
        <Button size="sm" disabled={pw.length < 6} onClick={() => resetPw.mutate()}>
          Redefinir
        </Button>
      </div>
    </div>
  );
}

function AdminInner() {
  const qc = useQueryClient();
  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashboard(),
    retry: false,
  });
  const isAdmin = !!dash?.isAdmin;
  const { data, error } = useQuery({
    queryKey: ["admin"],
    queryFn: () => getAdminQueue(),
    retry: false,
    enabled: isAdmin,
  });

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

  if (dashLoading) return <main className="p-6 text-sm text-muted-foreground">A carregar…</main>;
  if (!isAdmin || error || data?.authorized === false)
    return <main className="p-6 text-sm text-muted-foreground">Acesso restrito a administradores.</main>;

  return (
    <main className="mx-auto max-w-md space-y-5 px-4 pt-6">
      <h1 className="text-xl font-bold">Administração</h1>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Utilizadores ({data?.users?.length ?? 0})</h2>
        <p className="text-xs text-muted-foreground">
          Por segurança, as senhas são guardadas encriptadas e não podem ser lidas por ninguém — pode, no entanto,
          definir uma nova senha para qualquer utilizador.
        </p>
        {(data?.users ?? []).map((u) => (
          <UserCard key={u.id} user={u} onDone={refresh} />
        ))}
      </section>

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