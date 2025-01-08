//timer
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
export {startTimer};