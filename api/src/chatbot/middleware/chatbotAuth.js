export function extractChatbotHeaders(req, res, next) {
  req.chatContext = {
    walletAddress: req.headers['x-wallet-address'] || null,
    userRole: req.headers['x-user-role'] || null
  };
  next();
}
