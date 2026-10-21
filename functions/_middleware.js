import { handleUpload } from "./upload.js";
import { isEmptyBinding } from "./utils/http.js";

// Secret-path uploads, configured by the UPLOAD_UUID environment variable
// (just the UUID segment, no slashes). POST /<UPLOAD_UUID> uploads directly
// with no Basic Auth; GET /<UPLOAD_UUID> redirects to the homepage and sets
// an upload_key cookie so /api/config will disclose the upload path to this
// browser. Everything else falls through to normal Pages routing.
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
                return new Response(null, {
                    status: 302,
                    headers: {
                        'Location': new URL('/', request.url).toString(),
                        'Set-Cookie': `upload_key=${secret}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
                    },
                });
            }
        }
    }

    return context.next();
}
