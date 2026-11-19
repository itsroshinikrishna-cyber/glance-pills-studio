# Deploy Glance Pills Studio (step by step, no experience needed)

Plan: **GitHub** (already done) holds the code, **Vercel** turns it into a live website, **Blob storage** keeps everyone's images and cards, and an **OpenAI key** (optional) lets the Generate page make images. Allow about 20 minutes.

## What you need first
| Thing | Where | Needed for |
|---|---|---|
| GitHub account (you have one) | github.com | holds the code |
| Vercel account | vercel.com → **Sign Up → Continue with GitHub** | hosts the site |
| OpenAI API key | platform.openai.com → **API keys** (needs billing switched on) | only the Generate page. Skip it if you don't need image generation yet. |

> Heads-up: Vercel's free **Hobby** plan is for personal, non-commercial use. If this is for company work, use a **Pro** plan or your company's Vercel team, and check with your IT/security team before putting company images on a new account.

---

## Step 1. Your code is already on GitHub
Nothing to do. It lives in your repo **itsroshinikrishna-cyber/glance-pills-studio** on the `main` branch.

## Step 2. Create the Vercel project
1. Go to **vercel.com/new**.
2. Find **glance-pills-studio** and click **Import**. If it's missing, click **Adjust GitHub App Permissions** and allow it.
3. Leave **Root Directory** empty. The app is at the top of the repo.
4. **Framework Preset** → **Other**. Leave Build Command and Output Directory empty.
5. Click **Deploy**. After about a minute you get a link like `https://something.vercel.app`.

The site now loads, but **nothing is shared yet**. Steps 3 and 4 fix that.

## Step 3. Turn on shared storage (Blob)
1. In your Vercel project, open the **Storage** tab.
2. Click **Create** → choose **Blob**.
3. When asked, choose **Public** access. *(Private won't work, the app needs public image links.)*
4. Give it any name, click **Create**, then **Connect to Project** (all environments).

This adds the secret `BLOB_READ_WRITE_TOKEN` for you automatically.

## Step 4. Add your passcode and image key
In the project, go to **Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `STUDIO_PASSCODE` | a passcode you choose (stops strangers from uploading, deleting or spending your image credits) |
| `OPENAI_API_KEY` | your key from OpenAI (skip if you aren't generating images yet) |

Leave "All Environments" ticked and click **Save** on each.

## Step 5. Redeploy (needed so the new settings take effect)
**Deployments** tab → click the **⋯** next to the latest one → **Redeploy** → **Redeploy**.

## Step 6. Check that it all works
Open your Vercel link and tick each one:
- [ ] The top right of the Studio says **"Shared with everyone"** (not "Saved in this browser only").
- [ ] **Library → Mascots:** upload a mascot PNG. It appears in the grid.
- [ ] **Studio:** open a card, upload an image, see 3 gradient options. Click **Download PNG**.
- [ ] **Bulk:** drop 3 images, paste 3 lines of copy, click **Create cards**. They open in the Studio.
- [ ] **Generate:** pick a pill, fill the fields, click **Generate**. An image appears (needs the OpenAI key).
- [ ] Open the link on your phone or in a private window. You should see the same cards.

## Step 7. Lock it down (recommended)
**Settings → Deployment Protection → Vercel Authentication → On.** Now only people signed in to your Vercel team can open the site. Turn it off if you want anyone with the link (plus the passcode) to use it.

## Step 8. Share with your team
Send them the link and the passcode. The first time they upload or edit, the browser asks for the passcode once.

- **Studio:** edit one card at a time
- **Bulk:** many images + copy at once
- **Library:** shared images and mascots
- **Generate:** make images for the three pills

---

## If something goes wrong
| What you see | Fix |
|---|---|
| 404 page | Check Settings → General: **Root Directory** must be empty and **Framework Preset** must be **Other**, then redeploy |
| "Saved in this browser only" or "Shared storage isn't connected" | Do Step 3, then Step 5 (redeploy) |
| Uploads fail with "Library error" | Your Blob store is **Private**. Create a new **Public** one and connect it |
| Asks for a passcode again and again | You typed it wrong. Clear it by opening your browser's site settings for the page, or use a private window |
| Generate says "isn't switched on" | Add `OPENAI_API_KEY` (Step 4), then redeploy |
| Generate errors mentioning "verification" | OpenAI may require organization verification for its image model. Do this in your OpenAI account settings |
| Changes you made in GitHub don't show | Make sure they are on **main**. Vercel redeploys on its own within a minute or two |

## Costs
- **Vercel:** Hobby is free; Pro is per seat. Blob has a free allowance, then small usage charges.
- **OpenAI:** you pay per generated image (a few cents each at medium quality; check OpenAI's pricing page). The passcode and a spending limit in your OpenAI account protect you.

## Updating the site later
Edit or ask for changes, merge to `main`, and Vercel redeploys by itself. You don't repeat these steps.

## Things worth doing after launch
1. Upload your real **mascot PNGs** (transparent backgrounds) to Library → Mascots.
2. Upload one image to your **Palette Extractor** and to the Studio and compare the hex values.
3. Send your real copy lines to tune the auto-split rules for the small line / headline / subline.
4. Keep a backup: Studio → **Download all (ZIP)** now and then.
