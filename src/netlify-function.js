const chromium = require('chrome-aws-lambda');

exports.handler = async (event, context) => {
  try {
    const browser = await chromium.puppeteer.launch({
      executablePath: await chromium.executablePath,
      args: chromium.args,
      headless: chromium.headless
    });

    return { statusCode: 200, body: "Hello from Resoc!" };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error :(' }),
    };
  }
};
