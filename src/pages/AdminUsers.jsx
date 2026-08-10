import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { ROLE_OPTIONS } from "../auth/roles";
import {
  inviteAdminUser,
  listAdminUsers,
  updateAdminUserRole,
} from "../services/adminUsersApi";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("form_admin");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await listAdminUsers();
      setUsers(result.users || []);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviting(true);
    setError("");
    setNotice("");

    try {
      await inviteAdminUser({ email: email.trim(), fullName: fullName.trim(), role });
      setNotice(`Invitacion enviada a ${email.trim()}.`);
      setEmail("");
      setFullName("");
      setRole("form_admin");
      await loadUsers();
    } catch (inviteError) {
      setError(inviteError.message || "No se pudo enviar la invitacion.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (user, nextRole) => {
    setSavingUserId(user.id);
    setError("");
    setNotice("");

    try {
      await updateAdminUserRole({
        userId: user.id,
        role: nextRole,
        active: user.profile?.active ?? true,
      });
      setNotice(`Rol actualizado para ${user.email}.`);
      await loadUsers();
    } catch (roleError) {
      setError(roleError.message || "No se pudo actualizar el rol.");
    } finally {
      setSavingUserId("");
    }
  };

  const handleActiveChange = async (user, active) => {
    setSavingUserId(user.id);
    setError("");
    setNotice("");

    try {
      await updateAdminUserRole({
        userId: user.id,
        role: user.profile?.role || "viewer",
        active,
      });
      setNotice(active ? `${user.email} activado.` : `${user.email} desactivado.`);
      await loadUsers();
    } catch (activeError) {
      setError(activeError.message || "No se pudo cambiar el estado del usuario.");
    } finally {
      setSavingUserId("");
    }
  };

  return (
    <AdminLayout title="Usuarios" eyebrow="Acceso administrativo">
      <div className="detail-grid">
        <section className="form-panel">
          <h2>Invitar usuario</h2>
          <form className="stacked-form" onSubmit={handleInvite}>
            <label>
              Correo
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Nombre
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Opcional"
              />
            </label>

            <label>
              Rol
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="button primary" type="submit" disabled={inviting}>
              {inviting ? "Enviando..." : "Enviar invitacion"}
            </button>
          </form>
        </section>

        <section className="detail-panel">
          <h2>Roles disponibles</h2>
          <ul className="field-list">
            {ROLE_OPTIONS.map((option) => (
              <li key={option.value}>
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {notice ? <p className="form-message success">{notice}</p> : null}

      <section className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Ultimo acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5">Cargando usuarios.</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5">No hay usuarios administrativos registrados.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.email}</strong>
                    {user.profile?.fullName ? (
                      <span className="muted">{user.profile.fullName}</span>
                    ) : null}
                  </td>
                  <td>
                    <select
                      value={user.profile?.role || "viewer"}
                      onChange={(event) => handleRoleChange(user, event.target.value)}
                      disabled={savingUserId === user.id}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`status ${user.profile?.active ? "published" : "archived"}`}>
                      {user.profile?.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Sin acceso"}</td>
                  <td>
                    <button
                      className="button secondary compact"
                      type="button"
                      onClick={() => handleActiveChange(user, !user.profile?.active)}
                      disabled={savingUserId === user.id}
                    >
                      {user.profile?.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}

export default AdminUsers;
