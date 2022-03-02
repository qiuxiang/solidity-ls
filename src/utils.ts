export function parseAstOutput(stdout: string) {
  let json = false;
  const lines = [];
  const files = [];
  for (const line of stdout.split("\n")) {
    if (line == "{") json = true;
    if (json) lines.push(line);
    if (line == "}") {
      json = false;
      files.push(JSON.parse(lines.join("\n")));
    }
  }
  return files;
}
