export function toAuthorizationHeader(token: string) {
  const value = token.trim();
  if (!value) {
    return undefined;
  }

  return value.toLowerCase().startsWith('bearer ') ? value : `Bearer ${value}`;
}
