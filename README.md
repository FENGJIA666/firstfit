# FirstFit

**Make your first impression yours.**

FirstFit helps students build a first-work wardrobe around pieces they already own. Choose interview, workday and after-hours occasions; set a budget; explore a compact shopping plan; and see garments on a model through YouCam AI Clothes V4.

## Run locally

Requires Node.js 22 or later and npm.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5193**. The API runs at **http://127.0.0.1:5194**. Both bind to the local machine. The web server uses a strict port so it will report a conflict instead of silently switching projects.

The planner, recorded examples, saved styling shortlist and Markdown export work without an API key. For a fresh checkout, copy `.env.example` to `.env` and configure the server locally:

```dotenv
YOUCAM_API_KEY=your_key_here
YOUCAM_LIVE_ENABLED=true
PORT=5194
YOUCAM_MAX_TASKS_PER_SESSION=10
```

Keep `.env` private. It is excluded from Git. The browser never receives the key. The V2 workflow requires the API key; a separately issued secret key is not used by this implementation. Setting `YOUCAM_LIVE_ENABLED=false` keeps the personalized generation button inactive.

Each successful V4 result costs API units. The authenticated feature-cost endpoint returned **2 units per result** during the October 24, 2026 check. The app does not purchase units. The local session cap bounds accepted generation attempts; restarting the local API resets that cap. Event credits fund the public demo, and the app never purchases credits. The public judging experience has no account requirement or application request-count limit.

## Explore the experience

1. Keep the default Oxford shirt, tailored trousers and sneakers selected.
2. Set a budget of **S$101** and select all three occasions. The result adds a **S$59 blazer + S$42 loafers**, covering **3 occasions with 4 unique clothing combinations and 5 occasion looks**.
3. Change the budget to S$100, or mark the blazer as already owned, to see the plan respond. The planner never exceeds the budget.
4. Open a look. Recorded examples include source comparison. In the live tab, **Use fictional demo model + matching garment** loads original demo inputs locally. Confirm permission and click **Generate my preview** to send the selected photos to YouCam.
5. Save a successful live preview, close the studio, and open **Saved**. Compare it with its source and with the recorded looks; remove entries individually.
6. Download the shopping plan as Markdown.

The default catalog has ten concept items with illustrative integer SGD prices. The checklist is for planning, and contains no retailer checkout or live inventory claim. Styles are curated explicit outfit rules.

## How the planner works

The solver exhaustively enumerates subsets of unowned catalog items, counts owned pieces at zero incremental cost, and compares these objectives in order:

1. Cover the greatest number of requested occasions.
2. Add the fewest new items.
3. Minimize the cost of those items.
4. Maximize unique clothing combinations.

Each purchase SKU is charged once. A unique combination is a sorted set of clothing IDs; the same combination can have separate workday and after-hours styling cards. Invalid budgets become zero, and unknown wardrobe IDs are ignored. Source: `src/lib/optimizer.ts` and `src/lib/catalog.ts`.

## Image and result provenance

- **Original fictional model / concept garments:** original image-generated inputs; source records are under `media/source/`.
- **Recorded YouCam result:** actual V4 responses generated from those inputs. The first changes sneakers to loafers; the second uses that output as the source for an olive blazer. Files are `public/assets/generated/youcam-meeting-ready.jpg` and `youcam-first-impression.jpg`. Hashes, status and timing are in `evidence/youcam-live-validation.json`.
- **Style illustration:** original SVG artwork that visualizes an outfit rule.
- **Your live preview · this session:** a newly generated result saved in React memory, together with its source photo, for comparison. Personal photos and result links are not written to localStorage. Refreshing or closing the page clears these session previews. The styling shortlist stores only catalog look IDs in localStorage.

The original demo adult is fictional. Preview labels distinguish sources throughout the application. YouCam result links have a limited lifetime; see the [official retention policy](https://docs.perfectcorp.com/develop/file_retention_period).

## API flow

`POST /api/tryons` validates origin, photo types, permission and category, uploads both images with `/s2s/v2.0/file`, then creates `/s2s/v2.0/task/cloth-v4`. The client polls `GET /api/tryons/:id` at ten-second intervals. The server encrypts and authenticates a task receipt with a two-hour lifetime, so polling continues across serverless instances and cold starts. A small optional cache accelerates repeat queries. Responses include a clear provenance field. It sanitizes provider errors and checks provider upload/result URL hosts.

Choose JPG/PNG originals up to 8 MB each, with a short side of at least 384 pixels and a long side of at most 4096 pixels. Before sending, the browser optimizes each photo to JPEG (normally up to 1536 pixels on the long side, preserving the 384-pixel short-side minimum) and at most 1.35 MB. The two-photo request stays below 4 MB. Photos remain in the browser until Generate is selected. Full-body and lower-body references should show a complete worn outfit; a single upper-body garment can use a clear product reference. Source: [YouCam Clothes V4 documentation](https://docs.perfectcorp.com/reference/ai_clothes).

## Deploy on Vercel

The Vite build serves the interface and `api/` exposes the same Express API as Node functions. `vercel.json` pins the Vite preset; `package.json` selects Node 22. Set `YOUCAM_API_KEY` as a sensitive **production server environment variable**, and set `YOUCAM_LIVE_ENABLED=true`. Set `FIRSTFIT_PUBLIC_ORIGIN` to the canonical production URL when using a custom domain. Vercel system production/deployment URLs are recognized automatically.

Keep the production alias publicly accessible for judges. The dedicated Hobby project gives judges free access without an account or application request-count limit. No database, paid resource or subscription is required. The in-process local cap is deliberately disabled in this deployment; it is not a shared quota. Task receipts are encrypted, contain no photos, and expire after two hours. The browser retains personal source photos and saved previews for the current page session only.

The public repository and deployment use explicit source allowlists. Credentials, account screenshots, internal review notes and video intermediates stay local.

## Verify

```sh
npm test
npm run build
```

The independent outfit-union oracle verifies 539 wardrobe/occasion/budget cases against the production subset solver. Contract tests use mocked provider responses and consume no API units. Real API evidence is recorded separately from these local tests.

After a build, `npm start` serves the compiled application and API together at http://127.0.0.1:5194. No deployment or external account registration is performed by the start command.

The explicitly invoked `node scripts/validate-live.mjs` script performs the two recorded API tasks and consumes units. It resumes completed evidence instead of repeating successful tasks. Run it only with an appropriate account and authorized unit budget.

## License

Original FirstFit code and included original artwork are available under the MIT license in `LICENSE`. React, Vite, Express and Lucide retain their respective licenses. DM Sans and Manrope are loaded from Google Fonts with system-font fallbacks and retain their font licenses. YouCam service usage is governed by the provider’s terms.
