# Architecture

WAFIR consists of the following components:

- Widget. A small UI component that can be added to any web app to collect feedback and issues. The Widget is implemented in LIT and uses the shadow DOM to provide complete isolation from your application.
- Bridge. A small service that connects the widget to your GitHub repo. The Bridge is implemented as a Fastify service that will run on an AWS Lambda function and is available as a free service for development and demonstration purposes. For production use, we recommend running the Bridge on your own infrastructure.
- SnapStore. Temporary storage used to upload screenshots. The SnapStore is implemented as an AWS S3 bucket.
- Config. A small file in your GitHub repo (.github/wafir.yaml) used to specify where to store feedback/issues and (optionally) to tailor the associated forms.
- GitHub App. A standard GitHub App component that you install on your GitHub repo/project to allow the Bridge to read configuration information and write feedback and issues.

# Security

WAFIR security is provided through the standard GitHub App security mechanisms. This ensures that only WAFIR can access your repo, and only to read configuration info and write feedback/issues as you allowed. Because the GitHub App installation ID is passed to the Widget, it can potentially be captured and used by third parties to submit feedback directly through the Bridget instead of through the Widget. This does not represent a security exposure, but does slightly increase the attack surface for your repo (subject to GitHub rate limiting and other protections).

# Installation and Configuration

WAFIR is simple to install and configure:

- Install the WAFIR GitHub App on your repo/project and note the Installation ID.
- Install the WAFIR Widget as an NPM package and add it to your app front end, providing the Installation ID as a parameter.

# Functional Flow

- When the widget is opened, it reads configuration information (fields and values) from your GitHub repo through the Bridge and configures its forms to match.
- The user enters feedback and issue details. If a screenshot is included, it is written to the SnapStore for upload.
- When the user submits the feedback/issue, it is written to your GitHub repo through the bridge using the WAFIR GitHub App credentials.

# Requirements / Specifications

- Capture feedback and issues from application users and store them in GitHub
  - Feedback: title (fixed as configured), description (optional text), other (project fields as available and configured)
  - Issues: title, description, other (project fields as available and configured), screenshot (optional, default=no), browser info (optional, default=no, includes URL), console log (optional, default=no)
- Flexible screenshot
  - Can take screenshot with or without highlighting a page element
- Easily added to any application and configured for any GitHub repo/project
  - Widget does not impact app UI
  - Form (fields and valid values) is dynamically generated from GitHub project configuration
- Configurable form
  - Developer can optionally tailor form (fields displayed, order, mandatory/optional)
  - Field validation (other than security filtering/encoding) is not required, but error messages from GitHub should be available to use if backend validation fails
- Configurable storage
  - As GitHub issue, project item, or both
  - Primary use case is user input is stored as draft project item
  - Feedback and issues can be stored in same or different GitHub Project
- Configurable default description
  - Retrieved from GitHub issue template, configuration string, or null
  - If both template and string are configured, append template to string after newline
  - Strip header from template if it exists
- Easy to use
  - Single widget allows user to enter feedback or issue
  - Meaningful messages are provided to user to confirm all significant actions and report all significant errors
  - Form data is not lost when errors occur {TBD: or when the user changes pages}

# Technical Requirements

- Good support for Shadow DOMs
- Should be completely isolated from the outside HTML/CSS. Should not effect the site.

# Alternatives Considered

## UI Framework:

- [Lit](https://github.com/lit/lit): Built on native web components, allows for use with ShadowDOMs and with any other frameworks.
- [webawesome](https://github.com/shoelace-style/webawesome): Prebuilt components built with Lit. Similar to bootstrap.
- React: Adds to app page load due to React runtime library (~35 KB). May cause conflicts if app uses a different version of React.

## Backend:

- Docker container: fairly simple and portable
- Fastify
- AWS Lambda: very simple, AWS dependent
- Single multi-tenant service (using either of above): eliminates need for client app admin to implement the backend. Client app admin installs GitHub app and configures widget to send installation ID to backend service. See Staticman for example.

## GitHub Configuration Storage:

- GitHub. Cannot be used with widget alone because public access would expose GitHub App installation token, and CORS prohibits protected access from app domain to github.com. Can be used with some backend.
- Client app backend. Simple and secure. Admin user must install GitHub app on their repo/project. Widget must be configured to access client app backend. Admin use must implement backend service.
- Client-installed backend. Same as above but with a pre-built service (e.g., in AWS Lambda)

## Widget Configuration (backend service location):

- Widget parameter (e.g., data-\* or init). Can be used with multi-tenant app with GitHub app install.

## Widget Distribution:

- npm module. Easily installed into client app.
- CDN or S3. BPS maintains responsibility for ensuring widget compatibility and availability. Would require the ability to configure the widget to connect to client app backend
- User storage (e.g., S3). Easily installed with file copy.

## Existing Widgets:

- Feedback Fish: MIT open source but tied to paid service. TypeScript+React component. **Componentized**
- Open Feedback (Hugo Gresse): SaaS designed for conference speakers
- Feedbacky: text only
- Open Feedback (Neutron Creative): LGPL open source alternative to Feedback Fish. Self hosted. All styles hardcoded in JavaScript. Has bug, idea, help.
- Jam.dev, Betterbugs, Disbug: Free Github Markeplace items tied to paid service.
- Bug pilot: GitHub Markeplace app. Tied to paid service but widget is OSS.
- feedback (https://github.com/ueman/feedback): Complicated. Allows user to navigate and draw.
- feedbackfin (https://github.com/rowyio/feedbackfin): Simple text box. **Nice web hook architecture.**
- Bromb: simple widget and self-hostable endpoint. **Candidate**
- jQuery.feedback: Simple jQuery widget.
- Moufette: Feedback and feature voting widget. Companion widget customization app. Complicated?
- Feedback (https://github.com/lrsbt/Feedback): **Multiple pages.**
- [react_feedback_widget](https://github.com/BinaryLeo/react_feedback_widget). TypeScript+React+Tailwind. **Candidate**
- [feedback](https://github.com/ueman/feedback): Flutter.
