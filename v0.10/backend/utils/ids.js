export function newRevisionId() {
  // sortable + filesystem safe
  return String(Date.now());
}
