import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["esm"],
    target: "es2022",
    clean: true,
});

//This is the file use to somehow fixing the error
/*
So the error I faced in this project is
in Brief
I was confused between esm node next bundler commonjs in tsconfig.json
(Also learn about these things)
My project is not directly importing from the file it is putting extension init sometime .js sometime .ts I think when i was using  true for the all noEmit and allowImportingTsExtensions in tscong.json it was importing from .ts or else from .js 
Ultimately with the help of AI cause I was not able to figureout how to get rid of this error casuse even if i somehow manage to  import it without extension in my ts files it is also not importing from .js file in the compiled version and then node giving me module not found error
so the changes i made is i used tsup for compilation
and set this config with the help of AI
at last made some changes in tsconfig.json file
*/
