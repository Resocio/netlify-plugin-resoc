const path = require('path');
const fs = require('fs').promises;
const chromium = require('chrome-aws-lambda');

const resocCore = require('@resoc/core');
const resocCreateImg = require('@resoc/create-img');

const config = require('./resoc-open-graph-image.json');

const eventToSlug = (event) => {
  const path = event.path;
  return path.substr(path.lastIndexOf('/') + 1);
}

const slugToImageDataViaFunction = (slug) => {
  if (!config.slug_to_image_data_function) {
    return null;
  }

  const functionPath = path.join(__dirname, config.slug_to_image_data_function + '.js');
  console.log("FYI functionPath", functionPath);

  const toImg = require(config.slug_to_image_data_function);
  return toImg.slugToImageData(slug);
}

const slugToImageDataViaMappingFile = async (slug) => {
  if (!config.slug_to_image_data_mapping_file) {
    return null;
  }

  const mappingFilePath = path.join(__dirname, config.slug_to_image_data_mapping_file);
  console.log("Loading " + mappingFilePath);
  const content = await fs.readFile(mappingFilePath);
  console.log("Content", content.toString());

  return resocCreateImg.getImageData(mappingFilePath, slug);
}

exports.handler = async (event, context) => {
  try {
    const slug = eventToSlug(event);
    console.log("Slug is " + slug);

    // First method: function
    let imgData = slugToImageDataViaFunction(slug);

    // Second method: mapping file
    if (!imgData) {
      imgData = await slugToImageDataViaMappingFile(slug);
    }

    if (!imgData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `No image for ${slug}` })
      };
    }

    const browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: chromium.args,
      headless: chromium.headless
    });

    const templateDir = `build-time-resoc-templates/${imgData.template}`;
    const template = await resocCreateImg.loadLocalTemplate(`${templateDir}/resoc.manifest.json`);

    const htmlPath = await resocCreateImg.renderLocalTemplate(
      template, imgData.values,
      resocCore.FacebookOpenGraph,
      templateDir
    );

    const image = await resocCreateImg.convertUrlToImage(
      `file:///${htmlPath}`, {
        type: 'jpeg',
        quality: 80,
        encoding: "base64",
        fullPage: true
      },
      browser
    );

    console.log("Chrome closed");

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpg'
      },
      body: image,
      isBase64Encoded: true
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error :(' }),
    };
  }
};
