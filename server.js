require('dotenv').config()
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Note = require('./models/notes')


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



app.get('/api/notes', async (req, res) => {
    try {

        const notes = await Note.find()
        res.status(200).json(notes)
    }
    catch (err) {
        console.error('Error fetching notes:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
})

app.post('/api/notes', async (req, res) => {
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
            updatedAt: new Date().toISOString()
        }

        const note = new Note(newNote)
        const savedNote = await note.save()
        res.status(201).json(savedNote)
    }
    catch (err) {
        console.error('Error creating note:', err);
        res.status(500).json({ message: 'Internal server error' });
    }

})

app.put('/api/notes/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { title, content } = req.body

        if (!title?.trim() || !content?.trim()) {
            {
                return res.status(400).json({ message: 'A title and content are required.' })
            }
        }

        const updatedNote = await Note.findByIdAndUpdate(id, {
            title: title.trim(),
            content: content.trim(),
            updatedAt: new Date().toISOString()
        }, {
            new: true
        })
        if (!updatedNote) return res.status(404).json({ message: "Note not found." });

        res.status(200).json(updatedNote)
    }
    catch (err) {
        console.error("Error updating note:", err);

        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid note ID." });
        }

        return res.status(500).json({ message: "Internal server error" });
    }

})

app.delete('/api/notes/:id', async (req, res) => {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);

        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found.' });
        }

        return res.status(204).send();
    } catch (err) {
        console.error('Error deleting note:', err);
        return res.status(400).json({ message: 'Invalid note ID.' });
    }
});

