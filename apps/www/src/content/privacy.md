# Privacy Policy

**Last updated: February 2026**

Wafir is an open-source feedback widget that connects user input to GitHub. This policy explains what data Wafir collects, how it's used, and your options for control.

## What Data Wafir Collects

When a user submits feedback through the Wafir widget, the following information may be collected:

### User-Provided Data
- **Form inputs**: Title, description, and any custom fields configured by the application owner
- **Screenshots**: If the user captures a screenshot, it is uploaded and attached to the feedback
- **Element highlights**: If the user highlights elements on the page, coordinates and element identifiers are included

### Opt-In Telemetry Data
- **Browser information**: Browser name, version, and platform (e.g., "Chrome 120 on Windows")
- **Viewport size**: Screen dimensions at the time of submission
- **Page URL**: The URL of the page where feedback was submitted
- **Console logs**: Recent browser console messages (errors, warnings, logs) if enabled in the configuration
- **Timestamp**: When the feedback was submitted

## Where Data Is Stored

All feedback data is sent to **GitHub** and stored in your configured destination:

- **GitHub Issues**: Feedback becomes an issue in your repository
- **GitHub Projects**: Feedback becomes a project item with custom field values

**Screenshots and attachments** are temporarily stored in Amazon S3 (managed by the Wafir bridge service) so they can be uploaded to the GitHub issue/project item. URLs are publicly accessible but use randomized identifiers.  Screenshots are deleted from S3 after successful upload to GitHub.

## Who Has Access

Access to feedback data is controlled by **your GitHub repository or project permissions**:

- Repository collaborators can view issues
- Project members can view project items
- Anyone with the S3 link can view uploaded screenshots

**BPS Consulting** (the maintainers of Wafir) does not access your feedback data unless you explicitly share it for support purposes.

## Data Retention

- **GitHub data**: Retained according to your GitHub account settings and repository policies
- **S3 attachments**: Retained only until successfully uploaded to GitHub, then deleted

## Self-Hosting Option

For complete control over your data:

1. **Self-host the bridge**: Deploy your own instance of the Wafir bridge service
2. **Use your own S3 bucket**: Configure the bridge to use your AWS account
3. **Private repositories**: Use private GitHub repos to restrict access

See the [Self-Hosting documentation](/installation#self-hosting-the-bridge) for setup instructions.

## Third-Party Services

Wafir integrates with the following services:

| Service | Purpose | Privacy Policy |
|---------|---------|----------------|
| GitHub | Issue/Project storage | [GitHub Privacy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement) |
| Amazon S3 | Screenshot storage | [AWS Privacy](https://aws.amazon.com/privacy/) |

## Your Rights

You can:

- **Access**: View all feedback in your GitHub repository or project
- **Delete**: Remove issues or project items directly in GitHub
- **Export**: Use GitHub's export features to download your data
- **Opt out**: Remove the Wafir widget from your application at any time

## Children's Privacy

Wafir is not intended for use by children under 13. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this policy as Wafir evolves. Significant changes will be noted in the changelog and documentation.

## Contact

For privacy questions or concerns:

- **GitHub Issues**: [BPS-Consulting/wafir](https://github.com/BPS-Consulting/wafir/issues)
- **Email**: [Contact BPS Consulting](https://bps-consulting.com)

---

*Wafir is open source software licensed under the GNU AGPLv3. You can review the complete source code on [GitHub](https://github.com/BPS-Consulting/wafir).*
