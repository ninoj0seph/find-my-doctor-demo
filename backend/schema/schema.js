const mongoose = require('mongoose');

module.exports = {

    doctors: mongoose.Schema({
        name: { type: String, required: true, },
        address: { type: String, required: true, },
        location: { type: String, required: true, },
        schedule: { type: [{ type: String, lowercase: true }], required: true, },
        practice: { type: Array, required: true, },
    }, ),

    practiceLookup: mongoose.Schema({
        internalName: {
            type: String,
            required: true,
            unique: true,
        },
        tags: {
            type: [{ type: String, lowercase: true }],
            required: true,
            unique: true,
        },
    }, ),
    S
}