# Deployment Guide

## Overview

This guide covers the deployment process for the Amazon MCP monorepo, which includes:
- `amazon-mcp-common`: Shared library for Amazon MCP servers
- `amazon-ads-mcp`: MCP server for Amazon Ads API

## Prerequisites

1. **Node.js**: Version 18 or higher
2. **pnpm**: Version 8 or higher
3. **npm Account**: With publish permissions
4. **GitHub Repository**: With Actions enabled

## Local Development

### Setup

```bash
# Clone repository
git clone <repository-url>
cd amazon-mcp

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# LWA_CLIENT_ID=...
# LWA_CLIENT_SECRET=...
# ADS_REFRESH_TOKEN=...
# ADS_PROFILE_ID=...
# ADS_API_REGION=na
```

### Development Commands

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build all packages
pnpm build

# Run ads-mcp in development mode
cd packages/amazon-ads-mcp
pnpm dev
```

## Versioning

### Manual Versioning

1. Update version in both package.json files:

```bash
# Update version (e.g., 0.2.0)
node scripts/version.js 0.2.0
```

2. This will:
   - Update version in `packages/amazon-mcp-common/package.json`
   - Update version in `packages/amazon-ads-mcp/package.json`
   - Commit changes
   - Create git tag

3. Push changes and tags:

```bash
git push origin main
git push origin --tags
```

### Automated Versioning (GitHub Actions)

When you push a tag matching `v*`, the release workflow will:
1. Run tests
2. Build packages
3. Publish to npm
4. Create GitHub release

## Publishing to npm

### Manual Publishing

```bash
# Dry run (no actual publish)
node scripts/publish.js --dry-run

# Publish to npm
node scripts/publish.js
```

### Automated Publishing

The release workflow (`.github/workflows/release.yml`) automatically publishes when a tag is pushed:

```bash
# Create and push tag
git tag v0.2.0
git push origin v0.2.0
```

The workflow will:
1. Checkout code
2. Install dependencies
3. Run tests
4. Build packages
5. Publish `amazon-mcp-common` to npm
6. Publish `amazon-ads-mcp` to npm
7. Create GitHub release

## CI/CD Pipeline

### Continuous Integration (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop`:

1. **Test Job**:
   - Runs on Node.js 18.x and 20.x
   - Type checks all packages
   - Lints all packages
   - Runs all tests
   - Builds all packages

2. **Coverage Job**:
   - Runs tests with coverage
   - Uploads to Codecov

3. **Build Job**:
   - Builds all packages
   - Uploads build artifacts

### Continuous Deployment (`.github/workflows/release.yml`)

Runs when a tag matching `v*` is pushed:

1. Checkout code
2. Setup Node.js and pnpm
3. Install dependencies
4. Type check, lint, test
5. Build packages
6. Publish to npm
7. Create GitHub release

## Environment Variables

### Required for amazon-ads-mcp

```bash
# LWA Credentials (shared with amazon-seller-mcp)
LWA_CLIENT_ID=amzn1.application-oa2-client.xxxxx
LWA_CLIENT_SECRET=amzn1.oa2-cs.xxxxx

# Ads API Credentials
ADS_REFRESH_TOKEN=Atzr|xxxxx  # Must have advertising::campaign_management scope
ADS_PROFILE_ID=1234567890      # Your advertising profile ID
ADS_API_REGION=na              # na, eu, or fe
ADS_API_ENDPOINT=https://advertising-api.amazon.com  # Optional override
```

### Required for CI/CD

Set these in GitHub repository settings:

- `NPM_TOKEN`: npm authentication token for publishing

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/amazon-mcp-common && pnpm test
cd packages/amazon-ads-mcp && pnpm test
```

### Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View coverage report
open packages/amazon-mcp-common/coverage/index.html
open packages/amazon-ads-mcp/coverage/index.html
```

## Troubleshooting

### npm Publish Fails

1. Check npm token is valid:
```bash
npm whoami
```

2. Verify package.json version is not already published:
```bash
npm view amazon-mcp-common versions
npm view amazon-ads-mcp versions
```

3. Check you have publish permissions:
```bash
npm access ls-collaborators amazon-mcp-common
```

### Tests Fail in CI

1. Check Node.js version compatibility
2. Verify all dependencies are in package.json
3. Check for missing environment variables
4. Review test output in GitHub Actions

### Build Fails

1. Run type check locally:
```bash
pnpm typecheck
```

2. Check for TypeScript errors
3. Verify all imports are correct
4. Check workspace dependencies

## Release Checklist

Before releasing a new version:

- [ ] All tests pass locally
- [ ] Type check passes
- [ ] Lint passes
- [ ] Coverage is acceptable (>80%)
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped in both package.json files
- [ ] Git tag is created
- [ ] GitHub Actions release workflow completes
- [ ] Packages are published to npm
- [ ] GitHub release is created

## Support

For issues or questions:
- GitHub Issues: Report bugs or request features
- Documentation: See `docs/openspec/` for detailed specifications
- ADRs: See `docs/adr/` for architecture decisions
