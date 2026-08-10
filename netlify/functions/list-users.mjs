import { json, requireGlobalAdmin } from "./_adminAuth.mjs";

function normalizeUser(user, profile) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
    profile: profile
      ? {
          fullName: profile.full_name || "",
          role: profile.role,
          active: Boolean(profile.active),
        }
      : null,
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Metodo no permitido." });
  }

  try {
    const auth = await requireGlobalAdmin(event);

    if (auth.error) {
      return auth.error;
    }

    const { clients } = auth;
    const [{ data: usersData, error: usersError }, { data: profiles, error: profilesError }] =
      await Promise.all([
        clients.admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        clients.admin.from("admin_profiles").select("*"),
      ]);

    if (usersError) {
      return json(500, { error: usersError.message });
    }

    if (profilesError) {
      return json(500, { error: profilesError.message });
    }

    const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const users = (usersData.users || [])
      .map((user) => normalizeUser(user, profilesById.get(user.id)))
      .filter((user) => user.profile)
      .sort((a, b) => String(a.email).localeCompare(String(b.email)));

    return json(200, { users });
  } catch (error) {
    return json(500, { error: error.message || "Error listando usuarios." });
  }
}
