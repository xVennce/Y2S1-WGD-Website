document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let deletePressed = false;
let insertPressed = false;

const rightBtn = document.getElementById('rightBtn')
const leftBtn = document.getElementById('leftBtn')
const upBtn = document.getElementById('upBtn')
const downBtn = document.getElementById('downBtn')

function keyDownHandler(event){
	if (event.keyCode === 68){
		rightPressed = true;
	}
	else if (event.keyCode === 65){
		leftPressed = true;
	}
	else if (event.keyCode === 83){
		downPressed = true;
	}
	else if (event.keyCode === 87){
		upPressed = true;
	}
    else if (event.keyCode === 46){
        deletePressed = true;
    }
    else if (event.keyCode === 45){
        insertPressed = true;
    }
}
function keyUpHandler(event){
	if (event.keyCode === 68){
		rightPressed = false;
	}
	if (event.keyCode === 65){
		leftPressed = false;
	}
	if (event.keyCode === 83){
		downPressed = false;
	}
	if (event.keyCode === 87){
		upPressed = false;
	}
    if (event.keyCode === 46){
        deletePressed = false;
    }
    if (event.keyCode === 45){
        insertPressed = false;
    }
}

function addInputListeners(button, actionStart, actionEnd) {
    button.addEventListener("mousedown", (e) => {
        e.preventDefault();
        actionStart();
    });
    button.addEventListener("mouseup", (e) => {
        e.preventDefault();
        actionEnd();
    });
    button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        actionStart();
    });
    button.addEventListener("touchend", (e) => {
        e.preventDefault();
        actionEnd();
    });
}


addInputListeners(upBtn, () => (upPressed = true), () => (upPressed = false));
addInputListeners(downBtn, () => (downPressed = true), () => (downPressed = false));
addInputListeners(leftBtn, () => (leftPressed = true), () => (leftPressed = false));
addInputListeners(rightBtn, () => (rightPressed = true), () => (rightPressed = false));

export { upPressed, downPressed, leftPressed, rightPressed}