/**
 * App
 */
const express = require( 'express' );
const request = require( 'request' );
const port    = process.env.PORT || 8080;
const app     = express();

/**
 * Send CORS res.
 */
function sendCORS( req, res ) {
  const headers = { 'access-control-allow-origin': '*' };

  if ( request.headers[ 'access-control-request-method' ] ) {
    headers[ 'access-control-allow-methods' ] = request.headers[ 'access-control-request-method' ];
    delete request.headers[ 'access-control-request-method' ];
  }
  if ( request.headers[ 'access-control-request-headers' ] ) {
    headers[ 'access-control-allow-headers' ] = request.headers[ 'access-control-request-headers' ];
    delete request.headers[ 'access-control-request-headers' ];
  }
  headers[ 'access-control-expose-headers' ] = Object.keys( headers ).join( ',' );
  res.writeHead( 200, headers );
  res.end();
}

/**
 * Send plain text response
 */
function sendText( status, req, res, output ) {
  res.status( status );
  res.set( 'Content-Type', 'text/plain' );
  res.send( output );
}

/**
 * Send html response
 */
function sendHtml( status, req, res, output ) {
  res.status( status );
  res.set( 'Content-Type', 'text/html' );
  res.send( output );
}

/**
 * Send json object response
 */
function sendJson( status, req, res, output ) {
  res.status( status );
  res.set( 'Content-Type', 'application/json' );
  res.send( output );
}

/**
 * Send error json object response
 */
function sendError( status, req, res, error ) {
  const output = JSON.stringify( { status, error } );
  console.error( 'Error:', output );
  sendJson( status, req, res, output );
}


/**
 * Main route
 */
app.get( '/', function( req, res ) {

  if ( req.method === 'OPTIONS' ) {
    return sendCORS( req, res );
  }
  sendText( 200, req, res, 'Hello world.' );
});

/**
 * Test route
 */
app.get( '/test', function( req, res ) {

  if ( req.method === 'OPTIONS' ) {
    return sendCORS( req, res );
  }
  sendText( 200, req, res, 'Test route.' );
});

/**
 * Codepen route
 */
app.get( '/codepen', function( req, res ) {

  if ( req.method === 'OPTIONS' ) {
    return sendCORS( req, res );
  }

  const options = {
    method: 'GET',
    url: 'https://codepen.io/rainner/pens/popular/grid/',
    responseType: 'json',
  };

  request( options, function( err, response, body ) {
    const status = response.statusCode || 0;
    const server = response.headers.server || 'Unknown';

    console.log( '\n', '-'.repeat( 30 ) );
    console.log( `Server-response (${server}):`, status );

    if ( err || !status || status >= 400 ) {
      const error = `Could not fetch remote content (${options.url}). The server (${server}) responded with status code ${status}.`;
      return sendError( status, req, res, error );
    }

    let output = {};
    let data   = {};

    try { data = JSON.parse( body || '{}' ); }
    catch ( e ) {}

    if ( data && data.page && data.page.html ) {
      // parse html response and build output
      // ...
    }

    sendJson( 200, req, res, JSON.stringify( output ) );
  });

});

/**
 * Initialize the app.
 */
app.listen( port, function() {
  console.info( 'App now running on port', port );
});
