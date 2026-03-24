# ChatCaptcha — The Absurd Captcha

A completely ridiculous and unrealistic captcha for hackathons. Click the cats, avoid the dogs, kill 3 in a row to prove you are not a robot.

## How It Works

- **Click the cat** before it escapes the captcha zone
- **Do NOT click the dog** (25% spawn chance) — instant fail
- If a cat escapes without being clicked — fail
- **Kill 3 cats in a row** to pass the captcha

## Features

- Traditional captcha background (letters, numbers, lines, curves in various colors)
- Cats and dogs drawn with Canvas 2D (cartoon style)
- Random movement (directions and speeds vary)
- Death animation (flattened animal + blood puddle)
- Synthesized sounds via Web Audio API (meow, bark, splat, victory/fail jingles)
- Animated score popups
- Responsive dark-themed UI

## GitHub Pages Deployment

1. Create a GitHub repository
2. Upload the files: `index.html`, `style.css`, `script.js`
3. Go to **Settings > Pages**
4. Source: **main branch** / root
5. Your captcha will be live at `https://<your-user>.github.io/<repo>/`

## Files

```
├── index.html      # HTML structure
├── style.css       # Styles (dark theme, animations)
├── script.js       # Complete logic (canvas, sounds, game)
└── README.md       # This file
```

## No Dependencies

100% vanilla HTML5 + CSS3 + JavaScript. No libraries, no build step, no external assets.

## Development

Install ESLint for linting:

```bash
npm install
npm run lint
```

## License

MIT
