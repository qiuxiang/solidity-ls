import { join } from "path";

export function getTestContractUri(name: string) {
  return "file://" + getTestContractPath(name);
}

export function getTestContractPath(name: string) {
  return join(__dirname, "..", "test", "contracts", name);
}
