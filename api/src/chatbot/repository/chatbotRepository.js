import { getDb } from '../../db/schema.js';

export const chatbotRepository = {
  getKycStatus(walletAddress) {
    try {
      const db = getDb();
      return db.prepare("SELECT * FROM kyc_sessions WHERE wallet_address = ?").get(walletAddress);
    } catch (e) {
      console.error('[Chatbot Repo] getKycStatus error', e);
      return null;
    }
  },

  getExporterReceivables(walletAddress) {
    try {
      const db = getDb();
      return db.prepare("SELECT * FROM receivables WHERE exporter_address = ? ORDER BY created_at DESC").all(walletAddress);
    } catch (e) {
      console.error('[Chatbot Repo] getExporterReceivables error', e);
      return [];
    }
  },

  getInvestorInvestments(walletAddress) {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT i.*, r.amount_usd, r.commodity, r.status as receivable_status, r.maturity_date 
        FROM investments i 
        JOIN receivables r ON i.receivable_id = r.id 
        WHERE i.investor_address = ?
        ORDER BY i.invested_at DESC
      `).all(walletAddress);
    } catch (e) {
      console.error('[Chatbot Repo] getInvestorInvestments error', e);
      return [];
    }
  },

  getPendingReceivables() {
    try {
      const db = getDb();
      return db.prepare("SELECT * FROM receivables WHERE status = 'pending' ORDER BY created_at DESC").all();
    } catch (e) {
      console.error('[Chatbot Repo] getPendingReceivables error', e);
      return [];
    }
  },

  getPendingKycSessions() {
    try {
      const db = getDb();
      return db.prepare("SELECT * FROM kyc_sessions WHERE status = 'pending' ORDER BY started_at DESC").all();
    } catch (e) {
      console.error('[Chatbot Repo] getPendingKycSessions error', e);
      return [];
    }
  },

  getPlatformStats() {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT 
          COUNT(*) as total_receivables,
          SUM(amount_usd) as total_volume,
          SUM(CASE WHEN status = 'active' THEN amount_usd ELSE 0 END) as active_volume,
          SUM(CASE WHEN status = 'settled' THEN amount_usd ELSE 0 END) as settled_volume
        FROM receivables
      `).get();
    } catch (e) {
      console.error('[Chatbot Repo] getPlatformStats error', e);
      return null;
    }
  }
};
