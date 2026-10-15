interface Page { evaluate<T>(callback: () => T): Promise<T> }

export async function readClipboard(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
