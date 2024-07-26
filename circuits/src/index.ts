import { CircuitConfig } from "circomkit";
import { getCircomkit } from "./circomkit";
import fs from "fs/promises";

const circuitsCfgPath = "./circuits.json";

const renameFile = async (oldPath: string, newFilename: string) => {
    const newPath = oldPath.split("/").slice(0, -1).join("/") + `/${newFilename}`;
    await fs.rename(oldPath, newPath);
};

async function main() {
    const circomkit = await getCircomkit();
    const circuitsCfg: { [key: string]: CircuitConfig } = await fs.readFile(circuitsCfgPath, "utf8").then((data) => JSON.parse(data));

    // this assumes the default pathing from circomkit
    for (const circuit in circuitsCfg) {
        const config = circuitsCfg[circuit];
        await circomkit.clean(circuit);
        const buildDir = await circomkit.compile(circuit, config);
        // this could take a while if the necessary ptau file is not already downloaded
        const { proverKeyPath, verifierKeyPath } = await circomkit.setup(circuit);
        // regenerate the verification contract since it uses a different vkey
        const contractPath = await circomkit.contract(circuit);
        const verifierName = circuit + "Verifier";
        // rename the contract to the circuit name + Verifier
        await fs.readFile(contractPath, "utf8")
            .then(async (code) => {
                const newCode = code.replace(/Groth16Verifier/g, verifierName);
                await fs.writeFile(contractPath, newCode);
            });
        // rename all components to circuit specific names
        await renameFile(contractPath, verifierName + ".sol");
        await renameFile(proverKeyPath, circuit + ".zkey");
        await renameFile(verifierKeyPath, circuit + ".vkey.json");
        
        // wasm and zkey should be moved to fixed_proofs, where they can be
        // accessed for testing using snarkjs
    }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
