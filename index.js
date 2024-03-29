const querystring = require("node:querystring");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const { uploadByBuffer } = require("telegraph-uploader");
const path = require("path");
const kirimPesan = require("./lib/function");
const axios = require("axios");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());
const port = 3000;
const fs = require("fs");
const pdf = require("html-pdf");
const idApp = `https://script.google.com/macros/s/AKfycbzLAqrB3EDuOomueHyZFPaPQy2OfVnvbsyBABPCMYe9Hf4Loqsh-LYlaXOMApQEs8eI4Q/exec?`;

const data = [
  {
    namaPetugas: "Renaldi",
    nomorWhatsApp: "1234567890",
  },
  {
    namaPetugas: "Bahri",
    nomorWhatsApp: "0987654321",
  },
];

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, "public")));
app.get('/cek', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cek.html'));
});
async function fetchData() {
  try {
    const response = await axios.get(
      "https://opensheet.elk.sh/1kwsvHO00ZOZj3kJ-MkFeJSNzy0k0EfKHpU8X8RlOv8M/Sheet1"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    throw error;
  }
}

async function filterDataByMonth(data, targetMonth) {
  const filteredData = data.filter((entry) => {
    const entryMonth = entry.timestamp.split("/")[1];
    return entryMonth === targetMonth;
  });

  return filteredData;
}

async function generatePDF(data, targetMonth) {
  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  global.monthTitle = monthNames[parseInt(targetMonth, 10) - 1];

  const tableRows = data.map(
    (entry) => `
        <tr>
        <td>${entry.timestamp}</td>
        <td>${entry.Petugas}</td>
        <td>${entry.Keterangan}</td>
        <td>${entry.Foto}</td>
        </tr>
    `
  );

  const htmlTemplate = `
        <html>
        <head>
            <title>LAPORAN SATPAN</title>
            <style>
            table {
                border-collapse: collapse;
                width: 100%;
            }
            th, td {
                border: 1px solid black;
                padding: 8px;
                text-align: left;
            }
            </style>
        </head>
        <body>
            <h1>Laporan Bulan ${monthTitle}</h1>
            <table>
            <thead>
                <tr>
                <th>Tanggal dan Waktu</th>
                <th>Petugas</th>
                <th>Keterangan</th>
                <th>Link Foto</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows.join("")}
            </tbody>
            </table>
        </body>
        </html>
    `;

  const pdfOptions = { format: "Letter" };
  pdf
    .create(htmlTemplate, pdfOptions)
    .toFile(`laporan_bulan_${monthTitle}.pdf`, (err, res) => {
      if (err) return console.error(err);
      console.log("PDF file generated successfully.");
    });
}

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

app.get("/status", (req, res) => {
  kirimPesan("6285255646434", "text", `runtime`, "");
  res.send("Server is running");
});

app.get("/list-directory", (req, res) => {
  const directoryPath = "./";
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Gagal membaca direktori." });
    }
    res.status(200).json({ files });
  });
});

app.post("/webhook", async (req, res) => {
  const payload = req.body;
  console.log("Payload yang diterima:", payload);
  const sesi = payload.session;
  const from = payload.from;
  const fromMe = payload.sender;
  const body = payload.body;
  const isGroup = payload.isGroup;
  global.prefix = /^[./~!#%^&+=\-,;:()]/.test(body)
    ? body.match(/^[./~!#%^&+=\-,;:()]/gi)
    : "#";
  const arg = body.substring(body.indexOf(" ") + 1);
  const args = body.trim().split(/ +/).slice(1);
  const isCmd = body.startsWith(global.prefix);
  const cmd = isCmd
    ? body.slice(1).trim().split(/ +/).shift().toLocaleLowerCase()
    : null;

  if (sesi === "patrolwa") {
    if (isGroup) return;
    if (fromMe === "62895411310182@s.whatsapp.net") return;
    if (cmd === "ping") {
      kirimPesan(from, "text", `pong!`, "");
    }

    if (cmd === "lapor") {
      const senderWA = from.split("@")[0];
      const allowedUsers = [
        { Nama: "Security", WA: "6285255646434" },
        { Nama: "Renaldi", WA: "6281241559321" },
        { Nama: "Security", WA: "6285255646333" },
      ];
      const allowedUser = allowedUsers.find((user) => user.WA === senderWA);
      console.log(arg);
      const data = {
        Petugas: allowedUser.Nama,
        Keterangan: arg,
        Foto: "-",
      };
      const res = await fetch(idApp + querystring.stringify(data), {
        method: "POST",
      });
      const respon = await res.json();
      if (respon.result === "success") {
        // kirimPesan(from, "text", `Data berhasil disimpan!`, "");
        const caption = `⚠️ LAPORAN BARU ⚠️\n\nLaporan: \n\`${arg}\``;
        await kirimPesan("120363256542098102@g.us", "text", caption, "");
      }
    }
    if (cmd === "laporan") {
      if (args.length < 1)
        kirimPesan(
          from,
          "text",
          `Untuk melihat laporan, ketik ${prefix}laporan 03`,
          ""
        );
      const targetMonth = arg;
      kirimPesan(from, "text", "Under maintenance!", "");
      try {
        const rawData = await fetchData();
        const filteredData = await filterDataByMonth(rawData, targetMonth);
        const pdfPath = await generatePDF(filteredData, targetMonth);
        const pdfFileName = `laporan_bulan_${monthTitle}.pdf`;
        // setTimeout(async () => {
        //   console.log("PDF file sent to WhatsApp successfully.");
        //   kirimPesan(
        //     from,
        //     "document",
        //     `Laporan Bulan ${monthTitle}`,
        //     `https://patrolwa.vercel.app/download/${pdfFileName}`
        //   );
        // }, 5000);
      } catch (error) {
        console.error("An error occurred:", error.message);
        kirimPesan(
          from,
          "text",
          "Terjadi kesalahan saat memproses laporan. Harap coba lagi!",
          ""
        );
      }
    }
  }
});

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
  // const data = bacaDataJson();
  res.json(data);
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

app.get("/pdf", (req, res) => {
  const bulan = req.query.bulan;
  const targetMonth = bulan; // Contoh: untuk bulan Januari
  fetchData()
    .then((data) => {
      return filterDataByMonth(data, targetMonth);
    })
    .then((filteredData) => {
      generatePDF(filteredData, targetMonth);
      res.send(`Laporan PDF untuk bulan ${monthTitle} berhasil dihasilkan.`);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

app.listen(port, () => {
  console.log(`${port}`);
});
module.exports = app;
