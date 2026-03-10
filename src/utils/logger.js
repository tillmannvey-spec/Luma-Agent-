/**
 * Simple structured logger for agent workflow steps.
 */
export class Logger {
  constructor(agentName) {
    this.agent = agentName;
  }

  info(msg) {
    console.log(`  [${this.agent}] ${msg}`);
  }

  success(msg) {
    console.log(`  [${this.agent}] OK: ${msg}`);
  }

  warn(msg) {
    console.warn(`  [${this.agent}] WARN: ${msg}`);
  }

  error(msg) {
    console.error(`  [${this.agent}] ERROR: ${msg}`);
  }

  step(num, total, msg) {
    console.log(`  [${this.agent}] (${num}/${total}) ${msg}`);
  }
}
