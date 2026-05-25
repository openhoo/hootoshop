# Hootoshop

Hootoshop is a browser-based image editor for quick local edits. It can crop, resize, rotate, flip, adjust brightness/contrast/saturation/blur, and export images as PNG, JPEG, or WebP.

Images are processed in the browser. The app does not upload images to a server and does not include analytics or tracking by default.

## Requirements

- Node.js 20.9 or newer
- pnpm 11.3.0

## Development

```sh
pnpm install
pnpm dev
```

Open <http://localhost:3000> and upload an image to start editing.

## Checks

```sh
pnpm lint
pnpm format
pnpm typecheck
pnpm build
pnpm audit
```

## Contributing

Bug reports, feature requests, and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the expected workflow.

## Security

Please do not report suspected vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
