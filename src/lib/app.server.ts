import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DAY_MS = 24 * 60 * 60 * 1000;

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function logTx(userId: string, type: string, amount: number, description: string) {
  await supabaseAdmin.from("transactions").insert({ user_id: userId, type, amount, description });
}

async function addBalance(userId: string, amount: number, field?: "total_earned" | "total_deposited") {
  const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!data) return;
  const patch: { balance: number; total_earned?: number; total_deposited?: number } = {
    balance: Number(data.balance) + amount,
  };
  if (field === "total_earned") patch.total_earned = Number(data.total_earned) + amount;
  if (field === "total_deposited") patch.total_deposited = Number(data.total_deposited) + amount;
  await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
}

export async function ensureProfile(
  userId: string,
  input: { fullName: string; phone: string; countryCode: string; referralCode?: string | undefined },
) {
  const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return { created: false };

  let referredBy: string | null = null;
  if (input.referralCode) {
    const { data: ref } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", input.referralCode.trim().toUpperCase())
      .maybeSingle();
    referredBy = ref?.id ?? null;
  }

  let code = randomCode();
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabaseAdmin.from("profiles").select("id").eq("referral_code", code).maybeSingle();
    if (!clash) break;
    code = randomCode();
  }

  await supabaseAdmin.from("profiles").insert({
    id: userId,
    full_name: input.fullName,
    phone: input.phone,
    country_code: input.countryCode,
    referral_code: code,
    referred_by: referredBy,
  });
  await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" });
  return { created: true };
}

export async function syncEarnings(userId: string) {
  const { data: invs } = await supabaseAdmin
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true);
  if (!invs?.length) return;

  for (const inv of invs) {
    const elapsed = Math.floor((Date.now() - new Date(inv.last_payout_at).getTime()) / DAY_MS);
    const remaining = inv.duration_days - inv.days_paid;
    const days = Math.min(elapsed, remaining);
    if (days <= 0) continue;
    const amount = days * Number(inv.daily_income);
    await addBalance(userId, amount, "total_earned");
    await logTx(userId, "rendimento", amount, `Rendimento ${inv.product_code} (${days} dia(s))`);
    await supabaseAdmin
      .from("investments")
      .update({
        days_paid: inv.days_paid + days,
        last_payout_at: new Date(new Date(inv.last_payout_at).getTime() + days * DAY_MS).toISOString(),
        active: inv.days_paid + days < inv.duration_days,
      })
      .eq("id", inv.id);
  }
}

export async function loadDashboard(userId: string) {
  await syncEarnings(userId);
  const today = new Date().toISOString().slice(0, 10);
  const [profile, products, investments, checkin, isAdmin] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabaseAdmin.from("products").select("*").order("sort_order"),
    supabaseAdmin.from("investments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabaseAdmin.from("checkins").select("*").eq("user_id", userId).eq("day", today).maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
  ]);
  return {
    profile: profile.data,
    products: products.data ?? [],
    investments: investments.data ?? [],
    checkedInToday: !!checkin.data,
    isAdmin: !!isAdmin.data,
  };
}

export async function buyProduct(userId: string, code: string) {
  const { data: product } = await supabaseAdmin.from("products").select("*").eq("code", code).maybeSingle();
  if (!product) throw new Error("Produto não encontrado");
  const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) throw new Error("Perfil não encontrado");
  if (Number(profile.balance) < Number(product.price)) throw new Error("Saldo insuficiente. Faça um depósito primeiro.");

  await supabaseAdmin
    .from("profiles")
    .update({ balance: Number(profile.balance) - Number(product.price) })
    .eq("id", userId);
  await supabaseAdmin.from("investments").insert({
    user_id: userId,
    product_code: product.code,
    amount: product.price,
    daily_income: product.daily_income,
    duration_days: product.duration_days,
  });
  await logTx(userId, "compra", -Number(product.price), `Compra do ${product.name}`);
  return { ok: true };
}

