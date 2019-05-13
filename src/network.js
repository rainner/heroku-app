/**
 * Network request/response helpers and wrappers.
 */
module.exports = {

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

}
