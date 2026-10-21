import { isEmptyBinding, jsonResponse } from '../utils/http.js';
import { isShortUrlsEnabled } from '../utils/shortlink.js';
import { getSetupStatus } from '../utils/setup-status.js';

// Public, non-sensitive site configuration for the frontend. Any static UI can
// read this once at startup instead of the deployment having to edit HTML.
export async function onRequestGet(context) {
    const { env } = context;
    const setup = getSetupStatus(env);

    // Uploads go to a secret path segment from the UPLOAD_UUID environment
    // variable when one is configured (see functions/_middleware.js), and
    // fall back to the plain /upload route otherwise. The active path is
    // public information for the frontend: the homepage uploads through it.
    const uploadSecret = isEmptyBinding(env.UPLOAD_UUID)
        ? ''
        : String(env.UPLOAD_UUID).trim().replace(/^\/+|\/+$/g, '');

    return jsonResponse({
        siteName: env.SITE_NAME || 'Telegraph-Image',
        siteTitle: env.SITE_TITLE || env.SITE_NAME || 'Telegraph-Image | 免费图床',
        backgroundImage: env.SITE_BACKGROUND || '',
        enableShortUrls: isShortUrlsEnabled(env),
        uploadRequiresAuth: uploadSecret !== '',
        showAdminEntry: env.HIDE_ADMIN_ENTRY !== 'true',
        uploadPath: uploadSecret ? `/${uploadSecret}` : '/upload',
        // Deployment self-check so a misconfigured site says so instead of
        // failing silently on the first upload. Enum status only, no values.
        ready: setup.ready,
        setup: setup.checks,
        problems: setup.problems,
    }, {
        headers: { 'Cache-Control': 'no-store' },
    });
}
