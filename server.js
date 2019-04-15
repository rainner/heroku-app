/**
 * Server app.
 */
const express    = require( 'express' );
const cors       = require( './src/cors' );
const home       = require( './src/home' );
const codepen    = require( './src/codepen' );
const instagram  = require( './src/instagram' );
const mailgun    = require( './src/mailgun' );
const port       = process.env.PORT || 8080;
const app        = express();

// app middlewares
app.use( cors );
app.use( '/public', express.static( 'public' ) );

// app routes
app.get( '/', home );
app.get( '/codepen', codepen );
app.get( '/instagram', instagram );
app.post( '/mailer', mailgun );

// init app
app.listen( port, () => console.info( 'App running on port', port ) );
