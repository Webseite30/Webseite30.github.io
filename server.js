const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- MongoDB Verbindung ---
mongoose.connect("mongodb+srv://hinsenan_db_user:<db_password>@cluster0.rwgqssd.mongodb.net/?appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB verbunden"))
  .catch(err => console.error(err));

// --- Schema und Modell ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    registrationTimeMs: Number,
    loginTimeMs: Number,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// --- Registrierung ---
app.post("/register", async (req, res) => {
    try {
        const { username, passwordHash, timeSpentMs } = req.body;
        const user = new User({
            username,
            passwordHash,
            registrationTimeMs: timeSpentMs
        });
        await user.save();
        res.status(200).send("Registrierung erfolgreich");
    } catch (err) {
        console.error(err);
        res.status(400).send("Fehler bei Registrierung (Benutzername eventuell schon vorhanden)");
    }
});

// --- Login ---
app.post("/login", async (req, res) => {
    const { username, passwordHash, timeSpentMs } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(401).send("Benutzer nicht gefunden");
    if (user.passwordHash !== passwordHash) return res.status(401).send("Falsches Passwort");

    // Login-Zeit speichern
    user.loginTimeMs = timeSpentMs;
    await user.save();

    res.status(200).send("Login erfolgreich");
});

// --- Daten anzeigen (nur für dich) ---
app.get("/view", async (req, res) => {
    const users = await User.find({}, "-_id username passwordHash registrationTimeMs loginTimeMs timestamp");
    res.json(users);
});

// --- Server starten ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
