import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const setupProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        fullName: z.string().min(3),
        phone: z.string().min(5),
        countryCode: z.string().min(2),
        referralCode: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureProfile } = await import("./app.server");
    return ensureProfile(context.userId, data);
  });

export const getDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadDashboard } = await import("./app.server");
    return loadDashboard(context.userId);
  });

export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const { buyProduct } = await import("./app.server");
    return buyProduct(context.userId, data.code);
  });

export const spinCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { dailyCheckin } = await import("./app.server");
    return dailyCheckin(context.userId);
  });

export const getWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadWallet } = await import("./app.server");
    return loadWallet(context.userId);
  });

export const submitDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ amount: z.number().positive(), method: z.string(), reference: z.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createDeposit } = await import("./app.server");
    return createDeposit(context.userId, data.amount, data.method, data.reference);
  });

export const submitWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ amount: z.number().positive(), method: z.string(), destination: z.string() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createWithdrawal } = await import("./app.server");
    return createWithdrawal(context.userId, data.amount, data.method, data.destination);
  });

export const getReferrals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadReferrals } = await import("./app.server");
    return loadReferrals(context.userId);
  });

export const getAdminQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAdmin } = await import("./app.server");
    return loadAdmin(context.userId);
  });

export const decideDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string(), approve: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    const { reviewDeposit } = await import("./app.server");
    return reviewDeposit(context.userId, data.id, data.approve);
  });

export const decideWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string(), approve: z.boolean() }).parse(data))
  .handler(async ({ data, context }) => {
    const { reviewWithdrawal } = await import("./app.server");
    return reviewWithdrawal(context.userId, data.id, data.approve);
  });

export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), password: z.string().min(6) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { adminResetPassword } = await import("./app.server");
    return adminResetPassword(context.userId, data.userId, data.password);
  });

export const adminUpdateBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid(), balance: z.number().min(0) }).parse(data))
  .handler(async ({ data, context }) => {
    const { adminSetBalance } = await import("./app.server");
    return adminSetBalance(context.userId, data.userId, data.balance);
  });

export const getNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadNotifications } = await import("./app.server");
    return loadNotifications(context.userId);
  });

export const readNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { markNotificationsRead } = await import("./app.server");
    return markNotificationsRead(context.userId);
  });