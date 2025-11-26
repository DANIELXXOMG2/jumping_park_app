import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebaseAdmin";
import type { UserProfile } from "@/types/firestore";

const COLLECTION = "users";

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
  // NO devolver datos personales reales aquí para evitar enumeración/exposición
  // Solo devolvemos el email ofuscado para UI feedback
  emailMasked: maskEmail(user.email),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();
    const { cedula } = bodySchema.parse(rawBody);

    // Buscamos por ID de documento (si coincide con la cédula) O por campo 'uid'
    // Primero intentamos buscar por campo 'uid' que es lo más probable en la nueva estructura
    const usersRef = db.collection(COLLECTION);
    const querySnapshot = await usersRef.where("uid", "==", cedula).limit(1).get();

    let userData: UserProfile | null = null;

    if (!querySnapshot.empty) {
      userData = querySnapshot.docs[0].data() as UserProfile;
    } else {
      // Fallback: intentar buscar por ID de documento
      const docSnap = await usersRef.doc(cedula).get();
      if (docSnap.exists) {
        userData = docSnap.data() as UserProfile;
      }
    }

    if (!userData) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, userData: sanitizeUser(userData) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validación fallida", details: error.issues }, { status: 400 });
    }

    // console.error("Error en /api/usuarios/check", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
