import {createWriteStream, promises, readFile, copyFile} from 'fs';
import http from 'http';
import https from 'https';
import examples from "./example.json" with {type: "json"};

const getCardbacks = async function (url) {
    let cardbacks = [];
    if (!url.startsWith('http') && !url.startsWith('https')) {
        cardbacks = await getExamples();
    } else {
        cardbacks = await getBackendCardbacks(url);
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

async function getBackendCardbacks(url) {
    const response = await fetch(url);
    const cardbacks = await response.json();
    const downloads = getDownloads(cardbacks);

    const downloadPromises = [];
    for (const download of downloads) {
        await promises.access(download.fileLocation)
            .then(() => true)
            .catch(() => downloadPromises.push(downloadFileFromURL(download.url, download.fileLocation)));
    }

    await Promise.all(downloadPromises);

    return cardbacks;
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