/**
 * HOW TO ADD TO CHROME:
 * 1. Press Ctrl+Shift+B (Cmd+Shift+B on Mac) to ensure your Bookmarks Bar is visible.
 * 2. Right-click any empty space on the Bookmarks Bar and select "Add Page...".
 * 3. In the "Name" field, type something like "Launch Wafir".
 * 4. In the "URL" field, paste the MINIFIED code provided below (the one starting with javascript:).
 * 5. Click "Save".
 *
 * TO USE:
 * Go to any website and click the "Launch Wafir" bookmark you just created.
 */
(function () {
  const TAG_NAME = "wafir-widget";
  const SCRIPT_URL =
    "https://wafir-all.s3.us-east-2.amazonaws.com/wafir/latest/wafir.js";

  const BRIDGE_URL = ""; // Blank for default
  const CONFIG_URL = "https://your-config-url.com";

  // Prevent multiple injections
  if (document.querySelector(TAG_NAME)) {
    console.log("Widget already loaded.");
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.crossOrigin = "anonymous"; // Required for loading ES modules from S3/CORS
  script.src = SCRIPT_URL;

  script.onload = () => {
    const widget = document.createElement(TAG_NAME);

    // Set the attributes only if they are provided
    if (BRIDGE_URL) widget.setAttribute("bridge-url", BRIDGE_URL);
    if (CONFIG_URL) widget.setAttribute("config-url", CONFIG_URL);

    // Append to body
    document.body.appendChild(widget);
  };

  document.head.appendChild(script);
})();
