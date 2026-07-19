export const staticKnowledge = {
  platform: {
    name: "Aletheia",
    tagline: "Truth in Trade, Trust in Time",
    mission: "To eliminate the months-long liquidity gaps for exporters by turning verified receivables into tokenized assets on the Stellar blockchain, revealing truth to investors and accelerating trust for exporters.",
    coreFeatures: [
      "Soroban Smart Escrow: Secure automated yield distribution and principal protection.",
      "Attestations: Multi-sig verifications by logistics, NBFC, and export council entities before listing.",
      "Fractionalization: Breaking large trade invoices into smaller fractional tokens for retail and institutional buyers.",
      "KYC Compliance: Integration of compliance layers (like SEP-24) to keep capital secure and regulated."
    ]
  },
  workflows: {
    exporter: {
      steps: [
        "1. Click 'Login' and choose or register an Exporter Profile.",
        "2. Go to the Exporter Portal and upload a shipping bill or bill of lading (PDF format).",
        "3. Wait for the document to be SHA-256 hashed and pinned on IPFS. The hash will be registered on the Soroban registry contract.",
        "4. Auditor entities (Logistics and Export Council) will verify and attest the document on-chain.",
        "5. Once attested (requires at least 2 attestations), set the desired discount rate (BPS) and list the receivable on the marketplace.",
        "6. Receive instant capital (USDC) from investors once subscribed, and settle the invoice with the overseas buyer at maturity."
      ]
    },
    investor: {
      steps: [
        "1. Click 'Login' and choose or register an Investor Profile.",
        "2. Complete the basic KYC information (Name, Email, PAN/Identity) to get approved.",
        "3. Connect your Stellar Freighter wallet.",
        "4. Navigate to the Marketplace and browse active trade receivables listed by Kerala exporters.",
        "5. Buy fractional shares of the invoice using USDC (paying a discounted price).",
        "6. Earn yields (up to 10-15% APY) when the overseas buyer pays the invoice at maturity and the oracle distributes the funds."
      ]
    },
    auditor: {
      steps: [
        "1. Access the Admin Panel using the credentials admin/admin.",
        "2. Locate pending receivables in the checklist.",
        "3. Review the documents and click to attest as Logistics (freight verification) or Export Council (Spices Board/Cooperative verification).",
        "4. Confirm payment collections when SWIFT payment transfers are verified, triggering smart contract distributions."
      ]
    }
  },
  faqs: [
    {
      keywords: ["what is aletheia", "about aletheia", "who is aletheia"],
      answer: "Aletheia is a decentralized trade finance platform built on the Stellar network. We help Kerala's exporters unlock instant working capital by tokenizing verified invoices and letting global investors purchase fractional shares of them."
    },
    {
      keywords: ["how does it work", "how tokenization works", "process", "workflow", "how does tokenization work"],
      answer: "Exporters upload trade receivables (invoices/shipping bills) to Aletheia. The files are securely pinned to IPFS, and their cryptographic hash is recorded on-chain. Independent auditors (logistics partners and export councils) attest to the validity of the trade. Once attested, the receivable is listed on the marketplace for investors to buy fractional shares. At maturity, when the overseas buyer pays, funds are distributed back to investors with yield."
    },
    {
      keywords: ["what is soroban", "stellar blockchain", "smart contract", "why stellar"],
      answer: "Stellar is a blockchain designed for fast, low-cost financial transactions. Soroban is Stellar's WebAssembly (WASM)-based smart contract platform. Aletheia uses Soroban smart contracts to implement secure escrow vaults, fractional token registry, and automated multi-sig verification, ensuring absolute safety for investor funds."
    },
    {
      keywords: ["how to invest", "investing", "buy share", "marketplace yield", "browse receivables", "how do i browse", "browse invoice"],
      answer: "To invest, register as an Investor, complete the KYC verification form, and connect your Freighter wallet. You can then browse listed receivables on the Marketplace page, choose one, and purchase fractional shares using USDC. You get a discounted price on entry and collect the full face value at maturity, capturing high-yield trade finance interest (usually 10-15% annualized)."
    },
    {
      keywords: ["kyc", "identity verification", "pan number", "compliance", "what is kyc", "kyc verification"],
      answer: "Aletheia is a compliance-first platform. Investors must complete a basic KYC form providing their name, email, and PAN/Identity number before they are allowed to purchase fractional receivables. In the demo, you can approve pending KYC profiles directly through the Admin Panel."
    },
    {
      keywords: ["freighter", "wallet not detected", "connect wallet", "freighter issue"],
      answer: "Freighter is the official Stellar browser extension wallet. If Freighter is not detected, make sure the browser extension is installed, unlocked, and configured for the Stellar Testnet. On mobile devices, please open Aletheia inside the Freighter app's built-in web browser."
    },
    {
      keywords: ["escrow", "is my money safe", "capital protection"],
      answer: "Yes, security is enforced by smart escrow contracts written in Soroban Rust. Funds are locked in a decentralized multi-sig vault. They can only be released to the exporter once the audit threshold is met, and returned to investors upon maturity verified by off-chain SWIFT payment oracles. Exporters cannot run away with the funds since the contract enforces these strict conditions."
    },
    {
      keywords: ["fee", "discount rate", "bps", "basis points", "how are discounts calculated", "discounts", "calculate discount"],
      answer: "Exporters offer a small discount (expressed in Basis Points or BPS, where 100 BPS = 1%) on their invoices to attract investors. For example, a 500 BPS discount on a $10,000 invoice means investors pay $9,500 on entry and receive $10,000 at maturity, earning a $500 yield."
    },
    {
      keywords: ["upload a shipping bill", "upload shipping bill", "how to upload", "upload bill", "upload invoice"],
      answer: "To upload a shipping bill: 1. Log in and select or register your Exporter Profile. 2. Navigate to the Exporter Dashboard. 3. Click the 'Upload Document' section, select your shipping bill PDF, fill in the metadata (Maturity Date, USD Amount, Buyer, and Discount BPS), and submit. The file is uploaded to IPFS and its hash is recorded on the Soroban ledger for attestation."
    },
    {
      keywords: ["register an account", "how to register", "create account", "sign up", "registration"],
      answer: "To register an account: 1. Click the 'Login' button in the navbar. 2. Switch to the 'Register' tab or choose one of the quick profiles (Exporter, Investor, Admin). 3. Fill in your details (or sign up via Google). 4. If you are an investor, you will also need to complete the KYC verification in your dashboard to start purchasing shares."
    },
    {
      keywords: ["expected yields", "what are the yields", "yields", "interest"],
      answer: "Expected yields represent the return on investment when buying discounted receivables. In Aletheia, the annualized yields typically range from 10% to 15% APY depending on the exporter's rating and the maturity period. You purchase the receivable shares at a discount (e.g. paying $9,500 for a $10,000 share) and collect the full face value upon maturity."
    }
  ]
};
