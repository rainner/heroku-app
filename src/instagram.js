/**
 * Instagram route handler.
 * Fetch and parse posts from Inctagram account.
 */
const network = require( './network' );

module.exports = function( req, res ) {
  network.logIncoming( req );
  network.sendText( 200, res, 'ok' );
}
