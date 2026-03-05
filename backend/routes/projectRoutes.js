const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { sendZyncEmail } = require('../services/mailer');
const { escapeRegExp } = require('../utils/regexUtils');
const User = require('../models/User');
const Project = require('../models/Project');
const Step = require('../models/Step');
const ProjectTask = require('../models/ProjectTask');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const authMiddleware = require('../middleware/authMiddleware');
const { normalizeDoc, normalizeDocs } = require('../utils/normalize');
const { getProjectWithSteps, getProjectsWithSteps } = require('../utils/projectHelper');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_SECONDARY);
const MODEL_NAME = "gemini-2.5-flash";
console.log(`[Config] Using Gemini Model: ${MODEL_NAME}`);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;


const decryptToken = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Token decryption failed:", error);
    return null;
  }
};

const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../debug_architecture.log');
const logStream = fs.createWriteStream(logPath, { flags: 'a' });

logStream.on('error', (err) => {
  console.error('[DEBUG] Failed to write to log file:', err);
});

const logDebug = (message) => {
  const timestamp = new Date().toISOString();
  logStream.write(`[${timestamp}] ${message}\n`);
  console.log(`[DEBUG] ${message}`);
};


const fetchRepoContext = async (accessToken, owner, repo) => {
  logDebug(`Fetching repo context for ${owner}/${repo}`);
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json'
    };

    logDebug(`Requesting file tree...`);
    const treeResponse = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    const files = treeResponse.data.map(f => f.name);
    logDebug(`Found files: ${files.join(', ')}`);

    let context = `Repository File Structure (Root):\n${files.join('\n')}\n\n`;

    const interestingFiles = ['package.json', 'requirements.txt', 'go.mod', 'README.md', 'schema.prisma', 'Genre.js', 'App.js', 'server.js', 'index.js'];

    const filePromises = interestingFiles
      .filter(file => files.includes(file))
      .map(async (file) => {
        try {
          logDebug(`Fetching content of ${file}...`);
          const contentRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${file}`, { headers });
          if (contentRes.data.content) {
            const content = Buffer.from(contentRes.data.content, 'base64').toString('utf-8');
            return `\n--- Content of ${file} ---\n${content.substring(0, 5000)}\n----------------------\n`;
          }
        } catch (e) {
          logDebug(`Failed to fetch ${file}: ${e.message}`);
          return '';
        }
        return '';
      });

    const fileContents = await Promise.all(filePromises);
    context += fileContents.join('');

    logDebug(`Context prepared. Length: ${context.length} chars`);
    return context;
  } catch (error) {
    logDebug(`Error fetching repo context: ${error.message}`);
    if (error.response) logDebug(`Response data: ${JSON.stringify(error.response.data)}`);
    return "Failed to fetch repository context.";
  }
};


const analyzeWithGemini = async (repoContext, projectName) => {
  logDebug(`Sending context to Gemini for analysis...`);
  const prompt = `
    You are a Senior Software Architect. Analyze the following codebase context for the project "${projectName}".

    Codebase Context:
    ${repoContext}

    Based on the file structure and contents (dependencies, README, etc.), deduce the architecture.
    Return a STRICT JSON object matching this schema exactly:

    {
      "highLevel": "Brief summary of the architecture (e.g., MERN Stack application with Redux)",
      "frontend": {
        "structure": "Description of frontend organization (e.g., React with Vite)",
        "pages": ["Inferred pages"],
        "components": ["Inferred key components"],
        "routing": "Inferred routing strategy"
      },
      "backend": {
        "structure": "Description of backend organization (e.g., Node.js Express server)",
        "apis": ["Inferred API routes (REST/GraphQL)"],
        "controllers": ["Inferred controllers"],
        "services": ["Inferred services"],
        "authFlow": "Inferred authentication mechanism"
      },
      "database": {
        "design": "Description of data model",
        "collections": ["Inferred collections/tables"],
        "relationships": "Inferred key relationships"
      },
      "apiFlow": "How frontend communicates with backend",
      "integrations": ["Detected external libraries/SDKs (e.g., Firebase, Stripe)"]
    }

    If you cannot derive specific details, ANY logical inference is better than null. Use "N/A" only if absolutely unknown.
    Do NOT include markdown formatting or explanations outside the JSON.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    logDebug(`Gemini response received. Length: ${jsonString.length}`);

    const parsed = JSON.parse(jsonString);
    logDebug(`Parsed JSON keys: ${Object.keys(parsed).join(', ')}`);
    return parsed;
  } catch (error) {
    logDebug(`Gemini analysis failed: ${error.message}`);
    throw error;
  }
};


router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, githubRepoName, githubRepoOwner } = req.body;
    const ownerUid = req.user.uid;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const owner = await User.findOne({ uid: ownerUid }).lean();
    if (!owner) return res.status(404).json({ message: 'User not found' });

    const defaultSteps = [
      { title: 'Planning', description: 'Initial requirements and design', type: 'Design', order: 0 },
      { title: 'Frontend', description: 'Client-side implementation', type: 'Frontend', order: 1 },
      { title: 'Backend', description: 'Server-side logic and APIs', type: 'Backend', order: 2 },
      { title: 'Database', description: 'Schema design and data management', type: 'Database', order: 3 },
      { title: 'Deployment', description: 'CI/CD and hosting setup', type: 'Other', order: 4 }
    ];

    const newProject = await Project.create({
      name,
      description: description || 'No description',
      ownerId: owner._id,
      githubRepoName,
      githubRepoOwner,
      isTrackingActive: !!(githubRepoName && githubRepoOwner),
    });

    // Create default steps
    const createdSteps = [];
    for (const s of defaultSteps) {
      const step = await Step.create({ ...s, projectId: newProject._id });
      createdSteps.push(step);
    }

    const result = await getProjectWithSteps(newProject._id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
});


