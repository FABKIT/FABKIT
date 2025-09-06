import {useImage} from "vue-konva";

export function useCardRarities() {
    const cardRarities = [
        {
            id: 1,
            label: 'Basic',
            image: useImage('img/rarities/rarity_basic.svg')
        },
        {
            id: 2,
            label: 'Common',
            image: useImage('img/rarities/rarity_common.svg')
        },
        {
            id: 3,
            label: 'Rare',
            image: useImage('img/rarities/rarity_rare.svg')
        },
        {
            id: 4,
            label: 'Super Rare',
            image: useImage('img/rarities/rarity_superrare.svg')
        },
        {
            id: 5,
            label: 'Majestic',
            image: useImage('img/rarities/rarity_majestic.svg')
        },
        {
            id: 6,
            label: 'Legendary',
            image: useImage('img/rarities/rarity_legendary.svg')
        },
        {
            id: 7,
            label: 'Fabled',
            image: useImage('img/rarities/rarity_fabled.svg')
        },
        {
            id: 8,
            label: 'Token',
            image: useImage('img/rarities/rarity_token.svg')
        },
        {
            id: 9,
            label: 'Promo',
            image: useImage('img/rarities/rarity_promo.svg')
        },
        {
            id: 10,
            label: 'Marvel',
            image: useImage('img/rarities/rarity_marvel.svg')
        }
    ];

    return {
        cardRarities,
    }
}