Math.TAU = 2 * Math.PI;
var scene,
    camera,
    renderer,
    light,
    die;



var lastRender = null;

var world, dieBody, diePlane;

var WIDTH = 600,
    HEIGHT = 400;

function render() {
    var delta = (lastRender === null) ? 0 : Date.now() - lastRender;
    lastRender = Date.now();

    if (delta > 200) {
        delta = 200;
    }

    world.step(delta / 1000);
    die.position.copy(dieBody.position);
    die.quaternion.copy(dieBody.quaternion);

    renderer.render(scene, camera);

    requestAnimationFrame(render);
}


function roll() {
    var angle = ((Math.random() - 0.5) * Math.PI * 2) * 0.1;
    dieBody.velocity.set(Math.sin(angle) * 7, -1, Math.cos(angle) * 7);

    dieBody.position.set(0, 2, -5);

    dieBody.angularVelocity.set((0.5 + Math.random() * 0.1) * Math.PI, 
                                (0.5 + Math.random() * 0.1) * Math.PI,
                                (0.5 + Math.random() * 0.1) *  Math.PI);

    dieBody.quaternion.setFromEuler(
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI,
            Math.random() * 2 * Math.PI);
}

function gen_polyhedron(geometry) {
    var vertices = [],
        faces = [],
        i = 0,
        v = null,
        f = null;

    for (i = 0;i < geometry.vertices.length;i++) {
        v = geometry.vertices[i];
        vertices[i] = new CANNON.Vec3(v.x, v.y, v.z);
    }
    for (i = 0;i < geometry.faces.length;i++) {
        f = geometry.faces[i];
        faces[i] = [f.a, f.b, f.c];
    }

    return new CANNON.ConvexPolyhedron(vertices, faces);
}

function init_scene() {
    scene = new THREE.Scene();

    world = new CANNON.World();
    world.gravity.set(0, -10, 0);

    camera = new THREE.PerspectiveCamera(80, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.set(-1, 8, -1);
    camera.lookAt(new THREE.Vector3(-0.5, 0, -0.5));

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(WIDTH, HEIGHT);
    renderer.domElement.id = 'dice_canvas';
    $('body').append(renderer.domElement);
}

function add_plane() {
    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 50, 10, 10),
        new THREE.MeshPhongMaterial( {color: 0xd0d0d0})
    );
    plane.rotation.x = -Math.PI * 0.5;
    plane.receiveShadow = true;
    scene.add(plane);

    world.add(new CANNON.Body({
        shape: new CANNON.Plane(),
        mass: 0,
        quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI * 0.5, 0, 0)
    }));
}

function add_die() {
    var geometry = new THREE.IcosahedronGeometry(1),
        material = new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('../textures/d20.png'),
            specular: 0x303030
            //shininess: 1005
        }),
        i = 0;

    geometry.faceVertexUvs[0] = [];

    for (i = 0;i < 10;i++) {
        geometry.faceVertexUvs[0][2 * i] = [
            new THREE.Vector2(i * 74 / 1024, 0),
            new THREE.Vector2((i + 1) * 74 / 1024, 0),
            new THREE.Vector2((i * 74 + 37) / 1024, 1)];
        geometry.faceVertexUvs[0][2 * i + 1] = [
            new THREE.Vector2((i * 74 + 37) / 1024, 1),
            new THREE.Vector2((i * 74 + 37 + 74) / 1024, 1),
            new THREE.Vector2((i + 1) * 74  / 1024, 0)];
    }

    die = new THREE.Mesh(geometry, material);
    die.castShadow = true;
    scene.add(die);

    dieBody = new CANNON.Body({
        mass: 100,
        shape: gen_polyhedron(die.geometry),
        material: new CANNON.Material({
            friction: 100,
            restitution: 1})
    } );
    dieBody.angularDamping = 0.5;

    world.add(dieBody);
}

function add_light() {
    light = new THREE.PointLight(0xFFFFFF, 0.5);
    light.position.set(10, 20, 10);
    light.castShadow = true;

    light.shadow.camera.left = -5;
    light.shadow.camera.right = 5;
    light.shadow.camera.top = 5;
    light.shadow.camera.bottom = -5;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.bias = 0.1;
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
 
}

$(function() {
    init_scene();
    add_plane();
    add_die();
    add_light();

    roll();

    
    requestAnimationFrame(render);

    $('#dice_canvas').click(function() {
        roll();
    });
});

