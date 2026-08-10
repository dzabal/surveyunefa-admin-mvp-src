import { createClient } from "@supabase/supabase-js";

export const ADMIN_ROLES = ["global_admin", "form_admin", "form_editor", "viewer"];

export function json(statusCode, payload) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

export function readJsonBody(event) {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error("El cuerpo de la solicitud no es JSON valido.");
  }
}

export function getServerSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error("Faltan variables SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    anon: createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    admin: createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export async function requireGlobalAdmin(event) {
  const authorization = event.headers.authorization || event.headers.Authorization || "";
  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    return { error: json(401, { error: "Falta token de sesion." }) };
  }

  const clients = getServerSupabase();
  const { data: userData, error: userError } = await clients.anon.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: json(401, { error: "Sesion invalida o expirada." }) };
  }

  const { data: profile, error: profileError } = await clients.admin
    .from("admin_profiles")
    .select("id,email,role,active")
    .eq("id", userData.user.id)
    .eq("active", true)
    .maybeSingle();

  if (profileError) {
    return { error: json(500, { error: profileError.message }) };
  }

  if (profile?.role !== "global_admin") {
    return { error: json(403, { error: "Solo un admin global puede administrar usuarios." }) };
  }

  return { clients, actor: userData.user, profile };
}
