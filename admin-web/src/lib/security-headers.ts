// Encabezados de seguridad de ANA Admin. La sesión de Cognito vive en una
// cookie de todo pernexium.com.mx (ver amplify.ts): un script ajeno aquí
// leería la sesión de todas las apps, así que la página solo carga sus propios
// scripts y solo habla con los servicios que usa el navegador. Terceros: Google
// Fonts (Jost, globals.css).

/** Pool de Cognito (región del prefijo del id; por defecto us-east-2). */
const COGNITO_REGION = (process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? '').split('_')[0] || 'us-east-2';
const COGNITO = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com`;

/** Canal realtime de v4 (RealtimeWsUrl de prod si la variable no está). */
const REALTIME_DEFAULT = 'wss://c1azskji9l.execute-api.us-east-2.amazonaws.com';

/** Bucket de v3 al que el navegador sube el CSV maestro con URL firmada (PUT). */
const V3_UPLOADS = [
  'https://ana-backend-storage-prod.s3.us-east-1.amazonaws.com',
  'https://ana-backend-storage-prod.s3.amazonaws.com',
];

/** Origen (`esquema://host[:puerto]`) de una URL, o null si no es válida. */
function originOf(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).origin;
  } catch {
    return null;
  }
}

function connectSources(dev: boolean): string {
  const realtime = new Set([REALTIME_DEFAULT]);
  const configured = originOf(process.env.NEXT_PUBLIC_REALTIME_URL);
  if (configured) realtime.add(configured);
  return ["'self'", COGNITO, ...realtime, ...V3_UPLOADS, ...(dev ? ['ws:', 'http://localhost:*'] : [])].join(' ');
}

/** Directivas comunes; `script` cambia entre la capa fija y la del nonce. */
function directives(script: string, dev: boolean): string {
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSources(dev)}`,
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

/**
 * CSP fija (next.config): vale aunque el middleware no corra (archivos
 * estáticos). Permite scripts en línea porque ahí no hay nonce.
 */
export function baseCsp(dev = false): string {
  return directives(`script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`, dev);
}

/** CSP por petición con nonce: solo corren los scripts que Next marcó. */
export function nonceCsp(nonce: string, dev = false): string {
  return directives(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`, dev);
}

/** Encabezados fijos para todas las rutas. */
export function staticHeaders(dev = false): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: baseCsp(dev) },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
}