router.post('/:id/analyze-architecture', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || owner.uid !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { githubRepoName, githubRepoOwner } = project;

    if (!githubRepoName || !githubRepoOwner) {
      return res.status(400).json({ message: 'Project is not linked to a GitHub repository' });
    }

    const github = owner.githubIntegration;
    if (!github?.accessToken) {
      return res.status(400).json({ message: 'Owner is not connected to GitHub' });
    }

    const accessToken = decryptToken(github.accessToken);
    if (!accessToken) {
      return res.status(500).json({ message: 'Failed to decrypt GitHub token' });
    }

    console.log(`Analyzing GitHub Repo: ${githubRepoOwner}/${githubRepoName}...`);
    const context = await fetchRepoContext(accessToken, githubRepoOwner, githubRepoName);
    const analyzedArch = await analyzeWithGemini(context, project.name);

    console.log("Analysis Result:", JSON.stringify(analyzedArch, null, 2));

    if (analyzedArch && Object.keys(analyzedArch).length > 0) {
      await Project.updateOne({ _id: id }, { $set: { architecture: analyzedArch } });
      console.log("Project architecture saved successfully.");
      const updatedProject = await getProjectWithSteps(id);
      return res.json(updatedProject);
    }

    console.warn("Analysis returned empty or null.");
    const full = await getProjectWithSteps(id);
    res.json(full);
  } catch (error) {
    console.error("Architecture analysis failed:", error);
    res.status(500).json({ message: 'Failed to analyze architecture', error: error.message });
  }
});

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerUid = req.user.uid;

    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }

    const owner = await User.findOne({ uid: ownerUid }).lean();
    if (!owner) return res.status(404).json({ message: 'User not found' });

    const prompt = `
      You are a software architect. Generate a comprehensive project architecture and step-by-step development plan for the following project:

      Project Name: ${name}
      Project Description: ${description}

      Please provide the output strictly as a JSON object with the following structure. Do not include any markdown formatting or explanations outside the JSON.

      {
        "architecture": {
          "highLevel": "String describing high-level architecture",
          "frontend": {
            "structure": "String describing frontend structure",
            "pages": ["List of pages"],
            "components": ["List of key components"],
            "routing": "Description of routing"
          },
          "backend": {
            "structure": "String describing backend structure",
            "apis": ["List of key API endpoints"],
            "controllers": ["List of controllers"],
            "services": ["List of services"],
            "authFlow": "Description of authentication flow"
          },
          "database": {
            "design": "String describing database design",
            "collections": ["List of collections/tables"],
            "relationships": "Description of relationships"
          },
          "apiFlow": "Description of API calling flow between frontend and backend",
          "integrations": ["List of optional integrations"]
        },
        "steps": [
          {
            "title": "Phase Title (e.g., Planning, Frontend, Backend)",
            "description": "Description of the phase",
            "type": "Frontend" | "Backend" | "Database" | "Design" | "Other",
            "page": "Related Page",
            "tasks": [
               {
                 "title": "Task Title",
                 "description": "Task details"
               }
            ]
          }
        ]
      }

      Ensure the steps are ordered logically for development. Each step should act as a phase and contain multiple granular tasks.
    `;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let generatedData;
    try {
      generatedData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse Gemini response:", jsonString);
      return res.status(500).json({ message: 'Failed to generate valid project structure', error: e.message });
    }

    const newProject = await Project.create({
      name,
      description,
      ownerId: owner._id,
      architecture: generatedData.architecture || {},
      team: [],
    });

    // Create steps and tasks
    for (const [idx, stepData] of (generatedData.steps || []).entries()) {
      const step = await Step.create({
        title: stepData.title,
        description: stepData.description || '',
        type: stepData.type || 'Other',
        page: stepData.page || 'General',
        order: idx,
        projectId: newProject._id,
      });

      if (stepData.tasks && stepData.tasks.length > 0) {
        for (const task of stepData.tasks) {
          await ProjectTask.create({
            title: task.title,
            description: task.description || '',
            status: 'Pending',
            stepId: step._id,
          });
        }
      }
    }

    const fullProject = await getProjectWithSteps(newProject._id);
    res.status(201).json(fullProject);

  } catch (error) {
    console.error('Error generating project:', error);
    res.status(500).json({ message: 'Failed to generate project', error: error.message });
  }
});


