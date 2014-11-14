var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var sockjs_opts = {
    sockjs_url: "http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js"
};

var sockjs_server = sockjs.createServer(sockjs_opts);

sockjs_server.on( 'connection', function(conn) {
    console.log("Connected");
    conn.on( 'data', function(jsonStr) {
        var jsonObj = JSON.parse(jsonStr);
        var dt = jsonObj.dt;
        var response = {
            dt: dt,
            pos: {
                dx: 0.0,
                dy: 0.0
            },
            rot: {
                dx: dt*0.05,
                dy: dt*0.1
            }
        };
        conn.write(JSON.stringify(response));
    } );
    conn.on( 'disconnection', function(conn) {
        console.log("Disconnected from:");
        console.log(conn);
    } );
} );

// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Usual http stuff
var node_server = http.createServer();
node_server.addListener('request', function(req, res) {
    static_directory.serve(req, res);
});
node_server.addListener('upgrade', function(req,res){
    res.end();
});

sockjs_server.installHandlers(node_server, { prefix:'/deckard' });

console.log("Listening on port 8000");
node_server.listen(8000);
