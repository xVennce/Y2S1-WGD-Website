import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

/*Creating box geometry*/
const geometry1 = new THREE.BoxGeometry( 1, 1, 1 );
/*Creating basic material*/
const material1 = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
/*Creating mesh*/
const cube = new THREE.Mesh( geometry1, material1 );
scene.add( cube );

const geometry2 = new THREE.TorusKnotGeometry( 10, 3, 100, 16 ); 
const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 
const torusKnot = new THREE.Mesh( geometry2, material2 ); 
scene.add( torusKnot );


cube.position.x = (0);
torusKnot.position.x = (50);

torusKnot.parent = cube;

camera.position.z = 50;
function animate() {

    torusKnot.rotation.x +=0.05;
    torusKnot.rotation.y +=0.05;

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;

	renderer.render( scene, camera );

}
