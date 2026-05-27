import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { id } from "./ranking";

const COOKIE = "cafe_connect_user";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE)?.value;
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user ?? null;
}

/** Ensures a DB user exists for the cookie set by middleware (no cookie writes). */
export async function ensureUserInDb(name?: string) {
  const existing = await getCurrentUser();
  if (existing) return existing;

  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE)?.value;
  if (!userId) return null;

  const displayName = name?.trim() || "Coffee Lover";
  await db
    .insert(users)
    .values({ id: userId, name: displayName })
    .onConflictDoNothing();

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user!;
}

/** For Route Handlers — creates user and sets cookie if missing. */
export async function ensureUser(name?: string) {
  const existing = await getCurrentUser();
  if (existing) return existing;

  const cookieStore = await cookies();
  let userId = cookieStore.get(COOKIE)?.value;
  if (!userId) {
    userId = id();
    cookieStore.set(COOKIE, userId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const displayName = name?.trim() || "Coffee Lover";
  await db
    .insert(users)
    .values({ id: userId, name: displayName })
    .onConflictDoNothing();

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user!;
}
