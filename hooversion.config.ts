export default {
  branches: ["main"],
  packages: [
    {
      name: "hootoshop",
      path: ".",
      type: "node",
      manifest: "package.json",
      changelog: "CHANGELOG.md",
      scopes: ["hootoshop"],
      dependencies: [],
    },
  ],
  hooks: {
    afterVersion: ["bun install --lockfile-only --ignore-scripts"],
  },
  github: {
    releases: true,
  },
}
