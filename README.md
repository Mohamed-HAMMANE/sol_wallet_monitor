# Solana Wallet Monitor

A simple, robust Node.js bot that monitors the combined SOL balance of multiple Solana wallets. It sends instant, formatted notifications to a Telegram chat whenever the balance changes.

## Features

*   **Multi-Wallet Support:** Tracks the combined balance of a list of wallet addresses.
*   **Instant Notifications:** Sends a Telegram message detailing the amount received or sent and the new total.
*   **Persistence:** Saves the last known balance to a local file (`last_balance.txt`), so it remembers state even after a restart.
*   **Custom RPC:** Support for custom Solana RPC URLs to avoid public rate limits.
*   **Thresholds:** Optional `DIFF` setting to ignore small changes (dust).

## Prerequisites

*   Node.js (v16 or higher)
*   A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
*   A Telegram Chat ID (where you want to receive alerts)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/sol_wallet_monitor.git
    cd sol_wallet_monitor
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Create a `.env` file in the root directory and add the following:

    ```env
    # Telegram Bot Token (Get from BotFather)
    TELEGRAM_TOKEN=your_telegram_bot_token

    # Your Telegram Chat ID
    CHAT_ID=your_chat_id

    # Comma-separated list of Solana Wallet Addresses to monitor
    WALLETS=Address1...,Address2...

    # (Optional) Minimum balance change to trigger alert (default: 0)
    DIFF=0.001
    ```

## Usage

Start the monitor:

```bash
node walletMonitor.js
```

**Running 24/7:**
For production, it is recommended to use a process manager like `pm2`:

```bash
npm install -g pm2
pm2 start walletMonitor.js --name "sol-monitor"
pm2 save
```

## How it works

The script checks the balances of all configured wallets every 30 seconds.
1.  Fetches current balance from Solana blockchain.
2.  Compares it with the value stored in `last_balance.txt`.
3.  If different (and change > `DIFF`), it sends a Telegram alert.
4.  Updates `last_balance.txt`.
