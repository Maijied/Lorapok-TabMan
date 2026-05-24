/**
 * Minimal type declaration for the Firefox WebExtensions `browser` global.
 * Only the subset used by the dashboard (browser.storage.local) is typed here.
 * The full API is guarded at runtime with `typeof browser !== 'undefined'`.
 */
declare const browser: {
  storage: {
    local: {
      get(keys: string | string[] | Record<string, unknown>): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    };
  };
} | undefined;
