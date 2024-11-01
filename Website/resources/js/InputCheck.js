document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let deletePressed = false;
let insertPressed = false;

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
    if (event.keyCode === 46){
        insertPressed = false;
    }
}
export { upPressed, downPressed, leftPressed, rightPressed, deletePressed, insertPressed }