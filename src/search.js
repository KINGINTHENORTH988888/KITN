export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replaceAll(/\p{M}+/gu, "")
    .toLocaleLowerCase()
    .replaceAll(/[^\p{L}\p{N}\s]+/gu, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}
