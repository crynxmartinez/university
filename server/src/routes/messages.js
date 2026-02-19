import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    // Get participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantIds = conv.participantIds.filter(id => id !== userId)
        const participants = await prisma.user.findMany({
          where: {
            id: {
              in: otherParticipantIds
            }
          },
          include: {
            profile: true
          }
        })

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readBy: { hasNot: userId }
          }
        })

        return {
          ...conv,
          participants,
          unreadCount,
          lastMessage: conv.messages[0] || null
        }
      })
    )

    res.json(conversationsWithDetails)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// Create or get conversation
router.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { participantIds } = req.body
    const userId = req.user.userId

    // Include current user in participants
    const allParticipants = [...new Set([userId, ...participantIds])].sort()

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participantIds: { hasEvery: allParticipants } },
          { participantIds: { isEmpty: false } }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            sender: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })

    if (existingConversation) {
      return res.json(existingConversation)
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        participantIds: allParticipants,
        type: allParticipants.length > 2 ? 'GROUP' : 'DIRECT'
      },
      include: {
        messages: true
      }
    })

    res.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// Get messages in a conversation
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { limit = 50, before } = req.query

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })

    if (!conversation || !conversation.participantIds.includes(userId)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...(before && { createdAt: { lt: new Date(before) } })
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit)
    })

    res.json(messages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// Send a message
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const userId = req.user.userId

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })

    if (!conversation || !conversation.participantIds.includes(userId)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content,
        readBy: [userId] // Sender has read their own message
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        }
      }
    })

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: new Date() }
    })

    res.json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// Mark message as read
router.put('/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const message = await prisma.message.findUnique({
      where: { id }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Add user to readBy array if not already there
    if (!message.readBy.includes(userId)) {
      await prisma.message.update({
        where: { id },
        data: {
          readBy: {
            push: userId
          }
        }
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error marking message as read:', error)
    res.status(500).json({ error: 'Failed to mark message as read' })
  }
})

// Mark all messages in conversation as read
router.put('/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Verify user is participant
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    })

    if (!conversation || !conversation.participantIds.includes(userId)) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Get all unread messages
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        readBy: { hasNot: userId }
      }
    })

    // Mark all as read
    await Promise.all(
      unreadMessages.map(msg =>
        prisma.message.update({
          where: { id: msg.id },
          data: {
            readBy: {
              push: userId
            }
          }
        })
      )
    )

    res.json({ success: true, markedCount: unreadMessages.length })
  } catch (error) {
    console.error('Error marking conversation as read:', error)
    res.status(500).json({ error: 'Failed to mark conversation as read' })
  }
})

export default router
