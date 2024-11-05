const request = require("request");

function sendMessage(to, caption) {
  const url = `https://notifku.my.id/send?number=5&to=${to}&type=chat&message=${caption}`;

  request(url, (error, response, body) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Response:", body);
    }
  });
}
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



module.exports = { sendMessage };
