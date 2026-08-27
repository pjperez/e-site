# e harness site

The source for [eharness.dev](https://eharness.dev), the landing page for the
[e agent harness](https://github.com/pjperez/e).

## Development

Requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

The production build is written to `dist/`:

```bash
npm run build
```

`public/install.ps1` is the independently hosted bootstrap for Windows
releases. Keep it byte-for-byte aligned with `install.ps1` in `pjperez/e`
whenever the release verification key or installer behavior changes.

## Deployment

The site deploys as a Cloudflare Worker with static assets. Authenticate Wrangler,
then run:

```bash
npm run deploy
```

`wrangler.jsonc` declares `eharness.dev` as a custom domain, so Cloudflare manages
the DNS record and certificate when the Worker is deployed. The domain must be an
active zone in the deploying account and cannot already have a conflicting CNAME.
