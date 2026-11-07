# Registro + Ruleta bíblica

Dinámica para un evento. Los asistentes completan en **/** desde el celular los campos **nombre, apellido e iglesia**. El organizador abre **/ruleta** en computadora/proyector, accede con contraseña y hace girar la ruleta. La persona elegida tiene que decir un versículo bíblico.

## Funcionalidades

- Registro mobile-first; aviso de confirmación; bloquea duplicados del mismo nombre, apellido e iglesia.
- Pantalla de administración con lista de participantes, ruleta animada y contador.
- Actualización automática cada cuatro segundos en la computadora del organizador.
- Sorteos sin repetir personas elegidas. Reinicio de elegibilidad sin borrar registros.
- Sorteo aleatorio atómico con PostgreSQL, privado con RLS y funciones solo para service_role.
- Contraseña del administrador, sesión firmada HttpOnly y ninguna lista pública.
- Vercel + Supabase, planes gratuitos para uso pequeño, sujetos a sus límites.

## Configurar

1. Crear proyecto gratuito de Supabase. Abrir SQL Editor y ejecutar **supabase/schema.sql**.
2. Importar este repositorio en Vercel como Framework Preset **Other**; no se necesita comando de build.
3. En Vercel configurar las variables de `.env.example` en Production: **SUPABASE_URL**, **SUPABASE_SERVICE_ROLE_KEY**, **ADMIN_PASSWORD** (mínimo 12 caracteres) y **SESSION_SECRET** (mínimo 32 caracteres, por ejemplo generado con `openssl rand -hex 32`).
4. La clave service_role es **secreta**: jamás se publica, no se pone en frontend ni se comparte en GitHub.
5. Desplegar y probar `/` en celular y `/ruleta` en computadora. Para proyector usar F11.
6. Registrar dos personas de prueba, verificar sincronización, varios sorteos sin repetir, reinicio, acceso protegido y buena conexión a internet.

## Operación

Compartí un QR con la URL de registro; **solo el coordinador** debe acceder con contraseña a la ruleta. Pedí autorización para mostrar nombres e iglesia en la pantalla. Si se usa para una actividad posterior, borrar manualmente los registros antiguos de manera autorizada; el botón «Reiniciar» **no** elimina personas.

## Limitaciones de la primera versión

La sincronización usa sondeo de cuatro segundos (no WebSocket); requiere internet. La API de inscripción incluye un campo trampa anti-bots, pero no tiene un CAPTCHA ni un límite de solicitudes distribuido. El acceso del administrador usa contraseña fuerte, pero no limita intentos entre instancias. Antes de distribuir un enlace públicamente a gran escala se debe agregar limitación de solicitudes e intentos. La aplicación necesita que la base de datos y las variables se configuren; este repositorio por sí solo no constituye un despliegue operativo.

## Verificación local

Usá `npm run check` para sintaxis de los módulos JS. Para probar las funciones HTTP en local, instalá Vercel CLI y ejecutá `npx vercel dev` con las variables configuradas en `.env.local`.
