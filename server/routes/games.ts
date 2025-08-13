import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../lib/auth';
import { truncateTextForAI } from '../lib/fileProcessing';

const router = Router();

// AI prompt template for generating games
const AI_PROMPT_TEMPLATE = `
You are a senior AI learning designer. The user has uploaded educational content. Your job is to:

1. Extract the core ideas, topics, and learning objectives from the raw text
2. Create an interactive game that includes:
   - A roleplay simulation where the learner makes choices and receives feedback
   - A creative quiz with a theme, multiple-choice questions, and explanations

Return the result in a structured JSON format as shown below:

OUTPUT FORMAT (JSON):
{
  "title": "[Title based on uploaded content]",
  "summary": "[Short summary of the document]",
  "learningObjectives": ["Objective 1", "Objective 2", "..."],
  "roleplay": {
    "scenario": "[Brief scenario putting learner in a role]",
    "steps": [
      {
        "id": "step1",
        "text": "[Situation text]",
        "choices": [
          {
            "id": "a",
            "label": "[Choice text]",
            "feedback": "[Feedback after selecting this option]",
            "nextStep": "step2"
          },
          {
            "id": "b",
            "label": "[Choice text]",
            "feedback": "[Feedback]",
            "nextStep": "step2"
          }
        ]
      },
      {
        "id": "step2",
        "text": "[Next decision point]",
        "choices": [
          {
            "id": "a",
            "label": "[Choice]",
            "feedback": "[Feedback]",
            "nextStep": null
          }
        ]
      }
    ]
  },
  "quiz": {
    "theme": "[Fun theme for quiz experience]",
    "questions": [
      {
        "id": "q1",
        "question": "[Question text]",
        "options": ["Option A", "Option B", "Option C"],
        "answerIndex": 1,
        "explanation": "[Short explanation of answer]"
      }
    ]
  }
}

Use conversational but clear tone. The output should be engaging and accurate. Focus on deep understanding rather than memorization.

CONTENT TO PROCESS:
`;

// Mock AI processing function (replace with actual OpenAI/Claude API call)
async function generateGameWithAI(text: string): Promise<any> {
  // Truncate text to fit in AI context window
  const processedText = truncateTextForAI(text, 6000);
  
  // In production, replace this with actual AI API call
  // const response = await openai.chat.completions.create({
  //   messages: [{ role: "user", content: AI_PROMPT_TEMPLATE + processedText }],
  //   model: "gpt-4",
  //   temperature: 0.7,
  // });
  // return JSON.parse(response.choices[0].message.content);
  
  // Mock response for development
  const mockGame = {
    title: `Interactive Learning: ${text.split(' ').slice(0, 5).join(' ')}...`,
    summary: "A comprehensive learning experience based on your uploaded content.",
    learningObjectives: [
      "Understand key concepts from the material",
      "Apply knowledge through interactive scenarios",
      "Test comprehension with engaging quizzes"
    ],
    roleplay: {
      scenario: "You are a student applying the concepts from this material in a real-world scenario.",
      steps: [
        {
          id: "step1",
          text: "You encounter a situation where you need to apply what you've learned. What's your approach?",
          choices: [
            {
              id: "a",
              label: "Apply the theoretical framework directly",
              feedback: "Good start! Theoretical knowledge provides a solid foundation.",
              nextStep: "step2"
            },
            {
              id: "b",
              label: "Consider the practical constraints first",
              feedback: "Wise approach! Real-world application often requires adapting theory to practice.",
              nextStep: "step2"
            },
            {
              id: "c",
              label: "Seek additional information before proceeding",
              feedback: "Thoughtful! Gathering more context can lead to better decisions.",
              nextStep: "step2"
            }
          ]
        },
        {
          id: "step2",
          text: "As you implement your approach, you face an unexpected challenge. How do you adapt?",
          choices: [
            {
              id: "a",
              label: "Revise your strategy based on new information",
              feedback: "Excellent! Adaptability is key to successful problem-solving.",
              nextStep: null
            },
            {
              id: "b",
              label: "Stick to your original plan",
              feedback: "Sometimes persistence pays off, but flexibility often leads to better outcomes.",
              nextStep: null
            }
          ]
        }
      ]
    },
    quiz: {
      theme: "Knowledge Quest",
      questions: [
        {
          id: "q1",
          question: "What is the most important takeaway from this material?",
          options: [
            "The specific details and facts",
            "The underlying principles and concepts",
            "The historical context",
            "The practical applications"
          ],
          answerIndex: 1,
          explanation: "While all aspects are important, understanding underlying principles helps you apply knowledge in various contexts."
        },
        {
          id: "q2",
          question: "How would you best apply this knowledge in practice?",
          options: [
            "Memorize all the key points",
            "Practice with similar examples",
            "Teach it to someone else",
            "All of the above"
          ],
          answerIndex: 3,
          explanation: "The best learning comes from multiple approaches: practice, teaching, and reinforcement."
        }
      ]
    }
  };

  // Add some delay to simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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
        userId: req.user!.id,
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
router.get('/:gameId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;

    const gameSession = await prisma.gameSession.findFirst({
      where: {
        id: gameId,
        userId: req.user!.id
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

    if (!gameSession) {
      return res.status(404).json({ error: 'Game not found' });
    }

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
router.post('/:gameId/score', authenticate, async (req: AuthRequest, res) => {
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
        id: gameId,
        userId: req.user!.id
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
        userId: req.user!.id,
        score: scoreData.score,
        maxScore: scoreData.maxScore,
        timeSpent: scoreData.timeSpent,
        correctAnswers: scoreData.correctAnswers,
        totalQuestions: scoreData.totalQuestions,
        xpEarned,
        badges: badgesString
      }
    });

    // Update user XP and level
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (user) {
      const newXP = user.xp + xpEarned;
      const newLevel = Math.floor(newXP / 100) + 1;
      const existingBadges = user.badges ? user.badges.split(',').filter(b => b.length > 0) : [];
      const allBadges = [...new Set([...existingBadges, ...badges])];

      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          xp: newXP,
          level: newLevel,
          badges: allBadges.join(',')
        }
      });
    }

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
