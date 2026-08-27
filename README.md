# eharness.dev

The landing page for [e](https://github.com/pjperez/e), a minimalist agent
harness with a native GUI.

## Layout

```
index.html          markup and the design contract for the page
src/main.js         navigation, copy button, reveals, lazy mark loader
src/mark.js         the Three.js e mark (r = a·e^(bθ)) with bloom
src/style.css       tokens and layout
public/e-mark.svg   static mark, also the WebGL fallback and favicon
public/install.ps1  Windows bootstrap, served from this domain
```

`public/install.ps1` must stay byte-for-byte identical to `install.ps1` in
`pjperez/e`. It is hosted here so the script and the release artifacts it
verifies come from two independent origins.

## Develop

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
npm run build      # writes dist/
```

## Deploy

The site is a Cloudflare Worker serving static assets. `wrangler.jsonc`
declares `eharness.dev` as a custom domain, so Cloudflare manages the DNS
record and certificate.

```bash
npm run deploy
```
