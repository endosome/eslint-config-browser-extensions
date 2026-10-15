export async function report(port: MessagePort, url: string): Promise<void> {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const id = crypto.randomUUID();
  const copy = structuredClone({ id, language: navigator.language, ok: response.ok });

  port.postMessage(copy);
  URL.revokeObjectURL(URL.createObjectURL(new Blob([id])));
}
