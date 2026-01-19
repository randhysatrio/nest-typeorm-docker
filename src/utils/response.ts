export function createApiResponse(
  statusCode: number,
  success: boolean,
  message: string,
  data?: unknown,
  meta?: unknown,
) {
  return {
    statusCode,
    success,
    message,
    data: data ?? null,
    meta: meta ?? null,
  };
}
