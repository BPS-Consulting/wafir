## Wafir Deployment Guide

### Bridge & Widget Deployment

Bridge and widget components are deployed automatically when a GitHub tag is created matching the pattern `wafir@*` (e.g., `wafir@1.2.3`).

**Steps:**

1. Commit your changes to the repository.
2. Create a new tag with the format `wafir@<version>`.
3. Push the tag to GitHub:
   ```bash
   git tag wafir@<version>
   git push origin wafir@<version>
   ```
4. Deployment will be triggered automatically by GitHub Actions.

### WWW Deployment

The www site is deployed automatically when a pull request (PR) is merged into the main branch.

**Steps:**

1. Open a PR with your changes targeting the main branch.
2. Once the PR is reviewed and merged, deployment will be triggered automatically.

---

For more details, refer to the repository's CI/CD configuration files.
