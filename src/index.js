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
      join(__dirname, 'netlify-function.js'),
      join(functionDir, 'resoc-open-graph-image.js')
    );

    const slugToImageData = inputs.slug_to_image_data_function
      ? `${backwardPath(functionDir)}/${inputs.slug_to_image_data_function}`
      : null;
    const toImgDataMappingFile = inputs.slug_to_image_data_mapping_file
      ? `${backwardPath(functionDir)}/${inputs.slug_to_image_data_mapping_file}`
      : null;

    await writeJSON(
      join(functionDir, 'resoc-open-graph-image.json'), {
        templates_dir: inputs.templates_dir,
        slug_to_image_data_function: slugToImageData,
        slug_to_image_data_mapping_file: toImgDataMappingFile
      }
    );

    const includedFiles = [ `${inputs.templates_dir}/**` ];
    if (inputs.slug_to_image_data_function) {
      includedFiles.push(`${inputs.slug_to_image_data_function}*`);
    }
    if (inputs.slug_to_image_data_mapping_file) {
      includedFiles.push(inputs.slug_to_image_data_mapping_file);
    }
    netlifyConfig.functions[ 'resoc-open-graph-image' ] = {
      external_node_modules: [ "chrome-aws-lambda", "puppeteer", "@resoc/core", "@resoc/create-img" ],
      included_files: includedFiles,
      node_bundler: 'esbuild'
    }
  }
}
