import { CircuitConfig } from "circomkit";
import { getCircomkit } from "./circomkit";
import fs from "fs";

const CIRCUITS_CFG_PATH = "./circuits.json";

const CONTRACTS_DIR = "./contracts";
const PROOFS_DIR = "./proofs";

const renameFile = async (oldPath: string, newDir: string, newFilename: string) => {
    await fs.promises.rename(oldPath, `${newDir}/${newFilename}`);
};

async function main() {
    const circomkit = await getCircomkit();
    const circuitsCfg: { [key: string]: CircuitConfig } = await 
        fs.promises.readFile(
            CIRCUITS_CFG_PATH, "utf8"
        ).then(
            data => JSON.parse(data)
        );

    if (!fs.existsSync(CONTRACTS_DIR))
        await fs.promises.mkdir(CONTRACTS_DIR);

    // this assumes the default pathing from circomkit
    for (const circuit in circuitsCfg) {
        const config = circuitsCfg[circuit];
        await circomkit.clean(circuit);
        const buildDir = await circomkit.compile(circuit, config);
        // this could take a while if the necessary ptau file is not already downloaded
        const { proverKeyPath } = await circomkit.setup(circuit);
        // regenerate the verification contract since it uses a different vkey
        const contractPath = await circomkit.contract(circuit);
        const verifierName = circuit + "Verifier";
        // rename the contract to the circuit name + Verifier
        await fs.promises.readFile(contractPath, "utf8")
            .then(async (code) => {
                const newCode = code.replace(/Groth16Verifier/g, verifierName);
                await fs.promises.writeFile(contractPath, newCode);
            });
        // move all necessary components to their respective directories
        const proofsPath = `${PROOFS_DIR}/${circuit}`;
        if (!fs.existsSync(proofsPath))
            await fs.promises.mkdir(proofsPath, { recursive: true });

        await renameFile(contractPath, CONTRACTS_DIR, verifierName + ".sol");
        await renameFile(proverKeyPath, proofsPath, circuit + ".zkey");
        await renameFile(`${buildDir}/${circuit}_js/${circuit}.wasm`, proofsPath, circuit + ".wasm");
    }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
