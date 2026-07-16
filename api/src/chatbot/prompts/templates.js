export const systemPrompt = `
You are Aletheia AI, the official intelligent support assistant for the Aletheia decentralized trade finance platform.

Your primary purpose is to help users understand and interact with Aletheia.
Aletheia is a trade finance platform built on the Stellar blockchain utilizing Soroban smart contracts. It enables exporters to secure early liquidity by tokenizing and fractionalizing receivables for global investors.

OPERATING CONSTRAINTS:
1. ONLY answer questions related to Aletheia, Stellar network, Soroban contracts, and trade finance receivables.
2. If a query is completely unrelated to Aletheia or its ecosystem, politely refuse to answer.
3. ALWAYS use the provided User Profile and Platform Context if available.
4. NEVER invent blockchain transactions, public keys, hashes, or details that are not provided.
5. If information is missing or you cannot determine it from the context, state that honestly. Do not hallucinate.
6. Keep responses clean, concise, helpful, and professional. Format outputs in Markdown.
`;

export function constructContextPrompt({ role, address, kycStatus, items, stats }) {
  let context = `--- USER PROFILE & CONTEXT ---\n`;
  context += `Role: ${role || "Guest"}\n`;
  context += `Stellar Wallet Address: ${address || "Not connected"}\n`;
  
  if (kycStatus) {
    context += `KYC Verification Status: ${kycStatus.status || "None"} (PAN/Identity Verified: ${kycStatus.status === 'approved' ? 'YES' : 'NO'})\n`;
  } else if (address) {
    context += `KYC Verification Status: None/Not started\n`;
  }

  context += `\n--- ACTIVE CONTEXT DATA ---\n`;
  if (role === 'exporter' && items && items.length > 0) {
    context += `Your Receivables (Total: ${items.length}):\n`;
    items.forEach((item, index) => {
      context += `- #${item.id}: ${item.commodity} ($${item.amount_usd.toLocaleString()}) - Status: ${item.status.toUpperCase()} - Maturity: ${item.maturity_date}\n`;
    });
  } else if (role === 'investor' && items && items.length > 0) {
    context += `Your Investments (Total: ${items.length}):\n`;
    items.forEach((item, index) => {
      context += `- Receivable #${item.receivable_id} (${item.commodity}): Purchased share worth $${(item.share_cents / 100).toLocaleString()} (Paid $${(item.payment_cents / 100).toLocaleString()}) - Status: ${item.receivable_status.toUpperCase()} - Maturity: ${item.maturity_date}\n`;
    });
  } else if (role === 'admin') {
    if (items.pendingReceivables && items.pendingReceivables.length > 0) {
      context += `Pending Receivables awaiting attestation/audits (Total: ${items.pendingReceivables.length}):\n`;
      items.pendingReceivables.forEach(item => {
        context += `- #${item.id}: ${item.exporter_name} - ${item.commodity} ($${item.amount_usd.toLocaleString()}) - Document: ${item.doc_filename}\n`;
      });
    } else {
      context += `No pending receivables awaiting audit.\n`;
    }

    if (items.pendingKyc && items.pendingKyc.length > 0) {
      context += `Pending KYC sessions awaiting approval (Total: ${items.pendingKyc.length}):\n`;
      items.pendingKyc.forEach(session => {
        context += `- User: ${session.name} (${session.email}) - Wallet: ${session.wallet_address}\n`;
      });
    } else {
      context += `No pending KYC approvals.\n`;
    }
  }

  if (stats) {
    context += `\n--- ALETHEIA PLATFORM LIVE STATS ---\n`;
    context += `- Total Receivables Tokenized: ${stats.total_receivables || 0}\n`;
    context += `- Total Trade Volume: $${(stats.total_volume || 0).toLocaleString()} USD\n`;
    context += `- Active Funded Volume: $${(stats.active_volume || 0).toLocaleString()} USD\n`;
    context += `- Settled Volume: $${(stats.settled_volume || 0).toLocaleString()} USD\n`;
  }

  return context;
}
