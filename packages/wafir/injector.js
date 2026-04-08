(function () {
  const TAG_NAME = "wafir-widget";
  const SCRIPT_URL =
    "https://wafir-all.s3.us-east-2.amazonaws.com/wafir/latest/wafir.js";

  const BRIDGE_URL = ""; // Blank for default
  const CONFIG_URL = "https://your-config-url.com";

  if (document.querySelector(TAG_NAME)) {
    console.log("Widget already loaded.");
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.crossOrigin = "anonymous";
  script.src = SCRIPT_URL;

  script.onload = () => {
    const widget = document.createElement(TAG_NAME);

    // Set the attributes for the Lit component
    if (BRIDGE_URL) widget.setAttribute("bridge-url", BRIDGE_URL);
    if (CONFIG_URL) widget.setAttribute("config-url", CONFIG_URL);

    document.body.appendChild(widget);
  };

  document.head.appendChild(script);
})();

// This functions as a bookmarklet if you minify it and add "javascript:" to the beginning of the code.
