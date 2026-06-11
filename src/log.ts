export function logVerboseRequest(
  verbose: boolean | undefined,
  url: string,
  headers: Record<string, string>,
  body: unknown
): boolean {
  if (!verbose) return false;
  console.log('Request URL:', url);
  console.log('Request headers:', JSON.stringify(headers, null, 2));
  console.log('Request body:', JSON.stringify(body, null, 2));
  return true;
}

export function logVerboseResponse(
  verbose: boolean | undefined,
  status: number,
  data: unknown
): boolean {
  if (!verbose) return false;
  console.log('Response status:', status);
  console.log('Response body:', JSON.stringify(data, null, 2));
  return true;
}
