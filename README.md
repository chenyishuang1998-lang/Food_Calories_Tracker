# Calorie 🍜

A minimal calorie tracker PWA. Log what you eat, snap a photo for AI-powered recognition, and review your history in a calendar view.

## Features

- 📝 Log meals by category — breakfast, lunch, dinner, snack
- 📷 Photo recognition — snap a picture and AI identifies food and estimates calories
- 📊 Daily ring progress with remaining/over-goal indicator
- 📅 Calendar view with 14-day trend chart and day-by-day history
- 📱 Installable on iPhone and Android as a home screen app (PWA)
- 🔒 All data stored locally on your device — nothing is uploaded

---

## Deploy to Vercel (free)

### 1. Upload to GitHub

1. Go to [github.com](https://github.com) and sign in or create an account
2. Click **+** in the top right → **New repository**
3. Give it a name (e.g. `calorie`), then click **Create repository**
4. Drag all files from this folder into the GitHub upload page and commit

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project** and select your repository
3. Click **Deploy** — it takes about a minute
4. You'll get a live URL like `calorie.vercel.app` — that's your app

### 3. Install on your phone

**iPhone:** Open the URL in Safari → tap the Share button → **Add to Home Screen** → **Add**

**Android:** Open in Chrome → tap the menu (⋮) → **Add to Home Screen**

---

## Photo recognition (AI)

This feature requires an Anthropic API key.

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in
2. Navigate to **API Keys** → click **Create Key** and copy it
3. In the app, tap the ⚙️ icon → paste your key under **Anthropic API Key** → **Save**
4. Tap the camera button to snap or upload a photo — AI will fill in the food and calories automatically

> Your API key is stored only in your browser's local storage and is never sent anywhere except directly to Anthropic's API.

---

## Local development

No build tools needed. Just open `index.html` in a browser.

```
open index.html
```
