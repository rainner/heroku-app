/**
 * App
 */
const express = require( 'express' );
const port    = process.env.PORT || 8080;
const app     = express();

// Generic error handler used by all endpoints.
function handleError( res, reason, message, code ) {
  console.error( 'ERROR: ' + reason );
  res.status( code || 500 ).json( { 'error': message } );
}

// Main route
app.get( '/', function( req, res ) {
  res.status( 200 ).send( 'It works!' );
});

// Test route
app.get( '/test', function( req, res ) {
  res.status( 200 ).send( 'Test!' );
});

// Initialize the app.
app.listen( port, function() {
  console.info( 'App now running on port', port );
});
