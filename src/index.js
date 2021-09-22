const { join } = require('path')
const { ensureDir, copyFile, writeJSON } = require('fs-extra');

/**
 * backwardPath('some/path/to/somewhere') returns '../../../..'
 */
const backwardPath = (path) => (
  path.replace(/\\/g, '/').split('/').map(p => '..').join('/')
)

/* eslint-disable no-unused-vars */
module.exports = {
  async onBuild({ netlifyConfig, constants, inputs }) {
    const functionDir = constants.FUNCTIONS_SRC || 'netlify/functions';
    console.log(`Copy Resoc Netlify Function to ${functionDir}`);
    await ensureDir(functionDir);
    await copyFile(
      join(__dirname, 'resoc-open-graph-image.js'),
      join(functionDir, 'resoc-open-graph-image.js')
    );

    const jsonConfigFile = join(functionDir, 'resoc-open-graph-image.json');
    console.log(`Write Netlify Function configuration to ${jsonConfigFile}`);
    await writeJSON(jsonConfigFile, {
      templates_dir: inputs.templates_dir,

      slug_to_image_data_function:
        inputs.slug_to_image_data_function
          ? `${backwardPath(functionDir)}/${inputs.slug_to_image_data_function}`
          : null,

      slug_to_image_data_mapping_file:
        inputs.slug_to_image_data_mapping_file
          ? `${backwardPath(functionDir)}/${inputs.slug_to_image_data_mapping_file}`
          : null
    });

    console.log("Set Netlify Function configuration");
    netlifyConfig.functions[ 'resoc-open-graph-image' ] = {
      node_bundler: 'esbuild',

      external_node_modules: [
        'chrome-aws-lambda',
        'puppeteer-core',
        '@resoc/core',
        '@resoc/create-img',
        '@netlify/functions'
      ],

      included_files: [
        `${inputs.templates_dir}/**`,
        inputs.slug_to_image_data_function,
        inputs.slug_to_image_data_mapping_file
      ].filter(p => p)
    }
  }
}
