import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//need to figure out why this doesnt work
//import { keys } from './InputHandler.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.append(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

//This code is used to resize the game window when the user 
//resizes the browser window
const onWindowResize = () => {
	camera.aspect=window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth,window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

camera.position.set(4.61, 2.74, 8)

//creating class for new meshes
class Box extends THREE.Mesh{
    constructor({
        width, 
        height, 
        depth, 
        color = '#00ff00', 
        velocity = {
            x: 0,
            y: 0,
            z: 0
        },
        position = {
            x: 0,
            y: 0,
            z: 0
        },
        zAcceleration = false,
        isGrounded = true,
    }){
        super(
            //instancing geometry
            new THREE.BoxGeometry(width, height, depth),
            //instancing material
            new THREE.MeshStandardMaterial({color})
        )
        this.width = width
        this.height = height
        this.depth = depth
        this.color = color

        this.position.set(position.x, position.y, position.z)

        this.zAcceleration = zAcceleration

        this.isGrounded = isGrounded

        //this gives an initial values of the position
        this.updateSides()

        
        this.velocity = velocity
        this.gravity = -0.002

    }

    updateSides(){
        //this gives the postions of the box relative to the size
        //this is done as coordinate position is from the centre
        //rather than from the sides
        this.top = this.position.y + this.height / 2
        this.bottom = this.position.y - this.height / 2
        
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }
    update(ground){

        this.updateSides()

        //this is for the enemy gradual speed up
        if (this.zAcceleration = true) this.velocity.z += 0.0001


        this.position.x += this.velocity.x
        this.position.z += this.velocity.z

        this.applyGravity(ground)
    }

    applyGravity(ground){
        //value of gravity
        this.velocity.y += this.gravity

        const groundCollision = boxCollisionXYZ({ box1: this, box2: ground })
        const groundCollisionX = boxCollisionX ({ box1: this, box2: ground })
        const groundCollisionY = boxCollisionY ({ box1: this, box2: ground })

        //collision for the box when in contact with ground
        //currently only works for when the cube is in contact with the top of the ground

        if (groundCollision) {
            //this handles the bouncing of the box
            const friction = 0.5
            this.velocity.y *= friction
            this.velocity.y = -this.velocity.y
            this.isGrounded = true
        }
        else{
            this.position.y += this.velocity.y
            this.isGrounded = false
        }

        //NEED TO FIX LEFT AND RIGHT COLLISION STOP
        // if (groundCollisionX && !groundCollisionY) {
        //     //this.position.y += this.velocity.y
        // }
        
    }
}

function boxCollisionY({box1, box2}) {
    const yCollision = box1.top >= box2.bottom && box1.bottom + box1.velocity.y<= box2.top
    return yCollision
}
function boxCollisionX({box1, box2}) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right
    return xCollision
}
function boxCollisionZ({box1, box2}) {
    const zCollision = box1.front >= box2.back && box1.back <= box2.front
    return zCollision
}
function boxCollisionXYZ({box1, box2}) {
    return boxCollisionX({box1: box1, box2: box2,}) && boxCollisionY({box1: box1, box2: box2,}) && boxCollisionZ({box1: box1, box2: box2,})
}

const cube = new Box({
    width: 1,
    height: 1,
    depth: 1,
    color: '#00ff00',
    velocity: {
        x: 0,
        y: -0.01,
        z: 0,
    }
})
cube.castShadow = true
scene.add(cube)

const ground = new Box({
    width: 10,
    height: 0.5,
    depth: 50,
    color: '#86c5da',
    position: {
        x: 0,
        y: -2,
        z: 0,
    }
})
ground.receiveShadow = true
scene.add(ground)

//creating lighting and adding it to the scene
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.y = 3
light.position.z = 1
light.castShadow = true
scene.add(light)

scene.add(new THREE.AmbientLight(0xffffff, 0.5))


//going to move keystrokes into its own js file
const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    space:{
        pressed: false
    }
}

document.addEventListener('keydown', (event) => {
    switch(event.code){
        case'KeyA':
            keys.a.pressed = true
            break
        case'KeyD':
            keys.d.pressed = true
            break
        case'KeyW':
            keys.w.pressed = true
            break
        case'KeyS':
            keys.s.pressed = true
            break
        case'Space':
            keys.space.pressed = true
            break
    }
})

document.addEventListener('keyup', (event) => {
    switch(event.code){
        case'KeyA':
            keys.a.pressed = false
            break
        case'KeyD':
            keys.d.pressed = false
            break
        case'KeyW':
            keys.w.pressed = false
            break
        case'KeyS':
            keys.s.pressed = false
            break
        case'Space':
            keys.space.pressed = false
            break
    }
})

//array to hold all the enemies created
const enemies = []

//this set of code is for deltaTime
let msPrev = window.performance.now()
const desiredFPS = 60
const msPerFrame = 1000 / desiredFPS

//this tracks framerate
let frames = 0
let spawnRate = 200

function animate(){
    const animationID = requestAnimationFrame(animate)
    renderer.render(scene, camera)

    //movement code
    cube.velocity.x = 0
    cube.velocity.z = 0
    if (keys.a.pressed) cube.velocity.x = -0.01
    else if (keys.d.pressed) cube.velocity.x = 0.01
    
    if (keys.w.pressed) cube.velocity.z = -0.01
    else if (keys.s.pressed) cube.velocity.z = 0.01
    
    if (keys.space.pressed && cube.isGrounded) cube.velocity.y = 0.1
    
    cube.update(ground)
    enemies.forEach(enemy =>{
        enemy.update(ground)
        if (
            boxCollisionXYZ({box1: cube, box2: enemy,})) {
            //this needs to change for the ui
            //this currently freezes the game on the frame of which the
            //collision occurs
            cancelAnimationFrame(animationID)
        }
    })

    
    //delta time code
    const msNow = window.performance.now()
    const msPassed = msNow - msPrev

    if (msPassed < msPerFrame) return
    const excessTime = msPassed % msPerFrame
    msPrev = msNow - excessTime


    if (frames % spawnRate === 0) {
        //this will gradually increase the spawn rate
        //caps out at 1 enemy every 20 frames

        if (spawnRate > 20) spawnRate -= 20
        const enemy = new Box({
            width: 1,
            height: 1,
            depth: 1,
            color: '#ff0000',
        
            position: {
                x: (Math.random() - 0.5) * 10,
                y: 0,
                z: -25
            },
            velocity: {
                x: 0,
                y: 0,
                z: 0.005,
            },
            zAcceleration: true
        })
        enemy.castShadow = true
        scene.add(enemy)

        enemies.push(enemy)
    }

    frames++

}
setInterval(() => {
    console.log(frames)
  }, 1000)
animate()