# Palette — Visual Design Generator

A tactile, browser-based design instrument for remixing cohesive visual systems.
One card. Five scopes. Many materials.

## Running locally

No build step. Just serve the directory:

```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

Push to `main` — GitHub Actions publishes the static site to GitHub Pages.

## Keyboard

- `Space` or `R` — regenerate (current scope)
- `Esc` — close share sheet

## Tech

Vanilla HTML / CSS / JS. No frameworks. No build tools.
