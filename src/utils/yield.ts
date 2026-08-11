/**
 * Yields control back to the browser main thread / event loop to prevent UI freezing
 * and prevent Chrome's 'Page Unresponsive' prompt during heavy pixel operations.
 */
export async function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => resolve(), { timeout: 15 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
