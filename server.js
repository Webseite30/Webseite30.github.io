const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/register", (req, res) => {
    const data = req.body;
    const entry = {
        username: data.username,
        passwordHash: data.passwordHash,
        timeSpentMs: data.timeSpentMs,
        timestamp: new Date().toISOString()
    };
    fs.appendFileSync("registrations.json", JSON.stringify(entry) + "\n");
    res.status(200).send("OK");
});

app.listen(3000, () => console.log("Server läuft"));
