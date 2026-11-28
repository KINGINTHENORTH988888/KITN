import test from "node:test";
import assert from "node:assert/strict";

import { safeExternalUrl } from "../src/url-safety.js";

test("accepts absolute HTTP and HTTPS URLs and normalizes whitespace", () => {
  assert.equal(safeExternalUrl(" https://example.org/report "), "https://example.org/report");
  assert.equal(safeExternalUrl("http://example.org"), "http://example.org/");
});

test("rejects executable, embedded and non-web URL schemes", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "ftp://example.org/file",
    "//example.org/path",
    "mailto:test@example.org",
  ]) {
    assert.equal(safeExternalUrl(value), null, value);
  }
});

test("rejects malformed, empty and credential-bearing URLs", () => {
  for (const value of ["", "   ", null, undefined, 42, "https://", "https://user:pass@example.org"]) {
    assert.equal(safeExternalUrl(value), null, String(value));
  }
});
