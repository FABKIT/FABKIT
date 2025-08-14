import {useImage} from "vue-konva";

export function useCardRarities() {
    const cardRarities = [
        {
            id: 1,
            label: 'Common',
            image: useImage('img/rarities/rarity_common.svg')
        },
        {
            id: 2,
            label: 'Fabled',
            image: useImage('img/rarities/rarity_fabled.svg')
        },
        {
            id: 3,
            label: 'Legendary',
            image: useImage('img/rarities/rarity_legendary.svg')
        },
        {
            id: 4,
            label: 'Majestic',
            image: useImage('img/rarities/rarity_majestic.svg')
        },
        {
            id: 5,
            label: 'Marvel',
            image: useImage('img/rarities/rarity_marvel.svg')
        },
        {
            id: 6,
            label: 'Promo',
            image: useImage('img/rarities/rarity_promo.svg')
        },
        {
            id: 7,
            label: 'Rare',
            image: useImage('img/rarities/rarity_rare.svg')
        },
        {
            id: 8,
            label: 'Super Rare',
            image: useImage('img/rarities/rarity_superrare.svg')
        },
        {
            id: 9,
            label: 'Token',
            image: useImage('img/rarities/rarity_token.svg')
        }
    ];

    return {
        cardRarities,
    }
}