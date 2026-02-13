import { wafirWidget } from "wafir";

// Add click handler for the test button
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("open-suggestion-btn");
  if (button) {
    button.addEventListener("click", () => {
      wafirWidget.open({
        tab: "suggestion",
        prefill: {
          title: "Add dark mode support",
          description:
            "It would be great to have a dark mode option for better accessibility and reduced eye strain during nighttime usage.",
        },
      });
    });
  }
});
