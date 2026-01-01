let currentSpec = null;

export function setSpec(spec) {
  currentSpec = spec;
}

export function getSpec() {
  return currentSpec;
}

export function clearSpec() {
  currentSpec = null;
}
