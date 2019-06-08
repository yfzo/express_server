const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'user_id',
  secret: 'i want to play the basketball arcade game',
}));

app.set('view engine', 'ejs');

const urlDatabase = {};
const users = {};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls', (req, res) => {
  let currentUser = req.session.user_id;

  //show only the urls created by current user, else prompt for login
  if (currentUser) {
    const userURLS = urlsForUser(currentUser);

    let templateVars = {
      urls: userURLS,
      user: users[req.session.user_id]
    };

    res.render('urls_index', templateVars);
  } else {
    res.send('Please login');
  }
});

app.get('/urls/new', (req, res) => {
  //only logged in users may create a new url
  if (req.session.user_id) {
    let templateVars = {
      user: users[req.session.user_id]
    };

    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  let user_id = req.session.user_id;
  //only logged in users can see their urls, and no one elses
  if (user_id) {
    if(user_id === urlDatabase[req.params.shortURL].userID) {
      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        user: users[user_id]
      };

      res.render('urls_show', templateVars);
    } else {
      res.send('You do not have permission to view this page');
    }
  } else {
    res.send('Please login');
  }
});

app.get('/u/:shortURL', (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL].longURL;

  res.redirect(longURL);
});

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  res.render('urls_register', templateVars);
});

app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };

  res.render('urls_login', templateVars);
});

app.post('/urls', (req, res) => {
  const randomString = generateRandomString();

  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  res.redirect(`/urls/${randomString}`);
});

app.post('/urls/:shortURL', (req, res) => {
  const { shortURL, longURL } = req.body;

  //posts can only be edited by their creators
  if (req.session.user_id == urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
  }
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const { shortURL } = req.body;

  //posts can only be deleted by their creators
  if (req.session.user_id == urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  let user = users[findUser(req.body.email)];
  let givenPassword = req.body.password;

  //allow login if user is registered/in database and password is correct
  if (user) {
    if (bcrypt.compareSync(givenPassword, user.password)){
      req.session.user_id = user.user_id;
      res.redirect('/urls');
    } else {
      res.status(403).send('Password incorrect');
    }
  } else {
    res.status(403).send('User not found');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  let { email, password } = req.body;
  let user_id = generateRandomString();

  if (!email || !password) {
    res.status(400).send('Missing email or password');
  } else if (findUser(email)) {
    res.status(400).send('Email already used');
  } else {
    users[user_id] = {
      user_id,
      email,
      password: bcrypt.hashSync(password, 10)
    };

    req.session.user_id = user_id;

    res.redirect('/urls');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return crypto.randomBytes(3).toString('hex');
}

//returns user id of user with given email
function findUser(email) {
  for (user in users) {
    if(users[user].email == email) {
      return user;
    }
  }
}

//returns a subset of urlDatabase(urls belonging to user with user_id id)
function urlsForUser(id) {
  const userURLS = {};

  for (url in urlDatabase) {
    if (urlDatabase[url].userID == id) {
      userURLS[url] = urlDatabase[url];
    }
  }

  return userURLS;
}
