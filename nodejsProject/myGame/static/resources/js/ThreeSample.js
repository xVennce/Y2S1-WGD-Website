import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed, deletePressed, insertPressed, scorePressed} from './InputCheck.js';
import { startTimer } from './CountdownTimer.js';
import { createCube, createGround } from './CreateConstructors.js';
import Stats from 'Stats';

const LOADINGMANAGER = new THREE.LoadingManager();

// const AUDIOLISTENER = new THREE.AudioListener();
// const AUDIOLOADER = new THREE.AudioLoader();
// const BACKGROUNDMUSIC = new THREE.Audio(AUDIOLISTENER);

let SCENE, CAMERA, RENDERER, CLOCK, controls;
// const GLTFLOADER = new GLTFLoader(LOADINGMANAGER);
let GLTFLOADER, heliMixer, mesh, stats;
let BACKGROUNDMUSIC, AUDIOLISTENER, AUDIOLOADER;
let timerStarted = false;
let totalScore = 0;
const speed = 0.01;

const PROGRESSBAR = document.getElementById('progress-bar'); 
const PLAYGAMEBUTTON = document.getElementById('playGameButton'); 
const PROGRESSBARCONTAINER = document.querySelector('.progress-bar-container');
const PLAYGAMEBUTTONCONTAINER = document.querySelector('.play-button');
const USERINTERFACE = document.querySelector('.overlay-text');


LOADINGMANAGER.onProgress = function(url, loaded, total){
	PROGRESSBAR.value = (loaded / total) * 100;
};

LOADINGMANAGER.onLoad = function(){
	PROGRESSBARCONTAINER.style.display = 'none';
};

//background audio
// CAMERA.add(AUDIOLISTENER);
// AUDIOLOADER.load("../resources/sounds/BGM.mp3", function (buffer){
// 	BACKGROUNDMUSIC.setBuffer(buffer);
// 	BACKGROUNDMUSIC.setLoop(true);
// 	BACKGROUNDMUSIC.setVolume(1);
// });

// const STARTAUDIO = () => {
//     if (AUDIOLISTENER.context.state === 'suspended') {
//       AUDIOLISTENER.context.resume();
//     }
//     BACKGROUNDMUSIC.play(); // Play the music
//     document.removeEventListener('click', STARTAUDIO);
// };

Ammo().then(init);
//this function will run 1 time
function init(){

	

	tempTransformation = new Ammo.btTransform();
	initPhysicsWorld();
	initGraphicsWorld();

	createGround();
	addEventListener();

};

//setting renderer size
RENDERER.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild( RENDERER.domElement );

//score handler
let scoreText = document.getElementById("playerScore");
function scoreUpdate(amount){
	totalScore += amount;
	scoreText.innerHTML = totalScore;
}

