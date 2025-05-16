import fs from 'fs';

function getFiles(dir, files_) {
    files_ = files_ || [];
    const files = fs.readdirSync(dir);
    for (const i in files) {
        const name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
        } else {
            if (name.search(".png") !== -1) {
                files_.push(name);
            }
        }
    }
    return files_;
}

let res = [];

getFiles('public/img/cardbacks').forEach((file) => {
    let path = file.replace("public/img/cardbacks", "");
    const sub1re = /^\/(.*)?\/(.*.png)$/;
    let sub1match = path.match(sub1re);
    let [typeFolder, pitch] = sub1match[1].split('/');
    if (!pitch) {
        pitch = 1;
    }
    let type = typeFolder;
    if ('nostats' === typeFolder) {
        type = 'General';
    }
    if (['allstats', 'nodefense', 'nopower'].includes(typeFolder)) {
        return;
    }
    const image = sub1match[2];
    const name = image.split('_')[0];

    let cardbackIndex = res.findIndex(el => el.name === name && el.type === type);
    if (cardbackIndex < 0) {
        let cardback = {
            "type": type,
            "dented": true,
            "name": name,
            "images": []
        };
        cardback.images.push({
            "pitch": pitch,
            "url": 'img/cardbacks/' + sub1match[1] + '/' + image,
        });
        res.push(cardback);

        return;
    }
    res[cardbackIndex].images.push({
        "pitch": pitch,
        "url": 'img/cardbacks/' + sub1match[1] + '/' + image,
    });
});

const cardbacks = `const cardbacks = ${JSON.stringify(res)};
export function useCardBacks() {
    return cardbacks;
}`;

export default cardbacks;