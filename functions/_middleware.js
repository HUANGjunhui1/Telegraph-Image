import { handleUpload } from "./upload.js";
import { isEmptyBinding } from "./utils/http.js";

// Secret-path uploads, configured by the UPLOAD_UUID environment variable
// (just the UUID segment, no slashes). POST /<UPLOAD_UUID> runs the upload
// handler with no Basic Auth, and GET /<UPLOAD_UUID> simply redirects to
// the homepage. The homepage itself uploads through this same path —
// /api/config tells it where uploads go. Everything else falls through to
// normal Pages routing.
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
                return Response.redirect(new URL('/', request.url), 302);
            }
        }
    }

    return context.next();
}
