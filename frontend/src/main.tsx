import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { App } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <App />
        <Toaster
          position="bottom-center"
          toastOptions={{
            className:
              "!rounded-[4px] !shadow-none !border !border-border !bg-background !text-foreground",
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
