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
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const role = String(body.role || "viewer").trim();

    if (!email || !email.includes("@")) {
      return json(400, { error: "Correo invalido." });
    }

    if (!ADMIN_ROLES.includes(role)) {
      return json(400, { error: "Rol invalido." });
    }

    const redirectTo =
      process.env.SUPABASE_INVITE_REDIRECT_URL ||
      process.env.URL && `${process.env.URL}/login`;
    const { data, error } = await auth.clients.admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, admin_role: role },
      redirectTo,
    });

    if (error) {
      return json(400, { error: error.message });
    }

    const user = data.user;

    if (user?.id) {
      const { error: profileError } = await auth.clients.admin.from("admin_profiles").upsert({
        id: user.id,
        email,
        full_name: fullName,
        role,
        active: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        return json(500, { error: profileError.message });
      }
    }

    return json(200, { invited: true, email });
  } catch (error) {
    return json(500, { error: error.message || "Error enviando invitacion." });
  }
}
