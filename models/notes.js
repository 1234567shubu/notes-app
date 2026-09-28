const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }

},
{ timestamps: true }

)

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;