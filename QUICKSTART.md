# Quickstart Guide

Start collecting feedback with Wafir in minutes!

- Get the Wafir GitHub App from [GitHub](https://github.com/apps/wafir-web-feedback-widget) and install it on your GitHub account. Make sure to note the _Installation ID_, which is the number at the end of the URL after you install the app.
- Create a GitHub project on your GitHub account to receive feedback and bug reports. Create any custom fields you want to show up in the widget.
- Optionally create a `.github/wafir.yaml` configuration file in the target repository to customize the feedback form.
- Get the Wafir widget from our [GitHub page](https://github.com/BPS-Consulting/wafir) or build it from the source here. Add the widget to your web application and include your GitHub details.
- Start receiving user feedback and bug reports directly in GitHub!

For additional configuration instructions, see the [README](README.md).
For complete developer instructions see the [Setup Guide](SETUP.md).

## How Wafir Works

The Wafir widget is a web component that you add to your web application. It connects to your GitHub project using the Wafir bridge service, which you authorize by installing the Wafir GitHub app and providing the installation ID to the widget. The widget form is created dynamically based on your project fields. You can further customize the widget using a wafir.yaml file.

## Adding the Wafir widget to Your Web Application

To add the Wafir widget to your web application, add the custom element to your web page:

```html
<script src="https://your-application-url/wafir.js"></script>
...
<your-footer-or-header>
    <wafir-widget
      installationId="your-github-app-installation-id"
      owner="your-github-repository-owner"  <-- Your GitHub org or account name
      project="your-github-project-number"  <-- Optional: will create items in project (see project URL for number)
      repo="your-github-repository-name"    <-- Optional: will create issues in repo
      bridgeUrl=""  <-- URL for your own bridge instance or leave blank to use our dev Wafir bridge
    ></wafir-widget>
</your-footer-or-header>
```

We recommend putting the widget in the footer or header of your application so it's available on all pages.

## Adding a GitHub Project for Feedback

While Wafir can add issues directly to a repo, we recommend that you create a GitHub _project_ to manage feedback. This keeps feedback separated from your internal development issue tracking. After review, any project item can be converted to an issue if development action is required. (Note: old V1 projects attached directly to a single repo are not supported.)

- **Add a project.** Set up a dedicated `MyApp Public` project board (GitHub > Projects > New Project) to track public feedback and issue reports. Give your team access to this project (Project > Settings > Manage Access > Invite Collaborators).
- **Add 'Review' status.**Edit your project's `Status` field to add a `Review` status (GitHub > Project > Settings > Custom Fields > Status > Options). This will allow you to triage new items. Edit the default workflow to make the initial status of new items `Review` (GitHub > Project > Workflows > Item added to project > Edit).
- **Add project fields.** Add additional fields for any data you want to collect. For example you might want a `Rating` field (Type="Single select", Options=⭐,⭐⭐,etc.). Note: Typical ratings for customer satisfaction are 1-5 stars (Very Unsatisfied to Very Satisfied). Typical ratings for Customer Effort Score are 1-5 stars (Very Difficult to Very Easy).
- **Configure the widget.** Configure the Wafir widget `owner` and `project` attributes to connect it to your new project. You can optionally configure the widget further in the `.github/wafir.yaml` file.

## Configuring the Widget

The widget will automatically display fields from your GitHub project. If you provide the widget with the name of a repo, you can further configure the widget form using `.github/wafir.yaml` in your repo.

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

## Installing the Wafir GitHub App

The Wafir GitHub App authorizes the bridge to create issues and project items on your behalf. If you collect feedback in a project (as recommended), the needs to be installed on your account (rather than the repository), because GitHub V2 projects are not tied to a specific repository. TBD: add security details.

## Analyzing Your Feedback

You can use tools like GitHub Project Insights and Screenful to analyze feedback.
