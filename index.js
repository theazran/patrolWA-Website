const querystring = require("node:querystring");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const { sendMessage } = require("./lib/function");
const { exec } = require("child_process");
const session = require("express-session");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = 3000;
const fs = require("fs");

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }),
);

const database = [
  {
    admin: "admin",
    password: "Jempol123",
    nama: "M Asran",
    wa: "6285255646434",
    isAdmin: true,
  },
  {
    username: "aldi",
    password: "aldi123",
    nama: "Renaldi",
    wa: "6281241559321",
    isAdmin: false,
  },
  {
    username: "bahri",
    password: "bahri123",
    nama: "Bahri",
    wa: "6281354958973",
    isAdmin: false,
  },
];

fs.readFile("./package.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading package.json:", err);
    return;
  }
  const packageData = JSON.parse(data);
  const appName = packageData.name;
  const appVersion = packageData.version;
  const autor = packageData.author;

  app.locals.appName = appName;
  app.locals.appVersion = appVersion;
  app.locals.autor = autor;
});

const upload = multer({ storage: multer.memoryStorage() });

const request = require("request");
async function sendText(id, message) {
  
  var options = {
    'method': 'POST',
  'url': 'https://wa.panelpn.my.id/message/text?key=andalan',
  'headers': {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN',
    'Cookie': 'connect.sid=s%3AczNYsxJ8ssvtXkBvHrNoX1qTouJowdAX.jaL0VjfSkcVQhhJOGVBA7UJ7BPcbFQDKl979uTR9Xwc'
  },
  body: JSON.stringify({
    "id": "6285255646434-1613359737@g.us",
    "typeId": "group",
    "message": "message",
    "options": {
      "delay": 0,
      "replyFrom": ""
    },
    "groupOptions": {
      "markUser": "ghostMention"
    }
  })
  
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
}
sendText()


app.set("view engine", "ejs");
app.set("views", __dirname + "/public");

app.use(express.static(__dirname + "/public"));

app.get("/login", (req, res) => {
  //return res.redirect("https://patrolwa.pn-bulukumba.go.id")
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("login.ejs");
  }
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const userAgent = req.headers["user-agent"];

  const user = database.find(
    (user) => user.username === username || user.admin === username,
  );

  if (user && user.password === password) {
    req.session.loggedIn = true;
    req.session.nama = user.nama;
    res.redirect("/?status=success");
    const ip = req.ip;
    sendMessage(
      user.wa + "@s.whatsapp.net",
      `Akun Anda login dengan IP\n${ip}\n\nPerangkat: ${userAgent}\n\nJika bukan Anda, harap hubungi Admin untuk mengganti password.`,
    );
  } else {
    res.redirect("/login?status=error");
  }
});

app.get("/", (req, res) => {
  //return res.redirect("https://patrolwa.pn-bulukumba.go.id")
  const loggedIn = req.session.loggedIn || false;
  if (req.session.loggedIn) {
    res.render("index.ejs", { nama: req.session.nama, loggedIn: true });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/login");
    }
  });
});

app.get("/check-session-status", (req, res) => {
  const loggedIn = req.session.loggedIn || false;
  res.json({ loggedIn });
});

app.get("/cek", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cek.html"));
});

app.get("/package", (req, res) => {
  fs.readFile("package.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error reading package.json" });
    }
    const packageData = JSON.parse(data);
    res.json(packageData);
  });
});

async function uploadByBuffer(imageBuffer, mimeType) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("userhash", "ba439588348b369cc69ff2123");
  form.append("fileToUpload", imageBuffer, {
    filename: "upload.jpg",
    contentType: mimeType,
  });

  const headers = {
    ...form.getHeaders(),
    "Cookie": "PHPSESSID=konngt6240ka860311ord3c76d",
    "Dnt": "1",
    "Origin": "https://catbox.moe",
    "Referer": "https://catbox.moe/",
    "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  };

  try {
    const response = await axios.post("https://catbox.moe/user/api.php", form, { headers });
    return response.data;
  } catch (error) {
    console.error("Error uploading to Catbox:", error);
    throw error;
  }
}

app.post("/upload", upload.single("image"), async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try {
    const imageBuffer = req.file.buffer;
    const response = await uploadByBuffer(imageBuffer, req.file.mimetype);
    const imageUrl = response;
    res.send(imageUrl);
    // console.log("File uploaded successfully:", response);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send("Failed to upload image");
  }
});

app.get("/gitlog", (req, res) => {
  exec('git log --pretty=format:"%s|%ad"', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    const commits = stdout.split("\n").map((commit) => {
      const [comment, date] = commit.split("|");
      return { comment, date };
    });

    res.json({ commits });
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`${port}`);
});
module.exports = app;
