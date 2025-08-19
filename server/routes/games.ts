import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../lib/auth';
import { truncateTextForAI } from '../lib/fileProcessing';
import { searchMediaContent, MediaContent, extractKeyConceptsFromText } from '../lib/mediaService';

const router = Router();

// Comprehensive Learning Experience Designer AI Prompt
const AI_PROMPT_TEMPLATE = `
You are a Learning Experience Designer AI. A user has uploaded educational content. Your task is to carefully read, analyze, and transform this document into a complete interactive learning journey.

Break down the process into four parts: Learning Roadmap → Visual Diagrams → Gamified Learning Video → Quiz Game.
Output must be structured in JSON + Markdown, so the frontend (built on Builder.io + React) can consume it easily.

🎯 Part 1: Learning Roadmap
Read and understand the uploaded content deeply.
Extract key concepts, topics, and skills.
Organize them into a step-by-step roadmap: Modules → Lessons → Learning Objectives.
Each step should include: title, summary (2–3 sentences), estimated_time (in minutes), difficulty_level (beginner, intermediate, advanced)

🎨 Part 2: Visual 2D Diagrams
For each key concept in the roadmap, generate 2D diagram instructions.
The output should be structured text instructions that a diagram generator (e.g. Excalidraw API, Mermaid.js, or DALL·E for styled images) can use.
Example formats: flowcharts, concept maps, step-by-step processes.

📽️ Part 3: Gamified Learning Video
Convert roadmap content into a script for a short animated 2D video.
Style: engaging, gamified, story-driven.
Output should include: script (dialogue + narration), scenes (with visual descriptions: characters, environment, transitions), visual_style (e.g. cartoonish, minimal, professional)

🎮 Part 4: Quiz as a Game
Create a final interactive quiz in gamified format.
Quiz must be: Themed (e.g. escape room, treasure hunt, hero's journey), Interactive (multiple choice, true/false, drag/drop, sequencing), With feedback for each answer.

OUTPUT FORMAT (JSON):
{
  "title": "[Engaging title based on content]",
  "summary": "[Compelling 2-3 sentence summary]",
  "totalEstimatedTime": "[Total learning time in minutes]",

  "roadmap": [
    {
      "module": "Introduction to X",
      "moduleDescription": "Brief description of what this module covers",
      "estimatedTime": "30 min",
      "lessons": [
        {
          "title": "What is X?",
          "summary": "Simple explanation of X and its importance.",
          "estimatedTime": "10 min",
          "difficultyLevel": "beginner",
          "learningObjectives": ["Objective 1", "Objective 2"],
          "keyTopics": ["Topic A", "Topic B"]
        }
      ]
    }
  ],

  "diagrams": [
    {
      "topic": "How X Works",
      "type": "flowchart",
      "description": "Visual explanation of the X process",
      "diagramCode": "graph TD; A[Input] --> B[Process]; B --> C[Output];",
      "altText": "Flowchart showing the X process from input to output"
    },
    {
      "topic": "X Framework",
      "type": "concept-map",
      "description": "Mind map of X components and relationships",
      "diagramCode": "mindmap\n  root((X Framework))\n    Component A\n    Component B\n    Component C",
      "altText": "Concept map of X framework components"
    }
  ],

  "video": {
    "title": "Journey Through X",
    "visualStyle": "2D cartoon, colorful, fun",
    "totalDuration": "3-5 minutes",
    "scenes": [
      {
        "sceneNumber": 1,
        "duration": "30 seconds",
        "narration": "Welcome! Today you'll discover how X shapes our world.",
        "visuals": "Animated character walking into a digital world.",
        "characters": ["Friendly guide character"],
        "environment": "Colorful digital landscape",
        "transitions": "Smooth zoom-in from overview to detail"
      }
    ]
  },

  "quiz": {
    "theme": "Treasure Hunt",
    "description": "Navigate through challenges to find the knowledge treasure",
    "totalQuestions": 5,
    "questions": [
      {
        "id": "q1",
        "question": "What is the primary purpose of X?",
        "type": "multiple_choice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option B",
        "correctIndex": 1,
        "difficulty": "beginner",
        "points": 10,
        "feedback": {
          "correct": "Excellent! You found the right treasure. X indeed serves this primary purpose because...",
          "incorrect": "Oops, that's a trap! The correct answer is Option B because..."
        },
        "explanation": "Detailed explanation of why this is correct and how it applies in real-world scenarios."
      },
      {
        "id": "q2",
        "question": "Arrange these steps in the correct order for the X process:",
        "type": "sequencing",
        "items": ["Step 1", "Step 2", "Step 3", "Step 4"],
        "correctOrder": [0, 2, 1, 3],
        "difficulty": "intermediate",
        "points": 15,
        "feedback": {
          "correct": "Perfect sequencing! You understand the logical flow of the X process.",
          "incorrect": "Close, but the correct sequence is different. Remember that..."
        }
      },
      {
        "id": "q3",
        "question": "Match these X components to their functions:",
        "type": "drag_drop",
        "items": ["Component A", "Component B", "Component C"],
        "categories": ["Function 1", "Function 2", "Function 3"],
        "correctMapping": {
          "Component A": "Function 1",
          "Component B": "Function 3",
          "Component C": "Function 2"
        },
        "difficulty": "advanced",
        "points": 20,
        "feedback": {
          "correct": "Brilliant matching! You clearly understand how each component works.",
          "incorrect": "Good try! The correct pairings are based on..."
        }
      }
    ]
  },

  "gamification": {
    "achievements": [
      {
        "id": "roadmap_master",
        "name": "Roadmap Master",
        "description": "Completed all learning modules",
        "icon": "map",
        "condition": "complete_all_modules"
      },
      {
        "id": "visual_learner",
        "name": "Visual Learner",
        "description": "Studied all diagrams thoroughly",
        "icon": "eye",
        "condition": "view_all_diagrams"
      },
      {
        "id": "quiz_champion",
        "name": "Quiz Champion",
        "description": "Scored 90% or higher on the final quiz",
        "icon": "trophy",
        "condition": "high_quiz_score"
      }
    ],
    "progressMilestones": ["25%", "50%", "75%", "100%"],
    "bonusChallenges": [
      {
        "title": "Real-World Application",
        "description": "Create your own example of X in action",
        "points": 50,
        "type": "creative_project"
      }
    ]
  }
}

Create an engaging, comprehensive learning experience that transforms the uploaded content into an interactive educational journey. Focus on clear learning progression, practical application, and memorable engagement.

CONTENT TO PROCESS:
`;

