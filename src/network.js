/**
 * Network request/response helpers and wrappers.
 */
const request = require( 'request' );

module.exports = {

  // Options for retrying request using set-cookie value
  _retry: true,
  _retryCount: 0,
  _retryMax: 3,

  // Log incoming connection info
  logIncoming( request ) {
    console.log( '-'.repeat( 60 ) );
    console.log( 'Incoming connection...' );

    if ( request ) {
      const { method, url } = request;
      const client = this.getClientIP( request );
      console.log( method, url );
      console.log( 'From client host', client );
    }
  },

  // Log incoming connection info
  logOutgoing( method, url, response ) {
    console.log( '-'.repeat( 60 ) );
    console.log( 'Outgoing connection...' );
    console.log( method, url );

    if ( response ) {
      const { statusCode, headers } = response;
      const server = headers['server'] || '';
      console.log( 'Status', statusCode, 'from', server, 'server' );
    }
  },

  // Send plain text response
  sendText( status, response, output ) {
    output = ( typeof output === 'string' ) ? output : '';
    response.status( status );
    response.header( 'Content-Type', 'text/plain' );
    response.send( output );
  },

  // Send html response
  sendHtml( status, response, output ) {
    output = ( typeof output === 'string' ) ? output : '';
    response.status( status );
    response.header( 'Content-Type', 'text/html' );
    response.send( output );
  },

  // Send json object response
  sendJson( status, response, output ) {
    output = ( typeof output === 'object' ) ? JSON.stringify( output ) : output;
    response.status( status );
    response.header( 'Content-Type', 'application/json' );
    response.send( output );
  },

  // Send error json object response
  sendError( status, response, error ) {
    const output = JSON.stringify( { status, error } );
    console.error( 'Error:', output );
    this.sendJson( status, response, output );
  },

  // Get client ip from incoming request
  getClientIP( request ) {
    let { headers, connection, socket } = request;

    if ( headers && headers['x-forwarded-for'] ) {
      return String( headers['x-forwarded-for'] ).trim().split( /[\,\s]+/g ).shift();
    }
    if ( connection && connection.remoteAddress ) {
      return String( connection.remoteAddress ).trim();
    }
    if ( socket && socket.remoteAddress ) {
      return String( socket.remoteAddress ).trim();
    }
    if ( connection && connection.socket && connection.socket.remoteAddress ) {
      return String( connection.socket.remoteAddress ).trim();
    }
    return '';
  },

  // Check if a cookie is a cloudflare uid cookie
  isCFCookie( cookie ) {
    return ( cookie && cookie.indexOf( '__cfduid' ) >= 0 );
  },

  // Look for cloudflare cookie from client request
  getClientCookie( request ) {
    if ( request && request.headers && request.headers['cookie'] ) {
      for ( let cookie of String( request.headers['cookie'] ).split( ';' ) ) {
        cookie = String( cookie ).trim();
        if ( this.isCFCookie( cookie ) ) return cookie;
      }
    }
    return '';
  },

  // Look for cloudflare cookie from server response
  getServerCookie( response ) {
    if ( response && response.headers && Array.isArray( response.headers['set-cookie'] ) ) {
      for ( let cookie of response.headers['set-cookie'] ) {
        cookie = String( cookie ).split( ';' ).shift().trim();
        if ( this.isCFCookie( cookie ) ) return cookie;
      }
    }
    return '';
  },

  // Make a request, try to bypass cloudflare cookie check
  makeRequest( options, callback ) {
    request( options, ( error, response, body ) => {

      this.logOutgoing( options.method, options.url, response );

      const status = response ? response.statusCode || 0 : 0;
      const server = response ? response.headers.server || 'n/a' : 'n/a';

      // could not even make the request, abort
      if ( error ) {
        return callback( new Error( error.message || `There was a problem sending the request.` ) );
      }
      // something wrong with the request, or response, abort
      if ( !response ) {
        return callback( new Error( `No response object for the current request.` ) );
      }
      // request denied, look for uid cookie
      if ( response.statusCode >= 400 ) {
        const cookie = this.getServerCookie( response );

        // set cookie and resend the request...
        if ( cookie && this._retry && this._retryCount < this._retryMax ) {
          this._retryCount += 1;
          options.headers['cookie'] = cookie;
          return this.makeRequest( options, callback );
        }
        // done retrying, abort
        this._retryCount = 0;
        return callback( new Error( `The server (${server}) responded with status code ${status}.` ) );
      }
      // looks good...
      this._retryCount = 0;
      return callback( false, response, body );
    });
  },

}
