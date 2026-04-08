(function () {
  const TAG_NAME = "wafir-widget";
  const SCRIPT_URL =
    "https://wafir-all.s3.us-east-2.amazonaws.com/wafir/latest/wafir.js";

  if (document.querySelector(TAG_NAME)) {
    console.log("Widget already loaded.");
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.src = SCRIPT_URL;

  script.onload = () => {
    const widget = document.createElement(TAG_NAME);

    document.body.appendChild(widget);
  };

  document.head.appendChild(script);
})();

// This functions as a bookmarklet if you minify it and add "javascript:" to the beginning of the code.
