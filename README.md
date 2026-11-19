# Glance Pills Studio

Team tool for making Glance chat starter pills to the visual system. Three pages:

| Page | What it does |
|---|---|
| **Studio** (`/`) | Build cards. Anyone can upload or pick an image, edit the copy, choose a mascot, and export PNGs. Cards are shared: everyone sees and can edit the same set. |
| **Bulk** (`/bulk`) | Drop many images and paste or upload the copy (Excel, CSV or lines). Images are matched to copy by order or by file name, previewed as real cards, then created in one click. Each card opens in the Studio to fine-tune, with Prev/Next to step through the batch. |
| **Mascots** (`/mascots`) | Emoji-style mascot dashboard: click a mascot to copy it, search, drop files to add more. |
| **Library** (`/library`) | Image and mascot library. Anyone can upload, reuse, copy links or delete. |
| **Prompts** (`/generate`) | Prompt builder for the three photo pills: pick an idea or fill in the fields, check the guidelines, copy the prompt, and paste it into ChatGPT or Magnific. The site does not generate images. |

The three pills, each with a different focus:
1. **Contre-jour beauty close-ups**: light and texture (premium, cinematic)
2. **Playful conceptual portraits**: expression and twist (fun, human)
3. **Hero product still life**: product and place (clean, product-led)

Gradient colours are picked from each image with an Android-Palette-style extractor (`public/palette.js`): every image gets
3 suggested options (Option 1 is applied by default), plus the full Dominant / Vibrant / Muted palette and a custom colour.

Card rules are built in: 9:16 (170x310), 4:5 (170x212) and 1:1 prompt cards (170x170), DM Sans semibold/black,
bottom-left or bottom-right text only, max 7 words, square corners, four brand colours. PNGs export at 4x.

## Deploy on Vercel
**New to this? Follow [DEPLOY.md](DEPLOY.md)**, a step-by-step guide. The short version:

1. Import the repo, leave Root Directory empty, framework preset **Other** (no build step).
2. **Storage → Create → Blob** and connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`, which turns on the shared library and shared cards.
3. Add environment variables:
   - `ANTHROPIC_API_KEY` *(optional)*: switches on the AI "Suggest 3 ideas" box on the Prompts page (model `claude-haiku-5-5`; override with `IDEAS_MODEL`).
   - `STUDIO_PASSCODE` *(recommended)*: when set, uploads, edits, deletes and AI ideas need this passcode (people are asked once per browser). Viewing stays open.
4. Redeploy. Also consider Vercel **Deployment Protection** (SSO) so only your team can open the site.

Without Blob configured the Studio still works, saving cards in each person's own browser only.

## Run locally
```bash
MOCK_GENERATE=1 node dev-server.js   # http://localhost:3000, data in ./.data, canned AI ideas
```

## Notes
- Cards use last-save-wins: if two people edit the same card at once, the later save replaces the earlier one.
- The site only builds prompts. Images are made outside it (ChatGPT, Magnific) and then uploaded to the Studio, Bulk or the Library.
- The AI idea box calls `api/ideas.js`. It is text only and is hidden unless `ANTHROPIC_API_KEY` is set.

## Bulk upload sheet format
The Bulk page reads Excel (`.xlsx`, `.xls`), CSV (comma or semicolon) and pasted text. It finds the header row even with
title rows above it, picks the sheet with card columns (with a sheet picker for multi-sheet workbooks), tells you which columns
it used and ignored, and lists any image names that don't match. Your copy and settings are remembered in the browser.

Paste from Excel/Sheets, upload `.xlsx` / `.csv`, or type one card per line (`kicker | headline | subline`).
With a header row you can set per-card values: `image, kicker, headline, sub, segment, category, align, format, treatment, gradient` (1, 2 or 3).
Use `\n` inside a cell for a line break. A template CSV is downloadable on the page.
