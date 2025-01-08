import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed, scorePressed } from './InputCheck.js';
import { startTimer } from './CountdownTimer.js';
import { createCube, createGround } from './CreateConstructors.js';
import Stats from 'Stats';

let SCENE, CAMERA, RENDERER, CLOCK, controls;
let GLTFLOADER, heliMixer, mesh, stats;
let BACKGROUNDMUSIC, AUDIOLISTENER, AUDIOLOADER;
let timerStarted = false;
let totalScore = 0;
const speed = 0.01;

// DOM Elements
const PROGRESSBAR = document.getElementById('progress-bar');
const PLAYGAMEBUTTON = document.getElementById('playGameButton');
const PROGRESSBARCONTAINER = document.querySelector('.progress-bar-container');
const PLAYGAMEBUTTONCONTAINER = document.querySelector('.play-button');
const USERINTERFACE = document.querySelector('.overlay-text');
const scoreText = document.getElementById("playerScore");

// Initialize everything
function init() {
    // Clock
    CLOCK = new THREE.Clock();

    // Scene
    SCENE = new THREE.Scene();

    // Camera
    CAMERA = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    CAMERA.position.set(0, 10, 5);

    // Renderer
    RENDERER = new THREE.WebGLRenderer({ antialias: true });
    RENDERER.setSize(window.innerWidth, window.innerHeight);
    RENDERER.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(RENDERER.domElement);

    // Audio
    AUDIOLISTENER = new THREE.AudioListener();
    CAMERA.add(AUDIOLISTENER);
    AUDIOLOADER = new THREE.AudioLoader();
    BACKGROUNDMUSIC = new THREE.Audio(AUDIOLISTENER);
    AUDIOLOADER.load("../resources/sounds/BGM.mp3", (buffer) => {
        BACKGROUNDMUSIC.setBuffer(buffer);
        BACKGROUNDMUSIC.setLoop(true);
        BACKGROUNDMUSIC.setVolume(1);
    });

    // Loading Manager
    const LOADINGMANAGER = new THREE.LoadingManager();
    GLTFLOADER = new GLTFLoader(LOADINGMANAGER);

    LOADINGMANAGER.onProgress = (url, loaded, total) => {
        PROGRESSBAR.value = (loaded / total) * 100;
    };
    LOADINGMANAGER.onLoad = () => {
        PROGRESSBARCONTAINER.style.display = 'none';
    };

    // Stats
    stats = new Stats();
    document.body.appendChild(stats.dom);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    SCENE.add(ambientLight);

    // Skybox
    const skyboxGeometry = new THREE.SphereGeometry(100, 100, 100);
    const skyboxMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'),
        side: THREE.DoubleSide,
    });
    const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    SCENE.add(skybox);

    // Load Models
    loadModels();

    // Controls
    controls = new OrbitControls(CAMERA, RENDERER.domElement);

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
}

// Load models
function loadModels() {
    GLTFLOADER.load('../resources/3DModels/low_poly_helicopter.glb', (gltf) => {
        mesh = gltf.scene;
        mesh.scale.set(0.3, 0.3, 0.3);
        mesh.position.set(-5, 4, -5);
        SCENE.add(mesh);

        heliMixer = new THREE.AnimationMixer(gltf.scene);
        gltf.animations.forEach((clip) => {
            heliMixer.clipAction(clip).play();
        });
    });

    GLTFLOADER.load('../resources/3DModels/Island.glb', (gltf) => {
        const island = gltf.scene;
        island.scale.set(0.75, 0.75, 0.75);
        SCENE.add(island);
    });
}

// Handle window resize
function onWindowResize() {
    CAMERA.aspect = window.innerWidth / window.innerHeight;
    CAMERA.updateProjectionMatrix();
    RENDERER.setSize(window.innerWidth, window.innerHeight);
}

// Update Score
function scoreUpdate(amount) {
    totalScore += amount;
    scoreText.innerHTML = totalScore;
}

// Main render loop
function render() {
    const deltaTime = CLOCK.getDelta();

    if (heliMixer) heliMixer.update(deltaTime);

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
    RENDERER.render(SCENE, CAMERA);
    requestAnimationFrame(render);
}

// Start game logic
PLAYGAMEBUTTON.addEventListener("click", () => {
    BACKGROUNDMUSIC.play();
    init();
    PLAYGAMEBUTTONCONTAINER.style.display = 'none';
    USERINTERFACE.style.display = 'block';
    render();
});
