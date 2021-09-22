const config = require('./resoc-open-graph-image.json');

const { builder } = require("@netlify/functions");
const path = require('path');
const chromium = require('chrome-aws-lambda');
const resocCore = require('@resoc/core');
const resocCreateImg = require('@resoc/create-img');

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

  return resocCreateImg.getImageData(mappingFilePath, slug);
}

const handler = async (event, context) => {
  try {
    console.log(`Processing image with config ${JSON.stringify(config)}`);

    const slug = eventToSlug(event);
    console.log(`Slug ${slug}`);

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

    console.log("Render image with data", imgData);

    const browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: chromium.args,
      headless: chromium.headless
    });

    const templateDir = `${config.templates_dir}/${imgData.template}`;
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
      body: JSON.stringify({ error: 'An internal error occured' }),
    };
  }
};

exports.handler = builder(handler);
