const { describe, it } = require("node:test");
const assert = require("node:assert");
const { escapeRegExp } = require("../utils/regexUtils");

describe("escapeRegExp", () => {
  it("should escape special characters", () => {
    const input = "a(b)c*d+e?f.g^h$i|j[k]l{m}n";
    const expected = "a\\(b\\)c\\*d\\+e\\?f\\.g\\^h\\$i\\|j\\[k\\]l\\{m\\}n";
    assert.strictEqual(escapeRegExp(input), expected);
  });

  it("should not escape alphanumeric characters", () => {
    const input = "abcdefghijklmnopqrstuvwxyz1234567890";
    assert.strictEqual(escapeRegExp(input), input);
  });

  it("should handle empty string", () => {
    const input = "";
    assert.strictEqual(escapeRegExp(input), "");
  });
});
