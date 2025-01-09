import * as THREE from 'three';
function createCube(scale, position, mass, color, quaternion){
    let newCube = new THREE.Mesh(
        new THREE.BoxGeometry(scale.x, scale.y, scale.z),
        new THREE.MeshPhongMaterial({color: color})
    );
    newCube.position.set(position.x, position.y, position.z);
    scene.add(newCube);

    let transform = new Ammo.btTransform();
    transform.setIdentity();

    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.quaternion.z, quaternion.w));
    let defaultMotionState = new Ammo.btMotionState(transform);

    let structColShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
    structColShape.setMargine(0.05);

    let localInertia = new Ammo.btVector3( 0, 0, 0);
    structColShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let rBody = new Ammo.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(rBody);

    newCube.userData.physicsBody= rBody;
    rigidBody_List.push(newCube);
};

function createGround(){
    createCube(
        new THREE.Vector3(100, 1, 100), //scale
        new THREE.Vector3(0, -5, 0),    //position
        0,                              //mass
        0x00ff00,                       //colour
        {x:0, y:0, z:0, w:1}            //quaternion
    );
}



export {createCube, createGround}