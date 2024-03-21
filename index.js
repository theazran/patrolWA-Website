const express = require("express");
const multer = require("multer");
const { uploadByBuffer } = require("telegraph-uploader");
const path = require("path");

const app = express();
const port = 3000;
const fs = require("fs");

const bacaDataJson = () => {
  const data = fs.readFileSync("./db/petugas.json");
  return JSON.parse(data);
};

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("image"), async (req, res) => {
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

app.get("/api/data", (req, res) => {
  const data = bacaDataJson();
  res.json(data);
});

app.listen(port, () => {
  console.log(`${port}`);
});
