import { parseChatRequest } from '../dto/chatDto.js';
import { chatbotService } from '../service/chatbotService.js';

export const chatbotController = {
  async chat(req, res, next) {
    try {
      const { message, history } = parseChatRequest(req);
      const { walletAddress, userRole } = req.chatContext;

      const result = await chatbotService.handleChat({
        message,
        history,
        role: userRole,
        address: walletAddress
      });

      res.status(200).json(result);
    } catch (err) {
      res.status(err.message.includes('required') ? 400 : 500).json({
        error: err.message || 'Internal server error'
      });
    }
  }
};
