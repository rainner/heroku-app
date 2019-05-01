/**
 * Codepen.io route handler.
 * Fetch and parse showcase pens from codepen.io
 */
const cheerio = require( 'cheerio' );
const network = require( './network' );
const utils   = require( './utils' );

module.exports = function( req, res ) {

  const method  = 'GET';
  const host    = `codepen.io`;
  const profile = `https://${host}/rainner`;
  const url     = `${profile}/pens/showcase/grid/`;
  const headers = Object.assign( { cookie: '' }, req.headers, { host } );
  const options = { method, url, headers };

  network.logIncoming( req );
  network.makeRequest( options, function( error, response, body ) {

    // something wrong with request
    if ( error ) {
      const output = error ? error.message || 'There was a problem making the request' : '';
      return network.sendError( 500, res, `Could not fetch remote content from (${options.url}). ${output}.` );
    }

    // try to parse json response body
    let output = [];
    let data = {};
    try { data = JSON.parse( body || '{}' ); }
    catch ( e ) {}

    // parse html response and build output
    if ( data && data.page && data.page.html ) {
      const $ = cheerio.load( data.page.html );

      // each showcase pen container
      $( '.single-pen' ).each( function( elm, i ) {
        let wrap    = $( this );
        let hash    = utils.sanitize( wrap.data( 'slug-hash' ) );
        let title   = utils.sanitize( $( '.item-title > a', wrap ).text() );
        let info    = utils.sanitize( $( '.meta-overlay > p', wrap ).text() );
        let views   = utils.sanitize( $( '.stats > .views', wrap ).text() );
        let replies = utils.sanitize( $( '.stats > .comments', wrap ).text() );
        let likes   = utils.sanitize( $( '.loves > .count', wrap ).text() );
        let image   = `${base}/pen/${hash}/image/large.png`;
        let url     = `${base}/full/${hash}/`;
        if ( !hash || !title ) return;

        likes = ( likes ) ? likes : '0';
        likes = ( likes === '1' ) ? likes + ' Like' : likes + ' Likes';
        output.push( { hash, url, image, title, info, views, replies, likes } );
      });
    }

    // success
    network.sendJson( 200, res, output );
  });
}
