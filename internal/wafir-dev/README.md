# Wafir Dev Testing Environment

This is a local testing environment for the Wafir widget.

## Setup

1. Make sure the wafir widget is built:

   ```bash
   pnpm --filter wafir run build
   ```

2. Start the dev server:

   ```bash
   pnpm dev
   ```

3. Open your browser to the URL shown (typically http://localhost:5173)

## Debugging

The widget includes extensive console logging. Open your browser's developer console to see:

- Widget initialization
- Config loading
- Tab configuration
- Any errors

## Expected Behavior

1. You should see a thumbs-up button in the bottom-right corner
2. Click the button to open the modal
3. The config will be fetched from `/wafir.yaml`
4. You should see tabs: Feedback, Suggestion, Issue

## Troubleshooting

If the widget appears blank:

1. **Check the console** - Look for any errors or warnings
2. **Check the network tab** - Verify `/wafir.yaml` loads with 200 status
3. **Check the widget logs** - Look for "Wafir:" prefixed messages
4. **Verify the button renders** - Check Elements panel for `<wafir-widget>` and its shadow DOM

Common issues:

- **Config URL wrong**: Make sure configUrl="/wafir.yaml" (relative)
- **Port mismatch**: The dev server auto-selects an available port
- **CSS issues**: The button might be hidden; check computed styles
