import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COUNTRIES, normalizePhone, phoneToEmail } from "@/lib/countries";
import { setupProfile } from "@/lib/app.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InvestNatura — Cadastro e Login" },
      {
        name: "description",
        content:
          "Crie a sua conta InvestNatura com número de telefone e comece a investir em produtos de 365 dias com rendimento diário.",
      },
      { property: "og:title", content: "InvestNatura — Plataforma de Investimento" },
      {
        property: "og:description",
        content: "Cadastre-se, invista em produtos B1 a B8 e receba rendimento diário durante 365 dias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function PasswordField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="pr-11"
        />
        <button
          type="button"
          aria-label={show ? "Ocultar senha" : "Ver senha"}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"cadastro" | "login">("cadastro");
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [dial, setDial] = useState(COUNTRIES[0]!.dial);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [invite, setInvite] = useState("");
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) setInvite(ref.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/inicio" });
  }, [loading, session, navigate]);

  const country = COUNTRIES.find((c) => c.dial === dial)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "login" && emailMode) {
      if (!email.includes("@")) {
        toast.error("Email inválido");
        return;
      }
      if (password.length < 4) {
        toast.error("Senha inválida");
        return;
      }
      setBusy(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw new Error("Email ou senha incorretos");
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/inicio" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ocorreu um erro");
      } finally {
        setBusy(false);
      }
      return;
    }
    const digits = normalizePhone(dial, phone);
    if (digits.length < 8) {
      toast.error("Número inválido para " + country.name);
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (mode === "cadastro") {
      if (fullName.trim().split(" ").length < 2) {
        toast.error("Escreva o seu nome completo");
        return;
      }
      if (password !== confirm) {
        toast.error("As senhas não coincidem");
        return;
      }
    }

    setBusy(true);
    try {
      const email = phoneToEmail(dial, phone);
      if (mode === "cadastro") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        await setupProfile({
          data: {
            fullName: fullName.trim(),
            phone: phone.replace(/\D/g, ""),
            countryCode: dial,
            referralCode: invite.trim() || undefined,
          },
        });
        toast.success("Conta criada com sucesso!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("Número ou senha incorretos");
        toast.success("Bem-vindo de volta!");
      }
      navigate({ to: "/inicio" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
            style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
          >
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">InvestNatura</h1>
          <p className="mt-1 text-sm text-muted-foreground">Investimento verde com rendimento diário</p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-secondary p-1">
          {(["cadastro", "login"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "cadastro" ? "Cadastro" : "Entrar"}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-border p-6"
          style={{ background: "var(--gradient-surface)", boxShadow: "var(--shadow-soft)" }}
        >
          {mode === "cadastro" && (
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João Alberto Machava"
              />
            </div>
          )}

          {mode === "login" && emailMode ? (
            <div className="space-y-1.5">
              <Label htmlFor="email">Email do administrador</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número de telefone</Label>
              <div className="flex gap-2">
                <select
                  aria-label="Região"
                  value={dial}
                  onChange={(e) => setDial(e.target.value)}
                  className="h-10 w-32 rounded-md border border-input bg-input/40 px-2 text-sm"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.dial}>
                      {c.flag} {c.dial}
                    </option>
                  ))}
                </select>
                <Input
                  id="numero"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={"8".padEnd(country.digits, "0")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {country.name} • {country.digits} dígitos • será usado para entrar
              </p>
            </div>
          )}

          <PasswordField id="senha" label="Senha" value={password} onChange={setPassword} />
          {mode === "cadastro" && (
            <>
              <PasswordField id="senha2" label="Repetir senha" value={confirm} onChange={setConfirm} />
              <div className="space-y-1.5">
                <Label htmlFor="convite">Código de convite (opcional)</Label>
                <Input
                  id="convite"
                  value={invite}
                  onChange={(e) => setInvite(e.target.value.toUpperCase())}
                  placeholder="Ex: A1B2C3"
                />
              </div>
            </>
          )}

          <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "cadastro" ? "Criar conta" : "Entrar"}
          </Button>

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setEmailMode((v) => !v)}
              className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              {emailMode ? "Entrar com número de telefone" : "Entrar com email (administrador)"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
