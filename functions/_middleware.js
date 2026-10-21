import { handleUpload } from "./upload.js";
import { isEmptyBinding } from "./utils/http.js";

// Secret upload page + endpoint, configured by the UPLOAD_UUID environment
// variable (just the UUID segment, no slashes):
//   GET  /<UPLOAD_UUID>  serves the upload page itself and sets an
//                        upload_key cookie for /api/config.
//   POST /<UPLOAD_UUID>  runs the upload handler (no Basic Auth).
// The main site (/) never uploads: /api/config discloses the upload path
// only to browsers carrying the cookie, and the frontend only enables
// uploads while it is itself being viewed at the secret path.
// Everything else falls through to normal Pages routing.
export async function onRequest(context) {
    const { request, env } = context;

    const secret = isEmptyBinding(env.UPLOAD_UUID)
        ? ''
        : String(env.UPLOAD_UUID).trim().replace(/^\/+|\/+$/g, '');

    if (secret) {
        const url = new URL(request.url);
        if (url.pathname === `/${secret}`) {
            if (request.method === 'POST') {
                return handleUpload(context);
            }
            if (request.method === 'GET') {
                // Serve the app shell at the secret path itself.
                const assetResponse = await env.ASSETS.fetch(new URL('/index.html', request.url));
                const headers = new Headers(assetResponse.headers);
                headers.set('Content-Type', 'text/html; charset=utf-8');
                headers.set('Cache-Control', 'no-store');
                headers.set('Set-Cookie', `upload_key=${secret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
                return new Response(assetResponse.body, { status: 200, headers });
            }
        }
    }

    return context.next();
}
