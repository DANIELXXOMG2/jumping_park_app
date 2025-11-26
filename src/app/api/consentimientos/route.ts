import { NextRequest, NextResponse } from "next/server";
import { db, bucket } from "@/lib/firebaseAdmin";
import { consentSubmissionSchema } from "@/lib/schemas/consent.schema";
import { Consent, UserProfile } from "@/types/firestore";
import { generateConsentPdf } from "@/services/pdfService";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Validate Body
    const validation = consentSubmissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const { responsibleAdult, minors, signature } = data;

    // 2. Upload Signature to Storage
    if (!bucket) {
      throw new Error("Storage bucket not configured");
    }

    const timestamp = Date.now();
    const signaturePath = `signatures/${responsibleAdult.documentId}/${timestamp}.png`;
    const file = bucket.file(signaturePath);

    // Remove header "data:image/png;base64,"
    const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    await file.save(buffer, {
      metadata: {
        contentType: "image/png",
      },
    });

    // Generate signed URL (valid for 100 years for this MVP)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    // 3. Persist User in 'users' collection
    // We use merge: true to update existing users or create new ones without overwriting everything if not intended (though here we overwrite mostly everything to keep it fresh)
    const userProfileData: UserProfile = {
      uid: responsibleAdult.documentId,
      fullName: responsibleAdult.fullName,
      email: responsibleAdult.email,
      phone: responsibleAdult.phone,
      minors: minors.map(m => ({
        ...m,
        relationship: m.relationship
      })),
      createdAt: new Date(), // Note: In a real app, we might want to use set({ ... }, { merge: true }) carefully with createdAt. 
                             // For this MVP, we'll accept that createdAt might be updated or we could check existence first.
                             // However, to keep it simple and idempotent as requested:
      updatedAt: new Date(),
    };

    // If we want to preserve createdAt for existing users, we would need to read first or use a script.
    // But for now, let's just write.
    await db.collection("users").doc(responsibleAdult.documentId).set(userProfileData, { merge: true });

    // 4. Create Consent Document
    // Generate consecutive (using timestamp for MVP simplicity)
    const consecutivo = timestamp; 

    const consentId = db.collection("consents").doc().id;
    
    const newConsent: Consent = {
      id: consentId,
      consecutivo: consecutivo,
      userId: responsibleAdult.documentId,
      adultSnapshot: userProfileData, // Use the fresh user profile data
      minorsSnapshot: minors.map(m => ({
        ...m,
        relationship: m.relationship
      })),
      signatureUrl: signedUrl,
      policyVersion: "1.0",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      signedAt: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    };

    await db.collection("consents").doc(consentId).set(newConsent);

    // 5. Generate PDF and Send Email
    try {
      const pdfBuffer = await generateConsentPdf(newConsent, buffer);
      
      await resend.emails.send({
        from: 'Jumping Park <onboarding@resend.dev>',
        to: responsibleAdult.email,
        subject: 'Tu Consentimiento Firmado - Jumping Park',
        html: `
          <h1>¡Gracias por visitarnos!</h1>
          <p>Hola ${responsibleAdult.fullName},</p>
          <p>Adjunto encontrarás una copia de tu consentimiento informado firmado.</p>
          <p>Disfruta tu estancia en Jumping Park.</p>
        `,
        attachments: [
          {
            filename: `Consentimiento-${consecutivo}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue execution, don't fail the main request
    }

    return NextResponse.json({ success: true, consentId });

  } catch (error) {
    console.error("Error creating consent:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
