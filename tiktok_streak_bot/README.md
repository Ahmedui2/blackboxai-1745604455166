# TikTok Streak Bot

This is a Node.js bot to automatically manage TikTok streaks by sending messages to users to maintain streaks.

## Features

- Automatically sends messages to maintain streaks.
- Runs continuously on free hosting platforms like Render or Railway.
- Configurable via environment variables.

## Setup

1. Clone the repository.
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   TIKTOK_USERNAME=your_tiktok_username
   TIKTOK_PASSWORD=your_tiktok_password
   ```
4. Run the bot locally:
   ```
   node index.js
   ```

## Deployment

You can deploy this bot on free platforms like Render.com or Railway.app for continuous running.

## Notes

- This bot uses unofficial TikTok APIs or libraries.
- Use responsibly and comply with TikTok's terms of service.
