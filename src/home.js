/**
 * Home route handler.
 */
const network = require( './network' );

module.exports = function( req, res ) {
  network.logIncoming( req );
  network.sendText( 200, res, 'Nothing to see here.' );
}
