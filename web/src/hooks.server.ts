import type { Handle } from '@sveltejs/kit';

/**
 * In production (Cloudflare) `event.platform.env.DB` is injected by the adapter.
 * During `vite dev` there's no platform, so we lazily attach a D1 proxy backed by
 * the local wrangler state (getPlatformProxy). Dev-only; tree-shaken from the build.
 */
let devEnv: { DB: unknown } | undefined;
let devProxyPromise: Promise<{ DB: unknown }> | undefined;

async function getDevEnv() {
  if (devEnv) return devEnv;
  if (!devProxyPromise) {
    devProxyPromise = (async () => {
      const { getPlatformProxy } = await import('wrangler');
      const proxy = await getPlatformProxy({ configPath: './wrangler.toml', persist: true });
      return proxy.env as { DB: unknown };
    })();
  }
  devEnv = await devProxyPromise;
  return devEnv;
}

export const handle: Handle = async ({ event, resolve }) => {
  if (!event.platform?.env?.DB && !import.meta.env.PROD) {
    const env = await getDevEnv();
    // @ts-expect-error – synthesize a platform for dev
    event.platform = { ...(event.platform ?? {}), env };
  }
  return resolve(event);
};
