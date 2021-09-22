const resocCreateImg = require('@resoc/create-img');

const STORAGE_FILE = 'test/sample/resoc-storage.json';

resocCreateImg.storeImageData(
  STORAGE_FILE,
  'reg1', {
    template: 'default',
    values: {
      title: 'This is Reg1',
      mainImageUrl: 'https://resoc.io/assets/img/demo/photos/pexels-photo-371589.jpeg',
      textColor: '#ffffff',
      backgroundColor: '#55202a'
    }
  }
).then(() => (
  resocCreateImg.storeImageData(
    STORAGE_FILE,
    'reg2', {
      template: 'default',
      values: {
        title: 'This is Reg2',
        mainImageUrl: 'https://resoc.io/assets/img/demo/photos/pexels-photo-371589.jpeg',
        textColor: '#ffffff',
        backgroundColor: '#205555'
      }
    }
  )
)).then(() => {
  console.log("Done!");
});
