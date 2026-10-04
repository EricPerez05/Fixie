/** A random id for client-made records. Never throws. */
export function newId(): string {
  // randomUUID only exists in secure contexts; a LAN http:// address isn't one.
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
