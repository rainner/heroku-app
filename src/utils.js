/**
 * Common util functions
 */
module.exports = {

  // Sanitize text
  sanitize( text ) {
    return String( text || '' ).replace( /[\t\r\n\s]+/g, ' ' ).trim();
  },

}
