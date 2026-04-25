import * as fs from 'fs';
import * as path from 'path';

const stateFile = path.resolve(__dirname, 'checkboxState.json');

export function saveCheckboxState(state: Record<string, boolean | [boolean, boolean]>) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

export function loadCheckboxState(): Record<string, boolean> {
  if (!fs.existsSync(stateFile)) return {};
  return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
}
