import { Logger } from "../utils/logger.js";
import { getModelForTask } from "../models/registry.js";

/**
 * BaseAgent — foundation for all creative sub-agents.
 *
 * Each sub-agent extends this class and implements:
 *   - plan(brief)   → returns a task plan
 *   - execute(plan) → produces assets
 */
export class BaseAgent {
  constructor(name, taskType) {
    this.name = name;
    this.taskType = taskType;
    this.model = getModelForTask(taskType);
    this.log = new Logger(name);
  }

  async run(brief) {
    this.log.info(`Starting with model: ${this.model?.id || "default"}`);
    const plan = await this.plan(brief);
    this.log.info(`Plan ready — ${plan.steps.length} step(s)`);
    const assets = await this.execute(plan, brief);
    this.log.success(`Produced ${assets.length} asset(s)`);
    return { agent: this.name, plan, assets };
  }

  async plan(_brief) {
    throw new Error(`${this.name}.plan() not implemented`);
  }

  async execute(_plan, _brief) {
    throw new Error(`${this.name}.execute() not implemented`);
  }
}
