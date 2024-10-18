/*
Function name: clickFunction
Last update: 18/10/24
*/
const clickFunction=()=>{
    document.getElementById("demo").innerHTML = "This is new content";
}

document.getElementById("demo").addEventListener("click", clickFunction);