/**
 * Escapes special characters in a string for use in a regular expression.
 * This prevents Regular Expression Denial of Service (ReDoS) attacks
 * when using user input to create a new RegExp.
 *
 * @param {string} string - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = {
  escapeRegExp
};
