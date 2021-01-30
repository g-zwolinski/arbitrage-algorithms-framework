import defaultConfig = require("./../config.json");
import localConfig = require("./../config.local.json");
import { BotConfig } from "./Bot";

export default {
    ...defaultConfig,
    ...(localConfig ?? {})
} as BotConfig