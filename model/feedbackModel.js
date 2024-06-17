const { number } = require('@hapi/joi');
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    emoji: {
        type: Number,
        required: true
    },
    feedbackCategory: {
        type: String,
        required: true
    }, 
    message: {
        type: String,
        required: true
    }
}, {timestamps: true});

const Feedbacks = mongoose.model('feedbacks', feedbackSchema);

module.exports = Feedbacks;