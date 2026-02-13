const { MongoClient, ObjectId } = require('mongodb');
const { PrismaClient } = require('../prisma/generated/client');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is missing in .env');
    process.exit(1);
}

const idMap = new Map(); // ObjectId (String) -> UUID (String)

async function migrate() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        const db = client.db(); // Uses DB name from names in URI or default

        // -----------------------------------------------------------------------
        // 1. Migrate Users
        // -----------------------------------------------------------------------
        console.log('\n--- Migrating Users ---');
        const mongoUsers = await db.collection('users').find().toArray();

        for (const user of mongoUsers) {
            const oldId = user._id.toString();

            // Check if user already exists (by firebaseUid or email) to avoid duplicates
            let existingUser = await prisma.user.findUnique({
                where: { uid: user.uid }
            });

            if (!existingUser && user.email) {
                existingUser = await prisma.user.findUnique({ where: { email: user.email } });
            }

            let newUserId;
            if (existingUser) {
                console.log(`User exists: ${user.email} (${existingUser.id})`);
                newUserId = existingUser.id;
            } else {
                // Transform User
                const newUser = await prisma.user.create({
                    data: {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.name || 'User',
                        photoURL: user.photoURL,
                        bio: user.bio,
                        status: user.status || 'offline',
                        lastSeen: user.lastSeen ? new Date(user.lastSeen) : new Date(),
                        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
                        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),

                        // JSON fields
                        githubIntegration: user.integrations?.github || null,
                        googleIntegration: user.integrations?.google || null,
                        chatRequests: user.chatRequests || [],

                        // Simple Arrays
                        connections: user.connections || [],
                        closeFriends: user.closeFriends || [],

                        // New fields defaults
                        isPhoneVerified: false,
                    }
                });
                console.log(`Created User: ${user.email} (${newUser.id})`);
                newUserId = newUser.id;
            }

            idMap.set(oldId, newUserId);
        }
        console.log(`mapped ${idMap.size} users.`);


        // -----------------------------------------------------------------------
        // 2. Migrate Teams
        // -----------------------------------------------------------------------
        console.log('\n--- Migrating Teams ---');
        const mongoTeams = await db.collection('teams').find().toArray();

        for (const team of mongoTeams) {
            const ownerId = idMap.get(team.ownerId?.toString());
            if (!ownerId) {
                console.warn(`Skipping team ${team.name}: Owner ${team.ownerId} not found`);
                continue;
            }

            // Map members
            const members = (team.members || []).map(m => idMap.get(m?.toString())).filter(Boolean);

            const newTeam = await prisma.team.create({
                data: {
                    name: team.name,
                    description: team.description,
                    ownerId: ownerId,
                    members: members,
                    createdAt: team.createdAt ? new Date(team.createdAt) : new Date(),
                    updatedAt: team.updatedAt ? new Date(team.updatedAt) : new Date(),
                }
            });
            console.log(`Created Team: ${newTeam.name}`);
            // Map old team ID if referenced by Projects? (Project.team is String in schema?)
            // Schema says: team String? (Legacy team ID? Or is it UUID now?)
            // In Schema: model Project { team String? } -> This likely implies Team ID.
            // We need to map Team IDs too if projects ref them.
            idMap.set(team._id.toString(), newTeam.id);
        }


        // -----------------------------------------------------------------------
        // 3. Migrate Projects
        // -----------------------------------------------------------------------
        console.log('\n--- Migrating Projects ---');
        const mongoProjects = await db.collection('projects').find().toArray();

        for (const project of mongoProjects) {
            // Owner
            const ownerId = idMap.get(project.ownerId?.toString());
            // Team (if project.team was an ID)
            const teamId = project.team ? idMap.get(project.team.toString()) : null;

            if (!ownerId && !teamId) {
                console.warn(`Skipping project ${project.name}: No valid Owner or Team found`);
                continue;
            }

            // Collaborators
            const collaborators = (project.collaborators || []).map(c => idMap.get(c?.toString())).filter(Boolean);

            // Create Project
            const newProject = await prisma.project.create({
                data: {
                    name: project.name,
                    description: project.description,
                    repoName: project.repoName,
                    isPublic: project.isPublic || false,
                    repository: project.repository || null, // JSON?

                    ownerId: ownerId, // Optional in schema? No, ownerId String?. 
                    // Wait, Schema: ownerId String? (if team project?).
                    // Check schema: ownerId String?.

                    team: teamId, // String?
                    collaborators: collaborators,

                    architecture: project.architecture || null,

                    createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
                    updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
                }
            });
            console.log(`Created Project: ${newProject.name} (${newProject.id})`);

            // Migrate Steps & Tasks (Flattening)
            if (project.steps && Array.isArray(project.steps)) {
                for (const step of project.steps) {
                    const newStep = await prisma.step.create({
                        data: {
                            projectId: newProject.id,
                            title: step.title,
                            status: step.status || 'pending',
                            order: step.order || 0,
                        }
                    });

                    if (step.tasks && Array.isArray(step.tasks)) {
                        for (const task of step.tasks) {
                            const assignedTo = idMap.get(task.assignedTo?.toString());

                            await prisma.projectTask.create({
                                data: {
                                    stepId: newStep.id,
                                    title: task.title,
                                    description: task.description,
                                    status: task.status || 'pending',
                                    priority: task.priority || 'medium',
                                    dueDate: task.dueDate ? new Date(task.dueDate) : null,
                                    assignedTo: assignedTo || null,
                                    assignedBy: ownerId, // Approximate
                                }
                            });
                        }
                    }
                }
            }
        }

        // -----------------------------------------------------------------------
        // 4. Migrate Sessions? (Optional, maybe just current ones)
        // -----------------------------------------------------------------------

        console.log('\n--- Migration Complete ---');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.close();
        await prisma.$disconnect();
    }
}

migrate();
