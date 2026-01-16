# Quickstart Guide
Start collecting feedback with Wafir in minutes!

* Get the Wafir widget from our [GitHub page](https://github.com/BPS-Consulting/wafir) or build it from the source here.
* Get the Wafir GitHub App from [GitHub](https://github.com/apps/wafir-web-feedback-widget) and install it on your GitHub account or a specific repository. Make sure to note the **Installation ID**.
* Optionally create a `.github/wafir.yaml` configuration file in the target repository to customize the feedback form.
* Add the widget to your web application and include your GitHub details.
* Start receiving user feedback and bug reports directly in GitHub!

For additional configuration instructions, see the [README](README.md).
For complete developer instructions see the [Setup Guide](SETUP.md).

## Adding Wafir to Your Web Application
To add the Wafir widget to your web application, add the custom element to your web page:

```html
<script src="https://your-application-url/wafir.js"></script>
...
<your-footer-or-header>
    <wafir-reporter
      installationId="your-github-app-installation-id"
      owner="your-github-repository-owner"
      repo="your-github-repository-name"
      bridgeUrl=""  <!-- Leave blank to use the dev Wafir bridge or specify your own bridge URL -->
    ></wafir-reporter>
</your-footer-or-header>
```

We recommend putting the widget in the footer or header of your application so it's available on all pages.

## Configuring Wafir

Configure the widget feedback form using `.github/wafir.yaml` in your test repository:

```yaml
issue:
  labels:
    - bug
    - needs-triage
  screenshot: true
  browserInfo: true
  consoleLog: true

fields:
  - name: priority
    label: "Priority"
    type: select
    options:
      - "Low"
      - "Medium"
      - "High"
```

See [examples/](./examples) for more configuration templates.

## Configuring Your Project
You may want to configure your GitHub account to more effectively track feedback and keep public input separate from internal development issue tracking.

* **Add a project.**  Set up a dedicated `MyApp Public` project board (GitHub > Projects > New Project) to track public feedback and issue reports.  Give your team access to this project (Project > Settings > Manage Access > Invite Collaborators).
* **Add 'Review' status.**Edit your project's `Status` field to add a `Review` status (GitHub > Project > Settings > Custom Fields > Status > Options).  This will allow you to triage new items.  Edit the default workflow to make the initial status of new items `Review` (GitHub > Project > Workflows > Item added to project > Edit).
* **Add rating field.** Add a `Rating` field to your project (Type="Single select", Options=⭐,⭐⭐,etc.).  Typical ratings for customer satisfaction are 1-5 stars (Very Unsatisfied to Very Satisfied).  Typical ratings for Customer Effort Score are 1-5 stars (Very Difficult to Very Easy).
* **Add project to Wafir config.**  Edit your `.github/wafir.yaml` file to include the project name and the rating field.