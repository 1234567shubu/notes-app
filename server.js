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



app.get('/api/notes', async (req, res, next) => {
    try {

        const notes = await Note.find().sort('-updatedAt')
        res.status(200).json(notes)
    }
    catch (err) {
        next(err);
    }
})

app.post('/api/notes', async (req, res, next) => {
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
        }

        const note = new Note(newNote)
        const savedNote = await note.save()
        res.status(201).json(savedNote)
    }
    catch (err) {
        next(err);
    }

})

app.put('/api/notes/:id', async (req, res, next) => {
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
        }, {
            new: true
        })
        if (!updatedNote) return res.status(404).json({ message: "Note not found." });

        res.status(200).json(updatedNote)
    }
    catch (err) {
        next(err);
    }

})

app.delete('/api/notes/:id', async (req, res, next) => {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);

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

