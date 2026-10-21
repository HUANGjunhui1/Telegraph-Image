import { errorHandling, telemetryData } from "./utils/middleware.js";
import { isEmptyBinding, jsonResponse } from "./utils/http.js";
import { createDefaultMetadata, putMetadata } from "./utils/metadata.js";
import { allocateShortId, isShortUrlsEnabled, putShortLink } from "./utils/shortlink.js";
import { getUploadProvider } from "./storage/index.js";


export async function handleUpload(context) {
    const { request, env } = context;

    try {
        const provider = getUploadProvider(env);
        provider.validateConfig(env);

        const clonedRequest = request.clone();
        const formData = await clonedRequest.formData();

        await errorHandling(context);
        telemetryData(context);

        const uploadFile = formData.get('file');
        if (!uploadFile) {
            throw new Error('No file uploaded');
        }

        const fileName = uploadFile.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        const longId = await provider.upload(env, uploadFile, { fileName, fileExtension });
        let shortId = null;

        // 将文件信息保存到 KV 存储
        if (env.img_url) {
            if (isShortUrlsEnabled(env)) {
                shortId = await allocateShortId(env);
            }

            await putMetadata(env, longId, createDefaultMetadata(longId, {
                fileName,
                fileSize: uploadFile.size,
                provider: provider.key,
                ...(shortId ? { shortId } : {}),
            }));

            if (shortId) {
                await putShortLink(env, shortId, longId);
            }
        }

        return jsonResponse([{ 'src': `/file/${shortId || longId}` }]);
    } catch (error) {
        console.error('Upload error:', error);
        return jsonResponse({ error: error.message }, { status: 500 });
    }
}

// The plain /upload route is the fallback for deployments without a secret
// path: once UPLOAD_UUID is configured, uploads happen only through
// /<UPLOAD_UUID> (see functions/_middleware.js) and this route is closed.
export async function onRequestPost(context) {
    const secret = isEmptyBinding(context.env.UPLOAD_UUID)
        ? ''
        : String(context.env.UPLOAD_UUID).trim();
    if (secret) {
        return jsonResponse({ error: 'Not found' }, { status: 404 });
    }
    return handleUpload(context);
}
