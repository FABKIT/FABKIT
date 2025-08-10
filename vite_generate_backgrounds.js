import {readdir, unlink, createWriteStream, promises} from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';


const getCardbacks = async function(url) {
    const response = await fetch(url);
    const cardbacks = await response.json();
    let downloads = [];
    cardbacks.forEach((cardback) => {
        cardback.images.forEach((cardbackImage) => {
            const imgUrl = cardbackImage.fileName.split('/').pop();
            const cardbackLocation = './public/img/cardbacks/generated/' + imgUrl;
            downloads.push({url: cardbackImage.fileName, fileLocation: cardbackLocation});

            cardbackImage.url = 'img/cardbacks/generated/' + imgUrl;
            delete cardbackImage.fileName;
        })
    })

    const downloadPromises = [];
    for (const download of downloads) {
        await promises.access(download.fileLocation)
            .then(() => true)
            .catch(() => downloadPromises.push(downloadFileFromURL(download.url, download.fileLocation)));
    }

    await Promise.all(downloadPromises);

    return `const cardbacks = ${JSON.stringify(cardbacks)};
export function useCardBacks() {
    return cardbacks;
}`;
}

async function downloadFileFromURL(url, fileLocation) {
    return await new Promise((resolve, reject) => {
        let evalledHttp = http;
        if (url.startsWith('https')) {
            evalledHttp = https;
        }
        evalledHttp.get(url, async (response) => {
            const code = response.statusCode ?? 0

            if (code >= 400) {
                return reject(new Error(response.statusMessage))
            }

            // save the file to disk
            const fileWriter = createWriteStream(fileLocation)
                .on('finish', () => {
                    resolve({
                        fileLocation,
                        contentType: response.headers['content-type'],
                    })
                })

            response.pipe(fileWriter)
        })
            .on('error', (error) => {
                reject(error)
            })
    })
}

export default getCardbacks;