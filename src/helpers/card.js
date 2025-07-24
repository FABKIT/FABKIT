import {computed, onUnmounted, ref, watch} from "vue";
import {useCardBacks} from "../config/cardbacks.js";
import {useCardBackSettings} from "../config/cardSettings.js";
import {useMath} from "./math.js";
import useTypes from "../config/types.js";

const {clamp} = useMath();

const capitalizeFirstLetter = function (val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function useCard() {
    const cardType = ref('');
    const cardPitch = ref('');
    const cardName = ref('');
    const cardCost = ref('');
    const cardText = ref('');
    const cardPower = ref('');
    const cardHeroIntellect = ref('');
    const cardTalent = ref('');
    const cardTalentCustom = ref('');
    const cardClass = ref('');
    const cardClassCustom = ref('');
    const cardSecondaryClass = ref('');
    const cardSecondaryClassCustom = ref('');
    const cardActionSubtype = ref('');
    const cardActionSubtypeCustom = ref('');
    const cardDefenseReactionSubtype = ref('');
    const cardDefenseReactionSubtypeCustom = ref('');
    const cardEquipmentSubtype = ref('');
    const cardEquipmentSubtypeCustom = ref('');
    const cardInstantSubtype = ref('');
    const cardInstantSubtypeCustom = ref('');
    const cardResourceSubtype = ref('');
    const cardResourceSubtypeCustom = ref('');
    const cardMacroGroup = ref('');
    const cardHeroSubtype = ref('');
    const cardWeaponSubtype = ref('');
    const cardWeaponSubtypeCustom = ref('');
    const cardWeapon = ref('');
    const cardRarity = ref('');
    const cardTokenSubtype = ref('');
    const cardDefense = ref('');
    const cardLife = ref('');
    const cardUploadedArtwork = ref('');
    const cardFooterText  = ref('');
    const cardTypeText = computed(() => {
        let classText = cardClass.value;
        if (classText === 'Custom' && cardClassCustom.value) {
            classText = cardClassCustom.value;
        }

        let subtype = '';
        switch (cardType.value) {
            case 'action':
                subtype = cardActionSubtype.value;
                if (subtype === 'Custom') {
                    subtype = cardActionSubtypeCustom.value;
                }
                break;
            case 'defense_reaction':
                subtype = cardDefenseReactionSubtype.value;
                if (subtype === 'Custom') {
                    subtype = cardDefenseReactionSubtypeCustom.value;
                }
                break;
            case 'equipment':
                subtype = cardEquipmentSubtype.value;
                if (subtype === 'Custom') {
                    subtype = cardEquipmentSubtypeCustom.value;
                }
                break;
            case 'instant':
                subtype = cardInstantSubtype.value;
                if (subtype === 'Custom') {
                    subtype = cardInstantSubtypeCustom.value;
                }
                break;
            case 'resource':
                subtype = cardResourceSubtype.value;
                if (subtype === 'Custom') {
                    subtype = cardResourceSubtypeCustom.value;
                }
                break;
            case 'hero':
            case 'demi_hero':
                subtype = cardHeroSubtype.value;
                break;
            case 'weapon':
                subtype = cardWeaponSubtype.value;
                if (subtype === 'Custom') {
                    subtype = cardWeaponSubtypeCustom.value;
                }
                break;
            case 'token':
                subtype = cardTokenSubtype.value;
                break;
        }

        if (subtype) {
            subtype = ' - ' + subtype;
        }
        if (cardType.value === 'weapon') {
            subtype += ' ' + cardWeapon.value;
        }

        let type = capitalizeFirstLetter(cardType.value).split('_').map((word) => capitalizeFirstLetter(word)).join(' ');

        let secondaryClass = '';
        if (cardSecondaryClass.value) {
            secondaryClass = ' / ' + cardSecondaryClass.value;
            if (cardSecondaryClass.value === 'Custom') {
                secondaryClass = ' / ' + cardSecondaryClassCustom.value;
            }
        }

        let talent = cardTalent.value;
        if (talent === 'Custom') {
            talent = cardTalentCustom.value;
        }

        return `${talent} ${classText} ${secondaryClass} ${type} ${subtype}`
            .replace(/  +/g, ' ')
            .replace(/ $/, '')
            .replace(/^ /, '')
            ;
    });

    const types = useTypes();

    const activeFields = computed(() => {
        if (cardType.value === '') return [];

        const selectedType = types.find(t => t.type === cardType.value);
        if (!selectedType) return false;


        return selectedType.fields.map(el => el.id);
    })
    const isFieldShown = (fieldId) => {
        if (activeFields.value.includes(fieldId)) return true;
        // Reset field value when it's not shown
        eval(fieldId).value = '';
        return false;
    };

    const cardbacks = useCardBacks();

    const availableCardbacks = computed(() => {
        return cardbacks.filter(el => {
            let type = 'General';
            if (['equipment', 'hero', 'demi_hero', 'equipment', 'weapon', 'token', 'resource'].includes(cardType.value)) {
                type = cardType.value;
                if (cardType.value === 'demi_hero') {
                    type = 'hero';
                }
            }
            return el.type.toLowerCase() === type.toLowerCase();
        });
    });
    const currentCardback = computed(() => {
        if (backgroundIndex.value > (availableCardbacks.value.length - 1)) {
            // Reset the index to 0 if it's out of bounds
            backgroundIndex.value = 0;
        }

        return availableCardbacks.value[backgroundIndex.value];
    })

    const currentBackground = computed(() => {
        let currentPitch = cardPitch.value || 1;
        if (currentCardback.value.images.length < currentPitch) {
            // Reset pitch to 1 if the current pitch is invalid
            currentPitch = 1;
        }
        return currentCardback.value.images.find(el => String(el.pitch) === String(currentPitch)).url
    });

    const frameType = computed(() => {
        if (currentCardback.value.dented) {
            return 'dented';
        }

        return 'flat';
    });

    const cardBackSettings = useCardBackSettings();

    const getConfig = function (fieldName) {
        if (!cardBackSettings[frameType.value]) return {};
        if (cardBackSettings[frameType.value][cardType.value] && cardBackSettings[frameType.value][cardType.value][fieldName]) {
            return {
                ...cardBackSettings[frameType.value][cardType.value][fieldName],
            };
        }
        if (cardBackSettings[frameType.value].default[fieldName]) {
            return {
                ...cardBackSettings[frameType.value].default[fieldName],
            };
        }

        return {};
    }

    const cardbackName = computed(() => {
        return currentCardback.value.name;
    })

    const backgroundIndex = ref(0);

    const switchBackground = function (dir) {
        const available = availableCardbacks.value;
        if (dir === 'next') {
            backgroundIndex.value = clamp(
                (backgroundIndex.value + 1) % available.length,
                0,
                available.length - 1
            );

            return Promise.resolve();
        }
        if (dir === 'previous') {
            backgroundIndex.value = clamp(
                (backgroundIndex.value - 1 + available.length) % available.length,
                0,
                available.length - 1
            );
            return Promise.resolve();
        }

        return Promise.resolve();
    }


    const scaledFontsize = function (text, fontSize, fontface, desiredWidth) {
        const c = document.createElement('canvas');
        const cctx = c.getContext('2d');
        cctx.font = fontSize + 'px ' + fontface;
        const textWidth = cctx.measureText(text).width;
        if (textWidth < desiredWidth) {
            return fontSize;
        }

        // Try and calculate the correct fontsize first
        let newFontSize = (((fontSize * desiredWidth) / textWidth));

        // If it's correct we return it
        if (cctx.measureText(text).width <= desiredWidth) {
            return newFontSize;
        }

        // increment the fontsize with 0.01 until we get a good size
        while (cctx.measureText(text).width > desiredWidth) {
            newFontSize -= 0.01;
            cctx.font = newFontSize + 'px ' + fontface;
        }

        return newFontSize;
    }

    const nameFontSize = computed(() => {
        const config = getConfig('cardName') || {};

        return scaledFontsize(cardName.value, config.fontSize, config.fontFamily, config.width);
    })

    const typeTextFontSize = computed(() => {
        const typeTextConfig = getConfig('cardTypeText') || {};

        return scaledFontsize(cardTypeText.value, typeTextConfig.fontSize, typeTextConfig.fontFamily, typeTextConfig.width);
    })

    const footerTextFontSize = computed(() => {
        const footerTextConfig = getConfig('cardFooterText') || {};

        return scaledFontsize(cardTypeText.value, footerTextConfig.fontSize, footerTextConfig.fontFamily, footerTextConfig.width);
    })


    onUnmounted(() => {
        cardType.value = '';
            cardPitch.value = '';
            cardName.value = '';
            cardCost.value = '';
            cardText.value = '';
            cardPower.value = '';
            cardHeroIntellect.value = '';
            cardTalent.value = '';
            cardTalentCustom.value = '';
            cardClass.value = '';
            cardClassCustom.value = '';
            cardSecondaryClass.value = '';
            cardSecondaryClassCustom.value = '';
            cardActionSubtype.value = '';
            cardActionSubtypeCustom.value = '';
            cardDefenseReactionSubtype.value = '';
            cardDefenseReactionSubtypeCustom.value = '';
            cardEquipmentSubtype.value = '';
            cardEquipmentSubtypeCustom.value = '';
            cardInstantSubtype.value = '';
            cardInstantSubtypeCustom.value = '';
            cardResourceSubtype.value = '';
            cardResourceSubtypeCustom.value = '';
            cardMacroGroup.value = '';
            cardHeroSubtype.value = '';
            cardWeaponSubtype.value = '';
            cardWeaponSubtypeCustom.value = '';
            cardWeapon.value = '';
            cardRarity.value = '';
            cardTokenSubtype.value = '';
            cardDefense.value = '';
            cardLife.value = '';
            cardUploadedArtwork.value = '';
            cardTypeText.value = '';
            cardFooterText.value = '';
    });
    return {
        types,
        cardType,
        cardPitch,
        cardName,
        cardCost,
        cardText,
        cardPower,
        cardHeroIntellect,
        cardTalent,
        cardTalentCustom,
        cardClass,
        cardClassCustom,
        cardSecondaryClass,
        cardSecondaryClassCustom,
        cardActionSubtype,
        cardActionSubtypeCustom,
        cardDefenseReactionSubtype,
        cardDefenseReactionSubtypeCustom,
        cardEquipmentSubtype,
        cardEquipmentSubtypeCustom,
        cardInstantSubtype,
        cardInstantSubtypeCustom,
        cardResourceSubtype,
        cardResourceSubtypeCustom,
        cardMacroGroup,
        cardHeroSubtype,
        cardWeaponSubtype,
        cardWeaponSubtypeCustom,
        cardWeapon,
        cardRarity,
        cardTokenSubtype,
        cardDefense,
        cardLife,
        cardUploadedArtwork,
        cardTypeText,
        cardFooterText,
        isFieldShown,
        currentBackground,
        getConfig,
        switchBackground,
        cardbackName,
        nameFontSize,
        typeTextFontSize,
        footerTextFontSize,
    };
}
