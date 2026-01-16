# Feedback-Focused Example

This example demonstrates how to configure Wafir for collecting user satisfaction feedback with star ratings.

## Use Cases

- Customer satisfaction surveys
- NPS-style feedback collection
- Quick user sentiment gathering
- Feature satisfaction tracking

## Key Configuration

```yaml
# Set mode to feedback for star rating interface
mode: feedback

# Customize the modal title
feedback:
  title: "How are we doing?"
  labels: ["feedback", "user-satisfaction"]
```

## What Users See

When `mode: feedback` is set, users will see:

1. A 5-star rating input
2. Optional comment field
3. Any additional custom fields you define

## Comparison with Other Modes

| Mode       | Description                                  |
| ---------- | -------------------------------------------- |
| `issue`    | Bug reporting form (default)                 |
| `feedback` | Star rating + comments                       |
| `both`     | Tabbed interface for both issue and feedback |

## Tips

- Use `mode: both` if you want users to choose between reporting issues and giving feedback
- Customize labels to help categorize feedback in your GitHub repository
- The star rating is always included when `mode: feedback` is set
