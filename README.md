# waka-pm

`waka-pm` is a command-line interface tool that allows you to enforce consistencies throughout your pnpm monorepo.
`waka-pm` sibling waka-package/waka-root yaml files alongside every package.json within your monorepo. 
The waka yaml files can be used to define consistent dependency versions that could be installed 
in any package withing your monorepo.
Versions for the dependencies can be hoisted to the root waka file while dependency declarations can be localized in 
each respective package/app within the monorepo.

## Installation

To install Waka CLI, run the following command:

```bash
npm install -g waka-pm
```

Alternative you can use npx / pnpx:

```bash
pnpx waka-pm [subcommand]
```


## First time setup 

First, run the `init`  subcommand to generate all of the waka files
```bash
cd /your/pnpm/project
pnpx waka-pm init
```

Then, run import to import dependencies into `waka-pm` and interactively walk through all root dependency registrations.
```bash
pnpx waka-pm import
```

Finally, add this command to your `preinstall` script in your root package.json file
```json
{
   "scripts": {
        ...
        "preinstall": "pnpx waka-pm apply"
        ...
    } 
}
```


## Usage

Once installed, you can use the Waka CLI by executing the `waka` command followed by the desired subcommand.

### Initialize Waka YAML Files

To initialize Waka YAML files within your monorepo, use the `init` command:

```
waka init
```

This command will create the necessary Waka YAML files in your project.

### Import Dependencies

To import dependencies from your `package.json` files into the corresponding Waka YAML files, use the `import` command:

```
waka import [--register-all] [--accept-latest]
```

The `--register-all` flag registers all dependencies in the root registry, while the `--accept-latest` flag assigns the latest defined version to dependencies with the same name but different versions in the monorepo.

### Apply Waka YAML Files

To apply changes from Waka YAML files to your `package.json` files, use the `apply` command:

```
waka apply [--no-skip-ci]
```

This command will update the `package.json` files based on the information specified in the Waka YAML files. 

### Install New Dependencies

To install new dependencies and update the Waka YAML files, use the `install` command:

```
waka install [--packageName <package>] [--workspace <workspace>] [--save-dev] [--save-peer] [--save-opt] [--no-register]
```

The `--packageName` option specifies the package to install, while the `--workspace` option defines the workspace to install to. Additionally, the `--save-dev`, `--save-peer`, and `--save-opt` flags determine the type of dependency to save, and the `--no-register` flag prevents registering the dependency in the root registry.

### Eject Waka

To remove all Waka configuration from your project, use the `eject` command:

```
waka eject [--confirm]
```

The `--confirm` flag confirms the removal of the Waka configuration files.




# Definition of waka.config.js

The `waka.config.js` file is used to define lifecycle hooks for Waka, allowing users to customize the behavior of the tool according to their specific needs. This readme will guide you on how to define the `waka.config.js` file.

## File Location

The `waka.config.js` file should be located in the root directory of your project. Otherwise, you can use the [--config-path] options on the applicable subcommands to define an alternate waka.config.js file path.

## File Structure

The `waka.config.js` file should export an object that adheres to the following structure:

```javascript
const config = {
  installPreEvaluate: async (args) => {
    // pre install code
  },
  installPreWrite: async (args) => {
    // install pre-write code
  },
  installPostWrite: async (args) => {
    // install post-write code
  },
  applyPreEvaluate: async (args) => {
    // apply pre-evaluate code
  },
  applyPreWrite: async (args) => {
    // apply pre-write code
  },
  applyPostWrite: async (args) => {
    // apply post-write code
  },
};

module.exports = config;
```

The `config` object consists of various lifecycle hook functions that will be executed at different stages of the Waka process. Each function is defined as an asynchronous function that takes specific arguments.

## Lifecycle Hooks

### installPreEvaluate

The `installPreEvaluate` hook is executed before the installation process begins. It takes the following arguments:

```javascript
{
  workspaceDir: string,
  depType: string,
  wakaRoot: RootDocument,
  installPackageAndVersion: string
}
```

### installPreWrite

The `installPreWrite` hook is executed before writing the installation changes to the file system. It takes the following arguments:

```javascript
{
  wakaRootFile: string,
  workspaceDir: string,
  depType: string,
  wakaRoot: RootDocument,
  wakaPackage?: PackageDocument,
  wakaPackageFile?: string,
  parsedPackageInfo: {
    name: string,
    version: string | null
  }
}
```

### installPostWrite

The `installPostWrite` hook is executed after writing the installation changes to the file system. It takes the same arguments as `installPreWrite`.

### applyPreEvaluate

The `applyPreEvaluate` hook is executed before the apply process begins. It takes the following arguments:

```javascript
{
  wakaRoot: Root,
  wakaPackages: Record<string, Package>
}
```

### applyPreWrite

The `applyPreWrite` hook is executed before writing the apply changes to the file system. It takes the following arguments:

```javascript
{
  wakaRoot: Root,
  wakaPackages: Record<string, Package>,
  packageDirToJsonContents: [string, PackageJsonContents][]
}
```

### applyPostWrite

The `applyPostWrite` hook is executed after writing the apply changes to the file system. It takes the same arguments as `applyPreWrite`.

## Importing Additional Modules

If you need to import additional modules in your `waka.config.js` file, you can do so using the `import` statement. However, keep in mind that the file should be transpiled using a tool like Babel to ensure compatibility with the Node.js runtime.


## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, 
please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/napisani/waka).

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

