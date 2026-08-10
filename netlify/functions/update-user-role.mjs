import { ADMIN_ROLES, json, readJsonBody, requireGlobalAdmin } from "./_adminAuth.mjs";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Metodo no permitido." });
  }

  try {
    const auth = await requireGlobalAdmin(event);

    if (auth.error) {
      return auth.error;
    }

    const body = readJsonBody(event);
    const userId = String(body.userId || "").trim();
    const role = String(body.role || "").trim();
    const active = Boolean(body.active);

    if (!userId) {
      return json(400, { error: "Falta userId." });
    }

    if (!ADMIN_ROLES.includes(role)) {
      return json(400, { error: "Rol invalido." });
    }

    const { data: userData, error: userError } =
      await auth.clients.admin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return json(404, { error: userError?.message || "Usuario no encontrado." });
    }

    const { error } = await auth.clients.admin.from("admin_profiles").upsert({
      id: userId,
      email: userData.user.email,
      full_name: userData.user.user_metadata?.full_name || "",
      role,
      active,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return json(400, { error: error.message });
    }

    return json(200, { updated: true });
  } catch (error) {
    return json(500, { error: error.message || "Error actualizando usuario." });
  }
}
