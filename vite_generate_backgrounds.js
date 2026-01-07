import {copyFile} from 'fs';
import repoCardbacks from './cardbacks/cardbacks.json' with {type: "json"};

const getCardbacks = async function () {
  let cardbacks = repoCardbacks;
  const downloads = getDownloads(cardbacks);

  downloads.forEach(download => {
    copyFile(download.url, download.fileLocation, (err) => {
      if (err) {
        console.log("Error Copying File:", err);
      }
    });
  });


  return `const cardbacks = ${JSON.stringify(cardbacks)};
export function useCardBacks() {
    return cardbacks;
}`;
}

function getDownloads(cardbacks) {
  const downloads = [];
  cardbacks.forEach((cardback) => {
    cardback.images.forEach((cardbackImage) => {
      const imgUrl = cardbackImage.fileName.split('/').pop();
      const cardbackLocation = './public/img/cardbacks/generated/' + imgUrl;
      downloads.push({
        url: './cardbacks/' + cardbackImage.fileName,
        fileLocation: cardbackLocation
      });

      cardbackImage.url = 'img/cardbacks/generated/' + imgUrl;
      delete cardbackImage.fileName;
    })
  })

  return downloads;
}

export default getCardbacks;
