const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    description: { type: String, default: '' },

    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    team: { type: [String], default: [] }, // Firebase UIDs

    // GitHub link
    githubRepo:      { type: String, default: null },
    githubRepoName:  { type: String, default: null },
    githubRepoOwner: { type: String, default: null },
    githubRepoIds:   { type: [String], default: [] },

    // AI-generated architecture
    architecture: { type: mongoose.Schema.Types.Mixed, default: null },

    // Google Meet
    meetLink: { type: String, default: null },

    // Tracking
    isTrackingActive: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'projects',
  }
);

module.exports = mongoose.model('Project', projectSchema);
