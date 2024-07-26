import fs from "fs/promises";
import { Circomkit } from "circomkit";

const circomkitCfgPath = "./circomkit.json";

const getCircomkit = async () => {
    const circomkitCfg = await fs.readFile(circomkitCfgPath, "utf8").then(data => JSON.parse(data));
    return new Circomkit(circomkitCfg);
};

export { getCircomkit };