//highscore update
//Need to add this to the game end condition
//this function will send the score to the backend so that it can compare it
async function submitScoreToBackend(){
	const TEMP = document.getElementById("playerScore");
	const CURRENTSCORE = parseInt(TEMP.innerHTML);
	try {
		const RESPONSE = await fetch ('/compareUserScore', {
			method: 'POST',
			headers:{
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({PLAYERSCORE: CURRENTSCORE}),
		});
	} catch (err){
		console.error('Error occured when trying to pass the data to the backend', err);
	}
};

stats = new Stats();
document.body.appendChild( stats.dom );

function createBGM() {
	AUDIOLISTENER = new THREE.AudioListener();
	CAMERA.add(AUDIOLISTENER);
	AUDIOLOADER.load("../resources/sounds/BGM.mp3", function (buffer){
		BACKGROUNDMUSIC.setBuffer(buffer);
		BACKGROUNDMUSIC.setLoop(true);
		BACKGROUNDMUSIC.setVolume(1);
	});
};
function STARTAUDIO(){
	if (AUDIOLISTENER.context.state === 'suspended') {
	AUDIOLISTENER.context.resume();
	}
	BACKGROUNDMUSIC.play(); // Play the music
	document.removeEventListener('click', STARTAUDIO);
};

function createSkybox() {
	const geometry = new THREE.SphereGeometry( 100, 100, 100 );
	const material = new THREE.MeshBasicMaterial({ 
		map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'), 
		side: THREE.DoubleSide
	});

	const skybox = new THREE.Mesh( geometry, material );
	SCENE.add(skybox);
};

//Creating white directional light from top
const DIRECTIONALLIGHT = new THREE.AmbientLight(0x404040);
const HEMISPHERELIGHT = new THREE.HemisphereLight( 0xddeeff, 0x202020, 0.8);
SCENE.add(DIRECTIONALLIGHT);
SCENE.add(HEMISPHERELIGHT);



//Adding 3D model to scene
function loadModels() {
	GLTFLOADER = new GLTFLoader(LOADINGMANAGER);
	GLTFLOADER.load(
		'../resources/3DModels/low_poly_helicopter.glb',
		(gltf) => {
			mesh = gltf.scene;
			mesh.scale.set(0.3, 0.3, 0.3);
			mesh.position.set(-5, 4, -5);
			mesh.rotation.set(0, 90, 0.3);
			//adds GLTF to the scene
			SCENE.add(mesh);
	
			//this is for playing the animation
			heliMixer = new THREE.AnimationMixer(gltf.scene);
			gltf.animations.forEach((clip) =>{
				const animationAction = heliMixer.clipAction(clip);
				animationAction.play();
			});
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
	
	GLTFLOADER.load(
		'../resources/3DModels/Island.glb',
		(gltf) => {
			mesh = gltf.scene;
			mesh.scale.set(.75, .75, .75);
			mesh.position.set(0, 0, 0);
			mesh.rotation.set(0, 0, 0);
			//adds GLTF to the scene
			SCENE.add(mesh);
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
};





//Camera position
CAMERA.position.z = 10;
CAMERA.position.y = 5;

const createControls = () =>{
    controls = new OrbitControls(CAMERA, RENDERER.domElement);
};
createControls();

function addEventListener() {
	window.addEventListener("resize", onWindowResize, false);
}

//SETTING UP AMMO
let physicsWorld;
let rigidBody_List = new Array();
let tempTransformation = undefined;

function initPhysicsWorld(){
	let collisionConfiguration = new Ammo.btCollisionConfiguration(),
		dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
		overlappingPairCache = new Ammo.btDbvBroadphase(),
		solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));
};

function initGraphicsWorld(){
	//clock
	CLOCK = new THREE.Clock();
	//scene
	SCENE = new THREE.Scene();
	//camera
	CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	CAMERA.position.set(0,10,5);

	//hemisphere light
	let ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
	ambientLight.position.set(0, 10, 0);
	SCENE.add ( ambientLight );

	//renderer
	RENDERER = new THREE.WebGLRenderer( {antialias: true});
	RENDERER.setPixelRatio( window.devicePixelRatio );
	RENDERER.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( RENDERER.domElement );

	RENDERER.outputEncoding = THREE.sRGBEncoding;
};

function initStatsUi(){
	stats = new Stats();
	document.body.appendChild( stats.dom );
}



//Game loop
function render() {
	let deltaTime = CLOCK.getDelta()
	if (heliMixer){
		heliMixer.update(delta);
	}

	//this is for the timer
	if (!timerStarted){
		timerStarted=true;
		startTimer();
	}

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
	if (scorePressed){
		scoreUpdate(100);
		console.log(mesh.position)
	}

	stats.update();
	updatePhysicsWorld(deltaTime);
	RENDERER.render( SCENE, CAMERA );
	requestAnimationFrame(render);
}

function onWindowResize(){
	CAMERA.aspect=window.innerWidth / window.innerHeight;
	CAMERA.updateProjectionMatrix();
	RENDERER.setSize(window.innerWidth,window.innerHeight);
};

//play game button
PLAYGAMEBUTTON.addEventListener("click", () => {
	STARTAUDIO();
	init();
	PLAYGAMEBUTTONCONTAINER.style.display = 'none';
	USERINTERFACE.style.display = 'block';
});
