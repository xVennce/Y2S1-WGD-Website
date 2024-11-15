import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)

const renderer = new THREE.WebGLRenderer()
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
        zAcceleration = false
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

        if (this.zAcceleration = true) this.velocity.z += 0.0001


        this.position.x += this.velocity.x
        this.position.z += this.velocity.z

        this.applyGravity(ground)
    }

    applyGravity(ground){
        //value of gravity
        this.velocity.y += this.gravity

        //collision for the box when in contact with ground
        if (
            boxCollision({
                box1: this,
                box2: ground
            })
        ) {
            this.velocity.y *= 0.8
            this.velocity.y = -this.velocity.y
        }
        else{
            this.position.y += this.velocity.y
        }
    }
}

function boxCollision({box1, box2}) {
        const xCollision = box1.right >= box2.left && box1.left <= box2.right
        const yCollision = box1.top >= box2.bottom && box1.bottom + box1.velocity.y<= box2.top
        const zCollision = box1.front >= box2.back && box1.back <= box2.front
        
        return xCollision && yCollision && zCollision
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
    width: 5,
    height: 0.5,
    depth: 10,
    color: '#0000ff',
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
light.position.z = 2
light.castShadow = true
scene.add(light)

camera.position.z = 5

console.log("cube bottom = " + cube.bottom)
console.log("ground top = " + ground.top)

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
    }
}

window.addEventListener('keydown', (event) => {
    switch(event.code){
        case'KeyA':
            console.log('Pressed a')
            keys.a.pressed = true
            break
        case'KeyD':
            console.log('Pressed d')
            keys.d.pressed = true
            break
        case'KeyW':
            console.log('Pressed w')
            keys.w.pressed = true
            break
        case'KeyS':
            console.log('Pressed s')
            keys.s.pressed = true
            break
    }
})

window.addEventListener('keyup', (event) => {
    switch(event.code){
        case'KeyA':
            console.log('Released a')
            keys.a.pressed = false
            break
        case'KeyD':
            console.log('Released d')
            keys.d.pressed = false
            break
        case'KeyW':
            console.log('Released w')
            keys.w.pressed = false
            break
        case'KeyS':
            console.log('Released s')
            keys.s.pressed = false
            break
    }
})

const enemies = []

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
    

    cube.update(ground)
    enemies.forEach(enemy =>{
        enemy.update(ground)
        if (
            boxCollision({
                box1: cube,
                box2: enemy,
        })) {
            cancelAnimationFrame(animationID)
        }
    })


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
                x: (Math.random() - 0.5) * 5,
                y: 0,
                z: -4
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



animate()