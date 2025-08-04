<script setup>

import {PhotoIcon} from '@heroicons/vue/24/solid'
import {ChevronDownIcon} from '@heroicons/vue/16/solid'
import {useCard} from "../helpers/card.js";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  TrashIcon
} from "@heroicons/vue/24/solid/index.js";
import Editor from '@tinymce/tinymce-vue'
import {RadioGroup, RadioGroupOption} from "@headlessui/vue";
import {useCanvasHelper} from "../helpers/canvas.js";
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {toPng} from "html-to-image";
import useTinyMCEConfig from "../config/tinyMCE.js";
import {useImage} from "vue-konva";
import ButtonDropdown from "./ButtonDropdown.vue";

const fontsLoaded = ref(false);

const {
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
} = useCard();

const CanvasHelper = useCanvasHelper();
const configKonva = {
  width: 450,
  height: 628,
};
const stage = ref();
const artwork = ref();
const background = ref();
const footer = ref();
const footertext = ref();
const footertextRight = ref();
const canvasHelper = new CanvasHelper();

const readFile = function readFile(event) {

  if (!event.target.files || !event.target.files[0]) return;

  const FR = new FileReader();

  FR.addEventListener("load", function (evt) {
    cardUploadedArtwork.value = String(evt.target.result);
  });

  FR.readAsDataURL(event.target.files[0]);
}

const tinyMCEConfig = useTinyMCEConfig(cardText);


