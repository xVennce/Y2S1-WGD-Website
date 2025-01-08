import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed, deletePressed, insertPressed, scorePressed} from './InputCheck.js';
import Stats from 'Stats';

const LOADINGMANAGER = new THREE.LoadingManager();

const PROGRESSBAR = document.getElementById('progress-bar'); 
const PROGRESSBARCONTAINER = document.querySelector('.progress-bar-container');

const USERINTERFACE = document.querySelector('.overlay-text');

LOADINGMANAGER.onStart = function(url, item, total){
	console.log(`Started loading: ${url}`);
};
LOADINGMANAGER.onProgress = function(url, loaded, total){
	PROGRESSBAR.value = (loaded / total) * 100;
};

LOADINGMANAGER.onLoad = function(){
	PROGRESSBARCONTAINER.style.display = 'none';
	USERINTERFACE.style.display = 'block';
};

const SCENE = new THREE.Scene();
const CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const RENDERER = new THREE.WebGLRenderer();
const GLTFLOADER = new GLTFLoader(LOADINGMANAGER);

const AUDIOLISTENER = new THREE.AudioListener();
const AUDIOLOADER = new THREE.AudioLoader();
const BACKGROUNDMUSIC = new THREE.Audio(AUDIOLISTENER);

var timerStarted = false

CAMERA.add(AUDIOLISTENER);
AUDIOLOADER.load("../resources/sounds/BGM.mp3", function (buffer){
	BACKGROUNDMUSIC.setBuffer(buffer);
	BACKGROUNDMUSIC.setLoop(true);
	BACKGROUNDMUSIC.setVolume(1);
});

const STARTAUDIO = () => {
    if (AUDIOLISTENER.context.state === 'suspended') {
      AUDIOLISTENER.context.resume();
    }
    BACKGROUNDMUSIC.play(); // Play the music
    document.removeEventListener('click', STARTAUDIO);
};

document.addEventListener('click', STARTAUDIO);

//timer
function startTimer(){
	let timeDuration = 60;
	let timeText = document.getElementById("time");

	const TIMER = setInterval(function(){
		timeDuration--;
		timeText.innerHTML = timeDuration;
		if (timeDuration === 0){
			//this just reloads the game
			location.reload();
			clearInterval(TIMER);
		}
	}, 1000);
}

//score handler
let totalScore = 0;
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
		const RESPONSE = await fetch ('http://localhost:3000/compareUserScore', {
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

let stats;
stats = new Stats();
document.body.appendChild( stats.dom );

RENDERER.setSize( window.innerWidth, window.innerHeight - 100);
document.body.appendChild( RENDERER.domElement );


/*Creating box geometry*/
const geometry = new THREE.BoxGeometry( .1, .1, .1 );
/*Creating basic material*/
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
/*Creating mesh*/
const cube = new THREE.Mesh( geometry, material );
SCENE.add( cube );

//Creating skybox
const geometrySB = new THREE.SphereGeometry( 100, 100, 100 );
const materialSB = new THREE.MeshBasicMaterial({ 
	map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'), 
	side: THREE.DoubleSide
});
const cubeSB = new THREE.Mesh( geometrySB, materialSB );
SCENE.add( cube, cubeSB );

//Creating white directional light from top
const directionalLight = new THREE.AmbientLight(0x404040);
SCENE.add(directionalLight);

//setting cube x pos
cube.position.x = (0);


//Adding 3D model to scene

let mesh;

GLTFLOADER.load(
	'../resources/3DModels/helicopter.glb',
	(gltf) => {
		mesh = gltf.scene;
		mesh.scale.set(0.3, 0.3, 0.3);
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


//Controls
CAMERA.position.z = 5;

let controls;
const createControls = () =>{
    controls = new OrbitControls(CAMERA, RENDERER.domElement);
};
createControls();
controls.enableDamping=true;
controls.dampingFactor=0.05;
controls.screenSpacePanning=false;

const speed = 0.01;



//applying movement
const animate=function() {
	
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
	if (deletePressed){
		SCENE.remove(mesh);
		geometry.dispose();
		material.dispose();
	}
	if (insertPressed){
		SCENE.add(mesh);
	}
	if (scorePressed){
		scoreUpdate(100);
	}
	stats.update();
	//scoreUpdate(1);
	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
	RENDERER.render( SCENE, CAMERA );
}

const onWindowResize = () => {
	CAMERA.aspect=window.innerWidth / window.innerHeight;
	CAMERA.updateProjectionMatrix();
	RENDERER.setSize(window.innerWidth,window.innerHeight - 100);
}

window.addEventListener('resize', onWindowResize);

RENDERER.setAnimationLoop(animate);
