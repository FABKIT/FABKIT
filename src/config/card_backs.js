const card_backs = {
    dented: {
        default: {
            cardBackground: {
                x: 0,
                y: 0,
                name: 'background',
                id: 'img-background',
                draggable: false,
            },
            cardText: {
                x: 55,
                y: 408,
                draggable: false,
                name: 'card-text-image',
            },
            cardName: {
                x: 88,
                y: 41.2,
                width: 273.5,
                height: 31,
                fontFamily: 'Amanda Std Regular',
                fontSize: 25,
                verticalAlign: "middle",
                align: "center",
                fill: "black",
            },
            cardCost: {
                x: 372.1,
                y: 34.6,
                width: 48,
                height: 44,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 19,
                verticalAlign: "middle",
                align: "center",
                stroke: "#C42025",
                strokeWidth: 2,
                fillAfterStrokeEnabled: true,
            },
            cardDefense: {
                x: 352.3,
                y: 572,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
                align: "center",
            },
            cardPower: {
                x: 73,
                y: 572,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
                align: "center",
            },
            cardTypeText: {
                x: 116.3,
                y: 562.55,
                width: 217.2,
                height: 23,
                fontFamily: 'Amanda Std Regular',
                fontSize: 17.6,
                verticalAlign: "middle",
                align: "center",
                fill: "black",
            },
            cardLife: {
                x: 352.1,
                y: 572,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
                align: "center",
            },
            cardRarity: {
                x: 126,
                y: 596,
                width: 12,
                height: 12,
            },
            cardUploadedArtwork: {
                width: 390,
                height: 309,
                x: 30,
                y: 76,
            },
            cardFooterText: {
                x: 142,
                y: 597.9,
                width: 182,
                height: 12,
                fontFamily: 'Dialog Cond Semibold Regular',
                fontSize: 9.2,
                verticalAlign: "top",
                fill: "white",
            }
        },
        // Specialty cases
        hero: {
            cardName: {
                x: 55.6,
                y: 34.6,
                width: 338.5,
                height: 38,
                fontFamily: 'Amanda Std Regular',
                fontSize: 29,
                verticalAlign: "middle",
                align: "center",
                fill: "black",
            },
            cardHeroIntellect: {
                x: 73.4,
                y: 572,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
            },
            cardUploadedArtwork: {
                width: 390,
                height: 628,
                x: 30,
                y: 76,
            },
        },
        demi_hero: {
            cardName: {
                x: 55.6,
                y: 34.6,
                width: 338.5,
                height: 38,
                fontFamily: 'Amanda Std Regular',
                fontSize: 29,
                verticalAlign: "middle",
                align: "center",
                fill: "black",
            },
            cardHeroIntellect: {
                x: 73.4,
                y: 572,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
            },
            cardUploadedArtwork: {
                width: 390,
                height: 628,
                x: 30,
                y: 76,
            },
        },
    },
    flat: {
        default: {
            cardBackground: {
                x: 0,
                y: 0,
                name: 'background',
                id: 'img-background',
                draggable: false,
            },
            cardText: {
                x: 55,
                y: 408,
                draggable: false,
                name: 'card-text-image',
            },
            cardName: {
                x: 88,
                y: 41.2,
                width: 273.5,
                height: 31,
                fontFamily: 'Amanda Std Regular',
                fontSize: 25,
                verticalAlign: "middle",
                align: "center",
                fill: "black",
            },
            cardCost: {
                x: 372.1,
                y: 34.6,
                width: 48,
                height: 44,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 19,
                verticalAlign: "middle",
                stroke: "#C42025",
                strokeWidth: 2,
                fillAfterStrokeEnabled: true,
            },
            cardDefense: {
                x: 352.3,
                y: 571.5,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
            },
            cardPower: {
                x: 73,
                y: 571.5,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
            },
            cardTypeText: {
                x: 116.3,
                y: 562.55,
                width: 217.2,
                height: 23,
                fontFamily: 'Amanda Std Regular',
                fontSize: 17.6,
                verticalAlign: "middle",
                align: "center",
                fill: "black",
            },
            cardHeroIntellect: {
                x: 73.4,
                y: 571.8,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
            },
            cardLife: {
                x: 352.1,
                y: 571.8,
                width: 24,
                height: 29,
                fontFamily: 'Palatino LT Std Light',
                fontSize: 20.6,
                verticalAlign: "middle",
            },
            cardUploadedArtwork: {
                width: 390,
                height: 309,
                x: 30,
                y: 76,
            },
        },
        hero: {
            cardUploadedArtwork: {
                width: 390,
                height: 628,
                x: 30,
                y: 76,
            },
        },
        demi_hero: {
            cardUploadedArtwork: {
                width: 390,
                height: 628,
                x: 30,
                y: 76,
            },
        }
    }
}

export function useCardBacks() {
    return card_backs;
}