# Baseline CI - GitHub Action

A GitHub Action that automatically analyzes pull requests for web feature compatibility using [Baseline](https://web.dev/baseline) data from the [web-features](https://github.com/web-platform-dx/web-features) package.

## 🎯 What is Baseline?

Baseline is an initiative by the W3C WebDX Community Group that provides clear information about which web platform features are safe to use in your projects. Features are classified as:

- **✅ Widely Available**: Supported for 30+ months across major browsers
- **🟡 Newly Available**: Recently supported across major browsers
- **🔴 Limited Availability**: Not yet available across all major browsers

## 🚀 Features

- **Automated PR Analysis**: Scans JavaScript/TypeScript and CSS files for web platform features
- **Baseline Status Reporting**: Identifies which features are widely available, newly available, or have limited support
- **Customizable Targets**: Choose between widely available or newly available baseline targets
- **PR Comments**: Posts detailed compatibility reports directly on pull requests
- **CI/CD Integration**: Can fail builds based on feature compatibility (configurable)

## 📦 Installation

Add this action to your GitHub workflow:

```yaml
name: Baseline CI

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  baseline-check:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Baseline CI
        uses: nishant-gh/baseline-ci-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          severity: 'warn' # or 'fail' to block PRs
          target-baseline: 'widely' # or 'newly' or 'all'
```

## ⚙️ Configuration

### Inputs

| Input             | Description                                        | Required | Default                                                |
| ----------------- | -------------------------------------------------- | -------- | ------------------------------------------------------ |
| `github-token`    | GitHub token for API access                        | Yes      | `${{ github.token }}`                                  |
| `severity`        | Action on non-baseline features: `warn` or `fail`  | No       | `warn`                                                 |
| `target-baseline` | Baseline target: `widely`, `newly`, or `all`       | No       | `widely`                                               |
| `file-patterns`   | Comma-separated glob patterns for files to analyze | No       | `**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.css,**/*.scss` |

### Outputs

| Output               | Description                           |
| -------------------- | ------------------------------------- |
| `features-detected`  | JSON array of all detected features   |
| `non-baseline-count` | Number of non-baseline features found |
| `status`             | Analysis result: `pass` or `fail`     |

## 📊 Example Report

When Baseline CI detects non-baseline features, it posts a comment like this:

```markdown
## ⚠️ Baseline CI - Features Detected

**Target:** Baseline Widely Available
**Total Issues:** 3

### 🔴 Limited Availability (2)

| Feature                 | File         | Line | Status     |
| ----------------------- | ------------ | ---- | ---------- |
| `Promise.try`           | `utils.ts`   | 42   | 🔴 Limited |
| `css-container-queries` | `styles.css` | 15   | 🔴 Limited |

### 💡 Recommendations

- Consider using polyfills or feature detection for limited availability features
- Check [Can I Use](https://caniuse.com) for detailed browser support
```

## 🔍 Detected Features

Baseline CI currently detects:

### JavaScript/TypeScript Features

- Promise methods (`Promise.try`, `Promise.withResolvers`)
- Array methods (`Array.fromAsync`, `Array.prototype.at`, `findLast`, etc.)
- Object methods (`Object.groupBy`)
- Class private fields
- Top-level await
- And more...

### CSS Features

- Container queries
- Cascade layers
- Modern selectors (`:has()`, `:is()`, `:where()`)
- Math functions (`clamp()`, `min()`, `max()`)
- Modern properties (`aspect-ratio`, `gap`, `inset`, etc.)
- And more...

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm

### Build

```bash
pnpm install
pnpm build
```

### Project Structure

```
baseline-ci-action/
├── src/
│   ├── index.ts           # Main action entry point
│   ├── detector.ts        # Feature detection orchestrator
│   ├── baseline.ts        # Baseline data integration
│   ├── formatter.ts       # PR comment formatting
│   └── detectors/         # Modular detector system
│       ├── base.ts        # Core interfaces & types
│       ├── registry.ts    # Detector registry
│       ├── loader.ts      # Auto-loader
│       └── features/      # Feature detector plugins
│           ├── promise-try/
│           ├── array-at/
│           ├── container-queries/
│           └── css-has-pseudo/
├── dist/                  # Compiled output
├── action.yml             # Action metadata
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Adding New Feature Detectors

This project uses a **plugin-based architecture**. Each web feature has its own detector module with co-located tests.

**Quick Start:**

1. Create a new directory: `src/detectors/features/your-feature/`
2. Add three files: `detector.ts`, `detector.test.ts`, `index.ts`
3. Register in `src/detectors/loader.ts`
4. Run tests: `pnpm test`

**Detailed Guide:** See [CONTRIBUTING.md](./CONTRIBUTING.md) for step-by-step instructions, examples, and best practices.

**Example detectors to reference:**

- `src/detectors/features/promise-try/` - JavaScript API detection
- `src/detectors/features/container-queries/` - CSS feature detection

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Powered by [web-features](https://github.com/web-platform-dx/web-features)
- Uses [Baseline](https://web.dev/baseline) data from the W3C WebDX Community Group

## 📚 Resources

- [Baseline on web.dev](https://web.dev/baseline)
- [web-features Package](https://www.npmjs.com/package/web-features)
- [Web Platform Dashboard](https://webstatus.dev)
- [Can I Use](https://caniuse.com)
