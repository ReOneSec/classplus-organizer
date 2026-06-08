# ClassPlus Organizer — Chrome Extension

> Instant search, bookmarks, revision tracking, and smart organization for ClassPlus recorded lectures.

## Install (Developer Mode)

1. Download and unzip `classplus-organizer.zip`
2. Open Chrome → go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `classplus-organizer` folder
6. The ⚡ icon appears in your toolbar

## First-Time Setup

1. Click the ⚡ icon in the toolbar
2. Open `web.classplusapp.com` in a tab and log in
3. Navigate to your course's recorded lectures page
4. Come back to the extension — it auto-detects your session
5. Click **Fetch Lectures** — it loads all your classes automatically

> **Note:** The extension captures your session token automatically when you browse ClassPlus. No passwords are stored. All data stays on your device.

## Features

| Feature | How to use |
|---|---|
| **Search** | Type in the search bar — results update instantly |
| **Filter by Subject** | Click the colored pills (English, CDP, EVS…) |
| **Filter by Teacher** | Use the Teacher dropdown |
| **Filter by Duration** | Use the Duration dropdown |
| **Sort** | Newest / Oldest / Duration / A–Z |
| **Bookmark** | Click ★ on any card |
| **Change Status** | Right-click (or long-press) a card → Change Status |
| **Assign Subject** | Right-click → Change Subject Tag |
| **Folders** | Right-click → Move to Folder; or click the Folders tab |
| **Recent** | Click the 🕐 Recent tab — last 20 opened |
| **Revision** | Click 🔄 Revision tab — Watching + Revise Later |

## Data & Privacy

- All data stored locally via Chrome Storage API
- No passwords, tokens saved permanently (token auto-expires with session)  
- No external server — 100% local
- Clear all data: Settings → Clear All Data

## Supported Browsers

Chrome, Edge, Brave, Opera (any Chromium-based browser with MV3 support)

## Version

v1.0.0 — Supports batches with 300–1000+ lectures via paginated API fetching
