exports.slugToImageData = (slug) => {
  if (slug === 'world') {
    return {
      template: 'default',
      values: {
        title: 'This is World',
        mainImageUrl: 'https://resoc.io/assets/img/demo/photos/pexels-photo-371589.jpeg',
        textColor: '#ffffff',
        backgroundColor: '#202a55'
      }
    };
  }
  return null;
}
