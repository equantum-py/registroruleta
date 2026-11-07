# Conferencia de Jóvenes — Registro + Ruleta

**Sin Supabase.** Registro por QR desde celulares y ruleta del organizador en una pantalla separada. Backend en Vercel y almacenamiento compartido Redis REST gratuito (Upstash). No hay registro de cuentas para los participantes.

## Enlaces
- Registro público: `/` (nombre, apellido, iglesia).
- Panel del organizador: `/ruleta` (contraseña, lista, sorteo, reinicio).

## Configuración (Vercel)
1. En Vercel, abrir el proyecto `conferenciadejovenes2026` → **Storage / Marketplace** → crear/conectar una instancia **Upstash Redis** en su plan gratuito. No aceptar un plan pago. La integración puede proporcionar automáticamente `KV_REST_API_URL` y `KV_REST_API_TOKEN`, o `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. El código acepta ambas parejas.
2. En **Settings → Environment Variables**, crear `ADMIN_PASSWORD` (mínimo 12 caracteres) y `SESSION_SECRET` (cadena aleatoria de mínimo 32 caracteres). No publicar los valores.
3. **Redeploy** en producción después de guardar variables. No se necesita SQL, migraciones ni Supabase.
4. Abrir el formulario desde dos celulares y verificar que aparezcan ambos nombres en `/ruleta` tras unos segundos. Comprobar que no se repita un ganador.
5. Crear un QR del enlace público para mostrar a los asistentes. No compartir la contraseña.

## Notas
- El formulario no muestra los registrados. La API de participantes y sorteos exige sesión del organizador.
- Se bloquean registros duplicados con nombre, apellido e iglesia idénticos (sin distinguir mayúsculas).
- La ruleta se refresca cada cuatro segundos y requiere internet.
- El botón reiniciar permite volver a sortear sin eliminar datos.
- Se utiliza Redis para compartir datos entre las funciones serverless y todos los dispositivos. El navegador local por sí solo no funciona para múltiples celulares.
- Los nombres e iglesias son datos personales. Pedí consentimiento para mostrarlos en el proyector y eliminá el almacén al finalizar la actividad.
- Para evento de un día, los límites gratuitos del proveedor pueden ser suficientes; no están garantizados. La protección básica contra abuso es limitada, por lo que no conviene publicar el enlace en redes abiertas.
