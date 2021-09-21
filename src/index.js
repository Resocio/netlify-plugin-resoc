// This is the main file for the Netlify Build plugin {{name}}.
// Please read the comments to learn more about the Netlify Build plugin syntax.
// Find more information in the Netlify documentation.

const { join } = require('path')
const { ensureDir, copyFile, copy, writeJSON } = require('fs-extra')

const TEMPLATES_DIR = 'build-time-resoc-templates';

/* eslint-disable no-unused-vars */
module.exports = {
  // The plugin main logic uses `on...` event handlers that are triggered on
  // each new Netlify Build.
  // Anything can be done inside those event handlers.
  // Information about the current build are passed as arguments. The build
  // configuration file and some core utilities are also available.
  async onPreBuild({
    // Whole configuration file. For example, content of `netlify.toml`
    netlifyConfig,
    // Users can pass configuration inputs to any plugin in their Netlify
    // configuration file.
    // For example:
    //
    //   [[plugins]]
    //   package = "netlify-plugin-{{name}}"
    //     [plugins.inputs]
    //     foo = "bar"
    inputs,
    // `onError` event handlers receive the error instance as argument
    error,

    // Build constants
    constants: {
      // Path to the Netlify configuration file. `undefined` if none was used
      CONFIG_PATH,
      // Directory that contains the deploy-ready HTML files and assets
      // generated by the build. Its value is always defined, but the target
      // might not have been created yet.
      PUBLISH_DIR,
      // The directory where function source code lives.
      // `undefined` if not specified by the user.
      FUNCTIONS_SRC,
      // The directory where built serverless functions are placed before
      // deployment. Its value is always defined, but the target might not have
      // been created yet.
      FUNCTIONS_DIST,
      // Boolean indicating whether the build was run locally (Netlify CLI) or
      // in the production CI
      IS_LOCAL,
      // Version of Netlify Build as a `major.minor.patch` string
      NETLIFY_BUILD_VERSION,
      // The Netlify Site ID
      SITE_ID,
    },

    // Core utilities
    utils: {
      // Utility to report errors.
      // See https://github.com/netlify/build#error-reporting
      build,
      // Utility to display information in the deploy summary.
      // See https://github.com/netlify/build#logging
      status,
      // Utility for caching files.
      // See https://github.com/netlify/build/blob/master/packages/cache-utils#readme
      cache,
      // Utility for running commands.
      // See https://github.com/netlify/build/blob/master/packages/run-utils#readme
      run,
      // Utility for dealing with modified, created, deleted files since a git commit.
      // See https://github.com/netlify/build/blob/master/packages/git-utils#readme
      git,
      // Utility for handling Netlify Functions.
      // See https://github.com/netlify/build/tree/master/packages/functions-utils#readme
      functions,
    },
  }) {
    try {
      // Commands are printed in Netlify logs
      await run('echo', ['Hello world!\n'])
    } catch (error) {
      // Report a user error
      build.failBuild('Error message', { error })
    }

    // Console logs are shown in Netlify logs
    console.log('Netlify configuration', netlifyConfig)
    console.log('Plugin configuration', inputs)
    console.log('Build directory', PUBLISH_DIR)

    // Display success information
    status.show({ summary: 'Success!' })
  },

  // Build commands are executed
  async onBuild({ netlifyConfig, constants, inputs }) {
    const functionDir = join(constants.FUNCTIONS_SRC || 'netlify/functions');
    console.log('Copy Resoc Function to', functionDir)
    await ensureDir(functionDir);
    await copyFile(
      join(__dirname, 'netlify-function.js'),
      join(functionDir, 'resoc-open-graph-image.js')
    );

    const slugToImageData = inputs.slug_to_image_data
      ? `${functionDir.split('/').map(p => '..').join('/')}/${inputs.slug_to_image_data}`
      : null;

    await writeJSON(
      join(functionDir, 'resoc-open-graph-image.json'), {
        slug_to_image_data: slugToImageData
      }
    );

    await copy(inputs.templates_dir, TEMPLATES_DIR);

    const includedFiles = [ `${TEMPLATES_DIR}/**` ];
    if (inputs.slug_to_image_data) {
      includedFiles.push(`${inputs.slug_to_image_data}*`);
    }
    netlifyConfig.functions[ 'resoc-open-graph-image' ] = {
      external_node_modules: [ "chrome-aws-lambda", "puppeteer", "@resoc/core", "@resoc/create-img" ],
      included_files: includedFiles,
      node_bundler: 'esbuild'
    }

    console.log("IN the end", netlifyConfig);
  },

  // Other available event handlers
  /*
  // Before build commands are executed
  onPreBuild() {},
  // After Build commands are executed
  onPostBuild() {},
  // Runs on build success
  onSuccess() {},
  // Runs on build error
  onError() {},
  // Runs on build error or success
  onEnd() {},
  */
}
