import { useContext } from "react";
import { SessionContext } from "./sessionContextDefinition";

export function useSession() {
  return useContext(SessionContext);
}
