const AUTH_PARAM_KEYS = new Set([
  'access_token',
  'refresh_token',
  'expires_at',
  'expires_in',
  'token_type',
  'type',
  'provider_token',
  'provider_refresh_token',
  'code',
  'error',
  'error_code',
  'error_description',
]);

function stripAuthParams(params: URLSearchParams) {
  let changed = false;

  for (const key of [...params.keys()]) {
    if (AUTH_PARAM_KEYS.has(key)) {
      params.delete(key);
      changed = true;
    }
  }

  return changed;
}

export function cleanupAuthUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const searchParams = new URLSearchParams(url.search);
  let changed = stripAuthParams(searchParams);

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    if (stripAuthParams(hashParams)) {
      changed = true;
      const nextHash = hashParams.toString();
      url.hash = nextHash ? `#${nextHash}` : '';
    }
  }

  if (stripAuthParams(searchParams)) {
    changed = true;
  }

  if (!changed) {
    return;
  }

  const nextSearch = searchParams.toString();
  url.search = nextSearch ? `?${nextSearch}` : '';
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}
