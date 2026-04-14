import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// Server-side only client (secret key — never expose to browser)
export const supabaseAdmin = createClient(url, secretKey);

export const INVOICES_BUCKET = "invoices";
