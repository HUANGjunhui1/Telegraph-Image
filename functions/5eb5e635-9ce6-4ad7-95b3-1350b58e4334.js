import { handleUpload } from "./upload.js";

// Secret upload path. Uploads are accepted here without Basic Auth
// (UPLOAD_BASIC_USER / UPLOAD_BASIC_PASS are no longer used): knowing this
// link is the permission. Opening the link in a browser jumps straight to
// the homepage, where uploads go through this same path.
export const onRequestPost = handleUpload;

export function onRequestGet({ request }) {
    return Response.redirect(new URL('/', request.url), 302);
}
