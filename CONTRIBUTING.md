# Contributing

Thanks for taking the time to improve Hootoshop.

## Local Setup

```sh
bun install
bun run dev
```

Before opening a pull request, run:

```sh
bun run check
bun run audit
```

`bun install` installs the local Git hooks. The pre-commit hook runs Biome on staged files, and the commit-msg hook uses Hooversion to enforce Conventional Commit messages such as `feat: add crop preset` or `fix: preserve export quality`.

## Pull Requests

- Keep changes focused and explain the user-visible impact.
- Include screenshots or screen recordings for UI changes when useful.
- Avoid adding tracking, server uploads, or external processing for user images without a clear privacy discussion.
- Update documentation when behavior, setup, or public scripts change.
- Keep commits Conventional Commit compliant so Hooversion can plan releases and changelog entries.

## Issues

Use issues for reproducible bugs and concrete feature requests. For suspected security issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
