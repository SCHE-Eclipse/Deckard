// ENTRY FUNCTION - initialize everything
function init() {
    initGUI();
    initScene();
    initSocket();
    animate();
}

//--------------------------------------------------------------------
// PAGE INTERFACE ELEMENTS
var container, render_stats, physics_stats, renderer;

// Initialize the visible elements displayed on the web page
function initGUI() {
    container = document.createElement('div');
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
    renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
}

//--------------------------------------------------------------------
// GRAPHICAL SCENE ELEMENTS
var camera, scene;
var backgroundColor = 0x444444;
var staticObjects = [];
var dynamicObjects = [];

function DynamicObject(threeObj) {
    // Associated THREE.js object
    this.obj = threeObj;
    // Linear velocity
    this.dpxdt = 0;
    this.dpydt = 0;
    this.dpzdt = 0;
    // Angular velocity
    this.drxdt = 0;
    this.drydt = 0;
    this.drzdt = 0;
};

DynamicObject.prototype.update = function(dt) {
    this.obj.rotation.x += this.drxdt*dt;
    this.obj.rotation.y += this.drydt*dt;
};

// Initialize the scene graph
function initScene() {
    var aspect = window.innerWidth / window.innerHeight;

    camera = new THREE.PerspectiveCamera( 75, aspect, 1, 1000 );
	  camera.position.z = 500;

	  scene = new THREE.Scene();

    var geom = new THREE.IcosahedronGeometry( 100, 1 );
	  var mat1 = new THREE.MeshBasicMaterial( { color: 0xFFFFFF } );
	  var mat2 = new THREE.MeshBasicMaterial( {
        color: backgroundColor,
        wireframe: true,
        wireframeLinewidth: 3
    } );
	  var mesh1 = new THREE.Mesh( geom, mat1 );
	  var mesh2 = new THREE.Mesh( geom, mat2 );
    var obj = new THREE.Object3D();
    obj.add( mesh1 );
    obj.add( mesh2 );

    for (var i=0; i<2; ++i) {
        dynamicObjects[i] = new DynamicObject(obj.clone());
        dynamicObjects[i].obj.translateX(-200 + i*400);
	      scene.add( dynamicObjects[i].obj );
    }
}

//--------------------------------------------------------------------
// SOCKET INTERFACE
var sockjs;
var socketOpen = false;
var socketReady = false;
function initSocket() {
    sockjs = new SockJS('/deckard');

    sockjs.onopen = function() {
        socketOpen = true;
        socketReady = true;
        console.log('socket opened: ' + sockjs.protocol);
        registerObjects();
    };

    sockjs.onmessage = function(e) {
        socketReady = true;
        var data = JSON.parse(e.data);
        if (data.type = 'update') {
            var dt = data.delta;
            for (var i=0; i<data.objs.length; ++i) {
                var id = data.objs[i].id;
                dynamicObjects[id].dpxdt = data.objs[i].dx;
                dynamicObjects[id].dpydt = data.objs[i].dy;
                dynamicObjects[id].drxdt = data.objs[i].rx;
                dynamicObjects[id].drydt = data.objs[i].ry;
            }
            physics_stats.update();
        }
    };

    sockjs.onclose = function() {
        socketOpen = false;
        socketReady = false;
        console.log('socket closed');
    };
}

//--------------------------------------------------------------------
// REGISTER OBJECTS WITH SIMULATOR
function registerObjects() {
    if (socketOpen && socketReady) {
        console.log("Registering " + dynamicObjects.length +
                    " dynamic objects.");
        for (var i=0; i<dynamicObjects.length; ++i) {
            var jsonObj = {
                type: 'dynamic',
                id: i,
                pos: {
                    x: dynamicObjects[i].obj.position.x,
                    y: dynamicObjects[i].obj.position.y,
                    z: dynamicObjects[i].obj.position.z
                },
                rot: {
                    x: dynamicObjects[i].obj.rotation.x,
                    y: dynamicObjects[i].obj.rotation.y,
                    z: dynamicObjects[i].obj.rotation.z
                }
            };
            sockjs.send(JSON.stringify(jsonObj));
        }
        console.log("Registering " + staticObjects.length +
                    " static objects.");
        for (var i=0; i<staticObjects.length; ++i) {
            var jsonObj = {
                type: 'static',
                id: i,
                pos: {
                    x: staticObjects[i].obj.position.x,
                    y: staticObjects[i].obj.position.y,
                    z: staticObjects[i].obj.position.z
                },
                rot: {
                    x: staticObjects[i].obj.rotation.x,
                    y: staticObjects[i].obj.rotation.y,
                    z: staticObjects[i].obj.rotation.z
                }
            };
            sockjs.send(JSON.stringify(jsonObj));
        }
    }
}

//--------------------------------------------------------------------
// SCENE UPDATES AND ANIMATIONS
var clock = new THREE.Clock();
var startTime = Date.now();
function animate() {
    requestAnimationFrame( animate );
    var delta = clock.getDelta();
    // Wait for previous update to complete
    if (socketOpen && socketReady) {
        var jsonObj = {
            type: 'update',
            time: Date.now() - startTime,
            delta: delta
        };
        sockjs.send(JSON.stringify(jsonObj));
        socketReady = false;
    }

    for (var i=0; i<dynamicObjects.length; ++i) {
        dynamicObjects[i].update(delta);
    }

    render();
    render_stats.update();
}

function onWindowResize(event) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function render() {
    renderer.render( scene, camera );
}
