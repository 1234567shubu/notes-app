
const mongoose = require("mongoose");

const TokenStorageSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },
    expiration:{
        type: Date,
        required: true,
    }
});

const TokenStorage = mongoose.model("TokenStorage", TokenStorageSchema);
module.exports = TokenStorage;