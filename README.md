# Resoc Social Image Netlify Build Plugin

Automated social images for a website hosted on Netlify.

Features:
- Image templates made easy with HTML & CSS, thanks to the [Resoc Image Template Development Kit](https://www.npmjs.com/package/itdk)
- No build time penalty: images are created on demand via a Netlify Function
- You will only need a few lines of code

## Create an image template

You first need an image template:

```bash
cd my-project
npx itdk init resoc-templates/default -m title-description
```

This command creates a new template in `resoc-templates/default` and opens a viewer in your browser. Read the [Resoc Image Template Development Kit](https://www.npmjs.com/package/itdk) for more information.

## Install and configure the plugin

Install the plugin with:

```bash
npm install --save-dev @resoc/netlify-plugin-social-image
```

In your existing `netlify.toml`, configure the plugin:

```toml
[[plugins]]
package = "@resoc/netlify-plugin-social-image"
  [plugins.inputs]
  templates_dir = "resoc-templates"
  open_graph_base_path = "/social-images"
```

`templates_dir` is the location of your templates. This directory and the template name will be later contatened to form the final directory. In this example, the template directory is `resoc-templates` and the template will be named `default`, so the Netlify function will look for a template in `resoc-templates/default`.

`open_graph_base_path` is the base path for Open Graph images. For example, `/social-images/homepage.jpg` or `/social-images/news.png`.

## Create the image data

Because we are creating images based on a template, we need to provide parameters to the template to turn it into an image. For example, your template might expect a title and a description (probably the title and description of the page the image it supposed to illustrate).

What you need to do is to map page slugs to image data and template. For example, if your site has a page accessible via `/news`, its corresponding social image will be available via `/social-images/news.jpg`. For this to work, you must indicate that, for the slug `news`, the template to use is `default`, the title is `Our news` and the description is `All our latest news`.

There are two ways to achieve this.

### Statically, at build time

**Your images won't be generated at build time** - Here, we are only talking about gathering the image data.

Several frameworks and site builders create website statically: Next.js, Gatsby, 11ty... In this scenario, it makes sense to collect all the data at build time. This is achieved by preparing an image data mapping file.

In `netlify.toml`, declare this file:

```toml
[[plugins]]
package = "@resoc/netlify-plugin-social-image"
  [plugins.inputs]
  templates_dir = "resoc-templates"
  open_graph_base_path = "/social-images"
  slug_to_image_data_mapping_file = "resoc-image-data.json"
```

It will be used by the Netlify Function to create the images.

You now need to populate this file. Install:

```bash
npm install --save-dev @resoc/img-data
```

In your code:

```js
import { storeImageData } from '@resoc/img-data'

await storeImageData(
  'resoc-image-data.json', // Mapping file, as declared in netlify.toml
  "news", // Slug
  {
    // `${templates_dir}/${template}/resoc.manifest.json` should exist,
    // where templates_dir comes from netlify.toml and template is the parameter below
    template: 'default', 

    values: {
      title: "Our news",
      description: "All our latest news"
    }
  }
);
```

There must be a right place where to put this code.

For example, in Next.js, update the `getStaticProps` function of `pages/news.jsx`:

```js
export async function getStaticProps(context) {
  const title = "Our news";
  const description = "All our latest news";
  const imgSlug = "news";

  await storeImageData(
    'resoc-image-data.json',
    imgSlug,
    {
      template: "default",
      values: { title, description }
    }
  );

  return {
    props: {
      title,
      description,
      imgSlug
    }
  }
}
```

Also update `pages/_app.js`, where you manage the `head` markups:

```html
<title>{pageProps.title}</title>
<meta name="description" content={pageProps.description} />
<meta property="og:title" content={pageProps.title} />
<meta property="og:description" content={pageProps.description} />
<meta property="og:image" content={`/social-images/${pageProps.imgSlug}.jpg`} />
```

Thanks to the Next.js build system, `getStaticProps` will be called for all pages. Therefore, all image data will be saved as a side effect.

## Dynamically, at runtime

If your site has pages which URL or data are not known at build time, you need to provide the image data via a function that will be run by the Netlify Function.

Configure the function in `netlify.toml`:

```toml
[[plugins]]
package = "@resoc/netlify-plugin-social-image"
  [plugins.inputs]
  templates_dir = "resoc-templates"
  open_graph_base_path = "/social-images"
  slug_to_image_data_function = "src/slug-to-image-data.js"
```

`src/slug-to-image-data.js` must export a function named `slugToImageData`. This function probably needs to perform an API call of some kind:

```js
exports.slugToImageData = (slug) => {
  const exampleData = await exampleFetch(slug);

  return {
    // `${templates_dir}/${template}/resoc.manifest.json` should exist,
    // where templates_dir comes from netlify.toml and template is the parameter below
    template: 'default',

    values: {
      title: exampleData.info,
      description: exampleData.large_info
    }
  }
}
```

The page itself must declare the Open Graph Image accordingly:

```html
<meta property="og:image" content={`/social-images/${slug}.jpg`} />
```

## Deploy to Netlify

That's all! Your app is ready to be deployed to Netlify.
