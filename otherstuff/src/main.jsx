import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ChakraProvider,
  extendTheme,
  ColorModeScript, // Ensures theme applies immediately
} from "@chakra-ui/react";
import { App } from "./App";
import "./index.css";

// Custom theme for light and dark modes
const customTheme = extendTheme({
  config: {
    initialColorMode: localStorage.getItem("chakra-ui-color-mode"), // Set your default mode here
    useSystemColorMode: false, // Disable system mode syncing
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "light" ? "#FFFFFD" : "#211b2e",
        color: props.colorMode === "light" ? "#202020" : "#FFFFFD",
        transition: "background-color 0.2s ease-in-out",
      },
      "*": {
        borderColor: props.colorMode === "light" ? "#E2E8F0" : "#4A5568",
      },
    }),
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* ColorModeScript ensures the initial theme is applied */}
    <ColorModeScript initialColorMode={customTheme.config.initialColorMode} />
    <ChakraProvider theme={customTheme}>
      <App />
    </ChakraProvider>
  </StrictMode>
);
