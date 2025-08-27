import {computed, nextTick, onMounted, onUnmounted, reactive, ref, watch} from "vue";
import {useCardBacks} from "../config/cardbacks.js";
import {useCardBackSettings} from "../config/cardSettings.js";
import {useMath} from "./math.js";
import useTypes from "../config/types.js";
import {useCardRarities} from "./cardRarities.js";
import {useCanvasHelper} from "./canvas.js";
import {useTextConfig} from "../config/text.js";
import {toPng} from "html-to-image";

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

    const cardTextStyle = computed(() => {
        let base = `transform: translateX(calc(-50% * ${scale.value}));height: calc(135px * ${scale.value});width: calc(345px * ${scale.value}););`
        // Return the frame type CSS style
        if (frameType.value === 'flat') {
            return base + `top: calc(397.3px * ${scale.value});left: calc(50.165% * ${scale.value});`;
        }

        return base + `top:calc(408px * ${scale.value});left: calc(50% * ${scale.value});`
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


    const containerElement = ref();
    const contentElement = ref();

    const {flatConfig, dentedConfig} = useTextConfig();
    const frameTypeTextConfig = computed(() => {
        if (frameType.value === 'flat') {
            return flatConfig;
        } else {
            return dentedConfig;
        }
    });

    const fontsLoaded = ref(false);

    const flatFooterText = computed(() => {
        if (!fontsLoaded.value) {
            return '';
        }
        return `FLESH AND BLOOD TCG BY${String.fromCharCode(0x00A0)}${String.fromCharCode(0x00A0)}${String.fromCharCode(0x00A0)}Legend Story Studios`;
    });

    const dentedFooterText = computed(() => {
        if (!fontsLoaded.value) {
            return '';
        }
        if (selectedStyle.value === 'flat') {
            return 'FABKIT  |  NOT TOURNAMENT LEGAL';
        }
        return `FABKIT - NOT TOURNAMENT LEGAL - FaB TCG BY${String.fromCharCode(0x00A0)}${String.fromCharCode(0x00A0)}${String.fromCharCode(0x00A0)}LSS`;
    });

    const resizeText = ({element, minSize = frameTypeTextConfig.value.minFontSize, maxSize = frameTypeTextConfig.value.maxFontSize, step = frameTypeTextConfig.value.step, unit = 'px'}) => {
        if (!element) {
            return;
        }
        const parent = element.parentNode;
        const maxHeight = parent.clientHeight;

        // Binary search for the optimal font size
        let low = minSize;
        let high = maxSize;
        let optimalSize = minSize;

        // Helper function to calculate line height based on font size
        const calculateLineHeight = (fontSize) => {
            return ((fontSize / frameTypeTextConfig.value.baseFontSize) * frameTypeTextConfig.value.baseLineHeight) * scale.value;
        };

        // UPDATED: Apply styles to element and paragraphs
        const applyStyles = (size) => {
            element.style.fontSize = `${(size * scale.value)}${unit}`;
            element.style.lineHeight = `${calculateLineHeight(size)}${unit}`;

            // Apply paragraph spacing
            const paragraphs = element.querySelectorAll('p');
            paragraphs.forEach((p, index) => {
                p.style.margin = '0';
                p.style.padding = '0';
                // Add margin-top to all paragraphs except the first
                if (index > 0) {
                    p.style.marginTop = `${(calculateLineHeight(size) * frameTypeTextConfig.value.paragraphSpacing)}${unit}`;
                }
            });
        };

        // Helper function to check if content overflows parent
        const isOverflowing = (size) => {
            applyStyles(size);

            // Check if element's scroll height exceeds parent's client height
            return element.scrollHeight > maxHeight;
        };

        // First check if max size fits
        if (!isOverflowing(maxSize)) {
            applyStyles(maxSize);
            return;
        }

        // Binary search
        while (high - low > step) {
            const mid = (low + high) / 2;

            if (!isOverflowing(mid)) {
                optimalSize = mid;
                low = mid;
            } else {
                high = mid;
            }
        }

        // Apply the optimal size
        applyStyles(optimalSize);
    };

    function recalculateRatio() {
        if (containerElement.value === undefined || contentElement.value === undefined) return;

        resizeText({
            element: contentElement.value,
            minSize: frameTypeTextConfig.value.minFontSize,
            maxSize: frameTypeTextConfig.value.maxFontSize,
            step: frameTypeTextConfig.value.step
        });
    }

    watch(() => fields.cardText, () => {
        nextTick().then(() => {
            recalculateRatio();
        })
    }, {deep: true});

    watch(frameType, (newFrameType) => {
        // Only proceed if frameType is actually defined
        if (newFrameType) {
            nextTick().then(() => {
                recalculateRatio();
            });
        }
    });

    const loadingBackground = ref(false);

    const doLoading = async function (callback) {
        loadingBackground.value = true;
        const konvaStage = stage.value.getStage();
        // if it takes longer than 100 ms to load => set visual indicator
        setTimeout(() => {
            if (loadingBackground.value === true) {
                konvaStage.opacity(0.5)
            }
        }, 100);

        callback().finally(() => {
            loadingBackground.value = false;
            konvaStage.opacity(1);
        });
    }


    const CanvasHelper = useCanvasHelper();
    const stage = ref();
    const artwork = ref();
    const background = ref();
    const footer = ref();
    const footertext = ref();
    const footertextRight = ref();

    const canvasHelper = new CanvasHelper();

    watch(currentBackground, (newBackground) => {
        nextTick().then(async () => {
            await doLoading(async () => {
                return canvasHelper.drawBackground(newBackground);
            })
        })
    });

    watch(() => fields.cardType, (newCardType) => {
        nextTick().then(() => {
            updateSize();
            recalculateRatio();
        });
        if (!newCardType) return;
        canvasHelper.drawBackground(currentBackground.value);
        canvasHelper.drawUploadedArtwork(fields.cardUploadedArtwork, getConfig('cardUploadedArtwork'));
        if (fontsLoaded.value === false) {
            nextTick().then(() => {
                setTimeout(() => fontsLoaded.value = true, 100)
            })
        }
    }, {deep: true});

    watch(() => fields.cardUploadedArtwork, (newUploadedArtwork) => {
        canvasHelper.drawUploadedArtwork(newUploadedArtwork, getConfig('cardUploadedArtwork'));
    }, {deep: true});


    // Define virtual size for our scene
    const sceneWidth = 450;
    const sceneHeight = 628;

    // Reactive references
    const stageContainerRef = ref(null);
    const scale = ref(1);

    // Computed properties for stage dimensions
    const stageWidth = computed(() => sceneWidth * scale.value);
    const stageHeight = computed(() => sceneHeight * scale.value);

    // Function to handle resize
    const updateSize = () => {
        if (!stageContainerRef.value) return;

        // Get container width
        let containerWidth = stageContainerRef.value.offsetWidth;

        if (0 === containerWidth) {
            containerWidth = sceneWidth;
        }

        // Calculate scale
        scale.value = containerWidth / sceneWidth;
    };

    onMounted(() => {
        fields.cardRarity = 1;
        canvasHelper.artworkLayer = artwork.value.getStage();
        canvasHelper.backgroundLayer = background.value.getStage();
        canvasHelper.footerLayer = footer.value.getStage();
        if (containerElement.value) {
            containerElement.value.addEventListener('forceResize', () => {
                nextTick().then(() => {
                    updateSize();
                    recalculateRatio();
                });
            });
        }
        updateSize();
        recalculateRatio();
        // Add event listener
        window.addEventListener('resize', () => {
            nextTick().then(() => {
                updateSize();
                recalculateRatio();
            });
        });
    });

    onUnmounted(() => {
        // Clean up
        window.removeEventListener('resize', () => {
            nextTick().then(() => {
                updateSize();
                recalculateRatio();
            });
        });

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


    const downloadImage = function () {
        const stageInstance = stage.value.getStage();
        stageInstance.setWidth(450);
        stageInstance.setHeight(628);
        stageInstance.setScale(1, 1);
        scale.value = 1;
        stageInstance.batchDraw();
        recalculateRatio();
        nextTick(() => {
            toPng(document.querySelector('.cardParent'), {
                width: 450,
                canvasWidth: 450,
                height: 628,
                canvasHeight: 628,
            })
                .then((dataUrl) => {
                    downloadURI(dataUrl, (fields.cardName || 'card') + '.png');
                })
                .catch((err) => {
                    console.error('oops, something went wrong!', err);
                }).finally(() => {
                updateSize();
                recalculateRatio();
                stageInstance.batchDraw();
            });
        })
    }

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
        cardTextStyle,
        filteredAvailableCardbacks,
        backgroundIndex,
        handleStyleToggle,
        cardRarityImage,
        stage,
        artwork,
        background,
        footer,
        footertext,
        footertextRight,
        flatFooterText,
        dentedFooterText,
        containerElement,
        contentElement,
        stageContainerRef,
        stageWidth,
        stageHeight,
        scale,
        downloadImage,
    };
}
