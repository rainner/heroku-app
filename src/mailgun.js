/**
 * Mailer route handler.
 * Deliver incoming messages using the Mailgun API.
 */
const network = require( './network' );

module.exports = function( req, res ) {
  network.logIncoming( req );
  network.sendText( 200, res, 'ok' );
}
