import fs from "fs";

const writeFile = async (path: string, data: string) => {
    if (!fs.existsSync(path))
        await fs.promises.mkdir(
            path.split("/").slice(0, -1).join("/"), 
            { recursive: true }
        );
    
    await fs.promises.writeFile(path, data);
};

export { writeFile };