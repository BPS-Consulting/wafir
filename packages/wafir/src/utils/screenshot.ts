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
  const originalBodyStyle = {
    background: "",
    backgroundColor: "",
    backgroundImage: "",
  };

  try {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    if (highlightEl) {
      const rect = highlightEl.getBoundingClientRect();
      highlight = document.createElement("div");
      highlight.className = "wafir-temp-highlight";
      Object.assign(highlight.style, {
        position: "absolute",
        top: `${rect.top + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        outline: "4px solid #2563eb",
        outlineOffset: "-4px",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
      bodyEl.appendChild(highlight);

      // Chromium: Ensure paint
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    }

    const htmlStyle = window.getComputedStyle(htmlEl);
    const bodyStyle = window.getComputedStyle(bodyEl);

    const isBodyTransparent =
      bodyStyle.backgroundColor === "rgba(0, 0, 0, 0)" ||
      bodyStyle.backgroundColor === "transparent";
    const htmlHasBg =
      htmlStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      htmlStyle.backgroundImage !== "none";

    if (isBodyTransparent && htmlHasBg) {
      originalBodyStyle.background = bodyEl.style.background;
      bodyEl.style.background = htmlStyle.background;
    }

    const width = Math.max(
      htmlEl.scrollWidth,
      bodyEl.scrollWidth,
      window.innerWidth,
    );
    const height = Math.max(
      htmlEl.scrollHeight,
      bodyEl.scrollHeight,
      window.innerHeight,
    );

    const { domToDataUrl } = await import("modern-screenshot");

    const dataUrl = await domToDataUrl(bodyEl, {
      width,
      height,
      backgroundColor:
        htmlStyle.backgroundColor !== "transparent"
          ? htmlStyle.backgroundColor
          : "#ffffff",
      scale: 1,
      filter: (node: Node) => {
        if (node instanceof HTMLElement) {
          const tagName = node.tagName.toLowerCase();
          if (node.classList.contains("wafir-temp-highlight")) return true;
          if (tagName.startsWith("wafir-")) return false;
          if (["script", "style", "link"].includes(tagName)) return false;
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
    document.body.style.background = originalBodyStyle.background;
    isCapturing.set(false);
  }
}
