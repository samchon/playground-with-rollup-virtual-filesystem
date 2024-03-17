import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import fs from "fs";
import { rollup } from "rollup";
import hypothetical from "rollup-plugin-hypothetical";
import ts from "typescript";

const external = async (directory: string): Promise<Record<string, string>> => {
  const output: Record<string, string> = {};
  for (const file of await fs.promises.readdir(directory)) {
    const location: string = `${directory}/${file}`;
    const stats: fs.Stats = await fs.promises.lstat(location);
    if (stats.isDirectory()) Object.assign(output, await external(location));
    // else output[location] = await fs.promises.readFile(location, "utf8");
    else
      output[location.replace(`${__dirname}/../node_modules/`, "")] =
        await fs.promises.readFile(location, "utf8");
  }
  return output;
};

const main = async (): Promise<void> => {
  const res = await rollup({
    input: "./src/index.ts",
    output: {
      file: "./dist/index.js",
    },
    plugins: [
      commonjs(),
      hypothetical({
        files: {
          ...(await external(`${__dirname}/../node_modules`)),
          "./src/index.ts": [
            `import typia from "typia";`,
            "",
            `console.log(typia);`,
          ].join("\n"),
          "./src/plus.ts": `export const plus = (a: number, b: number) => a + b;`,
          "./src/minus.ts": `export const minus = (a: number, b: number) => a - b;`,
          "./package.json": await fs.promises.readFile(
            `${__dirname}/../package.json`,
            "utf8",
          ),
          "./tsconfig.json": await fs.promises.readFile(
            `${__dirname}/../tsconfig.json`,
            "utf8",
          ),
        },
      }),
      typescript({
        typescript: ts,
        compilerOptions: {
          target: "ESNext",
          module: "CommonJS",
          moduleResolution: "node",
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          strict: true,
          skipLibCheck: true,
        },
        include: ["./src/**/*.ts"],
      }),
      nodeResolve({
        browser: true,
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
