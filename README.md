# Commercial Vehicle Shorts Showcase

Static GitHub Pages portfolio site for commercial vehicle product planning shorts.

## 2026-06 update

- Added a `Creative Motive / 創作動機` section above the rotating showcase.
- Replaced the browser-side URL input workflow with hard-coded YouTube Shorts embed IDs in `data.js`.
- Removed URL input, apply, and clear controls from the showcase UI.
- Updated the rotating showcase to 12 videos across two batches.
- Added YouTube Error 153 mitigation:
  - `<meta name="referrer" content="origin-when-cross-origin">`
  - iframe `referrerpolicy="origin-when-cross-origin"`
  - embed URLs use `https://www.youtube.com/embed/VIDEO_ID`
- The website remains a static HTML/CSS/Vanilla JS prototype. No backend, database, or API key is required.

## Deployment

Upload all files to a GitHub Pages repository root:

- `index.html`
- `style.css`
- `app.js`
- `data.js`
- `data/source_manifest.json`

Then enable GitHub Pages from the repository settings.

## Notes

The site is a Prototype Simulation. Video text, AI/ADAS descriptions, market interpretation, legal or safety references, and product planning ideas require human review before commercial use.


## Homepage cinematic JPG hero update

This version replaces the original vector-style hero instrument with `assets/images/homepage-commercial-vehicle-cinematic-hero.jpg`, a 16:9 JPG preview/reference image. The homepage image opens in a fullscreen dialog with a close button. The final 5000-word English image-generation prompt is stored at `prompts/homepage_hero_commercial_vehicle_cinematic_jpg_prompt_5000_words.txt`.
