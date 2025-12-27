export const pkg: {
    name: string;
    description: string;
    version: string;
    author: string;
    bugs: {
        url: string;
    };
    dependencies: {
        "jwt-decode": string;
        mqtt: string;
        undici: string;
    };
    devDependencies: {
        "@unblessed/node": string;
        "@types/node": string;
        "@voxpelli/tsconfig": string;
        argsclopts: string;
        "auto-changelog": string;
        c8: string;
        eslint: string;
        "gh-release": string;
        neostandard: string;
        "npm-run-all2": string;
        typescript: string;
    };
    engines: {
        node: string;
        npm: string;
    };
    homepage: string;
    keywords: string[];
    license: string;
    type: string;
    module: string;
    main: string;
    types: string;
    files: string[];
    bin: {
        "yoto-auth": string;
        "yoto-token-info": string;
        "yoto-refresh-token": string;
        "yoto-devices": string;
        "yoto-device-model": string;
        "yoto-content": string;
        "yoto-groups": string;
        "yoto-icons": string;
    };
    repository: {
        type: string;
        url: string;
    };
    scripts: {
        prepublishOnly: string;
        postpublish: string;
        test: string;
        "test:lint": string;
        "test:tsc": string;
        "test:node-test": string;
        version: string;
        "version:changelog": string;
        "version:git": string;
        build: string;
        "build:declaration": string;
        clean: string;
        "clean:declarations-top": string;
        "clean:declarations-lib": string;
        "clean:declarations-bin": string;
    };
    funding: {
        type: string;
        url: string;
    };
    c8: {
        reporter: string[];
    };
};
//# sourceMappingURL=pkg.d.cts.map