const express = require('express');
const app = express();
const path = require('path');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const crypto = require('crypto');

// Generate a secure random string for the session secret
function generateRandomString(length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, length); // return required number of characters
}

const sessionSecret = generateRandomString(32);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: sessionSecret, // Use the generated random string for the session secret
    resave: false,
    saveUninitialized: true
}));

const uri = "mongodb://localhost:27017/Resturant";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectDB();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

app.use(express.static(path.join(__dirname, 'public')));

// Redirect root URL to login page
app.get('', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/username', async (req, res) => {
    try {
        const db = client.db("Resturant");
        const collection = db.collection("collection");

        const email = req.session.email;

        const user = await collection.findOne({ email });

        if (user) {
            res.json({ username: user.username });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        console.error("Error fetching username:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/login', async (req, res) => {
    const db = client.db("Resturant");
    const collection = db.collection("collection");

    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await collection.findOne({ email });

        if (user && user.password === password) {
            // Set session variables to indicate the user is logged in
            req.session.isLoggedIn = true;
            req.session.email = email;
            req.session.username = user.username;

            // Redirect to index.html and pass username as query parameter
            res.redirect(`/index.html?username=${user.username}`);
        } else {
            // Send appropriate error message for invalid credentials
            res.status(401).send("Invalid username or password");
        }
    } catch (error) {
        console.error("Error during login:", error);
        // Send internal server error status code and message
        res.status(500).send("Internal Server Error");
    }
});


app.post('/signup', async (req, res) => {
    const db = client.db("Resturant");
    const collection = db.collection("collection");

    const username = req.body.username;
    const password = req.body.password;
    const email = req.body.email;

    const existingUser = await collection.findOne({ email: email });
    if (existingUser) {
        return res.status(400).send("Email already exists");
    }

    if (password.length < 4) {
        return res.status(400).send("Password must be at least 4 characters long");
    }

    try {
        await collection.insertOne({ username, password, email });
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    } catch (error) {
        console.error("Error during sign up:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/booking', async (req, res) => {
    const db = client.db("Resturant");
    const collection = db.collection("collection2");

    const name = req.body.name;
    const phone = req.body.phone;
    const email = req.body.email;
    const time = req.body.time;
    const date = req.body.date;

    try {
        await collection.insertOne({ name, phone, email, time, date });
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
        
    } catch (error) {
        console.error("Error saving booking:", error);
        res.status(500).send("Internal Server Error");
    }
});
