import {copyFile} from 'fs';
import examples from "./example.json" with {type: "json"};
import repoCardbacks from './cardbacks.json' with {type: "json"};

const getCardbacks = async function (source) {
    let cardbacks = [];
    if (source === 'example') {
        cardbacks = await getExamples();
    } else {
        cardbacks = await getRepoCardbacks();
    }

    return `const cardbacks = ${JSON.stringify(cardbacks)};
export function useCardBacks() {
    return cardbacks;
}`;
}


async function getExamples() {
    var cardbacks = examples;
    const downloads = getDownloads(cardbacks);

    downloads.forEach(download => {
        copyFile(download.url, download.fileLocation, (err) => {
            if (err) {
                console.log("Error Copying File:", err);
            }
        });
    })

    return cardbacks;
}

async function getRepoCardbacks() {
    var cardbacks = repoCardbacks;
    const downloads = getDownloads(cardbacks);

    downloads.forEach(download => {
        copyFile(download.url, download.fileLocation, (err) => {
            if (err) {
                console.log("Error Copying File:", err);
            }
        });
    })

    return cardbacks;
}

function getDownloads(cardbacks) {
    const downloads = [];
    cardbacks.forEach((cardback) => {
        cardback.images.forEach((cardbackImage) => {
            const imgUrl = cardbackImage.fileName.split('/').pop();
            const cardbackLocation = './public/img/cardbacks/generated/' + imgUrl;
            downloads.push({url: cardbackImage.fileName, fileLocation: cardbackLocation});

            cardbackImage.url = 'img/cardbacks/generated/' + imgUrl;
            delete cardbackImage.fileName;
        })
    })

    return downloads;
}

export default getCardbacks;
