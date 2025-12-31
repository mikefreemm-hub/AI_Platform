let i = 0;
export function uid() {
  i += 1;
  return `id_${Date.now()}_${i}`;
}
