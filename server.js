/**
 * App
 */
const express = require( 'express' );
const request = require( 'request' );
const cheerio = require( 'cheerio' );
const port    = process.env.PORT || 8080;
const app     = express();

/**
 * Params
 */
let baseUrl     = `https://codepen.io/rainner`;
let endpointUrl = `${baseUrl}/pens/showcase/grid/`;
let cookieRetry = true;
let cookieCount = 0;
let cookieLimit = 3;

/**
 * Sanitize text
 */
function sanitizeText( text ) {
  return String( text || '' ).replace( /[\t\r\n\s]+/g, ' ' ).trim();
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
      if ( isCFCookie( cookie ) ) return cookie;
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
      if ( isCFCookie( cookie ) ) return cookie;
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
      if ( cookie && cookieRetry && cookieCount < cookieLimit ) {
        cookieCount += 1;
        options.headers['cookie'] = cookie;
        return makeRequest( options, callback );
      }
    }
    cookieCount = 0;
    return callback( false, response, body );
  });
}

/**
 * Cors middleware
 */
app.use( function( req, res, next ) {
  res.header( 'access-control-allow-origin', '*' );

  if ( req.headers[ 'access-control-request-method' ] ) {
    res.header( 'access-control-allow-methods', req.headers[ 'access-control-request-method' ] );
  }
  if ( req.headers[ 'access-control-request-headers' ] ) {
    res.header( 'access-control-allow-headers', req.headers[ 'access-control-request-headers' ] );
  }
  next();
});

/**
 * Main route
 */
app.get( '/', function( req, res ) {
  sendText( 200, req, res, 'Nothing to see here.' );
});

/**
 * Codepen route
 */
app.get( '/codepen', function( req, res ) {
  console.log( '-'.repeat( 60 ) );
  console.log( req.method, req.url );

  const options = {
    method: 'GET',
    url: endpointUrl,
    headers: {
      'cookie': getClientCookie( req ),
      'referer': endpointUrl,
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36',
      'upgrade-insecure-requests': '1',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'dnt': '1',
    }
  };
  makeRequest( options, function( error, response, body ) {
    const status  = response ? response.statusCode || 0 : 0;
    const server  = response ? response.headers.server || 'n/a' : 'n/a';
    const failed  = `Could not fetch remote content from (${options.url}).`;

    console.log( '-'.repeat( 60 ) );
    console.log( options.method, options.url );
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

    let data = {};
    let output = [];

    // try to parse json response body
    try { data = JSON.parse( body || '{}' ); }
    catch ( e ) { console.error( 'Error parsing response body.' ); }

    // parse html response and build output
    if ( data && data.page && data.page.html ) {
      const $ = cheerio.load( data.page.html );

      // each showcase pen container
      $( '.single-pen' ).each( function( elm, i ) {
        let wrap    = $( this );
        let hash    = sanitizeText( wrap.data( 'slug-hash' ) );
        let url     = `${baseUrl}/full/${hash}/`;
        let image   = `${baseUrl}/pen/${hash}/image/large.png`;
        let title   = sanitizeText( $( '.item-title > a', wrap ).text() );
        let info    = sanitizeText( $( '.meta-overlay > p', wrap ).text() );
        let views   = sanitizeText( $( '.stats > .views', wrap ).text() );
        let replies = sanitizeText( $( '.stats > .comments', wrap ).text() );

        if ( !hash || !title ) return;
        output.push( { hash, url, image, title, info, views, replies } );
      });
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