const downloadImage = function () {
  toPng(document.querySelector('.cardParent'), {
    width: 450,
    canvasWidth: 450,
    height: 628,
    canvasHeight: 628,
  })
      .then((dataUrl) => {
        downloadURI(dataUrl, (cardName.value || 'card') + '.png');
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
}

const printPage = function () {
  const stageInstance = stage.value.getStage();
  stage.value.getStage().scale({x:0.52913385826,y:0.52913385826});
  stageInstance.batchDraw();
  setTimeout(() => {
    window.print();
    stageInstance.scale({x:1,y:1});
    stageInstance.batchDraw();
  }, 100);
}

const downloadURI = function (uri, name) {
  const link = document.createElement('a');
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  link.remove();
}

const containerElement = ref();
const contentElement = ref();

// Easily adjustable constants - modify these to match real cards
const TEXT_CONFIG = computed(() => {
  const baseConfig = {    // Base line height for ratio calculation
    minFontSize: 8,          // Minimum font size in px
    step: 0.1,               // Search precision
  };

  // Default to dented if frameType is undefined or not 'flat'
  if (frameType.value === 'flat') {
    return {
      ...baseConfig,
      baseLineHeight: 20.235,
      maxFontSize: 17.27,      // Maximum font size in px
      baseFontSize: 17.27,
      paragraphSpacing: 0.545, // Base font size for ratio calculation
    };
  } else {
    // Default to dented (covers both 'dented' and undefined cases)
    return {
      ...baseConfig,
      baseLineHeight: 20.235,
      maxFontSize: 17.08,      // Maximum font size in px
      baseFontSize: 17.08,     // Base font size for ratio calculation
      paragraphSpacing: 0.55,
    };
  }
});

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

const resizeText = ({element, minSize = TEXT_CONFIG.value.minFontSize, maxSize = TEXT_CONFIG.value.maxFontSize, step = TEXT_CONFIG.value.step, unit = 'px'}) => {
  const parent = element.parentNode;
  const maxHeight = parent.clientHeight;

  // Binary search for the optimal font size
  let low = minSize;
  let high = maxSize;
  let optimalSize = minSize;

  // Helper function to calculate line height based on font size
  const calculateLineHeight = (fontSize) => {
    return (fontSize / TEXT_CONFIG.value.baseFontSize) * TEXT_CONFIG.value.baseLineHeight;
  };

  // UPDATED: Apply styles to element and paragraphs
  const applyStyles = (size) => {
    element.style.fontSize = `${size}${unit}`;
    element.style.lineHeight = `${calculateLineHeight(size)}${unit}`;

    // Apply paragraph spacing
    const paragraphs = element.querySelectorAll('p');
    paragraphs.forEach((p, index) => {
      p.style.margin = '0';
      p.style.padding = '0';
      // Add margin-top to all paragraphs except the first
      if (index > 0) {
        p.style.marginTop = `${calculateLineHeight(size) * TEXT_CONFIG.value.paragraphSpacing}${unit}`;
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
    minSize: TEXT_CONFIG.value.minFontSize,
    maxSize: TEXT_CONFIG.value.maxFontSize,
    step: TEXT_CONFIG.value.step
  });
}

watch(cardText, () => {
  nextTick().then(() => {
    recalculateRatio();
  })
});

watch(frameType, (newFrameType) => {
  // Only proceed if frameType is actually defined
  if (newFrameType) {
    nextTick().then(() => {
      recalculateRatio();
      canvasHelper.drawRarity(cardRarity.value, getConfig('cardRarity'));
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


onMounted(function () {
  if (!cardRarity.value) {
    cardRarity.value = 'img/rarities/rarity_common.svg';
  }

  canvasHelper.artworkLayer = artwork.value.getStage();
  canvasHelper.backgroundLayer = background.value.getStage();
  canvasHelper.footerLayer = footer.value.getStage();
})

watch(currentBackground, (newBackground) => {
  nextTick(() => {
    doLoading(async () => {
      return canvasHelper.drawBackground(newBackground);
    })
  })
});

watch(cardType, (newCardType) => {
  if (!newCardType) return;
  canvasHelper.drawBackground(currentBackground.value);
  canvasHelper.drawUploadedArtwork(cardUploadedArtwork.value, getConfig('cardUploadedArtwork'));
  if (fontsLoaded.value === false) {
    nextTick().then(() => {
      setTimeout(() => fontsLoaded.value = true, 100)
    })
  }
});

watch(cardRarity, (newCardRarity) => {
  if (!newCardRarity) return;
  nextTick().then(() => {
    canvasHelper.drawRarity(newCardRarity, getConfig('cardRarity'));
  });
})
watch(cardUploadedArtwork, (newUploadedArtwork) => {
  canvasHelper.drawUploadedArtwork(newUploadedArtwork, getConfig('cardUploadedArtwork'));
})

const [noCostImage] = useImage('src/assets/symbol_nocost.png');
const [powerImage] = useImage('src/assets/cardsymbol_power.svg');
const [defenseImage] = useImage('src/assets/cardsymbol_defense.svg');
const handleStyleToggle = (event) => {
  selectedStyle.value = event.target.checked ? 'flat' : 'dented';
}
</script>

<template>
  <div>
    <div v-if="!cardType" class="relative isolate overflow-hidden min-h-[100vh]">
      <div>
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-4xl font-semibold tracking-tight text-balance text-primary dark:text-white sm:text-5xl">Start creating!</h2>
          <div class="mt-10 flex items-center justify-center gap-x-6 fade-in-fwd">
            <ButtonDropdown
                placeholder="Select Card Type"
                :options="types.sort((a, b) => a.label.localeCompare(b.label)).map((t) => {
                return {
                 title: t.label,
                 type: t.type,
                 selected: t.type === cardType
                }
              })"
                @update:modelValue="cardType = $event.type"
            >
              <div slot="icon"></div>
            </ButtonDropdown>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 1024 1024" class="absolute top-1/2 left-1/2 -z-10 size-256 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)] fade-in-bottom" aria-hidden="true">
        <circle cx="512" cy="512" r="512" fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fill-opacity="0.7" />
        <defs>
          <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
            <stop stop-color="#A6864A" />
            <stop offset="1" stop-color="#A6864A" />
          </radialGradient>
        </defs>
      </svg>
    </div>
    <div v-show="cardType" class="p-1 cardback:p-6 fade-in-fwd">
      <div v-show="cardType" class="w-full mb-3 print:hidden">
        <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardType">Type</label>
        <div class="mt-2 grid grid-cols-1">
          <select id="cardType" v-model="cardType"
                  ref="cardTypeSelect"
                  class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
                  name="cardType">
            <option v-for="type in types.sort((a, b) => a.label.localeCompare(b.label))" :value="type.type">
              {{ type.label }}
            </option>
          </select>
          <ChevronDownIcon
              aria-hidden="true"
              class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-primary dark:text-white sm:size-4"/>
        </div>
      </div>
      <div v-show="cardType" class="grid grid-cols-1 sm:grid-cols-[2fr_1fr]">
        <div class="container mx-auto print:hidden">
          <form>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <div v-if="isFieldShown('cardPitch')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardPitch">Pitch</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardPitch"
                      v-model="cardPitch"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
              </div>
              <div v-if="isFieldShown('cardName')" class="">
                <label v-if="['hero', 'demi_hero'].includes(cardType)" id="cardHeroNameLabel"
                       class="block text-sm/6 font-medium text-primary dark:text-white">Hero name</label>
                <label v-else id="cardNameLabel" class="block text-sm/6 font-medium text-primary dark:text-white" for="cardName">Card
                  name</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardName" v-model="cardName"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           maxlength="50" type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardCost')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardCost">Cost</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardCost" v-model="cardCost"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           maxlength="2" type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardPower')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardPower">Power</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardPower" v-model="cardPower"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="number">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardHeroIntellect')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardHeroIntellect">Intellect</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardHeroIntellect" v-model="cardHeroIntellect"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="number">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardTalent')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardTalent">Talent (f.e. Mystic)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardTalent"
                      v-model="cardTalent"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Chaos">Chaos</option>
                    <option value="Draconic">Draconic</option>
                    <option value="Earth">Earth</option>
                    <option value="Elemental">Elemental</option>
                    <option value="Ice">Ice</option>
                    <option value="Light">Light</option>
                    <option value="Lightning">Lightning</option>
                    <option value="Mystic">Mystic</option>
                    <option value="Royal">Royal</option>
                    <option value="Shadow">Shadow</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardTalent === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardTalentCustom">Custom Talent</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardTalentCustom" v-model="cardTalentCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom resource subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardClass')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardClass">Class</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardClass"
                      v-model="cardClass"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
                      @change="!cardClass ? cardSecondaryClass = '' : ''">
                    <option value="">None</option>
                    <option value="Adjudicator">Adjudicator</option>
                    <option value="Assassin">Assassin</option>
                    <option value="Bard">Bard</option>
                    <option value="Brute">Brute</option>
                    <option value="Generic">Generic</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Illusionist">Illusionist</option>
                    <option value="Mechanologist">Mechanologist</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Ninja">Ninja</option>
                    <option value="Ranger">Ranger</option>
                    <option value="Runeblade">Runeblade</option>
                    <option value="Shapeshifter">Shapeshifter</option>
                    <option value="Warrior">Warrior</option>
                    <option value="Wizard">Wizard</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardClass === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardClassCustom">Custom class</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardClassCustom" v-model="cardClassCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                             placeholder="Enter custom class" type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardSecondaryClass')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardSecondaryClass">Secondary class
                  (optional)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select id="cardSecondaryClass" v-model="cardSecondaryClass"
                          class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Adjudicator">Adjudicator</option>
                    <option value="Assassin">Assassin</option>
                    <option value="Bard">Bard</option>
                    <option value="Brute">Brute</option>
                    <option value="Generic">Generic</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Illusionist">Illusionist</option>
                    <option value="Mechanologist">Mechanologist</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Ninja">Ninja</option>
                    <option value="Ranger">Ranger</option>
                    <option value="Runeblade">Runeblade</option>
                    <option value="Shapeshifter">Shapeshifter</option>
                    <option value="Warrior">Warrior</option>
                    <option value="Wizard">Wizard</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardSecondaryClass === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardSecondaryClassCustom">Custom class</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardSecondaryClassCustom" v-model="cardSecondaryClassCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                             placeholder="Enter custom class"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardActionSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardActionSubtype">Action subtype (f.e
                  Attack
                  Action)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardActionSubtype"
                      v-model="cardActionSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Attack">Attack</option>
                    <option value="Arrow Attack">Arrow Attack</option>
                    <option value="Dagger Attack">Dagger Attack</option>
                    <option value="Aura">Aura</option>
                    <option value="Affliction Aura">Affliction Aura</option>
                    <option value="Construct">Construct</option>
                    <option value="Invocation">Invocation</option>
                    <option value="Item">Item</option>
                    <option value="Shuriken Item">Shuriken Item</option>
                    <option value="Landmark">Landmark</option>
                    <option value="Song">Song</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardActionSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardActionSubtypeCustom">Custom action subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardActionSubtypeCustom" v-model="cardActionSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom action subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardDefenseReactionSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardDefenseReactionSubtype">Defense Reaction
                  subtype (optional, f.e: Trap)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardDefenseReactionSubtype"
                      v-model="cardDefenseReactionSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Trap">Trap</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardDefenseReactionSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardDefenseReactionSubtypeCustom">Custom Defense Reaction
                    subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardDefenseReactionSubtypeCustom" v-model="cardDefenseReactionSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom defense reaction subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardEquipmentSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardEquipmentSubtype">Equipment subtype
                  (f.e.
                  Legs)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardEquipmentSubtype"
                      v-model="cardEquipmentSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Head">Head</option>
                    <option value="Chest">Chest</option>
                    <option value="Arms">Arms</option>
                    <option value="Legs">Legs</option>
                    <option value="Base">Base</option>
                    <option value="Off-Hand">Off-Hand</option>
                    <option value="Item">Item</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardEquipmentSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardEquipmentSubtypeCustom">Custom equipment
                    subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardEquipmentSubtypeCustom" v-model="cardEquipmentSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom equipment subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardInstantSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardInstantSubtype">Instant subtype (f.e.
                  Aura)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardInstantSubtype"
                      v-model="cardInstantSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Aura">Aura</option>
                    <option value="Figment">Figment</option>
                    <option value="Trap">Trap</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardInstantSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardInstantSubtypeCustom">Custom instant subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardInstantSubtypeCustom" v-model="cardInstantSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom instant subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardResourceSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResourceSubtype">Resource subtype
                  (f.e.
                  Gem)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardResourceSubtype"
                      v-model="cardResourceSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Gem">Gem</option>
                    <option value="Chi">Chi</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardResourceSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResourceSubtypeCustom">Custom resource
                    subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardResourceSubtypeCustom" v-model="cardResourceSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom resource subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardMacroGroup')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardMacroGroup">Macro Group (f.e.
                  Rosetta)</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardMacroGroup" v-model="cardMacroGroup"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardHeroSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResourceSubtype">Hero subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardHeroSubtype"
                      v-model="cardHeroSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Demon">Demon</option>
                    <option value="Young">Young</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
              </div>
              <div v-if="isFieldShown('cardWeaponSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardWeaponSubtype">Weapon subtype (f.e.
                  Axe)</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardWeaponSubtype"
                      v-model="cardWeaponSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Axe">Axe</option>
                    <option value="Book">Book</option>
                    <option value="Bow">Bow</option>
                    <option value="Brush">Brush</option>
                    <option value="Club">Club</option>
                    <option value="Dagger">Dagger</option>
                    <option value="Fiddle">Fiddle</option>
                    <option value="Flail">Flail</option>
                    <option value="Gun">Gun</option>
                    <option value="Hammer">Hammer</option>
                    <option value="Lute">Lute</option>
                    <option value="Orb">Orb</option>
                    <option value="Pistol">Pistol</option>
                    <option value="Polearm">Polearm</option>
                    <option value="Scepter">Scepter</option>
                    <option value="Scroll">Scroll</option>
                    <option value="Scythe">Scythe</option>
                    <option value="Staff">Staff</option>
                    <option value="Sword">Sword</option>
                    <option value="Wrench">Wrench</option>
                    <option value="Custom">Custom...</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="cardWeaponSubtype === 'Custom'">
                  <!-- Custom input field for weapon type -->
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardWeaponSubtypeCustom"></label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardWeaponSubtypeCustom" v-model="cardWeaponSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom weapon subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardWeapon')" class="">
                <label id="cardWeapon" class="block text-sm/6 font-medium text-primary dark:text-white">1H or 2H?</label>
                <fieldset aria-label="1H or 2H?">
                  <RadioGroup v-model="cardWeapon" class="mt-2 grid grid-cols-2 gap-6">
                    <RadioGroupOption v-slot="{ active, checked }" as="template" value="(1H)">
                      <div :class="[active ? 'ring-2 bg-primary ring-offset-2' : '', checked ? 'bg-primary text-white ring-0 hover:bg-primary' : 'bg-white text-primary ring-1 ring-gray-300 hover:bg-gray-50', !active && !checked ? 'ring-inset' : '', active && checked ? 'ring-2' : '', 'flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold uppercase sm:flex-1']" class="cursor-pointer focus:outline-hidden">1h</div>
                    </RadioGroupOption>
                    <RadioGroupOption v-slot="{ active, checked }" as="template" value="(2H)">
                      <div :class="[active ? 'ring-2 bg-primary ring-offset-2' : '', checked ? 'bg-primary text-white ring-0 hover:bg-primary' : 'bg-white text-primary ring-1 ring-gray-300 hover:bg-gray-50', !active && !checked ? 'ring-inset' : '', active && checked ? 'ring-2' : '', 'flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold uppercase sm:flex-1']" class="cursor-pointer focus:outline-hidden">2h</div>
                    </RadioGroupOption>
                  </RadioGroup>
                </fieldset>
              </div>
              <div v-if="isFieldShown('cardRarity')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardRarity">Rarity</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardRarity"
                      v-model="cardRarity"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="img/rarities/rarity_common.svg">Common</option>
                    <option value="img/rarities/rarity_fabled.svg">Fabled</option>
                    <option value="img/rarities/rarity_legendary.svg">Legendary</option>
                    <option value="img/rarities/rarity_majestic.svg">Majestic</option>
                    <option value="img/rarities/rarity_marvel.svg">Marvel</option>
                    <option value="img/rarities/rarity_promo.svg">Promo</option>
                    <option value="img/rarities/rarity_rare.svg">Rare</option>
                    <option value="img/rarities/rarity_superrare.svg">Super Rare</option>
                    <option value="img/rarities/rarity_token.svg">Token</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <div v-if="isFieldShown('cardTokenSubtype')" class="">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardTokenSubtype">Subtype (optional)
                    (f.e. Aura)</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardTokenSubtype" v-model="cardTokenSubtype"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                             type="text">
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardDefense')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardDefense">Defense</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardDefense" v-model="cardDefense"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="number">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardLife')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardLife">Life</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardLife" v-model="cardLife"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="number">
                  </div>
                </div>
              </div>
              <div v-if="cardType !== ''" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="photo-cover">Artwork</label>
                <div v-if="cardUploadedArtwork" class="mt-2 w-full flex justify-center rounded-lg border border-dashed border-primary/25 dark:border-white px-6 py-1">
                  <img :src="cardUploadedArtwork" alt="Uploaded artwork" class="rounded">
                  <button class="inline-flex items-center gap-x-1.5 rounded-r-md bg-primary px-2.5  text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" v-on:click="() => cardUploadedArtwork = ''">
                    <TrashIcon aria-hidden="true" class="-mr-0.5 size-5"/>
                  </button>
                </div>
                <div v-else class="mt-2 w-full flex justify-center rounded-lg border border-dashed border-primary/25 dark:border-white px-6 py-10">
                  <div class="text-center">
                    <PhotoIcon aria-hidden="true" class="mx-auto size-12 text-gray-300"/>
                    <div class="mt-4 flex text-sm/6 text-gray-600 dark:text-white">
                      <label class="relative cursor-pointer rounded-md font-semibold text-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:outline-hidden hover:text-primary-500" for="cardUploadedArtwork">
                        <span>Upload your artwork</span>
                        <input id="cardUploadedArtwork" accept="image/png, image/jpeg, image/gif" class="sr-only" size="10000000" type="file" v-on:change="readFile">
                      </label>
                    </div>
                    <p class="text-xs/5 text-gray-600 dark:text-white">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
              <div v-show="isFieldShown('cardText')" class="sm:col-span-2">
                <label v-if="['hero', 'demi_hero'].includes(cardType)" id="cardHeroPowerLabel" class="block text-sm/6 font-medium text-primary dark:text-white" for="cardText">Hero power</label>
                <label v-else id="cardTextLabel" class="block text-sm/6 font-medium text-primary dark:text-white" for="cardText">Card text</label>
                <div class="col-span-full">
                  <div class="mt-2">
                    <editor
                        :init="tinyMCEConfig"
                        api-key="gpl"
                        tinymce-script-src="tinymce/tinymce.min.js"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div v-show="cardType" class="flex flex-col items-center cardback:p-6">
          <label class="block text-sm/6 font-medium text-primary dark:text-white text-center print:hidden" for="cardBackLabel">Select Card Background</label>
          <div class="toggle-container">
            <div class="button-cover">
              <div class="button r">
                <input
                    type="checkbox"
                    class="checkbox"
                    name="cardStyle"
                    :checked="selectedStyle === 'flat'"
                    @change="handleStyleToggle"
                />
                <div class="knobs"></div>
                <div class="layer"></div>
              </div>
            </div>
          </div>
          <div class="w-full flex justify-between items-center mt-2 mb-4 col-start-2 print:hidden cardback-selector-row">
            <button :disabled="loadingBackground" class="cardback-nav-button" type="button"
                    v-on:click="() => switchBackground('next')">
              <ArrowLeftIcon aria-hidden="true" class="size-5"/>
            </button>

            <select
                v-model="backgroundIndex"
                class="cardback-dropdown flex-grow-1 font-semibold text-primary dark:text-white"
                @change="onCardbackDropdownChange"
            >
              <option
                  v-for="(cardback, index) in filteredAvailableCardbacks"
                  :key="cardback.id"
                  :value="index"
              >
                {{ cardback.name }}
              </option>
            </select>

            <button :disabled="loadingBackground"
                    class="cardback-nav-button" type="button"
                    v-on:click="() => switchBackground('previous')">
              <ArrowRightIcon aria-hidden="true" class="size-5"/>
            </button>
          </div>

          <div class="flex flex-col w-full overflow-x-scroll cardback:items-center cardback:overflow-x-auto">
            <div class="exampleCard">
              <img src="../../public/img/Card_Example5.png" height="628" width="450"/>
            </div>
            <div class="cardParent">
              <div id="renderedCardText" ref="containerElement" :class="cardTextStyleClass">
                <div id="renderedContent" ref="contentElement" v-html="cardText"></div>
              </div>
              <v-stage
                  ref="stage"
                  :config="configKonva"
              >
                <v-layer id="artwork" ref="artwork"></v-layer>
                <v-layer id="background" ref="background"></v-layer>
                <v-layer>
                  <v-image
                      v-if="cardType === 'block'"
                      :config="{
                       ...getConfig('noCostImage'),
                       image: noCostImage,
                     }"
                  />
                  <v-image
                      v-if="cardPower"
                      :config="{
                       ...getConfig('powerImage'),
                       image: powerImage,
                     }"
                  />
                  <v-image
                      v-if="cardDefense"
                      :config="{
                       ...getConfig('defenseImage'),
                       image: defenseImage,
                     }"
                  />
                </v-layer>
                <v-layer id="text">
                  <v-text v-show="cardName" v-bind="{
                  ...getConfig('cardName'),
                  ...{
                    text: cardName,
                    fontSize: nameFontSize
                  }
                }"></v-text>
                  <v-text v-show="cardCost" :text="cardCost" v-bind="getConfig('cardCost')"></v-text>
                  <v-text v-show="cardDefense" :text="cardDefense" v-bind="getConfig('cardDefense')"></v-text>
                  <v-text v-show="cardPower" :text="cardPower" v-bind="getConfig('cardPower')"></v-text>
                  <v-text v-show="cardLife" :text="cardLife" v-bind="getConfig('cardLife')"></v-text>
                  <v-text v-show="cardHeroIntellect" :text="cardHeroIntellect" v-bind="getConfig('cardHeroIntellect')"></v-text>
                  <v-text
                      :text="cardTypeText"
                      v-bind="getConfig('cardTypeText')"
                      :fontSize="typeTextFontSize"
                  ></v-text>
                </v-layer>
                <v-layer id="footer" ref="footer">
                  <v-image v-if="cardRarity" :text="cardRarity" v-bind="getConfig('cardRarity')"></v-image>
                </v-layer>
                <v-layer id="footertext">
                  <v-text
                      ref="footertext"
                      :fontSize="footerTextFontSize"
                      :text="dentedFooterText"
                      v-bind="getConfig('cardFooterText')"
                  />
                  <v-text
                      v-if="selectedStyle === 'flat'"
                      ref="footertextRight"
                      :fontSize="footerTextFontSize"
                      :text="flatFooterText"
                      v-bind="getConfig('cardFooterTextRight')"
                  />

                  <!-- Copyright overlay -->
                  <v-text
                      text="©"
                      v-bind="getConfig('copyrightOverlay')"
                  />
                </v-layer>
              </v-stage>
            </div>
          </div>
          <div class="flex justify-center mt-2 print:hidden gap-4">
            <button class="inline-flex items-center gap-x-1.5 button-primary px-3.5 py-2.5" type="button" v-on:click="() => downloadImage()">
              Download Card
              <DocumentArrowDownIcon aria-hidden="true" class="-mr-0.5 size-5"/>
            </button>
            <button class="inline-flex items-center gap-x-1.5 button-primary px-3.5 py-2.5" type="button" v-on:click="() => printPage()">
              Print
              <PrinterIcon aria-hidden="true" class="-mr-0.5 size-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