router.get('/', authMiddleware, async (req, res) => {
  try {
    const ownerUid = req.user.uid;

    const user = await User.findOne({ uid: ownerUid }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Projects owned by user or where user is a team member
    const projects = await getProjectsWithSteps({
      $or: [
        { ownerId: user._id },
        { team: ownerUid }
      ]
    });

    // Projects where user has assigned tasks
    const assignedTasks = await ProjectTask.find({ assignedTo: ownerUid }).select('stepId').lean();
    const assignedStepIds = [...new Set(assignedTasks.map(t => t.stepId.toString()))];

    let assignedProjects = [];
    if (assignedStepIds.length > 0) {
      const assignedSteps = await Step.find({ _id: { $in: assignedStepIds } }).select('projectId').lean();
      const assignedProjectIds = [...new Set(assignedSteps.map(s => s.projectId.toString()))];

      if (assignedProjectIds.length > 0) {
        assignedProjects = await getProjectsWithSteps({
          _id: { $in: assignedProjectIds }
        });
      }
    }

    // Merge and deduplicate
    const projectMap = new Map();
    [...projects, ...assignedProjects].forEach(p => projectMap.set(p.id, p));
    const allProjects = Array.from(projectMap.values());

    res.json(allProjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/:id/team', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id).lean();

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || owner.uid !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!project.team.includes(userId) && owner.uid !== userId) {
      const newTeam = [...project.team, userId];
      await Project.updateOne({ _id: req.params.id }, { $set: { team: newTeam } });
    }

    const full = await getProjectWithSteps(req.params.id);
    res.json(full);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || (owner.uid !== req.user.uid && !project.team.includes(req.user.uid))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if project has any steps
    const stepCount = await Step.countDocuments({ projectId: project._id });

    if (stepCount === 0) {
      const defaultSteps = [
        { title: 'Planning', description: 'Initial requirements and design', type: 'Design', order: 0, projectId: project._id },
        { title: 'Frontend', description: 'Client-side implementation', type: 'Frontend', order: 1, projectId: project._id },
        { title: 'Backend', description: 'Server-side logic and APIs', type: 'Backend', order: 2, projectId: project._id },
        { title: 'Database', description: 'Schema design and data management', type: 'Database', order: 3, projectId: project._id },
        { title: 'Deployment', description: 'CI/CD and hosting setup', type: 'Other', order: 4, projectId: project._id }
      ];
      for (const s of defaultSteps) {
        await Step.create(s);
      }
    }

    const full = await getProjectWithSteps(req.params.id);
    res.json(full);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || owner.uid !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delete tasks, steps, then project
    const steps = await Step.find({ projectId: project._id }).select('_id').lean();
    const stepIds = steps.map(s => s._id);
    if (stepIds.length > 0) {
      await ProjectTask.deleteMany({ stepId: { $in: stepIds } });
    }
    await Step.deleteMany({ projectId: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || (owner.uid !== req.user.uid && !project.team.includes(req.user.uid))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'description', 'githubRepoName', 'githubRepoOwner', 'isTrackingActive'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    await Project.updateOne({ _id: id }, { $set: filteredUpdates });

    const updatedProject = await getProjectWithSteps(id);
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/:projectId/steps/:stepId/tasks', authMiddleware, async (req, res) => {
  try {
    const { projectId, stepId } = req.params;
    const { title, description, assignedTo, assignedToName, assignedBy } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || (owner.uid !== req.user.uid && !project.team.includes(req.user.uid))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const step = await Step.findOne({ _id: stepId, projectId: project._id }).lean();
    if (!step) return res.status(404).json({ message: 'Step not found' });

    // Send assignment email
    if (assignedTo) {
      const assigneeUser = await User.findOne({ uid: assignedTo }).lean();
      if (assigneeUser && assigneeUser.email) {
        const subject = `New Task Assigned: ${title}`;
        const text = `You have been assigned a new task in project "${project.name}".\n\nTask: ${title}\nDescription: ${description || 'No description'}\nAssigned By: ${assignedBy || 'Admin'}`;
        const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>New Task Assignment</h2>
            <p>You have been assigned a new task in project <strong>${project.name}</strong>.</p>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Step:</strong> ${step.title}</p>
              <p><strong>Task:</strong> ${title}</p>
              <p><strong>Description:</strong> ${description || 'No description'}</p>
            </div>
            <p>Please log in to Zync to view more details.</p>
          </div>
        `;
        try {
          await sendZyncEmail(assigneeUser.email, subject, html, text);
        } catch (emailError) {
          console.error("Failed to send assignment email:", emailError);
        }
      }
    }

    await ProjectTask.create({
      title,
      description: description || null,
      status: 'Pending',
      assignedTo,
      assignedToName,
      assignedBy: assignedBy || 'Admin',
      createdBy: req.user ? req.user.uid : (assignedBy || 'Admin'),
      stepId
    });

    const updatedProject = await getProjectWithSteps(projectId);
    res.status(201).json(updatedProject);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.put('/:projectId/steps/:stepId/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { projectId, stepId, taskId } = req.params;
    const { status, assignedTo, assignedToName, assignedBy } = req.body;

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || (owner.uid !== req.user.uid && !project.team.includes(req.user.uid))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const step = await Step.findOne({ _id: stepId, projectId: project._id }).lean();
    if (!step) return res.status(404).json({ message: 'Step not found' });

    const task = await ProjectTask.findOne({ _id: taskId, stepId }).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const taskUpdate = {};
    if (status) taskUpdate.status = status;

    if (assignedTo !== undefined) {
      const oldAssignee = task.assignedTo;
      taskUpdate.assignedTo = assignedTo;
      taskUpdate.assignedToName = assignedToName;

      if (assignedTo && assignedTo !== oldAssignee) {
        const assigneeUser = await User.findOne({ uid: assignedTo }).lean();

        if (assigneeUser && assigneeUser.email) {
          const subject = `New Task Assigned: ${task.title}`;
          const text = `You have been assigned a new task in project "${project.name}".\n\nStep: ${step.title}\nTask: ${task.title}\nAssigned By: ${assignedBy || 'Admin'}`;
          const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
              <h2>New Task Assignment</h2>
              <p>You have been assigned a new task in project <strong>${project.name}</strong>.</p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Task:</strong> ${task.title}</p>
                <p><strong>Step:</strong> ${step.title}</p>
                <p><strong>Assigned By:</strong> ${assignedBy || 'Admin'}</p>
              </div>
              <p>Please log in to ZYNC to view more details.</p>
            </div>
          `;

          try {
            await sendZyncEmail(assigneeUser.email, subject, html, text);
          } catch (emailError) {
            console.error("Failed to send assignment email:", emailError);
          }
        }
      }
    }

    await ProjectTask.updateOne({ _id: taskId }, { $set: taskUpdate });

    const updatedProject = await getProjectWithSteps(projectId);

    req.app.get('io').emit('projectUpdate', {
      projectId: updatedProject.id,
      project: updatedProject
    });

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.delete('/:projectId/steps/:stepId/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { projectId, stepId, taskId } = req.params;
    const userId = req.user ? req.user.uid : null;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || owner.uid !== userId) {
      return res.status(403).json({ message: 'Permission denied. Only the project owner can delete tasks.' });
    }

    const task = await ProjectTask.findOne({ _id: taskId, stepId }).lean();
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await ProjectTask.findByIdAndDelete(taskId);

    const updatedProject = await getProjectWithSteps(projectId);

    req.app.get('io').emit('projectUpdate', {
      projectId: updatedProject.id,
      project: updatedProject
    });

    res.json({ message: 'Task deleted successfully', projectId, stepId, taskId });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/tasks/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.uid;

    if (!query) return res.json([]);

    const user = await User.findOne({ uid: userId }).lean();
    if (!user) return res.json([]);

    // Get all projects user has access to
    const ownedProjects = await Project.find({ ownerId: user._id }).select('_id name').lean();
    const teamProjects = await Project.find({ team: userId }).select('_id name').lean();

    // Get projects via task assignment
    const assignedTasks = await ProjectTask.find({ assignedTo: userId }).select('stepId').lean();
    const assignedStepIds = [...new Set(assignedTasks.map(t => t.stepId.toString()))];
    let assignedProjectIds = [];
    if (assignedStepIds.length > 0) {
      const assignedSteps = await Step.find({ _id: { $in: assignedStepIds } }).select('projectId').lean();
      assignedProjectIds = assignedSteps.map(s => s.projectId.toString());
    }
    const assignedProjectDocs = assignedProjectIds.length > 0
      ? await Project.find({ _id: { $in: assignedProjectIds } }).select('_id name').lean()
      : [];

    const projectMap = new Map();
    [...ownedProjects, ...teamProjects, ...assignedProjectDocs].forEach(p => projectMap.set(p._id.toString(), p));
    const projectIds = Array.from(projectMap.keys());

    if (projectIds.length === 0) return res.json([]);

    // Get steps for these projects
    const steps = await Step.find({ projectId: { $in: projectIds } }).lean();
    const stepMap = new Map();
    steps.forEach(s => stepMap.set(s._id.toString(), s));

    const stepIds = steps.map(s => s._id);

    // Search tasks
    const searchLower = query.toLowerCase();
    const allTasks = await ProjectTask.find({ stepId: { $in: stepIds } }).lean();

    const results = [];
    allTasks.forEach(task => {
      if (task.title.toLowerCase().includes(searchLower)) {
        const step = stepMap.get(task.stepId.toString());
        const proj = step ? projectMap.get(step.projectId.toString()) : null;
        results.push({
          id: task._id.toString(),
          title: task.title,
          projectId: proj?._id?.toString() || '',
          projectName: proj?.name || '',
          status: task.status,
          stepName: step?.title || ''
        });
      }
    });

    res.json(results.slice(0, 10));
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/:projectId/quick-task', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, assignedToName } = req.body;

    const project = await Project.findById(projectId).lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const owner = await User.findById(project.ownerId).lean();
    if (!owner || (owner.uid !== req.user.uid && !project.team.includes(req.user.uid))) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const steps = await Step.find({ projectId: project._id }).sort({ order: 1 }).lean();

    let step = steps.find(s =>
      s.title.toLowerCase().includes('backlog') ||
      s.title.toLowerCase().includes('planning') ||
      s.title.toLowerCase().includes('general')
    );

    if (!step && steps.length > 0) {
      step = steps[0];
    }

    if (!step) {
      const created = await Step.create({
        title: 'Backlog',
        description: 'Auto-generated backlog',
        type: 'Other',
        order: 0,
        projectId: project._id
      });
      step = created.toObject();
    }

    const newTask = await ProjectTask.create({
      title,
      description: description || null,
      status: 'Backlog',
      assignedTo,
      assignedToName,
      assignedBy: req.user?.name || 'Admin',
      createdBy: req.user ? req.user.uid : 'Admin',
      stepId: step._id
    });

    if (assignedTo) {
      const assigneeUser = await User.findOne({ uid: assignedTo }).lean();
      if (assigneeUser && assigneeUser.email) {
        const subject = `New Task Assigned: ${newTask.title}`;
        const text = `You have been assigned a new task in project "${project.name}".\n\nTask: ${newTask.title}\nDescription: ${newTask.description || 'No description'}\nAssigned By: Admin`;
        const html = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>New Task Assignment</h2>
            <p>You have been assigned a new task in project <strong>${project.name}</strong>.</p>
            <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Task:</strong> ${newTask.title}</p>
              <p><strong>Description:</strong> ${newTask.description || 'No description'}</p>
            </div>
            <p>Please log in to Zync to view more details.</p>
          </div>
        `;
        try {
          await sendZyncEmail(assigneeUser.email, subject, html, text);
        } catch (emailError) {
          console.error("Failed to send assignment email:", emailError);
        }
      }
    }

    const updatedProject = await getProjectWithSteps(projectId);
    const taskObj = normalizeDoc(newTask.toObject());

    res.json({ message: 'Task created', task: taskObj, stepId: step._id?.toString() || step.id, project: updatedProject });
  } catch (error) {
    console.error('Error creating quick task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
