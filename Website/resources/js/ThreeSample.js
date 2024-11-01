import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

/*Creating box geometry*/
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
/*Creating basic material*/
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
/*Creating mesh*/
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

//Creating skybox
const geometrySB = new THREE.BoxGeometry( 100, 100, 100 );
const materialSB = new THREE.MeshBasicMaterial( { color:  0x6930c3, side: THREE.DoubleSide} );
const cubeSB = new THREE.Mesh( geometrySB, materialSB );
scene.add( cube, cubeSB );
//setting cube x pos
cube.position.x = (0);

camera.position.z = 5;

let controls;

const createControls = () =>{
    controls = new OrbitControls(camera, renderer.domElement);

};

createControls();

controls.enableDamping=true;
controls.dampingFactor=0.05;

controls.screenSpacePanning=false;



/*Controls*/
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;

function keyDownHandler(event){
	if (event.keyCode === 68){
		rightPressed = true;
	}
	else if (event.keyCode === 65){
		leftPressed = true;
	}
	else if (event.keyCode === 83){
		downPressed = true;
	}
	else if (event.keyCode === 87){
		upPressed = true;
	}
}
function keyUpHandler(event){
	if (event.keyCode === 68){
		rightPressed = false;
	}
	if (event.keyCode === 65){
		leftPressed = false;
	}
	if (event.keyCode === 83){
		downPressed = false;
	}
	if (event.keyCode === 87){
		upPressed = false;
	}
}
const speed = 0.01;
/*Controls*/

const animate=function() {
	
	if (rightPressed) {
        cube.position.x += speed;
    }
    if (leftPressed) {
        cube.position.x -= speed;
    }
    if (upPressed) {
        cube.position.y += speed;
    }
    if (downPressed) {
        cube.position.y -= speed;
    }

	console.log(renderer);
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}

renderer.setAnimationLoop(animate);