/**
 * Codepen.io route handler.
 * Fetch and parse showcase pens from codepen.io
 */
const cheerio = require( 'cheerio' );
const network = require( './network' );
const utils   = require( './utils' );

module.exports = function( req, res ) {

  const base     = `https://codepen.io/rainner`;
  const endpoint = `${base}/pens/showcase/grid/`;
  const options  = {
    method: 'GET',
    url: endpoint,
    headers: {
      'referer': endpoint,
      'cookie': network.getClientCookie( req ),
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.96 Safari/537.36',
      'upgrade-insecure-requests': '1',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'dnt': '1',
    }
  };

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
