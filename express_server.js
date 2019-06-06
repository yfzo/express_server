const express = require("express");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "b2xVn2"},
  "9sm5xK": { longURL: "http://www.google.com", userID: "9sm5xK"}
};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let currentUser = req.cookies["user_id"];

  if (currentUser) {
    const userURLS = urlsForUser(currentUser);
    //console.log(currentUser);

    let templateVars = {
      urls: userURLS,
      user: users[req.cookies["user_id"]]
    };

    res.render("urls_index", templateVars);
  } else {
    res.send("Please login");
  }
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = {
      user: users[req.cookies["user_id"]]
    };

    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let user_id = req.cookies["user_id"]
  if (user_id) {
    if(user_id == urlDatabase[req.params.shortURL].userID) {
      let templateVars = {
        shortURL: req.params.shortURL,
        longURL: urlDatabase[req.params.shortURL].longURL,
        user: users[user_id]
      };

      res.render("urls_show", templateVars);
    } else {
      res.send("You do not have permission to view this page");
    }
  } else {
    res.send("Please login");
  }
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];

  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_register", templateVars);
})

app.get("/login", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_login", templateVars);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();

  urlDatabase[randomString] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  };

  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const { shortURL, longURL } = req.body;

  if (req.cookies["user_id"] == urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
  }
})

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.body;

  if (req.cookies["user_id"] == urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  let user = users[findUser(req.body.email)];

  if (user) {
    if (req.body.password == user.password){
      res.cookie("user_id", user.user_id);
      res.redirect("/urls");
    } else {
      res.status(403).send('Password incorrect');
    }
  } else {
    //res.redirect("/register");
    res.status(403).send('User not found');
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

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
      password
    };

    res.cookie("user_id", user_id);

    res.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return crypto.randomBytes(3).toString('hex');
}

function findUser(email) {
  for (user in users) {
    if(users[user].email == email) {
      return user;
    }
  }
}

function urlsForUser(id) {
  const userURLS = {};

  for (url in urlDatabase) {
    if (urlDatabase[url].userID == id) {
      userURLS[url] = urlDatabase[url];
    }
  }

  return userURLS;
}

//console.log(urlsForUser());
