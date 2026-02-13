const express = require('express');
const router = express.Router();
const { Groq } = require('groq-sdk');
const { randomUUID } = require('crypto');
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL_NAME = "llama-3.3-70b-versatile";

router.post('/', verifyToken, async (req, res) => {
  const { name, description } = req.body;
  const ownerId = req.user.uid;

  if (!name || !description) {
    return res.status(400).json({ message: 'Project Name and Description are required' });
  }

  try {
    // 1. Generate Architecture & Tasks with Groq
    const prompt = `
      You are a Senior Software Architect and Project Manager. 
      Create a comprehensive technical Implementation Plan for a software project.
      
      Project Name: "${name}"
      Project Description: "${description}"

      You must return a STRICT JSON object with the following structure:
      {
        "architecture": {
           "highLevel": "Description of the system architecture",
           "frontend": { "tech": "Stack details", "components": ["List of core components"] },
           "backend": { "tech": "Stack details", "services": ["List of services/endpoints"] },
           "database": { "tech": "DB choice", "schema": ["Key collections/tables"] },
           "flow": "Description of data flow"
        },
        "steps": [
           {
             "id": "STEP-01",
             "title": "Phase 1: Foundation",
             "description": "Setting up the environment",
             "status": "Pending",
             "type": "Backend", 
             "tasks": [
                { "title": "Setup Repository", "description": "Initialize Git", "status": "Pending", "assignedTo": null },
                { "title": "Configure Database", "description": "Setup connection", "status": "Pending", "assignedTo": null }
             ]
           },
           {
             "id": "STEP-02",
             "title": "Test Board",
             "description": "QA and Testing Phase",
             "status": "Pending",
             "type": "Other", 
             "tasks": [
                { "title": "Unit Tests", "description": "Write core unit tests", "status": "Pending", "assignedTo": null },
                { "title": "Integration Tests", "description": "Test API endpoints", "status": "Pending", "assignedTo": null }
             ]
           }
        ],
        "team": [
            "Suggested Role 1", "Suggested Role 2"
        ]
      }
      
      Make the tasks specific, actionable, and technical. Include a "Test Board" step/phase explicitly.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_NAME,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    let generatedData;
    try {
      generatedData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI JSON:", responseText);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      generatedData = JSON.parse(cleanJson);
    }

    // 2. Look up the User record to get the Prisma user ID for the relation
    let user = await prisma.user.findUnique({ where: { uid: ownerId } });
    if (!user) {
      // Create user on-the-fly if not synced yet
      user = await prisma.user.create({
        data: {
          uid: ownerId,
          email: req.user.email || `${ownerId}@placeholder.com`,
          displayName: 'User'
        }
      });
    }

    // 3. Create Project with Steps and Tasks in a single transaction
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: user.id,
        architecture: generatedData.architecture || {},
        team: [],
        steps: {
          create: (generatedData.steps || []).map((step, index) => ({
            title: step.title,
            description: step.description || '',
            status: 'Pending',
            type: step.type || 'Other',
            order: index,
            tasks: {
              create: (step.tasks || []).map(t => ({
                title: t.title,
                description: t.description || '',
                status: 'Pending',
                assignedTo: null
              }))
            }
          }))
        }
      },
      include: {
        steps: {
          include: { tasks: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json(newProject);

  } catch (error) {
    console.error('Project Generation Error:', error);
    res.status(500).json({ message: 'Server error generating project', error: error.message });
  }
});

module.exports = router;
