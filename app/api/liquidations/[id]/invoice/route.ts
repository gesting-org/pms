import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { supabaseAdmin, INVOICES_BUCKET } from "@/lib/supabase";

// POST /api/liquidations/[id]/invoice — upload invoice PDF
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const liquidation = await prisma.liquidation.findUnique({ where: { id: params.id } });
  if (!liquidation) return NextResponse.json({ ok: false, error: "Liquidación no encontrada" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "Archivo requerido" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ ok: false, error: "Solo se aceptan archivos PDF" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: "El archivo no puede superar 10MB" }, { status: 400 });

  const fileName = `${params.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Delete old invoice if exists
  if (liquidation.invoiceUrl) {
    const oldPath = liquidation.invoiceUrl.split(`${INVOICES_BUCKET}/`)[1];
    if (oldPath) await supabaseAdmin.storage.from(INVOICES_BUCKET).remove([oldPath]);
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(INVOICES_BUCKET)
    .upload(fileName, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(INVOICES_BUCKET).getPublicUrl(fileName);

  await prisma.liquidation.update({
    where: { id: params.id },
    data: { invoiceUrl: publicUrl, invoiceFileName: file.name },
  });

  return NextResponse.json({ ok: true, invoiceUrl: publicUrl, invoiceFileName: file.name });
}

// DELETE /api/liquidations/[id]/invoice — remove invoice
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const liquidation = await prisma.liquidation.findUnique({ where: { id: params.id } });
  if (!liquidation?.invoiceUrl) return NextResponse.json({ ok: false, error: "Sin factura" }, { status: 404 });

  const oldPath = liquidation.invoiceUrl.split(`${INVOICES_BUCKET}/`)[1];
  if (oldPath) await supabaseAdmin.storage.from(INVOICES_BUCKET).remove([oldPath]);

  await prisma.liquidation.update({
    where: { id: params.id },
    data: { invoiceUrl: null, invoiceFileName: null },
  });

  return NextResponse.json({ ok: true });
}
