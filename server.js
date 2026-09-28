require('dotenv').config()
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Note = require('./models/notes');
const User = require('./models/users.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express()
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected");
        console.log("Connected database name:", mongoose.connection.name);

        app.listen(3000, () => {
            console.log("Server is running on http://localhost:3000");
        });
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1);
    }
};

startServer();


app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const authenticateUser = (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    let isTokenValid;
    try {
        isTokenValid = jwt.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET)
        if (!isTokenValid) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }
    catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userId = isTokenValid.userId;
    next();
}

app.post('/api/auth/register', async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        if (!name || !email || typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ message: 'Name, a valid email, and a password of at least 8 characters are required.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: passwordHash });
        return res.status(201).json({ message: 'Account created. You can now log in.', user: { name: user.name, email: user.email } });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }
        next(err);
    }
});

app.post('/api/auth/login', async (req, res, next) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;
        const user = await User.findOne({ email });

        if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Email or password is incorrect.' });
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '5min' });
        return res.status(200).json({ message: 'Login successful.', accessToken, user: { name: user.name, email: user.email } });
    } catch (err) {
        next(err);
    }
});

app.get('/api/notes', authenticateUser, async (req, res, next) => {
    try {
        const userId = req.userId
        const notes = await Note.find({ userId }).sort('-updatedAt')
        res.status(200).json(notes)
    }
    catch (err) {
        next(err);
    }
})

app.post('/api/notes', authenticateUser, async (req, res, next) => {
    try {
        const { title, content } = req.body
        if (!title?.trim() || !content?.trim()) {
            {
                return res.status(400).json({ message: 'A title and content are required.' })
            }
        }

        const newNote = {
            title: title.trim(),
            content: content.trim(),
            userId: req.userId
        }

        const note = new Note(newNote)
        const savedNote = await note.save()
        res.status(201).json(savedNote)
    }
    catch (err) {
        next(err);
    }

})

app.put('/api/notes/:id', authenticateUser, async (req, res, next) => {
    try {
        const { id } = req.params
        const { title, content } = req.body

        if (!title?.trim() || !content?.trim()) {
            {
                return res.status(400).json({ message: 'A title and content are required.' })
            }
        }

        const updatedNote = await Note.findOneAndUpdate(
            { _id: id, userId: req.userId },
            {
                title: title.trim(),
                content: content.trim(),
            },
            { new: true, runValidators: true }
        );
        if (!updatedNote) return res.status(404).json({ message: "Note not found." });

        res.status(200).json(updatedNote)
    }
    catch (err) {
        next(err);
    }

})

app.delete('/api/notes/:id', authenticateUser, async (req, res, next) => {
    try {
        const deletedNote = await Note.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });
        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        return res.status(204).send();
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error(err);

    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid note ID." });
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Internal server error." });
});

