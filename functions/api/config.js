import { isEmptyBinding, jsonResponse } from '../utils/http.js';
import { isShortUrlsEnabled } from '../utils/shortlink.js';
import { getSetupStatus } from '../utils/setup-status.js';

// Public, non-sensitive site configuration for the frontend. Any static UI can
// read this once at startup instead of the deployment having to edit HTML.
export async function onRequestGet(context) {
    const { env, request } = context;
    const setup = getSetupStatus(env);

    // Uploads are gated by a secret path segment from the UPLOAD_UUID
    // environment variable. The path is disclosed only to browsers that came
    // in through the secret link (its GET sets the upload_key cookie — see
    // functions/_middleware.js); everyone else gets no uploadPath and the
    // frontend keeps uploads disabled.
    const uploadSecret = isEmptyBinding(env.UPLOAD_UUID)
        ? ''
        : String(env.UPLOAD_UUID).trim().replace(/^\/+|\/+$/g, '');
    const cookieHeader = request.headers.get('Cookie') || '';
    const hasUploadKey = uploadSecret !== '' && cookieHeader
        .split(';')
        .some((part) => part.trim() === `upload_key=${uploadSecret}`);

    return jsonResponse({
        siteName: env.SITE_NAME || 'Telegraph-Image',
        siteTitle: env.SITE_TITLE || env.SITE_NAME || 'Telegraph-Image | 免费图床',
        backgroundImage: env.SITE_BACKGROUND || '',
        enableShortUrls: isShortUrlsEnabled(env),
        uploadRequiresAuth: uploadSecret !== '',
        showAdminEntry: env.HIDE_ADMIN_ENTRY !== 'true',
        ...(hasUploadKey ? { uploadPath: `/${uploadSecret}` } : {}),
        // Deployment self-check so a misconfigured site says so instead of
        // failing silently on the first upload. Enum status only, no values.
        ready: setup.ready,
        setup: setup.checks,
        problems: setup.problems,
    }, {
        headers: { 'Cache-Control': 'no-store' },
    });
}
