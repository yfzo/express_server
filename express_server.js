var express = require("express");
var crypto = require("crypto");
var cookieParser = require("cookie-parser");
var app = express();
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];

  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();

  urlDatabase[randomString] = req.body.longURL;

  res.redirect(`/urls/${randomString}`);         // Respond with 'Ok' (we will replace this)
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
  res.cookie("username", req.body.username);

  res.redirect("/urls");
})

app.get('/logout', (req, res) => {
  res.cookie('username', null);
  res.redirect('/');
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return crypto.randomBytes(3).toString('hex');
}

