
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
        case 'Space':
            keys.space.pressed = false
            break
    }
})

export {keys}