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
 * Check if a cookie is a cloudflare uid cookie
 */
function isCFCookie( cookie ) {
  return ( cookie && cookie.indexOf( '__cfduid' ) >= 0 );
}

/**
 * Look for cloudflare cookie from client request
 */
function getClientCookie( request ) {
  if ( request && request.headers && request.headers['cookie'] ) {
    for ( let cookie of String( request.headers['cookie'] ).split( ';' ) ) {
      cookie = String( cookie ).trim();

      if ( isCFCookie( cookie ) ) {
        return cookie;
      }
    }
  }
  return '';
}

/**
 * Look for cloudflare cookie from server response
 */
function getServerCookie( response ) {
  if ( response && response.headers && Array.isArray( response.headers['set-cookie'] ) ) {
    for ( let cookie of response.headers['set-cookie'] ) {
      cookie = String( cookie ).split( ';' ).shift().trim();

      if ( isCFCookie( cookie ) ) {
        return cookie;
      }
    }
  }
  return '';
}

/**
 * Make a request, try to bypass cloudflare cookie check
 */
function makeRequest( options, callback ) {
  request( options, function( error, response, body ) {

    // could not even make the request, abort
    if ( error ) {
      return callback( error );
    }
    // something wrong with the request, or response, abort
    if ( !response ) {
      return callback( new Error( 'No response object for request.' ) );
    }
    // request denied, look for uid cookie
    if ( response.statusCode >= 400 ) {
      const cookie = getServerCookie( response );

      // set cookie and resend the request...
      if ( cookie ) {
        options.headers['cookie'] = cookie;
        return makeRequest( options, callback );
      }
    }
    return callback( false, response, body );
  });
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
    headers: {
      'cookie': getClientCookie( req ),
      'referer': 'https://codepen.io/',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36',
      'upgrade-insecure-requests': '1',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'dnt': '1',
    }
  };

  makeRequest( options, function( error, response, body ) {

    // console.log( 'Error:', error );
    // console.log( 'Status:', response ? response.statusCode : 0 );
    // console.log( 'Headers:', response ? response.headers : {} );
    // console.log( body );

    // sendText( 200, req, res, body );
    // return;

    const status  = response ? response.statusCode || 0 : 0;
    const server  = response ? response.headers.server || 'n/a' : 'n/a';
    const failed  = `Could not fetch remote content from (${options.url}).`;

    console.log( '-'.repeat( 60 ) );
    console.log( `Server-response (${server}):`, status );

    if ( error || !status ) {
      const message = error ? error.message || 'There was a problem making the request' : '';
      const output  = `${failed} ${message}.`;
      return sendError( 500, req, res, output );
    }

    if ( status >= 400 ) {
      const output = `${failed} The server (${server}) responded with status code ${status}.`;
      return sendError( status, req, res, output );
    }

    return sendJson( status, req, res, body );

    // let output = {};
    // let data   = {};

    // try { data = JSON.parse( body || '{}' ); }
    // catch ( e ) {}

    // if ( data && data.page && data.page.html ) {
    //   // parse html response and build output
    //   // ...
    // }

    // sendJson( 200, req, res, JSON.stringify( output ) );
  });

});

/**
 * Initialize the app.
 */
app.listen( port, function() {
  console.info( 'App now running on port', port );
});
