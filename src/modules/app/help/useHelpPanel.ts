import { useContext } from "react";
import { HelpPanelContext } from "./HelpPanelContextDefinition";

export function useHelpPanel() {
  const context = useContext(HelpPanelContext);
  if (!context) {
    throw new Error("useHelpPanel must be used within a HelpPanelProvider");
  }
  return context;
}
