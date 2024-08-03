import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getDeployment } from "./deployment";
import { writeFile } from "./utils/file";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const exportState = async (args: any, hre: HardhatRuntimeEnvironment) => {
    const dep = await getDeployment(hre);
    const caRoot = await dep.certificateRegistry.getCARoot(); 
    const dsRoot = await dep.certificateRegistry.getDSRoot();
    const caLeaves = (await dep.certificateRegistry.getAllCALeaves()).map(leaf => leaf.toString());
    const dsLeaves = (await dep.certificateRegistry.getAllDSLeaves()).map(leaf => leaf.toString());
    const revoker = await dep.certificateRegistry.revoker();
    const blockTime = await time.latest();

    const state = {
        caRoot: caRoot.toString(),
        dsRoot: dsRoot.toString(),
        numCAs: caLeaves.length.toString(),
        caLeaves: caLeaves,
        numDSs: dsLeaves.length.toString(),
        dsLeaves: dsLeaves,
        revoker: revoker,
        latestBlockTime: blockTime,
    };

    await writeFile(args.out, JSON.stringify(state, null, 4));
    console.log("State written to", args.out);
};

export { exportState };
