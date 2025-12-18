import { domToDataUrl } from "modern-screenshot";
import { isCapturing, setCapturedImage } from "../store";

export async function takeFullPageScreenshot(
  highlightEl: HTMLElement | null = null
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
      window.innerWidth
    );
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );

    const dataUrl = await domToDataUrl(document.documentElement, {
      width,
      height,
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

    setCapturedImage(dataUrl);
  } catch (err) {
    console.error("Failed to capture full page screenshot", err);
  } finally {
    if (highlight && highlight.parentElement) {
      document.body.removeChild(highlight);
    }
    isCapturing.set(false);
  }
}
