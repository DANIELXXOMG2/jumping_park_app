import { NextResponse } from "next/server";
import { z } from "zod";
import { getDocById } from "@/lib/firestoreService";
import type { UserProfile } from "@/types/firestore";

const COLLECTION = "usuarios";

const bodySchema = z.object({
  cedula: z
    .string()
    .trim()
    .min(6, "La cédula es muy corta")
    .max(15, "La cédula es muy larga")
    .regex(/^\d+$/, "Solo se permiten números"),
});

const maskEmail = (email: string): string => {
  const [localPart, domainPart] = email.split("@");
  if (!domainPart) return "***@***";

  const visibleLocal = localPart.slice(0, 2).padEnd(Math.min(localPart.length, 2) || 1, "*");
  const obfuscatedLocal = `${visibleLocal}${"*".repeat(Math.max(localPart.length - 2, 2))}`;

  const domainSegments = domainPart.split(".");
  const tld = domainSegments.pop();
  const domainName = domainSegments.join(".");
  const obfuscatedDomain = `${domainName.slice(0, 1) || "*"}***`;

  return `${obfuscatedLocal}@${obfuscatedDomain}${tld ? `.${tld}` : ""}`;
};

const sanitizeUser = (user: UserProfile) => ({
  uid: user.uid,
  fullName: user.fullName,
  email: user.email,
  emailMasked: maskEmail(user.email),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const { cedula } = bodySchema.parse(rawBody);

    const existingUser = await getDocById<UserProfile>(COLLECTION, cedula);

    if (!existingUser) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, userData: sanitizeUser(existingUser) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validación fallida", details: error.issues }, { status: 400 });
    }

    console.error("Error en /api/usuarios/check", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
