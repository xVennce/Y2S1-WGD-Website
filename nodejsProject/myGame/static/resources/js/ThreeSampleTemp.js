import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { upPressed, downPressed, leftPressed, rightPressed } from './InputCheck.js';
import Stats from 'Stats';

//Logic or important variables
let scene, camera, renderer, clock, stats, controls;
let skybox, directionalLight, hemisphereLight;
let mesh, heliMixer;
let isGameOver = false;
let totalScore = 0;
let remainingTime = 60;
const pushForce = 50;

//Document related
const progressBar = document.getElementById('progress-bar');
const playGameButton = document.getElementById('playGameBtn');
const progressBarContainer = document.querySelector('.progress-bar-container');
const playGameButtonContainer = document.querySelector('.play-button');
const userInterface = document.querySelector('.overlay-text');
const scoreText = document.getElementById('playerScore');
const gameOverContainer = document.querySelector('.game-end-ui');

const replayGameButton = document.getElementById('replayBtn');
const homeButton = document.getElementById('quitBtn');
const gameOverScore = document.getElementById('final-score');

const statsContainer = document.querySelector('.stats-page');
const statsButton = document.getElementById('viewStatsBtn');

const backButton = document.getElementById('backBtn');

//THREE js stuff
const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);
const audioListener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
const backgroundMusic = new THREE.Audio(audioListener);

//CANNON js stuff
let physicsWorld;
let groundBody;
let cannonDebugger;

//Logic for spawn intervals for hurtCubes and good cubes
//time here is measured in ms

const totalTime = 60000;

let hurtCubeSpawnInterval = 2000;
const hurtCubeMinSpawnInterval = 500;

let hurtCubeElapsed = 0;
let hurtCubeSpawnTimer;
const hurtCubes = [];

let goodCubeSpawnInterval = 3000;
const goodCubeMinSpawnInterval = 250;

let goodCubeElapsed = 0;
let goodCubeSpawnTimer;
const goodCubes = [];

//playable boundary
const playableBounds = {
    minX: -5, maxX: 5, 
    minY: 0, maxY: 10, 
    minZ: -5, maxZ: 5, 
};

class Sphere {
    constructor(
		radius, 
		mass, 
		position = { x: 0, y: 0, z: 0 }, 
		color = 0x00ff00) 
		{
      
        this.geometry = new THREE.SphereGeometry(radius);
        this.material = new THREE.MeshBasicMaterial({ color: color });

        //Phys body
        this.body = new CANNON.Body({
            mass: mass,
            shape: new CANNON.Sphere(radius),
        });
        this.body.position.set(position.x, position.y, position.z);

        //Mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);

        //Adds it to physics world and scene
        physicsWorld.addBody(this.body);
        scene.add(this.mesh);
    };

    update() {
        //This matches the mesh to the physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);
    };
};

let playerSphere;

class SpawnedCube {
    constructor(
		position = { x: 0, y: 10, z: 0 }, 
		color = 0xff0000) 
		{//phys body
			this.body = new CANNON.Body({
				mass: 1,
				shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
			});
			this.body.position.set(position.x, position.y, position.z);

			//create the mesh for the cubes
			this.geometry = new THREE.BoxGeometry(2, 2, 2);
			this.material = new THREE.MeshBasicMaterial({ color });
			this.mesh = new THREE.Mesh(this.geometry, this.material);

			physicsWorld.addBody(this.body);
			scene.add(this.mesh);

			//this activates the 2 second delay timer
			this.despawnCubeAfterDelay();
		};

    update() {
        //This matches the mesh to the physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        //This will check if the player is colliding with the cubes
        this.checkPlayerCollision();
    };

    checkPlayerCollision() {
		//This checks if the cube has collided with the player
        const distanceToPlayer = this.body.position.distanceTo(playerSphere.body.position);
        //this will check if the distance is less than 1.5 between the two
		if (distanceToPlayer < 2.5) {
            isGameOver = true;
            console.log("Game Over!");
            this.despawn();
        }
    };

    despawnCubeAfterDelay() {
        //Starts a timer to despawn the cube after 3 seconds
        setTimeout(() => {
            this.despawn();
        }, 3000);
    };

    despawn() {
        // Remove from the physics world and scene
        physicsWorld.removeBody(this.body);
        scene.remove(this.mesh);

        //This removes the cube from the physics world and scene
        const index = hurtCubes.indexOf(this);
        if (index > -1) {
            hurtCubes.splice(index, 1);
        };
    };
};

