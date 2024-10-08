const querystring = require("node:querystring");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const { uploadByBuffer } = require("telegraph-uploader");
const path = require("path");
const { sendMessage } = require("./lib/function");
const { exec } = require("child_process");
const session = require("express-session");

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

app.post("/upload", upload.single("image"), async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins. Change "*" to your specific domain if needed.
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try {
    const imageBuffer = req.file.buffer;
    const response = await uploadByBuffer(imageBuffer, "image/jpeg");
    const imageUrl = response.link;
    res.send(imageUrl);
    console.log(response);
  } catch (error) {
    console.error("Gagal mengunggah gambar:", error);
    res.status(500).send("Terjadi kesalahan saat mengunggah gambar");
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
