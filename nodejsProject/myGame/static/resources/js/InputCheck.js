document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;
let deletePressed = false;
let insertPressed = false;
let scorePressed = false;

const rightBtn = document.getElementById('rightBtn')
const leftBtn = document.getElementById('leftBtn')
const upBtn = document.getElementById('upBtn')
const downBtn = document.getElementById('downBtn')
const scoreBtn = document.getElementById('scoreBtn')

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

upBtn.addEventListener("mousedown", (e) => {
	e.preventDefault();
	upPressed = true;
})
upBtn.addEventListener("mouseup", (e) => {
	e.preventDefault();
	upPressed = false;
})
downBtn.addEventListener("mousedown", (e) => {
	e.preventDefault();
	downPressed = true;
})
downBtn.addEventListener("mouseup", (e) => {
	e.preventDefault();
	downPressed = false;
})
leftBtn.addEventListener("mousedown", (e) => {
	e.preventDefault();
	leftPressed = true;
})
leftBtn.addEventListener("mouseup", (e) => {
	e.preventDefault();
	leftPressed = false;
})

rightBtn.addEventListener("mousedown", (e) => {
	e.preventDefault();
	rightPressed = true;
});
rightBtn.addEventListener("mouseup", (e) => {
	e.preventDefault();
	rightPressed = false;
});

scoreBtn.addEventListener("mousedown", (e) => {
	e.preventDefault();
	scorePressed = true;
});
scoreBtn.addEventListener("mouseup", (e) => {
	e.preventDefault();
	scorePressed = false;
});


export { upPressed, downPressed, leftPressed, rightPressed, deletePressed, insertPressed, scorePressed}