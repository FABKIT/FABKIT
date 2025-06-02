import {readdir, unlink, createWriteStream} from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';


const getCardbacks = async function(url) {
    // remove existing cardbacks
    readdir('./public/img/cardbacks/generated', (err, files) => {
        if (err) throw err;

        for (const file of files) {
            unlink(path.join('./public/img/cardbacks/generated', file), (err) => {
                if (err) throw err;
            });
        }
    });
    const response = await fetch(url);
    const cardbacks = await response.json();
    let downloads = [];
    cardbacks.forEach((cardback) => {
        cardback.images.forEach((cardbackImage) => {
            downloads.push({url: cardbackImage.fileName, fileLocation: './public/img/cardbacks/generated/'+cardbackImage.url});

            cardbackImage.url = 'img/cardbacks/generated/'+cardbackImage.url;
            delete cardbackImage.fileName;
        })
    })

    for (const download of downloads) {
        await downloadFileFromURL(download.url, download.fileLocation);
    }

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