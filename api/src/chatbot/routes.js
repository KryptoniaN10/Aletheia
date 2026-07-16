import express from 'express';
import { chatbotController } from './controller/chatbotController.js';
import { extractChatbotHeaders } from './middleware/chatbotAuth.js';

const router = express.Router();

router.post('/', extractChatbotHeaders, chatbotController.chat);

export default router;
