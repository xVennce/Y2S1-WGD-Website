const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

const bcrypt = require('bcrypt');

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cmp5360"
});

//setting up static folder
app.use(express.static(__dirname + "/static"));
//setting up body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("SELECT * FROM userpass", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});

//this function should add the user to the database
function registerUser(email, username, password, res) {
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing the password:', err);
      return res.status(404).send('Registration failed due to hashing.');
    }
    const query = 'INSERT INTO userpass (Email, Username, Password) VALUES (?, ?, ?)';
    con.query(query, [email, username, hashedPassword], (err, results) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.status(404).send('Registration failed due to error during insertation.');
      }
      console.log('User registered successfully:', results);
      res.redirect('/loginPage?msg=Registration successful!'); // Set message in query
    });
  });
}

//this function should check for the login details
function loginUser(emailOrUsername, password, res) {
  const query = 'SELECT * FROM userpass WHERE Email = ? OR Username = ?';
  con.query(query, [emailOrUsername, emailOrUsername], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(404).send('Login failed due to fetching error.');
    }
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.Password, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords:', err);
          return res.status(404).send('Login failed due to wrong password.');
        }
        if (isMatch) {
          console.log('Login successful:', user);
          return res.redirect('/game');
        }
        res.status(404).send('Invalid email/username or password.');
      });
    } else {
      res.status(404).send('Invalid email/username or password.');
    }
  });
}

//this is the route for the main page
//this is the page that loads when you go to the website
app.get('/index', (req, res, next) => {
  res.sendFile(__dirname + '/static/HomePage.html')
});

//this is the route for the login page
app.get('/loginPage', (req, res, next) => {
  res.sendFile(__dirname + '/static/LoginPage.html')
});

//this is the route for the game page
app.get('/game', (req, res, next) => {
  res.sendFile(__dirname + '/static/GameFile.html')
});
//this is the route for the 404 page link, not 404 error
app.get('/404', (req, res, next) => {
  res.sendFile(__dirname + '/static/404.html')
});

//this listens for this post to inact the register user function
app.post('/register', (req, res) => {
  const { email, username, password } = req.body;
  registerUser(email, username, password, res);
});

//this listens for this post to inact the login user function
app.post('/login', (req, res) => {
  const { emailOrUsername, password } = req.body;
  loginUser(emailOrUsername, password, res);
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

