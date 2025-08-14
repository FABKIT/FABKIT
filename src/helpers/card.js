import {computed, onMounted, onUnmounted, reactive, ref, watch} from "vue";
import {useCardBacks} from "../config/cardbacks.js";
import {useCardBackSettings} from "../config/cardSettings.js";
import {useMath} from "./math.js";
import useTypes from "../config/types.js";
import {useCardRarities} from "./cardRarities.js";

const {clamp} = useMath();

const capitalizeFirstLetter = function (val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function useCard() {
    const fields = reactive({
        cardType: '',
        cardPitch: '',
        cardName: '',
        cardCost: '',
        cardText: '',
        cardPower: '',
        cardHeroIntellect: '',
        cardTalent: '',
        cardTalentCustom: '',
        cardClass: '',
        cardClassCustom: '',
        cardSecondaryClass: '',
        cardSecondaryClassCustom: '',
        cardActionSubtype: '',
        cardActionSubtypeCustom: '',
        cardDefenseReactionSubtype: '',
        cardDefenseReactionSubtypeCustom: '',
        cardEquipmentSubtype: '',
        cardEquipmentSubtypeCustom: '',
        cardInstantSubtype: '',
        cardInstantSubtypeCustom: '',
        cardResourceSubtype: '',
        cardResourceSubtypeCustom: '',
        cardMacroGroup: '',
        cardHeroSubtype: '',
        cardWeaponSubtype: '',
        cardWeaponSubtypeCustom: '',
        cardWeapon: '',
        cardRarity: 0,
        cardTokenSubtype: '',
        cardDefense: '',
        cardLife: '',
        cardUploadedArtwork: '',
        cardFooterText: '',
    });
    const cardTypeText = computed(() => {
        let classText = fields.cardClass;
        if (classText === 'Custom' && fields.cardClassCustom) {
            classText = fields.cardClassCustom;
        }

        let subtype = '';
        switch (fields.cardType) {
            case 'action':
                subtype = fields.cardActionSubtype;
                if (subtype === 'Custom') {
                    subtype = fields.cardActionSubtypeCustom;
                }
                break;
            case 'defense_reaction':
                subtype = fields.cardDefenseReactionSubtype;
                if (subtype === 'Custom') {
                    subtype = fields.cardDefenseReactionSubtypeCustom;
                }
                break;
            case 'equipment':
                subtype = fields.cardEquipmentSubtype;
                if (subtype === 'Custom') {
                    subtype = fields.cardEquipmentSubtypeCustom;
                }
                break;
            case 'instant':
                subtype = fields.cardInstantSubtype;
                if (subtype === 'Custom') {
                    subtype = fields.cardInstantSubtypeCustom;
                }
                break;
            case 'resource':
                subtype = fields.cardResourceSubtype;
                if (subtype === 'Custom') {
                    subtype = fields.cardResourceSubtypeCustom;
                }
                break;
            case 'hero':
            case 'demi_hero':
                subtype = fields.cardHeroSubtype;
                break;
            case 'weapon':
                subtype = fields.cardWeaponSubtype;
                if (subtype === 'Custom') {
                    subtype = fields.cardWeaponSubtypeCustom;
                }
                break;
            case 'token':
                subtype = fields.cardTokenSubtype;
                break;
        }

        if (subtype) {
            subtype = ' - ' + subtype;
        }
        if (fields.cardType === 'weapon') {
            subtype += ' ' + fields.cardWeapon;
        }

        let type = capitalizeFirstLetter(fields.cardType).split('_').map((word) => capitalizeFirstLetter(word)).join(' ');

        let secondaryClass = '';
        if (fields.cardSecondaryClass) {
            secondaryClass = ' / ' + fields.cardSecondaryClass;
            if (fields.cardSecondaryClass === 'Custom') {
                secondaryClass = ' / ' + fields.cardSecondaryClassCustom;
            }
        }

        let talent = fields.cardTalent;
        if (talent === 'Custom') {
            talent = fields.cardTalentCustom;
        }

        return `${talent} ${classText} ${secondaryClass} ${type} ${subtype}`
            .replace(/  +/g, ' ')
            .replace(/ $/, '')
            .replace(/^ /, '')
            ;
    });

    const types = useTypes();

    const activeFields = computed(() => {
        if (fields.cardType === '') return [];

        const selectedType = types.find(t => t.type === fields.cardType);
        if (!selectedType) return false;


        return selectedType.fields.map(el => el.id);
    })
    const isFieldShown = (fieldId) => {
        if (activeFields.value.includes(fieldId)) return true;
        // Reset field value when it's not shown
        fields[fieldId] = '';
        return false;
    };

    const cardbacks = useCardBacks();

    const availableCardbacks = computed(() => {
        return cardbacks.filter(el => {
            let type = 'General';
            if (['equipment', 'hero', 'demi_hero', 'equipment', 'weapon', 'token', 'resource'].includes(fields.cardType)) {
                type = fields.cardType;
                if (fields.cardType === 'demi_hero') {
                    type = 'hero';
                }
            }
            return el.type.toLowerCase() === type.toLowerCase();
        });
    });

    const filteredAvailableCardbacks = computed(() => {

        // Filter based on dented property
        if (selectedStyle.value === 'dented') {
            // Only show cardbacks where dented is explicitly true
            return availableCardbacks.value.filter(cb => cb.dented === true);
        } else if (selectedStyle.value === 'flat') {
            // Show cardbacks where dented is false, undefined, or null
            return availableCardbacks.value.filter(cb => !cb.dented);
        }

        return availableCardbacks.value;
    });

    const currentCardback = computed(() => {
        const filtered = filteredAvailableCardbacks.value;

        if (backgroundIndex.value > (filtered.length - 1)) {
            // Reset the index to 0 if it's out of bounds
            backgroundIndex.value = 0;
        }

        return filtered[backgroundIndex.value];
    })

    const currentBackground = computed(() => {
        let currentPitch = fields.cardPitch || 1;
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

    const cardTextStyleClass = computed(() => {
        // Return the frame type as the CSS class name
        return frameType.value; // This will be either 'flat' or 'dented'
    });

    const cardBackSettings = useCardBackSettings();

    const getConfig = function (fieldName) {
        if (!cardBackSettings[frameType.value]) return {};
        if (cardBackSettings[frameType.value][fields.cardType] && cardBackSettings[frameType.value][fields.cardType][fieldName]) {
            return {
                ...cardBackSettings[frameType.value][fields.cardType][fieldName],
            };
        }
        if (cardBackSettings[frameType.value].default[fieldName]) {
            return {
                ...cardBackSettings[frameType.value].default[fieldName],
            };
        }

        return {};
    }

    const backgroundIndex = ref(0);
    const selectedStyle = ref('dented');

    const switchBackground = function (dir) {
        const available = filteredAvailableCardbacks.value;
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


    const scaledFontsize = function (text, fontSize, fontface, desiredWidth, desiredHeight = null) {
        if (!text || !fontSize || !fontface || !desiredWidth) {
            return fontSize;
        }

        const c = document.createElement('canvas');
        const cctx = c.getContext('2d');
        cctx.font = fontSize + 'px ' + fontface;
        const textWidth = cctx.measureText(text).width;

        // Estimate text height (approximate)
        const textHeight = fontSize * 1.2; // Line height is typically 1.2x font size

        // Check if text fits both width and height (if height is specified)
        const fitsWidth = textWidth <= desiredWidth;
        const fitsHeight = !desiredHeight || textHeight <= desiredHeight;

        if (fitsWidth && fitsHeight) {
            return fontSize;
        }

        // Calculate scaling factor based on both width and height constraints
        let widthScale = desiredWidth / textWidth;
        let heightScale = desiredHeight ? desiredHeight / textHeight : 1;

        // Use the more restrictive scaling factor
        let newFontSize = fontSize * Math.min(widthScale, heightScale);

        // Fine-tune with the existing logic but check both dimensions
        cctx.font = newFontSize + 'px ' + fontface;
        while (cctx.measureText(text).width > desiredWidth ||
        (desiredHeight && newFontSize * 1.2 > desiredHeight)) {
            newFontSize -= 0.01;
            cctx.font = newFontSize + 'px ' + fontface;

            // Prevent infinite loop
            if (newFontSize <= 1) break;
        }

        return newFontSize;
    }

    const nameFontSize = computed(() => {
        const config = getConfig('cardName') || {};

        return scaledFontsize(fields.cardName, config.fontSize, config.fontFamily, config.width);
    })

    const typeTextFontSize = computed(() => {
        const typeTextConfig = getConfig('cardTypeText') || {};

        return scaledFontsize(
            cardTypeText.value,
            typeTextConfig.fontSize,
            typeTextConfig.fontFamily,
            typeTextConfig.width,
            typeTextConfig.height
        );
    })

    const footerTextFontSize = computed(() => {
        const footerTextConfig = getConfig('cardFooterText') || {};

        return scaledFontsize(cardTypeText.value, footerTextConfig.fontSize, footerTextConfig.fontFamily, footerTextConfig.width);
    })

    watch(selectedStyle, () => {
        backgroundIndex.value = 0;
    });

    const handleStyleToggle = (event) => {
        selectedStyle.value = event.target.checked ? 'flat' : 'dented';
    }

    const {cardRarities} = useCardRarities();
    const cardRarityImage = computed(() => {
        return cardRarities.find(value => value.id === fields.cardRarity).image[0].value;
    })

    onMounted(() => {
        fields.cardRarity = 1;
    })

    onUnmounted(() => {
        fields.cardType = '';
        fields.cardPitch = '';
        fields.cardName = '';
        fields.cardCost = '';
        fields.cardText = '';
        fields.cardPower = '';
        fields.cardHeroIntellect = '';
        fields.cardTalent = '';
        fields.cardTalentCustom = '';
        fields.cardClass = '';
        fields.cardClassCustom = '';
        fields.cardSecondaryClass = '';
        fields.cardSecondaryClassCustom = '';
        fields.cardActionSubtype = '';
        fields.cardActionSubtypeCustom = '';
        fields.cardDefenseReactionSubtype = '';
        fields.cardDefenseReactionSubtypeCustom = '';
        fields.cardEquipmentSubtype = '';
        fields.cardEquipmentSubtypeCustom = '';
        fields.cardInstantSubtype = '';
        fields.cardInstantSubtypeCustom = '';
        fields.cardResourceSubtype = '';
        fields.cardResourceSubtypeCustom = '';
        fields.cardMacroGroup = '';
        fields.cardHeroSubtype = '';
        fields.cardWeaponSubtype = '';
        fields.cardWeaponSubtypeCustom = '';
        fields.cardWeapon = '';
        fields.cardRarity = 0;
        fields.cardTokenSubtype = '';
        fields.cardDefense = '';
        fields.cardLife = '';
        fields.cardUploadedArtwork = '';
        fields.cardFooterText = '';
    });
    return {
        types,
        fields,
        cardTypeText,
        isFieldShown,
        currentBackground,
        getConfig,
        switchBackground,
        selectedStyle,
        nameFontSize,
        typeTextFontSize,
        footerTextFontSize,
        frameType,
        cardTextStyleClass,
        filteredAvailableCardbacks,
        backgroundIndex,
        handleStyleToggle,
        cardRarityImage,
    };
}
