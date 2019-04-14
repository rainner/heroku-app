/**
 * App
 */
const express = require( 'express' );
const axios   = require( 'axios' );
const port    = process.env.PORT || 8080;
const app     = express();

/**
 * Send CORS response.
 */
function sendCORS( request, response ) {
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
  response.writeHead( 200, headers );
  response.end();
}

/**
 * Send plain text response
 */
function sendText( status, request, response, output ) {
  response.status( status );
  response.set( 'Content-Type', 'text/plain' );
  response.send( output );
}

/**
 * Send html response
 */
function sendHtml( status, request, response, output ) {
  response.status( status );
  response.set( 'Content-Type', 'text/html' );
  response.send( output );
}

/**
 * Send json object response
 */
function sendJson( status, request, response, output ) {
  response.status( status );
  response.set( 'Content-Type', 'application/json' );
  response.send( output );
}

/**
 * Send error json object response
 */
function sendError( status, request, response, error ) {
  const output = JSON.stringify( { status, error } );
  console.error( 'ERROR ('+ status +'):', output );
  sendJson( status, request, response, output );
}


/**
 * Main route
 */
app.get( '/', function( request, response ) {

  if ( request.method === 'OPTIONS' ) {
    return sendCORS( request, response );
  }
  sendText( 200, request, response, 'Hello world.' );
});

/**
 * Test route
 */
app.get( '/test', function( request, response ) {

  if ( request.method === 'OPTIONS' ) {
    return sendCORS( request, response );
  }
  sendText( 200, request, response, 'Test route.' );
});

/**
 * Codepen route
 */
app.get( '/codepen', function( request, response ) {

  if ( request.method === 'OPTIONS' ) {
    return sendCORS( request, response );
  }

  const options = {
    method: 'GET',
    url: 'https://codepen.io/rainner/public/feed/',
    responseType: 'text',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36',
      'Referer': 'https://codepen.io/rainner/',
      'Cache-Control': 'no-cache',
      'DNT': 1,
    }
  };

  axios( options ).then( res => {
    sendText( 200, request, response, res.data || 'ok' );
  })
  .catch( e => {
    const error = `Could not fetch content from ${options.url} with message: ${e.message || 'none'}.`;
    sendError( 500, request, response, error );
  });
});

/**
 * Initialize the app.
 */
app.listen( port, function() {
  console.info( 'App now running on port', port );
});
