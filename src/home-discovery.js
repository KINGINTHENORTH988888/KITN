export function getHomeFeaturedItems(items, { getSpace, getKey, limit = 5 } = {}) {
  if (!Array.isArray(items) || !Number.isInteger(limit) || limit <= 0) return [];
  const recentItems = [...items].sort((a, b) =>
    String(b?.date_publication || "").localeCompare(String(a?.date_publication || ""))
  );
  const selected = [];
  const selectedKeys = new Set();
  const selectedSpaces = new Set();
  const keyOf = (item) => getKey?.(item) ?? item;

  for (const item of recentItems) {
    const space = getSpace?.(item);
    const key = keyOf(item);
    if (!space || selectedSpaces.has(space) || selectedKeys.has(key)) continue;
    selected.push(item);
    selectedSpaces.add(space);
    selectedKeys.add(key);
    if (selected.length >= limit) return selected;
  }

  for (const item of recentItems) {
    const key = keyOf(item);
    if (selectedKeys.has(key)) continue;
    selected.push(item);
    selectedKeys.add(key);
    if (selected.length >= limit) break;
  }
  return selected;
}
