import { toAuthorizationHeader } from '@/lib/authHeader';

export async function requestJson<T>(url: string, init?: RequestInit, token?: string): Promise<T> {
  const authorizationHeader = token ? toAuthorizationHeader(token) : undefined;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export async function requestForm<T>(url: string, formData: FormData, token?: string): Promise<T> {
  const authorizationHeader = token ? toAuthorizationHeader(token) : undefined;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: authorizationHeader ? { Authorization: authorizationHeader } : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}
