import {
  isCapturing,
  setCapturedImage,
  setFormScreenshot,
  getCurrentFormId,
} from "../store";

export async function takeFullPageScreenshot(
  highlightEl: HTMLElement | null = null,
): Promise<void> {
  if (isCapturing.get()) return;
  isCapturing.set(true);

  let highlight: HTMLDivElement | null = null;

  try {
    const htmlEl = document.documentElement;

    if (highlightEl) {
      const rect = highlightEl.getBoundingClientRect();
      const borderWidth = 4;
      highlight = document.createElement("div");
      highlight.className = "wafir-temp-highlight";
      Object.assign(highlight.style, {
        position: "absolute",
        top: `${rect.top + window.scrollY - borderWidth}px`,
        left: `${rect.left + window.scrollX - borderWidth}px`,
        width: `${rect.width + borderWidth * 2}px`,
        height: `${rect.height + borderWidth * 2}px`,
        border: `${borderWidth}px solid #2563eb`,
        boxSizing: "border-box",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
      htmlEl.appendChild(highlight);

      // Chromium: Ensure paint
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    const computedBgColor = (() => {
      const htmlBg = window.getComputedStyle(htmlEl).backgroundColor;
      if (htmlBg && htmlBg !== "rgba(0, 0, 0, 0)" && htmlBg !== "transparent")
        return htmlBg;

      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      if (bodyBg && bodyBg !== "rgba(0, 0, 0, 0)" && bodyBg !== "transparent")
        return bodyBg;

      return "#ffffff";
    })();

    const { domToDataUrl } = await import("modern-screenshot");

    const dataUrl = await domToDataUrl(htmlEl, {
      width,
      height,
      backgroundColor: computedBgColor,
      style: {
        transform: `translate(${-window.scrollX}px, ${-window.scrollY}px)`,
        backgroundColor: computedBgColor,
        minHeight: `${Math.max(document.documentElement.scrollHeight, height)}px`,
      },
      scale: 1,
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          const tagName = node.tagName.toLowerCase();
          if (node.classList.contains("wafir-temp-highlight")) return true;
          if (tagName.startsWith("wafir-")) return false;
          if (["script"].includes(tagName)) return false;
        }
        return true;
      },
    });

    setCapturedImage(dataUrl);
    setFormScreenshot(getCurrentFormId(), dataUrl);
  } catch (err) {
    console.error("Failed to capture screenshot", err);
  } finally {
    highlight?.remove();
    isCapturing.set(false);
  }
}
