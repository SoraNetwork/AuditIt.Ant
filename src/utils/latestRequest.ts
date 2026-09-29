// A slower previous response must never overwrite the latest filter selection.
// Weak keys keep separate stores/pages independent without retaining unmounted owners.
const versions = new WeakMap<object, number>();

export function beginLatestRequest(owner: object) {
  const version = (versions.get(owner) ?? 0) + 1;
  versions.set(owner, version);
  return () => versions.get(owner) === version;
}
