import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../lib/auth';
import { truncateTextForAI } from '../lib/fileProcessing';
import { searchMediaContent, MediaContent, extractKeyConceptsFromText } from '../lib/mediaService';

const router = Router();

// AI prompt template for generating games
const AI_PROMPT_TEMPLATE = `
You are a senior AI learning designer specializing in multimedia educational experiences. The user has uploaded educational content. Your job is to:

1. Extract the core ideas, topics, and learning objectives from the raw text
2. Identify key visual concepts that would benefit from images, videos, or animations
3. Create an immersive interactive learning module that includes:
   - Rich media content (images, videos, animations) strategically placed to enhance understanding
   - A roleplay simulation with multimedia scenarios where the learner makes choices and receives feedback
   - A creative quiz with visual elements, multiple-choice questions, and detailed explanations
   - Interactive elements like drag-and-drop, hotspots, or mini-games

Return the result in a structured JSON format as shown below:

OUTPUT FORMAT (JSON):
{
  "title": "[Engaging title based on uploaded content]",
  "summary": "[Compelling summary that hooks the learner]",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "visualConcepts": ["Concept that needs visualization", "Another visual concept"],
  "learningObjectives": ["Specific, measurable objective 1", "Objective 2", "..."],
  "mediaContent": {
    "headerImage": {
      "description": "[Description of ideal header image]",
      "searchTerms": ["term1", "term2"],
      "purpose": "introduction"
    },
    "conceptImages": [
      {
        "concept": "[Specific concept]",
        "description": "[What the image should show]",
        "searchTerms": ["term1", "term2"],
        "placement": "section1"
      }
    ],
    "videos": [
      {
        "topic": "[Video topic]",
        "description": "[What the video should demonstrate]",
        "searchTerms": ["term1", "term2"],
        "placement": "introduction"
      }
    ]
  },
  "roleplay": {
    "scenario": "[Immersive scenario with specific context and setting]",
    "backgroundImage": {
      "description": "[Description of scene-setting image]",
      "searchTerms": ["term1", "term2"]
    },
    "steps": [
      {
        "id": "step1",
        "text": "[Rich, detailed situation text with specific context]",
        "mediaContent": {
          "image": {
            "description": "[Image that supports this step]",
            "searchTerms": ["term1", "term2"]
          }
        },
        "choices": [
          {
            "id": "a",
            "label": "[Realistic, specific choice]",
            "feedback": "[Detailed feedback with reasoning and consequences]",
            "nextStep": "step2",
            "points": 10
          },
          {
            "id": "b",
            "label": "[Alternative realistic choice]",
            "feedback": "[Constructive feedback explaining the outcome]",
            "nextStep": "step2",
            "points": 5
          }
        ]
      }
    ]
  },
  "quiz": {
    "theme": "[Creative, engaging theme that matches content]",
    "gameFormat": "visual-challenge",
    "questions": [
      {
        "id": "q1",
        "type": "multiple-choice",
        "question": "[Clear, thought-provoking question]",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answerIndex": 1,
        "explanation": "[Comprehensive explanation with real-world application]",
        "mediaContent": {
          "image": {
            "description": "[Supporting visual for this question]",
            "searchTerms": ["term1", "term2"]
          }
        },
        "difficulty": "medium",
        "points": 10
      },
      {
        "id": "q2",
        "type": "drag-drop",
        "question": "[Interactive question requiring categorization or sequencing]",
        "items": ["Item 1", "Item 2", "Item 3"],
        "categories": ["Category A", "Category B"],
        "correctMapping": {"Item 1": "Category A", "Item 2": "Category B"},
        "explanation": "[Detailed explanation of the correct categorization]",
        "difficulty": "hard",
        "points": 15
      }
    ]
  },
  "gamification": {
    "achievements": [
      {
        "id": "perfect_understanding",
        "name": "Perfect Understanding",
        "description": "Answered all questions correctly",
        "icon": "trophy",
        "condition": "perfect_score"
      }
    ],
    "progressMilestones": ["25%", "50%", "75%", "100%"],
    "bonusChallenges": [
      {
        "title": "[Bonus challenge title]",
        "description": "[What the learner needs to do]",
        "points": 20
      }
    ]
  }
}

Create an experience that is:
- Visually rich and engaging
- Pedagogically sound with clear learning progression
- Interactive and hands-on
- Memorable and impactful
- Adaptive to different learning styles

Use conversational but clear tone. Focus on deep understanding, practical application, and retention.

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
    mediaContent: {
      headerImage: {
        url: mediaSearchResult.images[0]?.url || 'https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=1200&q=80',
        altText: mediaSearchResult.images[0]?.altText || `Visual introduction to ${keyConcepts[0] || 'learning'}`,
        description: `Engaging visual that represents the core concepts of ${mainTopic}`,
        searchTerms: keyConcepts.slice(0, 2),
        purpose: "introduction"
      },
      conceptImages: mediaSearchResult.images.slice(1, 3).map((img, index) => ({
        concept: keyConcepts[index] || `Concept ${index + 1}`,
        url: img.url,
        altText: img.altText,
        description: `Visual explanation of ${keyConcepts[index] || `concept ${index + 1}`}`,
        searchTerms: [keyConcepts[index] || 'concept'],
        placement: `section${index + 1}`
      })),
      videos: mediaSearchResult.videos.slice(0, 2).map((vid, index) => ({
        topic: `${keyConcepts[index] || 'Key concept'} in action`,
        url: vid.url,
        altText: vid.altText,
        description: `Educational video demonstrating ${keyConcepts[index] || 'practical application'}`,
        searchTerms: [keyConcepts[index] || 'application'],
        placement: index === 0 ? "introduction" : "demonstration"
      }))
    },
    roleplay: {
      scenario: `You are a professional working in a field where ${keyConcepts[0] || 'these concepts'} are crucial for success. Your organization is facing a challenging situation that requires you to apply the principles you've learned.`,
      backgroundImage: {
        url: mediaSearchResult.images[3]?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        altText: mediaSearchResult.images[3]?.altText || 'Professional workplace scenario',
        description: `Realistic workplace setting where ${keyConcepts[0] || 'concepts'} are applied`,
        searchTerms: [keyConcepts[0] || 'workplace', 'professional']
      },
      steps: [
        {
          id: "step1",
          text: `A critical situation has emerged in your organization that directly relates to ${keyConcepts[0] || 'the concepts you\'ve studied'}. Stakeholders are looking to you for guidance. What's your initial approach?`,
          mediaContent: {
            image: {
              url: mediaSearchResult.images[1]?.url || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80',
              altText: 'Team meeting and discussion',
              description: `Visual representation of decision-making in ${keyConcepts[0] || 'professional'} context`,
              searchTerms: [keyConcepts[0] || 'decision', 'meeting']
            }
          },
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
          mediaContent: {
            image: {
              url: mediaSearchResult.images[2]?.url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80',
              altText: 'Complex problem solving',
              description: 'Visual showing adaptive problem-solving and complexity management',
              searchTerms: [keyConcepts[1] || 'complexity', 'adaptation']
            }
          },
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
          mediaContent: {
            image: {
              url: mediaSearchResult.images[0]?.url || 'https://images.unsplash.com/photo-1553895501-af9e282e7fc1?w=400&q=80',
              altText: `Visual representation of ${keyConcepts[0] || 'theory-practice'} integration`,
              description: `Diagram showing the relationship between theory and practice in ${keyConcepts[0] || 'professional applications'}`,
              searchTerms: [keyConcepts[0] || 'theory', 'practice']
            }
          },
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
          mediaContent: {
            image: {
              url: mediaSearchResult.images[1]?.url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
              altText: 'Ethical decision-making process',
              description: `Visual guide to ethical reasoning in ${keyConcepts[1] || 'professional'} contexts`,
              searchTerms: [keyConcepts[1] || 'ethics', 'decision-making']
            }
          },
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