// Enhanced AI processing function with media integration
async function generateGameWithAI(text: string): Promise<any> {
  // Truncate text to fit in AI context window
  const processedText = truncateTextForAI(text, 6000);

  // Extract key concepts for media search
  const keyConcepts = extractKeyConceptsFromText(processedText);

  // Search for relevant media content
  console.log('Searching for media content for concepts:', keyConcepts);
  const mediaSearchResult = await searchMediaContent(processedText);

  // In production, replace this with actual AI API call
  // const response = await openai.chat.completions.create({
  //   messages: [{ role: "user", content: AI_PROMPT_TEMPLATE + processedText }],
  //   model: "gpt-4",
  //   temperature: 0.7,
  // });
  // return JSON.parse(response.choices[0].message.content);

  // Generate enhanced mock response with actual media content
  const topicWords = processedText.split(' ').slice(0, 5);
  const mainTopic = topicWords.join(' ');

  const mockGame = {
    title: `Interactive Learning: ${mainTopic}...`,
    summary: `Discover the fascinating world of ${keyConcepts[0] || 'learning'} through immersive multimedia experiences, hands-on simulations, and engaging challenges.`,
    keyTopics: keyConcepts.slice(0, 3),
    visualConcepts: [
      `Visual representation of ${keyConcepts[0] || 'main concept'}`,
      `Practical application of ${keyConcepts[1] || 'key principle'}`
    ],
    learningObjectives: [
      `Master the fundamental principles of ${keyConcepts[0] || 'the subject matter'}`,
      "Apply theoretical knowledge to real-world scenarios",
      "Analyze complex situations using evidence-based reasoning",
      "Develop critical thinking skills through interactive challenges"
    ],
    mediaContent: mediaSearchResult.totalFound > 0 ? {
      ...(mediaSearchResult.images[0] && {
        headerImage: {
          url: mediaSearchResult.images[0].url,
          altText: mediaSearchResult.images[0].altText,
          description: `Engaging visual that represents the core concepts of ${mainTopic}`,
          searchTerms: keyConcepts.slice(0, 2),
          purpose: "introduction"
        }
      }),
      ...(mediaSearchResult.images.length > 1 && {
        conceptImages: mediaSearchResult.images.slice(1, 3).map((img, index) => ({
          concept: keyConcepts[index] || `Concept ${index + 1}`,
          url: img.url,
          altText: img.altText,
          description: `Visual explanation of ${keyConcepts[index] || `concept ${index + 1}`}`,
          searchTerms: [keyConcepts[index] || 'concept'],
          placement: `section${index + 1}`
        }))
      }),
      ...(mediaSearchResult.videos.length > 0 && {
        videos: mediaSearchResult.videos.slice(0, 2).map((vid, index) => ({
          topic: `${keyConcepts[index] || 'Key concept'} in action`,
          url: vid.url,
          altText: vid.altText,
          description: `Educational video demonstrating ${keyConcepts[index] || 'practical application'}`,
          searchTerms: [keyConcepts[index] || 'application'],
          placement: index === 0 ? "introduction" : "demonstration"
        }))
      })
    } : undefined,
    roleplay: {
      scenario: `You are a professional working in a field where ${keyConcepts[0] || 'these concepts'} are crucial for success. Your organization is facing a challenging situation that requires you to apply the principles you've learned.`,
      ...(mediaSearchResult.images[3] && {
        backgroundImage: {
          url: mediaSearchResult.images[3].url,
          altText: mediaSearchResult.images[3].altText,
          description: `Realistic workplace setting where ${keyConcepts[0] || 'concepts'} are applied`,
          searchTerms: [keyConcepts[0] || 'workplace', 'professional']
        }
      }),
      steps: [
        {
          id: "step1",
          text: `A critical situation has emerged in your organization that directly relates to ${keyConcepts[0] || 'the concepts you\'ve studied'}. Stakeholders are looking to you for guidance. What's your initial approach?`,
          ...(mediaSearchResult.images[1] && {
            mediaContent: {
              image: {
                url: mediaSearchResult.images[1].url,
                altText: mediaSearchResult.images[1].altText,
                description: `Visual representation of decision-making in ${keyConcepts[0] || 'professional'} context`,
                searchTerms: [keyConcepts[0] || 'decision', 'meeting']
              }
            }
          }),
          choices: [
            {
              id: "a",
              label: `Apply the theoretical framework of ${keyConcepts[0] || 'established principles'} directly`,
              feedback: `Excellent foundation! Starting with proven ${keyConcepts[0] || 'theoretical principles'} provides a solid base for decision-making. This shows you understand the core concepts and their systematic application.`,
              nextStep: "step2",
              points: 15
            },
            {
              id: "b",
              label: "Analyze the practical constraints and stakeholder needs first",
              feedback: "Strategic thinking! Understanding the real-world context and stakeholder perspectives is crucial for successful implementation. This approach shows sophisticated practical wisdom.",
              nextStep: "step2",
              points: 12
            },
            {
              id: "c",
              label: "Gather additional data and expert opinions before proceeding",
              feedback: "Thoughtful approach! Seeking diverse perspectives and comprehensive information reduces risk and improves decision quality. This demonstrates intellectual humility and thoroughness.",
              nextStep: "step2",
              points: 10
            }
          ]
        },
        {
          id: "step2",
          text: `As you implement your chosen approach, you discover that the situation is more complex than initially anticipated. There are conflicting priorities and unexpected challenges related to ${keyConcepts[1] || 'secondary factors'}. How do you adapt?`,
          ...(mediaSearchResult.images[2] && {
            mediaContent: {
              image: {
                url: mediaSearchResult.images[2].url,
                altText: mediaSearchResult.images[2].altText,
                description: 'Visual showing adaptive problem-solving and complexity management',
                searchTerms: [keyConcepts[1] || 'complexity', 'adaptation']
              }
            }
          }),
          choices: [
            {
              id: "a",
              label: `Integrate insights from ${keyConcepts[1] || 'multiple perspectives'} to develop a hybrid solution`,
              feedback: `Outstanding adaptive thinking! By synthesizing different approaches and incorporating ${keyConcepts[1] || 'multiple viewpoints'}, you demonstrate mastery of complex problem-solving. This flexibility is key to real-world success.`,
              nextStep: null,
              points: 20
            },
            {
              id: "b",
              label: "Reassess priorities and adjust the strategy while maintaining core principles",
              feedback: "Excellent balance! Maintaining your foundational principles while adapting to new information shows both consistency and flexibility—hallmarks of effective leadership.",
              nextStep: null,
              points: 18
            },
            {
              id: "c",
              label: "Consult with stakeholders to build consensus around a modified approach",
              feedback: "Smart collaborative strategy! Engaging stakeholders in solution development not only improves the outcome but also builds buy-in and support for implementation.",
              nextStep: null,
              points: 15
            }
          ]
        }
      ]
    },
    quiz: {
      theme: `${keyConcepts[0] || 'Knowledge'} Mastery Challenge`,
      gameFormat: "multimedia-quest",
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          question: `What is the most critical factor when applying ${keyConcepts[0] || 'these concepts'} in professional settings?`,
          options: [
            "Strict adherence to theoretical models",
            "Balancing theory with practical constraints",
            "Prioritizing stakeholder preferences",
            "Following established organizational procedures"
          ],
          answerIndex: 1,
          explanation: `The most effective approach combines theoretical understanding with practical wisdom. While ${keyConcepts[0] || 'theoretical frameworks'} provide essential guidance, real-world application requires adapting these principles to specific contexts, constraints, and stakeholder needs.`,
          ...(mediaSearchResult.images[0] && {
            mediaContent: {
              image: {
                url: mediaSearchResult.images[0].url,
                altText: mediaSearchResult.images[0].altText,
                description: `Diagram showing the relationship between theory and practice in ${keyConcepts[0] || 'professional applications'}`,
                searchTerms: [keyConcepts[0] || 'theory', 'practice']
              }
            }
          }),
          difficulty: "medium",
          points: 15
        },
        {
          id: "q2",
          type: "multiple-choice",
          question: `When facing ethical dilemmas related to ${keyConcepts[1] || 'key principles'}, what should be your primary consideration?`,
          options: [
            "Immediate organizational benefits",
            "Long-term consequences for all stakeholders",
            "Personal career advancement",
            "Industry standard practices"
          ],
          answerIndex: 1,
          explanation: `Ethical decision-making requires considering long-term consequences for all affected parties. This approach aligns with ${keyConcepts[1] || 'fundamental principles'} and ensures sustainable, responsible outcomes that build trust and credibility.`,
          ...(mediaSearchResult.images[1] && {
            mediaContent: {
              image: {
                url: mediaSearchResult.images[1].url,
                altText: mediaSearchResult.images[1].altText,
                description: `Visual guide to ethical reasoning in ${keyConcepts[1] || 'professional'} contexts`,
                searchTerms: [keyConcepts[1] || 'ethics', 'decision-making']
              }
            }
          }),
          difficulty: "hard",
          points: 20
        },
        {
          id: "q3",
          type: "drag-drop",
          question: `Organize these elements in order of priority when implementing ${keyConcepts[0] || 'key strategies'}:`,
          items: [
            "Stakeholder analysis",
            "Risk assessment",
            "Resource allocation",
            "Implementation planning",
            "Outcome measurement"
          ],
          categories: ["Phase 1: Foundation", "Phase 2: Execution", "Phase 3: Evaluation"],
          correctMapping: {
            "Stakeholder analysis": "Phase 1: Foundation",
            "Risk assessment": "Phase 1: Foundation",
            "Resource allocation": "Phase 2: Execution",
            "Implementation planning": "Phase 2: Execution",
            "Outcome measurement": "Phase 3: Evaluation"
          },
          explanation: `Effective implementation follows a logical sequence: foundation-building (stakeholder and risk analysis), execution (planning and resource allocation), and evaluation (measuring outcomes). This systematic approach ensures comprehensive coverage of critical factors.`,
          difficulty: "hard",
          points: 25
        }
      ]
    },
    gamification: {
      achievements: [
        {
          id: "perfect_understanding",
          name: "Perfect Understanding",
          description: "Answered all questions correctly",
          icon: "trophy",
          condition: "perfect_score"
        },
        {
          id: "strategic_thinker",
          name: "Strategic Thinker",
          description: "Demonstrated excellent strategic reasoning in roleplay",
          icon: "brain",
          condition: "high_roleplay_score"
        },
        {
          id: "speed_learner",
          name: "Speed Learner",
          description: "Completed the module in record time",
          icon: "zap",
          condition: "fast_completion"
        }
      ],
      progressMilestones: ["25%", "50%", "75%", "100%"],
      bonusChallenges: [
        {
          title: `Real-World Application of ${keyConcepts[0] || 'Key Concepts'}`,
          description: `Design a practical implementation plan for applying ${keyConcepts[0] || 'these concepts'} in your current work environment`,
          points: 30
        }
      ]
    }
  };

  // Add some delay to simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Generated enhanced game with', mediaSearchResult.totalFound, 'media items found');

  return mockGame;
}

