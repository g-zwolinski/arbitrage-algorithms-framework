let port = (process.argv.length > 2) ? parseInt (process.argv[2]) : 8080;
let host = (process.argv.length > 3) ? parseInt (process.argv[3]) : process.env.HOST || '0.0.0.0';
require('cors-anywhere').createServer().listen(port, host).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});