export async function dailyCheckin(userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabaseAdmin
    .from("checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();
  if (existing) throw new Error("Já fez o check-in de hoje. Volte amanhã!");
  const amount = Math.round((1 + Math.random() * 4) * 100) / 100;
  await supabaseAdmin.from("checkins").insert({ user_id: userId, day: today, amount });
  await addBalance(userId, amount);
  await logTx(userId, "checkin", amount, "Roleta da sorte — check-in diário");
  return { amount };
}

export async function createDeposit(userId: string, amount: number, method: string, reference: string) {
  if (amount < 50) throw new Error("Depósito mínimo: 50 MZN");
  await supabaseAdmin.from("deposits").insert({ user_id: userId, amount, method, reference });
  return { ok: true };
}

export async function createWithdrawal(userId: string, amount: number, method: string, destination: string) {
  const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!profile) throw new Error("Perfil não encontrado");
  if (amount < 100) throw new Error("Levantamento mínimo: 100 MZN");
  if (Number(profile.balance) < amount) throw new Error("Saldo insuficiente");
  await supabaseAdmin.from("profiles").update({ balance: Number(profile.balance) - amount }).eq("id", userId);
  await supabaseAdmin.from("withdrawals").insert({ user_id: userId, amount, method, destination });
  await logTx(userId, "levantamento", -amount, `Pedido de levantamento (${method})`);
  return { ok: true };
}

export async function loadWallet(userId: string) {
  const [deposits, withdrawals, transactions] = await Promise.all([
    supabaseAdmin.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
    supabaseAdmin.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(100),
  ]);
  return {
    deposits: deposits.data ?? [],
    withdrawals: withdrawals.data ?? [],
    transactions: transactions.data ?? [],
  };
}

export async function loadReferrals(userId: string) {
  const { data: profile } = await supabaseAdmin.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
  const { data: invited } = await supabaseAdmin
    .from("profiles")
    .select("full_name, created_at, first_deposit_done")
    .eq("referred_by", userId)
    .order("created_at", { ascending: false });
  const { data: bonuses } = await supabaseAdmin
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "bonus_convite");
  const total = (bonuses ?? []).reduce((sum, b) => sum + Number(b.amount), 0);
  return { code: profile?.referral_code ?? "", invited: invited ?? [], totalBonus: total };
}

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito a administradores");
}

export async function loadAdmin(userId: string) {
  await assertAdmin(userId);
  const [deposits, withdrawals] = await Promise.all([
    supabaseAdmin.from("deposits").select("*").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("withdrawals").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  return { deposits: deposits.data ?? [], withdrawals: withdrawals.data ?? [] };
}

export async function reviewDeposit(userId: string, depositId: string, approve: boolean) {
  await assertAdmin(userId);
  const { data: dep } = await supabaseAdmin.from("deposits").select("*").eq("id", depositId).maybeSingle();
  if (!dep || dep.status !== "pendente") throw new Error("Depósito inválido");
  await supabaseAdmin
    .from("deposits")
    .update({ status: approve ? "aprovado" : "rejeitado" })
    .eq("id", depositId);
  if (!approve) return { ok: true };

  const amount = Number(dep.amount);
  await addBalance(dep.user_id, amount, "total_deposited");
  await logTx(dep.user_id, "deposito", amount, `Depósito aprovado (${dep.method})`);

  const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", dep.user_id).maybeSingle();
  if (profile && !profile.first_deposit_done) {
    await supabaseAdmin.from("profiles").update({ first_deposit_done: true }).eq("id", dep.user_id);
    if (profile.referred_by) {
      const bonus = Math.round(amount * 0.1 * 100) / 100;
      await addBalance(profile.referred_by, bonus);
      await logTx(profile.referred_by, "bonus_convite", bonus, `Bónus de convite (10% do 1.º depósito de ${profile.full_name})`);
    }
  }
  return { ok: true };
}

export async function reviewWithdrawal(userId: string, withdrawalId: string, approve: boolean) {
  await assertAdmin(userId);
  const { data: wd } = await supabaseAdmin.from("withdrawals").select("*").eq("id", withdrawalId).maybeSingle();
  if (!wd || wd.status !== "pendente") throw new Error("Levantamento inválido");
  await supabaseAdmin
    .from("withdrawals")
    .update({ status: approve ? "pago" : "rejeitado" })
    .eq("id", withdrawalId);
  if (!approve) {
    await addBalance(wd.user_id, Number(wd.amount));
    await logTx(wd.user_id, "reembolso", Number(wd.amount), "Levantamento rejeitado — valor devolvido");
  }
  return { ok: true };
}