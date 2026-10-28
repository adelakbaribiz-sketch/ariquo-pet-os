// Turn a failed fetch Response into an Error carrying the server's message.
export async function apiError(res: Response, fallback: string): Promise<Error> {
  const data = (await res.json().catch(() => null)) as { error?: string } | null
  return new Error(data?.error || fallback)
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback
}
