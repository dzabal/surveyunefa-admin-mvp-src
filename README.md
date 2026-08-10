# SurveyUNEFA Admin

Portal administrativo para publicar formularios JSON de SurveyJS Form Library y guardar respuestas en Supabase.

## Variables locales

Copia `.env.example` a `.env` y completa:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Para probar invitaciones con `netlify dev`, agrega tambien:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_INVITE_REDIRECT_URL=http://localhost:5173/login
```

`SUPABASE_SERVICE_ROLE_KEY` solo debe existir en Netlify Functions o en entorno local seguro. Nunca debe usarse en componentes React.

## Base de datos y Auth

1. Ejecuta `supabase-schema.sql` en Supabase SQL Editor.
2. Crea el primer usuario desde Supabase Auth.
3. Copia el `id` del usuario y ejecuta el bloque bootstrap al final de `supabase-schema.sql` para asignarle `global_admin`.
4. Inicia sesion en `/login`.
5. Entra a `/admin/users` para invitar otros usuarios y asignar roles.

## Roles

- `global_admin`: control total, incluyendo usuarios y roles.
- `form_admin`: crea, edita, publica, archiva formularios y administra respuestas.
- `form_editor`: crea y edita formularios en borrador.
- `viewer`: solo consulta formularios y respuestas.

La seguridad real se aplica con RLS en Supabase. Las rutas protegidas de React solo mejoran la experiencia de usuario.
