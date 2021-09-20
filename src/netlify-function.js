const chromium = require('chrome-aws-lambda');

const resocCore = require('@resoc/core');
const resocCreateImg = require('@resoc/create-img');

exports.handler = async (event, context) => {
  try {
    const browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: chromium.args,
      headless: chromium.headless
    });

    const template = await resocCreateImg.loadLocalTemplate('resoc-template/resoc.manifest.json');

    return { statusCode: 200, body: "Hello from Resoc!" };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error :(' }),
    };
  }
};
