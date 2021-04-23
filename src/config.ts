import defaultConfig = require("./../config.json");
// import localConfig = require("./../config.local.json");
import { BotConfig } from "./Bot";

export default {
    ...defaultConfig,
    // ...(localConfig ?? {})
} as BotConfig

export const config = (config: any) => ({
    ...config,
    ...defaultConfig,
    // ...(localConfig ?? {})
}) as BotConfig