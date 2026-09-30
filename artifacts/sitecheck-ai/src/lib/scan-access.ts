export const SCAN_ACCESS_TOKEN_KEY = "sitecheck-scan-access-token";

export function setScanAccessToken(scanId: number, token: string): void {
  window.localStorage.setItem(`${SCAN_ACCESS_TOKEN_KEY}:${scanId}`, token);
}

export function getScanAccessToken(scanId: number): string | null {
  return window.localStorage.getItem(`${SCAN_ACCESS_TOKEN_KEY}:${scanId}`);
}
