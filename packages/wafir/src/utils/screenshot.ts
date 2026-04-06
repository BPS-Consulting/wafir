import {
  isCapturing,
  setCapturedImage,
  setFormScreenshot,
  getCurrentFormId,
} from "../store";

export async function takeFullPageScreenshot(
  highlightEl: HTMLElement | null = null,
) {
  isCapturing.set(true);

  // Give time for UI to hide if needed (though Lit reactive update should handle it if we wait a tick)
  await new Promise((resolve) => setTimeout(resolve, 50));

  let highlight: HTMLDivElement | null = null;

  try {
    if (highlightEl) {
      const rect = highlightEl.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      highlight = document.createElement("div");
      highlight.className = "wafir-temp-highlight";
      Object.assign(highlight.style, {
        position: "absolute",
        top: `${rect.top + scrollY}px`,
        left: `${rect.left + scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: "4px solid #2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        zIndex: "2147483647",
        boxSizing: "border-box",
        pointerEvents: "none",
      });
      document.body.appendChild(highlight);
    }

    const width = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
      window.innerWidth,
    );
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight,
    );

    const getCanvasColor = () => {
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);

      // Use body color if set, otherwise html color, otherwise white
      const bg = bodyStyle.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;

      const htmlBg = htmlStyle.backgroundColor;
      if (htmlBg && htmlBg !== "rgba(0, 0, 0, 0)" && htmlBg !== "transparent")
        return htmlBg;

      return "#ffffff";
    };

    const backgroundColor = getCanvasColor();

    // Lazy load modern-screenshot only when actually taking a screenshot
    const { domToDataUrl } = await import("modern-screenshot");

    const dataUrl = await domToDataUrl(document.documentElement, {
      width,
      height,
      backgroundColor,
      scale: 1,
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          const tagName = node.tagName.toLowerCase();
          if (tagName.startsWith("wafir-")) {
            if (node.className === "wafir-temp-highlight") return true;
            return false;
          }
        }
        return true;
      },
    });

    // Store screenshot both globally (for backward compatibility) and per-form
    setCapturedImage(dataUrl);
    const formId = getCurrentFormId();
    setFormScreenshot(formId, dataUrl);
  } catch (err) {
    console.error("Failed to capture full page screenshot", err);
  } finally {
    if (highlight && highlight.parentElement) {
      document.body.removeChild(highlight);
    }
    isCapturing.set(false);
  }
}