// Process upload with AI to generate game
router.post('/process', async (req, res) => {
  try {
    const { uploadId } = z.object({
      uploadId: z.string()
    }).parse(req.body);

    const upload = await prisma.upload.findFirst({
      where: {
        id: uploadId
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    if (!upload.extractedText) {
      return res.status(400).json({ error: 'No text content available for processing' });
    }

    // Check if already processed
    const existingSession = await prisma.gameSession.findFirst({
      where: {
        uploadId: upload.id,
        gameType: 'INTERACTIVE'
      }
    });

    if (existingSession) {
      return res.json({
        gameSessionId: existingSession.id,
        message: 'Game already generated for this upload'
      });
    }

    // Generate game with AI
    const gameData = await generateGameWithAI(upload.extractedText);

    // Save game session to database
    const gameSession = await prisma.gameSession.create({
      data: {
        uploadId: upload.id,
        userId: null,
        title: gameData.title,
        gameType: 'INTERACTIVE',
        gameData: JSON.stringify(gameData)
      }
    });

    // Mark upload as processed
    await prisma.upload.update({
      where: { id: upload.id },
      data: { 
        isProcessed: true,
        processedAt: new Date()
      }
    });

    res.status(201).json({
      gameSessionId: gameSession.id,
      title: gameData.title,
      message: 'Game generated successfully'
    });
  } catch (error) {
    console.error('AI processing error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process with AI' 
    });
  }
});

// Get game by ID
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    console.log('Getting game with ID:', gameId);

    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameId
      },
      include: {
        upload: {
          select: {
            fileName: true,
            fileType: true,
            createdAt: true
          }
        },
        scores: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    console.log('Game session found:', gameSession ? 'YES' : 'NO');

    if (!gameSession) {
      console.log('Game not found for ID:', gameId);
      return res.status(404).json({ error: 'Game not found' });
    }

    console.log('Returning game data for:', gameSession.title);

    res.json({
      gameId: gameSession.id,
      title: gameSession.title,
      gameType: gameSession.gameType,
      gameData: JSON.parse(gameSession.gameData),
      isCompleted: gameSession.isCompleted,
      upload: gameSession.upload,
      lastScore: gameSession.scores[0] || null,
      createdAt: gameSession.createdAt
    });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Submit game score
router.post('/:gameId/score', async (req, res) => {
  try {
    const { gameId } = req.params;
    const scoreData = z.object({
      score: z.number().min(0),
      maxScore: z.number().min(1),
      timeSpent: z.number().min(0),
      correctAnswers: z.number().min(0),
      totalQuestions: z.number().min(1)
    }).parse(req.body);

    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameId
      }
    });

    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Calculate XP and badges
    const percentage = (scoreData.score / scoreData.maxScore) * 100;
    let xpEarned = Math.floor(scoreData.score * 10);
    const badges: string[] = [];

    if (percentage === 100) {
      badges.push('Perfect Score');
      xpEarned += 50; // Bonus XP
    } else if (percentage >= 90) {
      badges.push('Excellence');
      xpEarned += 20;
    } else if (percentage >= 75) {
      badges.push('Great Job');
      xpEarned += 10;
    }

    if (scoreData.timeSpent < 60) {
      badges.push('Speed Learner');
      xpEarned += 15;
    }

    const badgesString = badges.join(',');

    // Save score
    const score = await prisma.score.create({
      data: {
        gameSessionId: gameSession.id,
        userId: null,
        score: scoreData.score,
        maxScore: scoreData.maxScore,
        timeSpent: scoreData.timeSpent,
        correctAnswers: scoreData.correctAnswers,
        totalQuestions: scoreData.totalQuestions,
        xpEarned,
        badges: badgesString
      }
    });

    // No user XP update needed for anonymous users

    // Mark game session as completed
    await prisma.gameSession.update({
      where: { id: gameSession.id },
      data: {
        isCompleted: true,
        completedAt: new Date()
      }
    });

    res.status(201).json({
      scoreId: score.id,
      xpEarned,
      badges,
      percentage: Math.round(percentage),
      message: 'Score submitted successfully'
    });
  } catch (error) {
    console.error('Submit score error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid score data', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

// Get user's game history
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [games, total] = await Promise.all([
      prisma.gameSession.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          upload: {
            select: {
              fileName: true,
              fileType: true
            }
          },
          scores: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.gameSession.count({
        where: { userId: req.user!.id }
      })
    ]);

    res.json({
      games,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

export default router;
