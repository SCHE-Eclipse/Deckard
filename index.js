// INITIALIZE SOCKET INTERFACE
var sockjs_url = '/deckard';
var sockjs = new SockJS(sockjs_url);
var socketOpen = false;
var socketReady = false;

sockjs.onopen = function() {
    socketOpen = true;
    socketReady = true;
    console.log('socket opened: ' + sockjs.protocol);
};

sockjs.onmessage = function(e) {
    socketReady = true;
    updateGraphics(JSON.parse(e.data));
};

sockjs.onclose = function() {
    socketOpen = false;
    socketReady = false;
    console.log('socket closed');
};

// OBJECT STATE
var State = function() {
};

// GRAPHICS INTERFACE
var render_stats, physics_stats;
var camera, scene, renderer;
var clock = new THREE.Clock();

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var backgroundColor = 0x444444;
var group;

function init() {
    initGUI();
    initScene();
    animate();
};

//--------------------------------------------------------------------
// Initialize the visible elements displayed on the web page
function initGUI() {
    var container = document.createElement('div');
    document.body.appendChild(container);

    // Graph that displays the rate at which the scene is rendering.
		render_stats = new Stats();
		render_stats.domElement.style.position = 'absolute';
		render_stats.domElement.style.top = '0px';
		render_stats.domElement.style.zIndex = 100;
		container.appendChild( render_stats.domElement );

		// Graph that diplays the rate at which the simulation is running.
		physics_stats = new Stats();
		physics_stats.domElement.style.position = 'absolute';
		physics_stats.domElement.style.top = '50px';
		physics_stats.domElement.style.zIndex = 100;
		container.appendChild( physics_stats.domElement );

    // The main viewport where the scene will be rendered.
		renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor( backgroundColor, 1 );
    renderer.setSize(WIDTH, HEIGHT);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
    container.appendChild(renderer.domElement);
}

function initScene() {
    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera( 75, aspect, 1, 1000 );
	  camera.position.z = 500;

	  scene = new THREE.Scene();

    var geom = new THREE.IcosahedronGeometry( 200, 1 );
	  var mat1 = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );
	  var mat2 = new THREE.MeshBasicMaterial( {
        color: backgroundColor,
        wireframe: true,
        wireframeLinewidth: 3
    } );
	  var mesh1 = new THREE.Mesh( geom, mat1 );
	  var mesh2 = new THREE.Mesh( geom, mat2 );
    group = new THREE.Group();
    group.add( mesh1 );
    group.add( mesh2 );
	  scene.add( group );
}

var dpxdt = 0;
var dpydt = 0;
var drxdt = 0;
var drydt = 0;

function animate() {
    requestAnimationFrame( animate );
    var delta = clock.getDelta();
    // Wait for previous update to complete
    if (socketOpen && socketReady) {
        var jsonObj = {
            dt: delta
        };
        sockjs.send(JSON.stringify(jsonObj));
        socketReady = false;
    }
    
    group.rotation.x += drxdt*delta;
    group.rotation.y += drydt*delta;

    render();
    render_stats.update();
}

function updateGraphics(data) {
    dpxdt = data.pos.dx/data.dt;
    dpydt = data.pos.dy/data.dt;
    drxdt = data.rot.dx/data.dt;
    drydt = data.rot.dy/data.dt;
    physics_stats.update();
}

function render() {
    renderer.render( scene, camera );
}
