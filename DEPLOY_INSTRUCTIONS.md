# Island Time Dashboard — Deployment Instructions
## One-time setup (~15 minutes). Never repeat after that.

---

## STEP 1 — Get your Notion API Key

1. Go to https://www.notion.so/my-integrations
2. Click **New integration**
3. Name it: `Island Time Dashboard`
4. Click **Submit**
5. Copy the **Internal Integration Token** — it starts with `secret_...`
6. Keep this somewhere safe — you'll need it in Step 4

Then give the integration access to your databases:
1. Open your **Island Time KPIs** database in Notion
2. Click the **...** menu (top right) → **Add connections** → select `Island Time Dashboard`
3. Repeat for **Island Time Tracker** database

---

## STEP 2 — Create a GitHub account (if you don't have one)

1. Go to https://github.com/signup
2. Create a free account
3. That's it — you don't need to know how to use GitHub

---

## STEP 3 — Upload the deploy folder to GitHub

1. Go to https://github.com/new
2. Repository name: `island-time-dashboard`
3. Set to **Private**
4. Click **Create repository**
5. On the next page, click **uploading an existing file**
6. Drag the entire `island_time_deploy` folder contents into the upload area:
   - `index.html`
   - `netlify.toml`
   - `netlify/functions/notion-data.js`
7. Click **Commit changes**

---

## STEP 4 — Deploy to Netlify

1. Go to https://app.netlify.com and sign up with your GitHub account
2. Click **Add new site** → **Import an existing project**
3. Click **GitHub** → authorize Netlify
4. Select `island-time-dashboard` repository
5. Leave all build settings as default
6. Click **Deploy site**
7. Netlify gives you a URL like `https://amazing-name-123.netlify.app`

---

## STEP 5 — Add your Notion API Key to Netlify

This is the step that keeps your key secure — it never touches the code.

1. In Netlify, go to your site → **Site configuration** → **Environment variables**
2. Click **Add a variable**
3. Key: `NOTION_API_KEY`
4. Value: paste your `secret_...` token from Step 1
5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## STEP 6 — Share the URL

Send `https://your-site-name.netlify.app` to your team.

They bookmark it once. That's the only URL they ever need.

---

## Every Monday after your generator run

Nothing changes about your workflow. You run the generator, push KPIs to Notion with your uploader — the dashboard at that URL automatically shows the new data the next time anyone opens it.

**You never redeploy. You never touch Netlify again.**

The only time you'd update Netlify is if the dashboard template itself changes (new features, layout updates). That's rare.

---

## What your team sees

- Full Performance & Change Dashboard — all flags, all tiles, all units
- Both snapshots: 5/4/26 and 4/27/26 (switcher in the header)
- Change Tracker with all entries from Notion
- Live data — always the latest weekly push
- Works on any device, any browser, no login required

---

## Troubleshooting

**Dashboard loads but shows no data**
→ Check that your Notion integration has access to both databases (Step 1)
→ Check that NOTION_API_KEY is set correctly in Netlify (Step 5)

**"KPI fetch failed" error**
→ Your Notion API key may be wrong — re-check Step 1 and Step 5

**Change Tracker is empty**
→ The Tracker database field names need to match exactly — contact support

---

*Island Time — Rev & Research | Dashboard Deploy Instructions*
