const EXPRESS = require('express');
const APP = EXPRESS();
const PORT = 3000;
const BODYPARSER = require('body-parser');
const BCRYPT = require('bcrypt');
const NOTIFIER = require('node-notifier');

const PATH = require('path');

const FS = require('fs/promises');
const FS2 = require('fs');

const SECUREFOLDER = PATH.resolve(__dirname, 'secure');
const PATHTOJSON = PATH.join(SECUREFOLDER, '/json/userdata.json');



var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cmp5360"
});

//setting up static folder
APP.use(EXPRESS.static(__dirname + "/static"));
//setting up body parser
APP.use(BODYPARSER.json());
APP.use(BODYPARSER.urlencoded({ extended: true }));

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
  const SALTROUNDS = 10;
  const SCORE = 0;
  BCRYPT.hash(password, SALTROUNDS, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing the password:', err);
      return NOTIFIER.notify({
        title: 'Error',
        message: 'Error occured when trying to hash password. Try again.',
      });
    }
    //this query checks if the username has already been taken
    const USERNAMECHECK = 'SELECT * FROM userinfo WHERE username = ?';
    con.query(USERNAMECHECK, [username], function (err, result) {
      if (err) {
        console.error('Error occured when checking for existing usernames.')
        return NOTIFIER.notify({
          title: 'Error',
          message: 'Error occured when checking for existing usernames. Try again.',
        });
      }
      if (result.length > 0) {
        console.log('Error: Username already exists');
        return NOTIFIER.notify({
          title: 'Error',
          message: 'Username already exists. Try again.',
        });
      }
      else{
      //this statement only runs if the username is unique
        const QUERY = 'INSERT INTO userinfo (Username, Password, Score) VALUES (?, ?, ?)';
        con.query(QUERY, [username, hashedPassword, SCORE], (err, results) => {
          if (err) {
            console.error('Error inserting user:', err);
            return NOTIFIER.notify({
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
  const QUERY = 'SELECT * FROM userinfo WHERE Username = ?';
  con.query(QUERY, [username], (err, results) => {
    if (err) {
      //this occurs when there is an error when trying to fetch usernames
      console.error('Error fetching user:', err);
      return NOTIFIER.notify({
        title: 'Error',
        message: 'Error fetching usernames. Try again.',
      });
    }
    if (results.length > 0) {
      const USER = results[0];
      BCRYPT.compare(password, USER.Password, (err, isMatch) => {
        if (err) {
          //this only occurs when there is an error with bcrypt
          console.error('Error comparing passwords:', err);
          return NOTIFIER.notify({
            title: 'Error',
            message: 'Error with password checker. Try again.',
          });
        };
        if (isMatch) {
          console.log('Login successful:', USER);
          loggingUserIntoJSON(username);
          return res.redirect('/game');
        };
        //this occurs when there is a matching username but incorrect password
        return NOTIFIER.notify({
          title: 'Error',
          message: 'Incorrect password. Try again.',
        });
      });
    } 
    else {
      //this else statement occurs when there is no matching username 
      //with the given username
      NOTIFIER.notify({
        title: 'Error',
        message: 'Username not found. Try again.'
      });
    };
  });
};

//Theses set of functions will be used for session control
//It will log the current user into the JSON file
//If there requires an update to score it shall do update it
//On logout it will remove the user from the JSON file
//
//some functions need to be async as to allow for the code to be temp paused
//whilst it writes to the database

//This function will input the user information into the .json file to be held as a form of session control
//There could be an oversight with how it only uses username rather than
//UserID, however this shouldn't be an issue due to not duplicate usernames
async function loggingUserIntoJSON(username){
  try {
    const QUERY = 'SELECT * FROM userinfo WHERE username = ?';
    con.query(QUERY, [username], async (err, results) => {
      if (err){
        console.error('Error querying database:', err.message);
      };
      //this occurs when there is a matching username
      if (results.length > 0) {
        const USER = results[0];
        console.log('User information logged into JSON file.');
        await FS.writeFile(PATHTOJSON, JSON.stringify(USER, null, 2));
      }
    });
  } catch (err) {
    console.error('Error whilst writing to JSON file.', err.message);
  };
};

//this function will update the score in the json file
async function comparingUserScores(playerScore){
  const DATA = await FS.readFile(PATHTOJSON, 'utf8');
  const USERDATA = JSON.parse(DATA);

  if (playerScore > USERDATA.Score){
    USERDATA.Score = playerScore;
    await FS.writeFile(PATHTOJSON, JSON.stringify(USERDATA, null, 2));
    console.log('Updated score due to highscore.');
    insertingUserdataIntoDatabase();
    return;
  } else {
    console.log('No update needed.');
    return;
  };
};

//this function will update the database table with the user information
//via comparison of userIDs
function insertingUserdataIntoDatabase(){
  FS2.readFile(PATHTOJSON, 'utf8', function (err, data) { 
    if (err) {
      console.error('Error reading JSON file:', err.message);
      return;
    };
    try {
      //this gets the data from the json and sets them to local variables
      const USERDATAFROMJSON = JSON.parse(data);
      const { ID, Score } = USERDATAFROMJSON;

      const QUERY = 'UPDATE userinfo SET score = ? WHERE id = ?';
      con.query(QUERY, [Score, ID], function (err, results) {
        if (err) {
          console.error('Error updating database:', err.message);
          return;
        };
        if (results.affectedRows === 0) {
          console.log('Error updating database: No rows were updated due to no matching ID.');
        }
        else {
          console.log('Row successfully updated.');
        };
      });
    } catch (parsingError){
      console.error('Error when attempting to parse the JSON file:', parsingError.message);
    };
  });
};

//This function will clear the .json file of all user information
async function clearingUserDataInJSON(){
  try{
    await FS.writeFile(PATHTOJSON, JSON.stringify([], null, 2));
    console.log('Cleared userdata.json successfully.');
  } catch{
    console.error('Error whilst clearing JSON.');
  };
};

//This function reads the json file and fowards the data
async function readUserDataJSON(){
  try {
    const DATA = await FS.readFile(PATHTOJSON, 'utf8');
    if (!DATA.trim()) {
        return { message: "User data is blank." };
    };
    const USERDATA = JSON.parse(DATA);
    if (USERDATA.Username && USERDATA.Score !== undefined) {
        return {
            username: USERDATA.Username,
            score: USERDATA.Score
        };
    } else {
        return { message: "User data is invalid." };
    };
  } catch (err) {
      console.error('Error reading userdata.json:', err.message);
      return { message: "Error reading user data." };
  };
};

//this is the route for the main page
//this is the page that loads when you go to the website
APP.get('/index', (req, res, next) => {
  res.sendFile(__dirname + '/static/index.html');
  clearingUserDataInJSON();
});

//this is the route for the login page
APP.get('/loginPage', (req, res, next) => {
  res.sendFile(__dirname + '/static/LoginPage.html');
});

//this is the route for the game page
APP.get('/game', (req, res, next) => {
  res.sendFile(__dirname + '/static/GameFile.html');
});
//this is the route for the 404 page link, not 404 error
APP.get('/404', (req, res, next) => {
  res.sendFile(__dirname + '/static/404.html');
});

//this listens for this post to inact the register user function
APP.post('/register', (req, res) => {
  const { username, password } = req.body;
  registerUser(username, password, res);
});

//this listens for this post to inact the login user function
APP.post('/login', (req, res) => {
  const { username, password } = req.body;
  loginUser(username, password, res);
});

APP.post('/compareUserScore', (req, res) => {
  const { PLAYERSCORE } = req.body;
  comparingUserScores(PLAYERSCORE);
});

//this listens for this post to read the json file and send the data
APP.get('/readJSON', async (req, res) => {
  const USERDATA = await readUserDataJSON();
  res.json(USERDATA);
});

//this is the route for the 404 page
//this page should only appear when there is not a route for the url
APP.use(function(req, res){
  //__dirname
  console.log(__dirname);
  res.status(404).sendFile(__dirname + '/static/404.html');
})
  
APP.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

