export function parseChatRequest(req) {
  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('Message is required and must be a valid string.');
  }

  return {
    message: message.trim(),
    history: Array.isArray(history) ? history : []
  };
}
