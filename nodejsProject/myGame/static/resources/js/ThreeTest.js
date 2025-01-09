import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed, deletePressed, insertPressed, scorePressed} from './InputCheck.js';
import Stats from 'Stats';

const LOADINGMANAGER = new THREE.LoadingManager();
let SCENE;
let CAMERA;
const RENDERER = new THREE.WebGLRenderer();
const GLTFLOADER = new GLTFLoader(LOADINGMANAGER);
const AUDIOLISTENER = new THREE.AudioListener();
const AUDIOLOADER = new THREE.AudioLoader();
const BACKGROUNDMUSIC = new THREE.Audio(AUDIOLISTENER);
let CLOCK;

const PROGRESSBAR = document.getElementById('progress-bar'); 
const PLAYGAMEBUTTON = document.getElementById('playGameButton'); 
const PROGRESSBARCONTAINER = document.querySelector('.progress-bar-container');
const PLAYGAMEBUTTONCONTAINER = document.querySelector('.play-button');
const USERINTERFACE = document.querySelector('.overlay-text');

let timerStarted = false

LOADINGMANAGER.onProgress = function(url, loaded, total){
	PROGRESSBAR.value = (loaded / total) * 100;
};

LOADINGMANAGER.onLoad = function(){
	PROGRESSBARCONTAINER.style.display = 'none';
};

function init() {
    initGraphicsWorld();
};

function initGraphicsWorld(){
    CLOCK = new THREE.Clock();

    SCENE = new THREE.Scene();
    SCENE.add(createSkybox());
    CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    CAMERA.position.set(0,10,5);

    //hemisphere light
    let ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
    ambientLight.position.set(0, 10, 0);
    SCENE.add ( ambientLight );

    loadBGMAudio();
};

//background audio
function loadBGMAudio(){
    CAMERA.add(AUDIOLISTENER);
    AUDIOLOADER.load("../resources/sounds/BGM.mp3", function (buffer){
	BACKGROUNDMUSIC.setBuffer(buffer);
	BACKGROUNDMUSIC.setLoop(true);
	BACKGROUNDMUSIC.setVolume(1);
});
};


function STARTAUDIO() {
    if (AUDIOLISTENER.context.state === 'suspended') {
      AUDIOLISTENER.context.resume();
    }
    BACKGROUNDMUSIC.play(); // Play the music
    document.removeEventListener('click', STARTAUDIO);
};


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

let stats;
stats = new Stats();
document.body.appendChild( stats.dom );

RENDERER.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild( RENDERER.domElement );



function createSkybox() {
    const geometry = new THREE.SphereGeometry( 100, 100, 100 );
    const material = new THREE.MeshBasicMaterial({ 
        map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'), 
        side: THREE.DoubleSide
    });

    const skybox = new THREE.Mesh( geometry, material );
    return skybox;
};

//Creating white directional light from top
// const directionalLight = new THREE.AmbientLight(0x404040);
// const hemisphereLight = new THREE.HemisphereLight( 0xddeeff, 0x202020, 0.8);
// SCENE.add(directionalLight);
// SCENE.add(hemisphereLight);




//Adding 3D model to scene

let mesh;
let heliMixer;

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



function loadStaticGLTF(){
    GLTFLOADER.load(
        '../resources/3DModels/Island.glb',
        (gltf) => {
            mesh = gltf.scene;
            mesh.scale.set(.75, .75, .75);
            mesh.position.set(0, 0, 0);
            mesh.rotation.set(0, 0, 0);
            //adds GLTF to the scene
            return mesh;
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
}

//SETTING UP CANNON







//Controls
// let controls;
// const createControls = () =>{
//     controls = new OrbitControls(CAMERA, RENDERER.domElement);
// };
// createControls();
// const speed = 0.01;

//Game loop
function update() {
	var delta = CLOCK.getDelta()
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

	RENDERER.render( SCENE, CAMERA );
    requestAnimationFrame( update );
}

const onWindowResize = () => {
	CAMERA.aspect=window.innerWidth / window.innerHeight;
	CAMERA.updateProjectionMatrix();
	RENDERER.setSize(window.innerWidth,window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

//play game button
PLAYGAMEBUTTON.addEventListener("click", () => {
	STARTAUDIO();
    init();
	update();
	PLAYGAMEBUTTONCONTAINER.style.display = 'none';
	USERINTERFACE.style.display = 'block';
});