class CollectableSpawner{
	constructor(
		position = { x: 0, y: 4, z: 0 }, 
		color = 0xffd700) 
		{
			//phys body
			this.body = new CANNON.Body({
				mass: 1,
				shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
			});
			this.body.position.set(position.x, position.y, position.z);

			//create the mesh for the cubes
			this.geometry = new THREE.BoxGeometry(1, 1, 1);
			this.material = new THREE.MeshBasicMaterial({ color });
			this.mesh = new THREE.Mesh(this.geometry, this.material);

			this.pointCheck = false;

			physicsWorld.addBody(this.body);
			scene.add(this.mesh);

			//this activates the 1.5 second delay timer
			this.despawnCubeAfterDelay();
		}
	update() {
		//This matches the mesh to the physics body
		this.mesh.position.copy(this.body.position);
		this.mesh.quaternion.copy(this.body.quaternion);

		//This will check if the player is colliding with the cubes
		this.checkPlayerCollision();
	};
	checkPlayerCollision() {
		//This checks if the cube has collided with the player
        const distanceToPlayer = this.body.position.distanceTo(playerSphere.body.position);
        //this will check if the distance is less than 2 between the two
		if (distanceToPlayer < 1.75) {
			if (!this.pointCheck) {
				//this ensures it only occurs once
				scoreUpdate(1000);
				this.pointCheck = true;
			};
            this.despawn();
        }
    };

	despawnCubeAfterDelay() {
        //Starts a timer to despawn the cube after 1 seconds
        setTimeout(() => {
            this.despawn();
        }, 1500);
    };

    despawn() {
        //This removes the cube from the physics world and scene
        physicsWorld.removeBody(this.body);
        scene.remove(this.mesh);

		//This removes the cube from the array
        const index = hurtCubes.indexOf(this);
        if (index > -1) {
            goodCubes.splice(index, 1);
        };
    };
}


start();

function start() {
	

	initPhysicsWorld();
	initGraphicsWorld();

	cannonDebugger= new CannonDebugger(scene, physicsWorld);

	createGround();
	playerSphere = new Sphere (
		1,
		5,
		{
			x: 0,
			y: 3,
			z: 0
		}
	);

	//places trees
	loadAndPlaceTrees(15, playableBounds);
    setupEventListeners();
};

function update() {
	//this stops the update loop when the game is over
	if (isGameOver){
		gameOverHandler(isGameOver);
		return;
	}

	//this handles the helicopter anims
    const deltaTime = clock.getDelta();
    if (heliMixer) {
        heliMixer.update(deltaTime);
    }

	//this handles the timer ui
	//also handles when the time is over
	remainingTime -= deltaTime;
	document.getElementById("time").innerHTML= Math.ceil(remainingTime);
	if (remainingTime <= 0) {
        isGameOver = true;
    };

	//this updates the physics world
	physicsWorld.fixedStep();
	cannonDebugger.update();

	//this updates the mesh to be inline with the rigidbody
	playerSphere.update();

	
	if (rightPressed) {
		playerSphere.body.applyForce(new CANNON.Vec3(pushForce, 0, 0), playerSphere.body.position);
	};
	if (leftPressed) {
	playerSphere.body.applyForce(new CANNON.Vec3(-pushForce, 0, 0), playerSphere.body.position);
	};
	if (upPressed) {
	playerSphere.body.applyForce(new CANNON.Vec3(0, 0, -pushForce), playerSphere.body.position);
	};
	if (downPressed) {
		playerSphere.body.applyForce(new CANNON.Vec3(0, 0, pushForce), playerSphere.body.position);
	};

	//these function handles limiting the player velocity
	//also handles the boundaries
	capVelocity(playerSphere.body, 5);

	//this resets the velocity when it hits the boundary 
	//and also handles the boundary
	clampPlayerBoundsAndVelocity(playerSphere.body, playableBounds);

	//updates the stats (FPS,ms)
    stats.update();

	//this iterates through each cube within the array and runs update();
	//updateCubes();
	hurtCubes.forEach(cube => {
		cube.update();
	});

	goodCubes.forEach(cube => {
		cube.update();
	});
	

    renderer.render(scene, camera);

	requestAnimationFrame(update);
};

function spawnHurtCube() {
	//This generates a random x,y coord within the bounds
    const x = Math.random() * (playableBounds.maxX - playableBounds.minX) + playableBounds.minX;
    const z = Math.random() * (playableBounds.maxZ - playableBounds.minZ) + playableBounds.minZ;

    const cube = new SpawnedCube({ x, y: 10, z });
	//this adds it to the array
    hurtCubes.push(cube); 
};

