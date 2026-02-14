# GitHub Actions Workflows

This directory contains automated workflows for the Wafir project.

## Workflows

### auto-assign-issue.yaml

Automatically assigns newly created issues to a GitHub project.

#### Setup Requirements

To enable automatic issue assignment to a project:

1. **Create or identify your GitHub Project**
   - Go to your organization or repository's Projects tab
   - Note the project URL (e.g., `https://github.com/orgs/BPS-Consulting/projects/1`)

2. **Create a Personal Access Token (PAT) or use GitHub App**
   - Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Create a new token with the following permissions:
     - Repository permissions: Read access to metadata
     - Organization permissions: Read and write access to projects
   - Or use a GitHub App with similar permissions

3. **Add Repository Variables and Secrets**
   - Go to your repository's Settings → Secrets and variables → Actions
   - Add a new **variable** named `PROJECT_URL` with your project URL
   - Add a new **secret** named `PROJECT_TOKEN` with your PAT or GitHub App token

4. **Test the workflow**
   - Create a new issue in the repository
   - Check the Actions tab to see if the workflow ran successfully
   - Verify the issue appears in your project

#### Workflow Details

- **Trigger**: Runs when a new issue is opened
- **Action**: Uses the official `actions/add-to-project` action
- **Permissions**: Requires a token with project write access

#### Customization

You can customize the workflow to:
- Filter issues by labels before adding to project
- Assign to different projects based on issue labels
- Set custom field values when adding to project

Example with label filtering:

```yaml
on:
  issues:
    types: [opened]

jobs:
  add-to-project:
    name: Add issue to project
    runs-on: ubuntu-latest
    if: contains(github.event.issue.labels.*.name, 'bug')
    steps:
      - name: Add issue to project
        uses: actions/add-to-project@v0.5.0
        with:
          project-url: ${{ vars.PROJECT_URL }}
          github-token: ${{ secrets.PROJECT_TOKEN }}
```

### deploy-bridge.yaml

Deploys the Bridge service to production.

### deploy-www.yaml

Deploys the documentation website to GitHub Pages.

### publish-wafir.yaml

Publishes the Wafir widget package to NPM and S3 when a new version tag is pushed.
