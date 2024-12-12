const express = require('express');
const app = express();
const port = 3000;

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cmp5360"
});

//setting up static folder
app.use(express.static(__dirname + "/static"));

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("SELECT * FROM userpass", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});

//this is the route for the main page
//this is the page that loads when you go to the website
app.get('/index', (req, res, next) => {
  res.sendFile(__dirname + '/static/HomePage.html')
});

//this is the route for the 404 page
//this page should only appear when there is not a route for the url
app.get('*', function(req, res){
  //__dirname
  console.log(__dirname);
  res.status(404).sendFile(__dirname + '/static/404.html')
})
  
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

