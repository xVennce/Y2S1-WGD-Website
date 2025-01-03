const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const notifier = require('node-notifier');
const fs = require('fs/promises');
const path = require('path');

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cmp5360"
});

//setting up static folder
app.use(express.static(__dirname + "/static"));
//setting up secure folder

//setting up body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("SELECT * FROM userinfo", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});

//this function should add the user to the database
//on error, it sends a desktop notif
function registerUser(username, password, res) {
  const saltRounds = 10;
  const score = 0;
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing the password:', err);
      return notifier.notify({
        title: 'Error',
        message: 'Error occured when trying to hash password. Try again.',
      });
    }
    //this query checks if the username has already been taken
    const usernameCheck = 'SELECT * FROM userinfo WHERE username = ?';
    con.query(usernameCheck, [username], function (err, result) {
      if (err) {
        userCheck = false;
        console.error('Error occured when checking for existing usernames.')
        return notifier.notify({
          title: 'Error',
          message: 'Error occured when checking for existing usernames. Try again.',
        });
      }
      if (result.length > 0) {
        userCheck = false;
        console.log('Error: Username already exists');
        return notifier.notify({
          title: 'Error',
          message: 'Username already exists. Try again.',
        });
      }
      else{
      //this statement only runs if the username is unique
        const query = 'INSERT INTO userinfo (Username, Password, Score) VALUES (?, ?, ?)';
        con.query(query, [username, hashedPassword, score], (err, results) => {
          if (err) {
            console.error('Error inserting user:', err);
            return notifier.notify({
              title: 'Error',
              message: 'Error occured when trying to insert user into table. Try again.',
            });
          }
          console.log('User registered successfully:', results);
          res.redirect('/loginPage?msg=Registration successful!');
        });
      }
    });
  });
};

//this function should check for the login details
//on error, it sends a desktop notif
function loginUser(username, password, res) {
  const query = 'SELECT * FROM userinfo WHERE Username = ?';
  con.query(query, [username], (err, results) => {
    if (err) {
      //this occurs when there is an error when trying to fetch usernames
      console.error('Error fetching user:', err);
      return notifier.notify({
        title: 'Error',
        message: 'Error fetching usernames. Try again.',
      });
    }
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.Password, (err, isMatch) => {
        if (err) {
          //this only occurs when there is an error with bcrypt
          console.error('Error comparing passwords:', err);
          return notifier.notify({
            title: 'Error',
            message: 'Error with password checker. Try again.',
          });
        };
        if (isMatch) {
          console.log('Login successful:', user);
          return res.redirect('/game');
        };
        //this occurs when there is a matching username but incorrect password
        return notifier.notify({
          title: 'Error',
          message: 'Incorrect password. Try again.',
        });
      });
    } 
    else {
      //this else statement occurs when there is no matching username 
      //with the given username
      notifier.notify({
        title: 'Error',
        message: 'Username not found. Try again.'
      });
    };
  });
};

//these functions need to be async as to allow for the code to be temp paused
//whilst it writes to the database

//This function will input the user information into the .json file to be held as a form of session control
async function loggingUserIntoJSON(username){
  const [rows] = await con.execute('SELECT * FROM userinfo WHERE username = ?', [username]);
  if (rows.length === 0) {
    console.log("No user found.");
  };
  await fs.writeFile(out)
};

async function updatingUserInJSON(score){

};

//This function will clear the .json file of all user information
async function clearingUserDataInJSON(){
  try{
    const secureFolder = path.resolve(__dirname, 'secure');
    const filePath = path.join(secureFolder, '/json/userdata.json');
    //this try block is used to check if folder exists
    try{
      await fs.access(secureFolder);
    } catch (err) {
      console.error(`Error accessing secure folder (${secureFolder}): ${err.message}`);
      return;
    };
    await fs.writeFile(filePath, '');
    console.log('Cleared userdata.json successfully.');
  } catch{
    console.error('Error whilst clearing JSON.');
  };
};

//this is the route for the main page
//this is the page that loads when you go to the website
app.get('/index', (req, res, next) => {
  res.sendFile(__dirname + '/static/HomePage.html')
  clearingUserDataInJSON();
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
  const { username, password } = req.body;
  registerUser(username, password, res);
});

//this listens for this post to inact the login user function
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  loginUser(username, password, res);
});

//this is the route for the 404 page
//this page should only appear when there is not a route for the url
app.use(function(req, res){
  //__dirname
  console.log(__dirname);
  res.status(404).sendFile(__dirname + '/static/404.html')
})
  
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

