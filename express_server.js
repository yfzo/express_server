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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies["user_id"]]
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();

  urlDatabase[randomString] = req.body.longURL;

  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const { shortURL, longURL } = req.body;

  urlDatabase[shortURL] = longURL;
})

app.post("/urls/:shortURL/delete", (req, res) => {
  const { shortURL } = req.body;

  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  let user = users[findUser(req.body.email)];

  console.log(req.body);

  if (user) {
    res.cookie("user_id", user.user_id);
    res.redirect("/urls");
  } else {
    res.redirect("/register");
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
  } else if (emailExists(email)) {
    res.status(400).send('Email already used');
  } else {
    users[user_id] = {
      user_id,
      email,
      password
    };

    res.cookie("user_id", user_id);
    console.log(users);
    res.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return crypto.randomBytes(3).toString('hex');
}

function emailExists(email) {
  for (user in users) {
    if (users[user].email == email) {
      return true;
    }
  }

  return false;
}

function findUser(email) {
  for (user in users) {
    if(users[user].email == email) {
      return user;
    }
  }
}