function spawnCollectable() {
	//This generates a random x,y coord within the bounds
    const x = Math.random() * (playableBounds.maxX - playableBounds.minX) + playableBounds.minX;
    const z = Math.random() * (playableBounds.maxZ - playableBounds.minZ) + playableBounds.minZ;

    const cube = new CollectableSpawner({ x, y: 4, z });
	//this adds it to the array
    goodCubes.push(cube); 
};

function adjustHurtCubeSpawnRate() {
    const progress = hurtCubeElapsed / totalTime;
	//this linearly scales the spawn interval from 2 seconds to 0.5 seconds
    hurtCubeSpawnInterval = 2000 - progress * (2000 - hurtCubeMinSpawnInterval);
	//this clamps the spawnInterval to the minSpawnInterval
	//this is to prevent overspawning
	hurtCubeSpawnInterval = Math.max(hurtCubeSpawnInterval, hurtCubeMinSpawnInterval); 
};

function adjustGoodCubeSpawnRate() {
    const progress = hurtCubeElapsed / totalTime;
	//this linearly scales the spawn interval from 3 seconds to 0.25 seconds
    goodCubeSpawnInterval = 3000 - progress * (3000 - goodCubeMinSpawnInterval);
	//this clamps the spawnInterval to the minSpawnInterval
	//this is to prevent overspawning
	goodCubeSpawnInterval = Math.max(goodCubeSpawnInterval, goodCubeMinSpawnInterval); 
};

//Function to handle cube spawning
//this is added to the on click for play game button
function startSpawningHurtCubes() {
    hurtCubeSpawnTimer = setInterval(() => {
        spawnHurtCube();
        hurtCubeElapsed += hurtCubeSpawnInterval;

        // Adjust the spawn rate dynamically
        adjustHurtCubeSpawnRate();

        // Restart the timer with the new interval
        clearInterval(hurtCubeSpawnTimer);
        startSpawningHurtCubes();

        // Stop spawning after 60 seconds
        if (hurtCubeElapsed >= totalTime) {
            clearInterval(hurtCubeSpawnTimer);
        }
    }, hurtCubeSpawnInterval);
}

function startSpawningCollectables(){
	goodCubeSpawnTimer = setInterval(() => {
        spawnCollectable();
        goodCubeElapsed += goodCubeSpawnInterval;

        // Adjust the spawn rate dynamically
        adjustGoodCubeSpawnRate();

        // Restart the timer with the new interval
        clearInterval(goodCubeSpawnTimer);
        startSpawningCollectables();

        // Stop spawning after 60 seconds
        if (goodCubeElapsed >= totalTime) {
            clearInterval(goodCubeSpawnTimer);
        }
    }, goodCubeSpawnInterval);
};

function clampPlayerBoundsAndVelocity(body, bounds) {
    const { position, velocity } = body;

	//these if statements prevent player from going out of bounds
    if (position.x <= bounds.minX || position.x >= bounds.maxX) velocity.x = 0;
    if (position.y <= bounds.minY || position.y >= bounds.maxY) velocity.y = 0;
    if (position.z <= bounds.minZ || position.z >= bounds.maxZ) velocity.z = 0;

	//this resets the velocity when it hits the boundary 
    position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
    position.y = Math.max(bounds.minY, Math.min(bounds.maxY, position.y));
    position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
};

function capVelocity(body, maxSpeed){
	const velocity = body.velocity;
	const speed = velocity.length();
	if (speed > maxSpeed) {
		velocity.scale (maxSpeed / speed, velocity);
	}
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
	//clock
	clock = new THREE.Clock();

	//scene
	scene = new THREE.Scene();
	
	//camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	camera.position.set(0, 8, 16);

	//renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

	//stats
    stats = new Stats();
    document.body.appendChild(stats.dom);

	//wireframe for the boundary
	const wireframeGeometry = new THREE.BoxGeometry(10, 10, 10);
	const wireframeMaterial = new THREE.MeshBasicMaterial({
		color: 0xffffff,
		wireframe: true,
	});
	const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
	scene.add(wireframe);

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

	//skybox
    const geometrySB = new THREE.SphereGeometry(100, 100, 100);
    const materialSB = new THREE.MeshBasicMaterial({ 
        map: new THREE.TextureLoader().load('../resources/images/skybox.jpg'), 
        side: THREE.DoubleSide
    });
    skybox = new THREE.Mesh(geometrySB, materialSB);
    scene.add(skybox);
	
	//lighting
	directionalLight = new THREE.AmbientLight(0x404040);
    hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 0.8);
    scene.add(directionalLight, hemisphereLight);

    createControls(controls);
    load3DModels();
};

