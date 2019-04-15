/**
 * Cors middleware handler.
 */
module.exports = function( req, res, next ) {
  res.header( 'access-control-allow-origin', '*' );

  if ( req.headers[ 'access-control-request-method' ] ) {
    res.header( 'access-control-allow-methods', req.headers[ 'access-control-request-method' ] );
  }
  if ( req.headers[ 'access-control-request-headers' ] ) {
    res.header( 'access-control-allow-headers', req.headers[ 'access-control-request-headers' ] );
  }
  next();
}
