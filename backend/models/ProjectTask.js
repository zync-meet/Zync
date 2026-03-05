const mongoose = require('mongoose');

const projectTaskSchema = new mongoose.Schema(
  {
    displayId:   { type: String, default: null },
    title:       { type: String, required: true },
    description: { type: String, default: null },
    status:      { type: String, default: 'Backlog' },

    assignedTo:     { type: String, default: null },
    assignedToName: { type: String, default: null },
    createdBy:      { type: String, default: null },
    assignedBy:     { type: String, default: null },

    // GitHub commit linkage
    commitMessage:   { type: String, default: null },
    commitUrl:       { type: String, default: null },
    commitAuthor:    { type: String, default: null },
    commitTimestamp: { type: Date, default: null },

    // GitHub repo link
    repoIds: { type: [String], default: [] },

    stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: true },
  },
  {
    timestamps: true,
    collection: 'projecttasks',
  }
);

projectTaskSchema.index({ assignedTo: 1 });
projectTaskSchema.index({ status: 1 });
projectTaskSchema.index({ displayId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
