export const ADMIN_ROLES = {
  globalAdmin: "global_admin",
  formAdmin: "form_admin",
  formEditor: "form_editor",
  viewer: "viewer",
};

export const ROLE_LABELS = {
  [ADMIN_ROLES.globalAdmin]: "Admin global",
  [ADMIN_ROLES.formAdmin]: "Admin formularios",
  [ADMIN_ROLES.formEditor]: "Editor",
  [ADMIN_ROLES.viewer]: "Lector",
};

export const ROLE_OPTIONS = [
  {
    value: ADMIN_ROLES.formAdmin,
    label: ROLE_LABELS[ADMIN_ROLES.formAdmin],
    description: "Crea, edita, publica formularios y administra respuestas.",
  },
  {
    value: ADMIN_ROLES.formEditor,
    label: ROLE_LABELS[ADMIN_ROLES.formEditor],
    description: "Crea y edita formularios en borrador.",
  },
  {
    value: ADMIN_ROLES.viewer,
    label: ROLE_LABELS[ADMIN_ROLES.viewer],
    description: "Consulta formularios y respuestas sin modificar datos.",
  },
  {
    value: ADMIN_ROLES.globalAdmin,
    label: ROLE_LABELS[ADMIN_ROLES.globalAdmin],
    description: "Control total, incluyendo usuarios y roles.",
  },
];

export function hasRole(profile, allowedRoles) {
  return Boolean(profile?.active && allowedRoles.includes(profile.role));
}

export function canManageUsers(profile) {
  return hasRole(profile, [ADMIN_ROLES.globalAdmin]);
}

export function canManageForms(profile) {
  return hasRole(profile, [ADMIN_ROLES.globalAdmin, ADMIN_ROLES.formAdmin, ADMIN_ROLES.formEditor]);
}

export function canPublishForms(profile) {
  return hasRole(profile, [ADMIN_ROLES.globalAdmin, ADMIN_ROLES.formAdmin]);
}

export function canDeleteData(profile) {
  return hasRole(profile, [ADMIN_ROLES.globalAdmin, ADMIN_ROLES.formAdmin]);
}
