export function getPageSlice(items, requestedPage = 1, pageSize = 24) {
  const safeItems = Array.isArray(items) ? items : [];
  const safePageSize = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 24;
  const total = safeItems.length;
  const pageCount = Math.max(1, Math.ceil(total / safePageSize));
  const numericPage = Number.isFinite(Number(requestedPage)) ? Math.trunc(Number(requestedPage)) : 1;
  const page = Math.min(pageCount, Math.max(1, numericPage));
  const startIndex = Math.min(total, (page - 1) * safePageSize);
  const endIndex = Math.min(total, startIndex + safePageSize);

  return {
    items: safeItems.slice(startIndex, endIndex),
    total,
    page,
    pageCount,
    startIndex,
    endIndex
  };
}
