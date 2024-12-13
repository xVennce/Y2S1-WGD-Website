import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed, deletePressed, insertPressed } from './InputCheck.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
const loader = new GLTFLoader();

renderer.setSize( window.innerWidth, window.innerHeight - 100);
document.body.appendChild( renderer.domElement );


/*Creating box geometry*/
const geometry = new THREE.BoxGeometry( .1, .1, .1 );
/*Creating basic material*/
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
/*Creating mesh*/
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

//Creating skybox
const geometrySB = new THREE.SphereGeometry( 100, 100, 100 );
const materialSB = new THREE.MeshBasicMaterial({ 
	map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'), 
	side: THREE.DoubleSide
});
const cubeSB = new THREE.Mesh( geometrySB, materialSB );
scene.add( cube, cubeSB );

//Creating white directional light from top
const directionalLight = new THREE.AmbientLight(0x404040);
scene.add(directionalLight);

//setting cube x pos
cube.position.x = (0);


//Adding 3D model to scene

let mesh;

loader.load(
	'../resources/3DModels/helicopter.glb',
	(gltf) => {
		mesh = gltf.scene;
		mesh.scale.set(0.3, 0.3, 0.3);
		//adds GLTF to the scene
		scene.add(mesh);
	},
	//called when loading is in progress
	(xhr) => {
		console.log((xhr.loaded / xhr.total * 100) + '% loaded');
	},
	//called when loading has errors
	(error) => {
		console.log('Error has occured!' + error);
	}
);


//Controls
camera.position.z = 5;

let controls;
const createControls = () =>{
    controls = new OrbitControls(camera, renderer.domElement);
};
createControls();
controls.enableDamping=true;
controls.dampingFactor=0.05;
controls.screenSpacePanning=false;

const speed = 0.01;



//applying movement
const animate=function() {
	
	if (rightPressed) {
        mesh.position.x += speed;
    }
    if (leftPressed) {
        mesh.position.x -= speed;
    }
    if (upPressed) {
        mesh.position.y += speed;
    }
    if (downPressed) {
        mesh.position.y -= speed;
    }
	if (deletePressed){
		scene.remove(mesh);
		geometry.dispose();
		material.dispose();
	}
	if (insertPressed){
		scene.add(mesh);
	}
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}

const onWindowResize = () => {
	camera.aspect=window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight - 100);
}

window.addEventListener('resize', onWindowResize);

renderer.setAnimationLoop(animate);
