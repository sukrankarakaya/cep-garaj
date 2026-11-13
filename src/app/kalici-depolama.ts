/**
 * Asks the browser to keep this site's storage (Known traps: IndexedDB can be evicted). Silent
 * by design (spec 0001, R-7): a refusal, a missing API or an error changes nothing for the user.
 */
export async function kaliciDepolamaIste(): Promise<void> {
  try {
    await navigator.storage?.persist?.();
  } catch {
    // ignored on purpose: the app works without persistent storage
  }
}
