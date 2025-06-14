const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    address: String,
    password: String,
});

module.exports = mongoose.model('User', userSchema);
