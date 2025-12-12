const solanaWeb3 = require('@solana/web3.js');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();
const fs = require('fs');
const BALANCE_FILE = 'last_balance.txt';

// === CONFIGURATION ===
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const WALLETS = process.env.WALLETS;
const DIFF = parseFloat(process.env.DIFF) || 0;

const bot = new TelegramBot(TELEGRAM_TOKEN);
const connection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl('mainnet-beta'),
  { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }
);

const WALLET_ADDRESSES = WALLETS.split(",").map(w => w.trim());
const publicKeys = WALLET_ADDRESSES.map(addr => new solanaWeb3.PublicKey(addr));

function loadLastCombinedBalance() {
  if (fs.existsSync(BALANCE_FILE)) {
    const val = fs.readFileSync(BALANCE_FILE, 'utf8');
    const num = parseFloat(val);
    if (!isNaN(num)) return num;
  }
  return null;
}

function saveLastCombinedBalance(balance) {
  fs.writeFileSync(BALANCE_FILE, balance.toString(), 'utf8');
}

let lastCombinedBalance = loadLastCombinedBalance();

async function getSolBalance(pubkey) {
  const lamports = await connection.getBalance(pubkey);
  return lamports / solanaWeb3.LAMPORTS_PER_SOL;
}

async function checkCombinedBalance() {
  try {
    const balances = await Promise.all(
      publicKeys.map(pk => getSolBalance(pk))
    );
    const combined = balances.reduce((sum, bal) => sum + bal, 0);

    if (lastCombinedBalance === null) {
      lastCombinedBalance = combined;
      saveLastCombinedBalance(combined);
      console.log(`Initial balance: ${combined.toFixed(5)} SOL`);
      return;
    }

    if (combined !== lastCombinedBalance) {
      const diff = combined - lastCombinedBalance;

      const formattedDiff = (diff > 0 ? '+' : '') + diff.toFixed(5);
      console.log(`✅ Alert sent: ${formattedDiff} | New: ${combined.toFixed(5)} SOL`);
      
      if (Math.abs(diff) < DIFF) {
        return;
      }
      const emoji = diff > 0 ? '🟢 Received' : '🔴 Sent';

      const message = `
🔔 *Balance Update Detected*

${emoji} *Change:* \`${formattedDiff} SOL\`
💰 *New Total:* \`${combined.toFixed(5)} SOL\`

────────────────
📅 _${new Date().toLocaleString()}_
      `.trim();

      await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });

      lastCombinedBalance = combined;
      saveLastCombinedBalance(combined);
    }
  } catch (e) {
    console.error('❌ Error checking balance:', e.message);
  }
}

// === LOOP ===
async function loop() {
  await checkCombinedBalance();
  setTimeout(loop, 30_000); // Wait 30s AFTER the previous check finishes
}
loop();
