var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

// 1. SockJS communication server
var sockjs_opts = {
    sockjs_url: "http://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js"
};

var sockjs_server = sockjs.createServer(sockjs_opts);

var dynamicObjects = [];
var staticObjects = [];

function DynamicObject(json) {
    this.id = json.id;
    this.x = json.pos.x;
    this.y = json.pos.y;
    this.z = json.pos.z;
    this.rx = json.rot.x;
    this.ry = json.rot.y;
    this.rz = json.rot.z;
}

function StaticObject(json) {
    this.id = json.id;
    this.x = json.pos.x;
    this.y = json.pos.y;
    this.z = json.pos.z;
    this.rx = json.rot.x;
    this.ry = json.rot.y;
    this.rz = json.rot.z;
}

sockjs_server.on( 'connection', function(conn) {
    console.log("Connected");
    conn.on( 'data', function(jsonStr) {
        var jsonObj = JSON.parse(jsonStr);
        var type = jsonObj.type;
        // Perform a physics update on the dynamic bodies
        if (type == 'update') {
            var t = jsonObj.time;
            var dt = jsonObj.delta;
            var response = { type: 'update',
                             delta: dt,
                             objs: [] };
            for (var i=0; i<dynamicObjects.length; ++i) {
                response.objs[i] = {
                    id: dynamicObjects[i].id,
                    dx: 0.0,
                    dy: 0.0,
                    rx: 0.05,
                    ry: 0.1
                };
            }
            conn.write(JSON.stringify(response));
        }
        // Register dynamic objects
        else if (type == 'dynamic') {
            console.log("Registering dynamic object.");
            console.log(jsonObj);
            dynamicObjects[jsonObj.id] = new DynamicObject(jsonObj);
        }
        // Register static objects
        else if (type == 'static') {
            console.log("Registering static object.");
            console.log(jsonObj);
            staticObjects[jsonObj.id] = new StaticObject(jsonObj);
        }
    } );
    conn.on( 'disconnection', function(conn) {
        console.log("Disconnected from:");
        console.log(conn);
    } );
} );


// 2. Static files server
var static_directory = new node_static.Server(__dirname);

// 3. Node HTTP file server
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
