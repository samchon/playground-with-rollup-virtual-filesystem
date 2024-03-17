import commonjs from "@rollup/plugin-commonjs";
import fs from "fs";
import { rollup } from "rollup";
import hypothetical from "rollup-plugin-hypothetical";

const external = async (directory: string): Promise<Record<string, string>> => {
  const output: Record<string, string> = {};
  for (const file of await fs.promises.readdir(directory)) {
    const location: string = `${directory}/${file}`;
    const stats: fs.Stats = await fs.promises.lstat(location);
    if (stats.isDirectory()) Object.assign(output, await external(location));
    // else output[location] = await fs.promises.readFile(location, "utf8");
    // else
    //   output[location.replace(`${__dirname}/../`, "")] =
    //     await fs.promises.readFile(location, "utf8");
    else
      output[
        `file:///node_modules/` +
          location.replace(`${__dirname}/../node_modules/`, "")
      ] = await fs.promises.readFile(location, "utf8");
  }
  return output;
};

const main = async (): Promise<void> => {
  const res = await rollup({
    input: "./src/index.js",
    output: {
      file: "./dist/index.js",
    },
    plugins: [
      commonjs(),
      hypothetical({
        files: {
          ...(await external(`${__dirname}/../node_modules`)),
          "./src/index.js": [
            `const typia = require("typia");`,
            `const { plus } = require("./plus");`,
            `const { minus } = require("./minus");`,
            ``,
            `console.log(typia);`,
            `console.log(plus(1, 2));`,
            `console.log(minus(1, 2));`,
          ].join("\n"),
          "./src/plus.js": `export const plus = (a, b) => a + b;`,
          "./src/minus.js": `export const minus = (a, b) => a - b;`,
        },
      }),
    ],
  });
  await res.write({
    file: "./dist/index.js",
  });
};
main().catch((exp) => {
  console.log(exp);
  process.exit(-1);
});
