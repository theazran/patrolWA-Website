const fetch = require("node-fetch");

async function sendMessage() {
    try {
        const response = await fetch(
            `https://wa.notifku.my.id/api/send-message?receiver=6285255646434&apikey=patrolwa1&mtype=text&text=s`
        );

        if (response.ok) {
            const data = await response.json();
            console.log(data);
        } else {
            console.log("Error:", response.statusText);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

sendMessage();
