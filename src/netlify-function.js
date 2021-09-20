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

    const htmlPath = await resoc.renderLocalTemplate(
      template, {
        title: 'A picture is worth a thousand words!!',
        mainImageUrl: 'https://resoc.io/assets/img/demo/photos/pexels-photo-371589.jpeg',
        textColor: '#ffffff',
        backgroundColor: '#20552a'
      },
      resocCore.FacebookOpenGraph,
      'assets/resoc-template'
    );

    const image = await resoc.convertUrlToImage(
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
