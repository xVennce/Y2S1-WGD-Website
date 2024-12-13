//This gets the message from the URL
const params = new URLSearchParams(window.location.search);
const msg = params.get('msg');

if (msg) {
document.querySelectorAll('#msg').forEach(span => {
    span.textContent = msg;
});

//This clears the text after 2.5s
setTimeout(() => {
    document.querySelectorAll('#msg').forEach(span => {
    span.textContent = '';
    });

    //This clears the query parameter from the URL
    const newUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    }, 2500);
}