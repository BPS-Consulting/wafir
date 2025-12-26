import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootLayout } from "./layouts/RootLayout.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { FeaturesPage } from "./pages/FeaturesPage.tsx";
import { DocsPage } from "./pages/DocsPage.tsx";
import { ContactPage } from "./pages/ContactPage.tsx";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "features", element: <FeaturesPage /> },
      { path: "docs", element: <DocsPage /> },
      { path: "contact", element: <ContactPage /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
