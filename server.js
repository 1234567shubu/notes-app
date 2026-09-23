const express = require('express');
const path = require('path');
const fs = require('fs')
const { randomUUID } = require('crypto')


const dataFolder = path.join(__dirname, 'data')
const datafile = path.join(dataFolder, 'notes.json')
const app = express()

// befor the app runs check whether folder and file exist. If not create it.
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder)
}

if (!fs.existsSync(datafile)) {
    fs.writeFileSync(datafile, '[]')
}

function readNotes() {
    return JSON.parse(fs.readFileSync(datafile, 'utf-8'))
}

function saveNotes(content) {
    fs.writeFileSync(datafile, JSON.stringify(content, null, 2))
}

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api/notes', (req, res) => {
    res.status(200).json(readNotes())
})

app.post('/api/notes', (req, res) => {
    const { title, content } = req.body
    if (!title?.trim() || !content?.trim()) {
        {
            return res.status(400).json({ message: 'A title and content are required.' })
        }
    }

    const notes = readNotes()
    const newNote = {
        id: randomUUID(),
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date().toISOString()
    }
    notes.unshift(newNote)
    saveNotes(notes)
    res.status(201).json(newNote)
})

app.put('/api/notes/:id', (req, res) => {

    const { id } = req.params
    const { title, content } = req.body

    if (!title?.trim() || !content?.trim()) {
        {
            return res.status(400).json({ message: 'A title and content are required.' })
        }
    }

    const notes = readNotes()
    const note = notes.find(note => note.id === id)

    if (!note) return response.status(404).json({ message: "Note not found." });

    note.title = title.trim()
    note.content = content.trim()
    note.updatedAt = new Date().toISOString()
    saveNotes(notes)
    res.status(201).json(note)
})

app.delete('/api/notes/:id', (req, res) => {
  const notes = readNotes();
  const index = notes.findIndex(note => note.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: 'Note not found.' });
  }

  notes.splice(index, 1);
  saveNotes(notes);
  return res.status(204).send();
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})