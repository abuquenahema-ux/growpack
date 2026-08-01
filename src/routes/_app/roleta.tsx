import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { getDashboard, spinCheckin } from "@/lib/app.functions";
import { formatMzn } from "@/lib/countries";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/roleta")({
  head: () => ({
    meta: [
      { title: "Roleta da Sorte — InvestNatura" },
      { name: "description", content: "Faça o check-in diário e ganhe entre 1 e 5 MZN na roleta da sorte." },
      { property: "og:title", content: "Roleta da Sorte — InvestNatura" },
      { property: "og:description", content: "Check-in diário com prémio aleatório de 1 a 5 MZN." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Roleta,
});

function Roleta() {
  const qc = useQueryClient();
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<number | null>(null);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

  const spin = useMutation({
    mutationFn: () => spinCheckin(),
    onMutate: () => setSpinning(true),
    onSuccess: (res) => {
      window.setTimeout(() => {
        setSpinning(false);
        setPrize(res.amount);
        toast.success(`Ganhou ${formatMzn(res.amount)}!`);
        void qc.invalidateQueries({ queryKey: ["dashboard"] });
      }, 1800);
    },
    onError: (e) => {
      setSpinning(false);
      toast.error(e instanceof Error ? e.message : "Erro no check-in");
    },
  });

  return (
    <main className="mx-auto max-w-md space-y-6 px-4 pt-6 text-center">
      <header>
        <h1 className="text-xl font-bold">Roleta da sorte</h1>
        <p className="text-sm text-muted-foreground">Check-in diário: ganhe de 1 MZN a 5 MZN por dia</p>
      </header>

      <div
        className="mx-auto flex h-56 w-56 items-center justify-center rounded-full border-8 border-accent/30"
        style={{ background: "var(--gradient-brand)", animation: spinning ? "spin 0.6s linear infinite" : undefined }}
      >
        <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-card">
          <Gift className="h-8 w-8 text-accent" />
          <p className="mt-2 text-lg font-bold">{prize !== null ? formatMzn(prize) : "1 – 5 MZN"}</p>
        </div>
      </div>

      <Button
        className="h-12 w-full rounded-xl text-base font-semibold"
        disabled={spin.isPending || spinning || data?.checkedInToday}
        onClick={() => spin.mutate()}
      >
        {data?.checkedInToday ? "Check-in de hoje já feito" : "Girar e fazer check-in"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Saldo atual: <span className="text-primary">{formatMzn(Number(data?.profile?.balance ?? 0))}</span>
      </p>
    </main>
  );
}