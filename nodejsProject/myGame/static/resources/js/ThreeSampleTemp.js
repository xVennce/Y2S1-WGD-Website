import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed, scorePressed } from './InputCheck.js';
import Stats from 'Stats';

let scene, camera, renderer, clock, stats, controls;
let skybox, directionalLight, hemisphereLight;
let mesh, heliMixer;
let timerStarted = false;
let totalScore = 0;
const speed = 0.01;

const progressBar = document.getElementById('progress-bar');
const playGameButton = document.getElementById('playGameButton');
const progressBarContainer = document.querySelector('.progress-bar-container');
const playGameButtonContainer = document.querySelector('.play-button');
const userInterface = document.querySelector('.overlay-text');
const scoreText = document.getElementById("playerScore");

const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);
const audioListener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
const backgroundMusic = new THREE.Audio(audioListener);

let physicsWorld;
let groundBody;

let cannonDebugger 

start();

function start() {
	initPhysicsWorld();
	initGraphicsWorld();
	
	cannonDebugger= new CannonDebugger(scene, physicsWorld)

	createGround();

    addEventListener();
};

function update() {
	//this handles the helicopter anims
    const deltaTime = clock.getDelta();
    if (heliMixer) {
        heliMixer.update(deltaTime);
    }

	cannonDebugger.update();

	//this starts the timer
    if (!timerStarted) {
        timerStarted = true;
        startTimer();
    }
	
    if (rightPressed) mesh.position.x += speed;
    if (leftPressed) mesh.position.x -= speed;
    if (upPressed) mesh.position.y += speed;
    if (downPressed) mesh.position.y -= speed;
    if (scorePressed) scoreUpdate(100);

    stats.update();

    renderer.render(scene, camera);
	requestAnimationFrame(update);
};

function createGround(){
	groundBody = new CANNON.Body({
		type: CANNON.Body.STATIC,
		shape: new CANNON.Plane(),
	});
	groundBody.quaternion.setFromEuler(-Math.PI/2,0,0)
	physicsWorld.addBody(groundBody);
};

function initPhysicsWorld(){
	physicsWorld = new CANNON.World({
		gravity: new CANNON.Vec3(0, -9.82, 0),
	});
};

function initGraphicsWorld(){
	//setting up base three js scene
	clock = new THREE.Clock();

	scene = new THREE.Scene();
	
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 5, 10);// Set camera position

	createLighting();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    //this handles the bgm
    camera.add(audioListener);
    audioLoader.load("../resources/sounds/BGM.mp3", (buffer) => {
        backgroundMusic.setBuffer(buffer);
        backgroundMusic.setLoop(true);
        backgroundMusic.setVolume(1);
    });

    //This is for the loading screen
    loadingManager.onProgress = (url, loaded, total) => {
        progressBar.value = (loaded / total) * 100;
    };

    loadingManager.onLoad = () => {
        progressBarContainer.style.display = 'none';
    };

    // Create basic objects
    createSceneObjects();
    createControls(controls);
    load3DModels();
};



function addEventListener() {
	window.addEventListener('resize', onWindowResize);
	document.addEventListener('click', startAudio);
    playGameButton.addEventListener("click", startGame);
};

function startAudio() {
	if (audioListener.context.state === 'suspended') {
		audioListener.context.resume();
	}
	backgroundMusic.play();
	document.removeEventListener('click', startAudio);
};

function createSceneObjects() {
    const geometrySB = new THREE.SphereGeometry(100, 100, 100);
    const materialSB = new THREE.MeshBasicMaterial({ 
        map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'), 
        side: THREE.DoubleSide
    });
    skybox = new THREE.Mesh(geometrySB, materialSB);
    scene.add(skybox);
};

//Creating white directional light from top
function createLighting() {
    directionalLight = new THREE.AmbientLight(0x404040);
    hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 0.8);
    scene.add(directionalLight, hemisphereLight);
};

function createControls(controls) {
    controls = new OrbitControls(camera, renderer.domElement);
};

function load3DModels() {
    gltfLoader.load(
        '../resources/3DModels/low_poly_helicopter.glb',
        (gltf) => {
            mesh = gltf.scene;
            mesh.scale.set(0.3, 0.3, 0.3);
            mesh.position.set(-5, 4, -5);
            mesh.rotation.set(0, 90, 0.3);
            scene.add(mesh);

            heliMixer = new THREE.AnimationMixer(gltf.scene);
            gltf.animations.forEach((clip) => {
                const animationAction = heliMixer.clipAction(clip);
                animationAction.play();
            });
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (error) => console.error('Error loading helicopter model:', error)
    );

    gltfLoader.load(
        '../resources/3DModels/Island.glb',
        (gltf) => {
            const island = gltf.scene;
            island.scale.set(0.75, 0.75, 0.75);
            island.position.set(0, 0, 0);
            scene.add(island);
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (error) => console.error('Error loading island model:', error)
    );
};

//score handler
function scoreUpdate(amount) {
    totalScore += amount;
    scoreText.innerHTML = totalScore;
};

//highscore update
//Need to add this to the game end condition
//this function will send the score to the backend so that it can compare it
async function submitScoreToBackend() {
    try {
        const response = await fetch('/compareUserScore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ PLAYERSCORE: totalScore }),
        });
        console.log('Score submitted:', response);
    } catch (err) {
        console.error('Error submitting score:', err);
    }
};

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


//when the startGame button is pressed,
//it will cause the update function to start
function startGame() {
    playGameButtonContainer.style.display = 'none';
    userInterface.style.display = 'block';
    update();
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};