# Publishing Guide for Wafir npm Package

This document provides step-by-step instructions for publishing the Wafir widget to the npm registry.

## Prerequisites

Before publishing, ensure you have:

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/signup) if you don't have one
2. **Organization access**: If publishing under the `@bps-consulting` scope, you need to be a member of the BPS Consulting organization on npm
3. **2FA enabled**: npm requires two-factor authentication for publishing packages
4. **npm CLI installed**: Verify with `npm --version`

## Pre-Publishing Checklist

Before publishing a new version, complete these steps:

### 1. Update Version Number

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (0.1.0 → 0.1.1): Bug fixes and minor changes
- **Minor** (0.1.0 → 0.2.0): New features, backwards compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

Update version in `package.json`:

```bash
cd packages/wafir

# Option 1: Manual edit
# Edit package.json and change the version field

# Option 2: Use npm version command
npm version patch  # or minor, or major
```

### 2. Update CHANGELOG

Document changes in a CHANGELOG.md file (recommended):

```markdown
## [0.1.0] - 2025-01-28

### Added
- Initial npm package release
- TypeScript type definitions
- Comprehensive documentation
- Support for ES modules
```

### 3. Test the Package Locally

```bash
# Clean and rebuild
rm -rf dist node_modules
pnpm install
pnpm build

# Verify build output
ls -la dist/

# Create a test tarball
npm pack

# Test in a separate project
mkdir -p /tmp/wafir-test && cd /tmp/wafir-test
npm init -y
npm install /path/to/wafir-0.1.0.tgz
```

### 4. Run Quality Checks

```bash
# Type checking
pnpm build

# Check package contents
npm pack --dry-run

# Verify package size (should be reasonable)
du -h wafir-*.tgz
```

## Publishing Steps

### First-Time Setup

1. **Login to npm**:

```bash
npm login
```

Enter your npm credentials when prompted. If you have 2FA enabled, you'll need to provide an OTP (one-time password).

2. **Verify login**:

```bash
npm whoami
```

### Publishing the Package

1. **Navigate to the package directory**:

```bash
cd packages/wafir
```

2. **Ensure you're on the correct branch**:

```bash
git status
git branch
```

3. **Build the package**:

```bash
pnpm build
```

The `prepublishOnly` script will automatically run the build, but it's good to verify manually.

4. **Publish to npm**:

For the first publish:

```bash
npm publish --access public
```

For subsequent publishes (after version bump):

```bash
npm publish
```

If you're publishing a beta or pre-release version:

```bash
npm publish --tag beta
```

5. **Verify publication**:

Visit your package page: `https://www.npmjs.com/package/wafir`

Or check via CLI:

```bash
npm view wafir
```

### Post-Publishing Steps

1. **Tag the release in Git**:

```bash
git tag v0.1.0
git push origin v0.1.0
```

2. **Create a GitHub Release**:

- Go to the [GitHub releases page](https://github.com/BPS-Consulting/wafir/releases)
- Click "Draft a new release"
- Select the tag you just created
- Add release notes
- Publish the release

3. **Announce the release**:

- Update the main README.md with the new version
- Announce on social media, blog, or community channels
- Update documentation site if needed

## Versioning Strategy

### Version Ranges

- `0.x.y`: Pre-1.0 versions, may have breaking changes between minor versions
- `1.x.y`: Stable API, breaking changes only in major versions
- `x.y.z-beta.n`: Beta/pre-release versions

### Release Cadence

- **Patch releases**: As needed for critical bug fixes
- **Minor releases**: Monthly or when significant features are ready
- **Major releases**: When breaking changes are necessary

## Common Issues and Solutions

### Issue: "You do not have permission to publish"

**Solution**: Ensure you're logged in with the correct account and have publishing rights:

```bash
npm logout
npm login
npm whoami
```

### Issue: "Version already exists"

**Solution**: Increment the version number in `package.json` before publishing:

```bash
npm version patch
npm publish
```

### Issue: "Package size too large"

**Solution**: Check what's included in the package:

```bash
npm pack --dry-run
```

Update `.npmignore` to exclude unnecessary files.

### Issue: "prepublishOnly script failed"

**Solution**: Fix the build errors before publishing:

```bash
pnpm build
# Fix any TypeScript or build errors
```

## Publishing Beta/Pre-release Versions

To publish a pre-release version without affecting the `latest` tag:

```bash
# Update version to beta
npm version 0.2.0-beta.1

# Publish with beta tag
npm publish --tag beta

# Users can install with:
# npm install wafir@beta
```

To promote a beta to latest:

```bash
npm dist-tag add wafir@0.2.0 latest
```

## Unpublishing (Emergency Only)

⚠️ **Warning**: Unpublishing is permanent and can break projects depending on your package.

```bash
# Unpublish a specific version (only within 72 hours of publishing)
npm unpublish wafir@0.1.0

# Deprecate instead (recommended)
npm deprecate wafir@0.1.0 "This version has critical bugs. Please upgrade to 0.1.1"
```

## Automated Publishing (CI/CD)

For automated publishing via GitHub Actions:

1. Generate an npm token:
   - Go to npmjs.com → Account Settings → Access Tokens
   - Generate a new "Automation" token
   
2. Add token to GitHub Secrets:
   - Repository Settings → Secrets → Actions
   - Add secret named `NPM_TOKEN`

3. Create a publish workflow (`.github/workflows/publish.yml`):

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 9.0.0
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm --filter wafir build
      - run: cd packages/wafir && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Support

For questions or issues with publishing:

- Check [npm documentation](https://docs.npmjs.com/)
- Contact the package maintainers
- Open an issue on [GitHub](https://github.com/BPS-Consulting/wafir/issues)

## Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm Package Best Practices](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
