const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Announcement title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Announcement description is required']
    },
    targetAudience: {
        type: String,
        enum: ['All Students', 'Eligible Students', 'Selected Batch'],
        default: 'All Students'
    },
    targetBatch: {
        type: String,
        trim: true
    },
    publishDate: {
        type: String,
        default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    },
    expiryDate: {
        type: String,
        required: [true, 'Expiry date is required']
    },
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Archived'],
        default: 'Published'
    },
    priority: {
        type: String,
        enum: ['Normal', 'High', 'Urgent'],
        default: 'Normal'
    },
    referenceLink: {
        type: String,
        trim: true
    },
    author: {
        type: String,
        default: 'Prof. Rajesh Sharma (Coordinator)'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
