const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String, 
        required: true
    }, 
    password: {
        type: String, 
        required: true
    }, 
    lastLogin: {
        type: Date,
        default: Date.now()
    }, 
    isVerified: {
        type: Boolean,
        default: false
    },
    code: {
        type: String,
        required: true
    }

}, {timestamps: true});

const AdminModel = mongoose.model('admin', adminSchema);

module.exports = AdminModel;