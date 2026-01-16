# Quickstart Guide
Start collecting feedback with Wafir in minutes!

* Get the Wafir widget from our [GitHub page](https://github.com/BPS-Consulting/wafir) or build it from the source here.
* Get the Wafir GitHub App from [here](https://github.com/apps/wafir-web-feedback-widget) and install it on your GitHub account or a specific repository. Make sure to note the **Installation ID**.
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
If you are not currently collecting feedback, you may want to configure your account to track feedback separately from bugs and feature requests.

* Add a `feedback` item type to your account (GitHub > Account > Settings > Planning > Issue Types > Name="Feedback", Description="A comment from a user").