# Hootoshop

[![CI](https://github.com/openhoo/hootoshop/actions/workflows/ci.yml/badge.svg)](https://github.com/openhoo/hootoshop/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-blue)
![runtime](https://img.shields.io/badge/runtime-Bun-f472b6)
![coverage](https://img.shields.io/badge/coverage-90%25%2B-brightgreen)

Hootoshop is a browser-based image editor for quick local edits. It can crop, resize, rotate, flip, adjust brightness/contrast/saturation/blur, and export images as PNG, JPEG, or WebP.

Images are processed in the browser. The app does not upload images to a server and does not include analytics or tracking by default.

## Requirements

- Bun 1.3.14 or newer
- Node.js 20.9 or newer for Next.js compatibility

## Development

```sh
bun install
bun run dev
```

Open <http://localhost:3000> and upload an image to start editing.

## Checks

```sh
bun run biome:check
bun run typecheck
bun run test:coverage
bun run build
bun run audit
```

`bun run check` runs Biome linting and formatting checks with warnings treated as failures, type checking, `bun test` with coverage thresholds, and the production build. Use `bun run biome:fix` to apply safe Biome formatting and lint fixes.

Commit hooks are installed by `bun install`. The pre-commit hook runs Biome on staged files, and the commit-msg hook uses Hooversion to enforce Conventional Commit messages. CI runs the same commit linting, Bun install, Biome checks, Bun test coverage, build, audit, and Hooversion release automation.

## Contributing

Bug reports, feature requests, and focused pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the expected workflow.

## Security

Please do not report suspected vulnerabilities in public issues. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