function setupEventListeners() {
	window.addEventListener('resize', onWindowResize);
	document.addEventListener('click', startAudio);
    playGameButton.addEventListener('click', startGame);
	replayGameButton.addEventListener('click', restartGame);
	homeButton.addEventListener('click', logoutUser);
	statsButton.addEventListener('click', loadStatsUi);
	backButton.addEventListener('click', unloadStatsUi);
};

function startAudio() {
	if (audioListener.context.state === 'suspended') {
		audioListener.context.resume();
	}
	backgroundMusic.play();
	document.removeEventListener('click', startAudio);
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
            mesh.position.set(-5, 10, -5);
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
        '../resources/3DModels/low_poly_island.glb',
        (gltf) => {
            const island = gltf.scene;
            island.scale.set(2, 10, 2);
            island.position.set(0, -20, 0);
            scene.add(island);
        },
        (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
        (error) => console.error('Error loading island model:', error)
    );
};

function loadAndPlaceTrees(treeCount, bounds) {
    gltfLoader.load(
        '../resources/3DModels/tree.glb',
        (gltf) => {
            const treeModel = gltf.scene;

            for (let i = 0; i < treeCount; i++) {
				//this clones the tree model
                const tree = treeModel.clone(); 
                let x, z;

                // Generate random positions outside the specified bounds and restricted z-range
                //this generates random positions out of the bounds but within a 5 radius of the bounds
				do {
                    x = Math.random() * (bounds.maxX + 5 - (bounds.minX - 5)) + (bounds.minX - 5);
                    z = Math.random() * (bounds.maxZ + 5 - (bounds.minZ - 5)) + (bounds.minZ - 5);
                } while (
					//this occurs when the tree is in the bounds
					//this is to prevent trees from being placed too close to the camera
                    (x > bounds.minX && x < bounds.maxX && z > bounds.minZ && z < bounds.maxZ) || (z >= bounds.maxZ && z <= 30)
                );

				//this keeps the trees on the ground
                const y = bounds.minY;

                // Position the tree
                tree.position.set(x, y, z);

				//this generates a random scale to apply to the tree
                const scale = Math.random() * 0.25 + 0.375;
                tree.scale.set(scale, scale, scale);

                scene.add(tree);
            }
            console.log(treeCount + "trees placed successfully.");
        },
        undefined,
        (error) => console.error('Error loading tree model:', error)
    );
};

//when the startGame button is pressed,
//it will cause the update function to start
function startGame() {
    playGameButtonContainer.style.display = 'none';
    userInterface.style.display = 'block';
	startSpawningHurtCubes();
	startSpawningCollectables();
    update();
};

function restartGame(){
	location.reload();
};

function logoutUser(){
	//this redirects to the index page which auto logs them out
	window.location.href = "/index";
};

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};

//score handler
function scoreUpdate(amount) {
    totalScore += amount;
    scoreText.innerHTML = totalScore;
};

//highscore update
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

async function fetchUserData(){
	try {
        const response = await fetch('/readJSON');
        //this assigns the data that was sent from the backend to the data variable
        const data = await response.json();

        const statsContainerUserText = document.getElementById('stats-username');
        const statsContainerScoreText = document.getElementById('stats-highscore');

        // Validate and display user data
        if (data.username && data.score !== undefined) {
            statsContainerUserText.innerHTML = 'Username: ' + data.username;
            statsContainerScoreText.innerHTML = 'Highscore: ' + data.score;
        } else {
            statsContainerUserText.innerHTML = 'Username: Guest';
            statsContainerScoreText.innerHTML = 'Highscore: Not recorded';
        };
    } catch (err) {
        console.error('Something went wrong during data fetching:', err.message);
    }
};

function unloadStatsUi(){
	playGameButtonContainer.style.display = 'flex';
	statsContainer.style.display = 'none';
}

function loadStatsUi(){
	playGameButtonContainer.style.display = 'none';
	statsContainer.style.display = 'flex';
	fetchUserData();
};

function gameOverHandler(gameState){
	if (gameState === true){
		userInterface.style.display = 'none';
		gameOverScore.innerHTML = totalScore;
		submitScoreToBackend();
		//game over ui here
		gameOverContainer.style.display = 'flex';
	};
};