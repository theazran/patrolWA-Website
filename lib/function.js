const request = require("request");

function sendMessage(to, caption) {
  const url = `https://notifku.my.id/send?number=555&to=${to}&type=chat&message=${caption}`;

  request(url, (error, response, body) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Response:", body);
    }
  });
}




module.exports = { sendMessage };
