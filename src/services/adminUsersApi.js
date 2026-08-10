import { supabase } from "./supabase";

async function callAdminFunction(name, payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error("Debes iniciar sesion para administrar usuarios.");
  }

  const response = await fetch(`/.netlify/functions/${name}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la operacion.");
  }

  return data;
}

export async function listAdminUsers() {
  return callAdminFunction("list-users");
}

export async function inviteAdminUser({ email, fullName, role }) {
  return callAdminFunction("invite-user", { email, fullName, role });
}

export async function updateAdminUserRole({ userId, role, active }) {
  return callAdminFunction("update-user-role", { userId, role, active });
}
