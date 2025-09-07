<script setup>

import {PhotoIcon} from '@heroicons/vue/24/solid'
import {ChevronDownIcon} from '@heroicons/vue/16/solid'
import {useCard} from "../helpers/card.js";
import {useCardRarities} from "../helpers/cardRarities.js";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  TrashIcon
} from "@heroicons/vue/24/solid/index.js";
import {RadioGroup, RadioGroupOption} from "@headlessui/vue";
import {useImage} from "vue-konva";
import ButtonDropdown from "./ButtonDropdown.vue";
import Editor from "./Editor/Editor.vue";

const {
  types,
  fields,
  cardTypeText,
  isFieldShown,
  getConfig,
  switchBackground,
  selectedStyle,
  nameFontSize,
  typeTextFontSize,
  footerTextFontSize,
  filteredAvailableCardbacks,
  backgroundIndex,
  cardTextStyle,
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
  loadingBackground,
  containerElement,
  contentElement,
  stageContainerRef,
  stageWidth,
  stageHeight,
  scale,
  downloadImage,
} = useCard();

const {cardRarities} = useCardRarities();
console.log('First rarity:', cardRarities[0]);
console.log('First rarity image:', cardRarities[0]?.image);
console.log('Image structure:', cardRarities[0]?.image?.value || cardRarities[0]?.image);

const readFile = function readFile(event) {

  if (!event.target.files || !event.target.files[0]) return;

  const FR = new FileReader();

  FR.addEventListener("load", function (evt) {
    fields.cardUploadedArtwork = String(evt.target.result);
  });

  FR.readAsDataURL(event.target.files[0]);
}

const printPage = function () {
  const stageInstance = stage.value.getStage();
  stage.value.getStage().scale({x: 0.52913385826, y: 0.52913385826});
  stageInstance.batchDraw();
  setTimeout(() => {
    window.print();
    stageInstance.scale({x: 1, y: 1});
    stageInstance.batchDraw();
  }, 100);
}

const [noResourceImage] = useImage('/img/symbols/cardsymbol_nocost.png');
const [powerImage] = useImage('/img/symbols/cardsymbol_power.svg');
const [defenseImage] = useImage('/img/symbols/cardsymbol_defense.svg');
const [lifeImage] = useImage('/img/symbols/cardsymbol_life.svg');
</script>

<template>
  <div>
    <div v-if="!fields.cardType" class="relative isolate overflow-hidden min-h-[100vh]">
      <div>
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-4xl font-semibold tracking-tight text-balance text-primary dark:text-white sm:text-5xl">Start creating!</h2>
          <div class="mt-10 flex items-center justify-center gap-x-6 fade-in-fwd">
            <ButtonDropdown
                :options="types.sort((a, b) => a.label.localeCompare(b.label)).map((t) => {
                return {
                 title: t.label,
                 type: t.type,
                 selected: t.type === fields.cardType,
                 disabled: t.disabled,
                }
              })"
                placeholder="Select Card Type"
                @update:modelValue="fields.cardType = $event.type"
            >
              <div slot="icon"></div>
            </ButtonDropdown>
          </div>
        </div>
      </div>
      <svg aria-hidden="true" class="absolute top-1/2 left-1/2 -z-10 size-256 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)] fade-in-bottom" viewBox="0 0 1024 1024">
        <circle cx="512" cy="512" fill="url(#8d958450-c69f-4251-94bc-4e091a323369)" fill-opacity="0.7" r="512"/>
        <defs>
          <radialGradient id="8d958450-c69f-4251-94bc-4e091a323369">
            <stop stop-color="#A6864A"/>
            <stop offset="1" stop-color="#A6864A"/>
          </radialGradient>
        </defs>
      </svg>
    </div>
    <div v-show="fields.cardType" class="fade-in-fwd px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      <div v-show="fields.cardType" class="w-full mb-3 print:hidden">
        <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardType">Type</label>
        <div class="mt-2 grid grid-cols-1">
          <select id="cardType" ref="fields.cardTypeSelect"
                  v-model="fields.cardType"
                  class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
                  name="fields.cardType">
            <option v-for="type in types.sort((a, b) => a.label.localeCompare(b.label))" :disabled="type.disabled" :value="type.type">
              {{ type.label }}
            </option>
          </select>
          <ChevronDownIcon
              aria-hidden="true"
              class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-primary dark:text-white sm:size-4"/>
        </div>
      </div>
      <div v-show="fields.cardType" class="grid grid-cols-1 sm:grid-cols-[2fr_1fr]">
        <div class="container mx-auto print:hidden">
          <form>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <div v-if="isFieldShown('cardPitch')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardPitch">Pitch</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardPitch"
                      v-model="fields.cardPitch"
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
                <label v-if="['hero', 'demi_hero'].includes(fields.cardType)" id="cardHeroNameLabel"
                       class="block text-sm/6 font-medium text-primary dark:text-white">Hero name</label>
                <label v-else id="cardNameLabel" class="block text-sm/6 font-medium text-primary dark:text-white" for="cardName">Card
                  name</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardName" v-model="fields.cardName"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           maxlength="50" type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardResource')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResource">Cost</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardResource" v-model="fields.cardResource"
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
                    <input id="cardPower" v-model="fields.cardPower"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardHeroIntellect')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardHeroIntellect">Intellect</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardHeroIntellect" v-model="fields.cardHeroIntellect"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardTalent')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardTalent">Talent</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardTalent"
                      v-model="fields.cardTalent"
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
                    <option value="Pirate">Mystic</option>
                    <option value="Royal">Royal</option>
                    <option value="Shadow">Shadow</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="fields.cardTalent === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardTalentCustom">Custom Talent</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardTalentCustom" v-model="fields.cardTalentCustom"
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
                      v-model="fields.cardClass"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"
                      @change="!fields.cardClass ? fields.cardSecondaryClass = '' : ''">
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
                    <option value="Necromancer">Necromancer</option>
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
                <template v-if="fields.cardClass === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardClassCustom">Custom class</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardClassCustom" v-model="fields.cardClassCustom"
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
                  <select id="cardSecondaryClass" v-model="fields.cardSecondaryClass"
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
                    <option value="Necromancer">Necromancer</option>
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
                <template v-if="fields.cardSecondaryClass === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardSecondaryClassCustom">Custom class</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardSecondaryClassCustom" v-model="fields.cardSecondaryClassCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                             placeholder="Enter custom class"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardActionSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardActionSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardActionSubtype"
                      v-model="fields.cardActionSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Attack">Attack</option>
                    <option value="Ally">Ally</option>
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
                <template v-if="fields.cardActionSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardActionSubtypeCustom">Custom action subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardActionSubtypeCustom" v-model="fields.cardActionSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom action subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardDefenseReactionSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardDefenseReactionSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardDefenseReactionSubtype"
                      v-model="fields.cardDefenseReactionSubtype"
                      class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary dark:text-white outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">
                    <option value="">None</option>
                    <option value="Trap">Trap</option>
                    <option value="Custom">Custom</option>
                  </select>
                  <ChevronDownIcon
                      aria-hidden="true"
                      class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"/>
                </div>
                <template v-if="fields.cardDefenseReactionSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardDefenseReactionSubtypeCustom">Custom Defense Reaction
                    subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardDefenseReactionSubtypeCustom" v-model="fields.cardDefenseReactionSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom defense reaction subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardEquipmentSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardEquipmentSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardEquipmentSubtype"
                      v-model="fields.cardEquipmentSubtype"
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
                <template v-if="fields.cardEquipmentSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardEquipmentSubtypeCustom">Custom equipment
                    subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardEquipmentSubtypeCustom" v-model="fields.cardEquipmentSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom equipment subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardInstantSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardInstantSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardInstantSubtype"
                      v-model="fields.cardInstantSubtype"
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
                <template v-if="fields.cardInstantSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardInstantSubtypeCustom">Custom instant subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardInstantSubtypeCustom" v-model="fields.cardInstantSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom instant subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardResourceSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResourceSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardResourceSubtype"
                      v-model="fields.cardResourceSubtype"
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
                <template v-if="fields.cardResourceSubtype === 'Custom'">
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResourceSubtypeCustom">Custom resource
                    subtype</label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardResourceSubtypeCustom" v-model="fields.cardResourceSubtypeCustom"
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
                    <input id="cardMacroGroup" v-model="fields.cardMacroGroup"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardHeroSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardResourceSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardHeroSubtype"
                      v-model="fields.cardHeroSubtype"
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
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardWeaponSubtype">Subtype</label>
                <div class="mt-2 grid grid-cols-1">
                  <select
                      id="cardWeaponSubtype"
                      v-model="fields.cardWeaponSubtype"
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
                <template v-if="fields.cardWeaponSubtype === 'Custom'">
                  <!-- Custom input field for weapon type -->
                  <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardWeaponSubtypeCustom"></label>
                  <div class="mt-2">
                    <div
                        class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                      <input id="cardWeaponSubtypeCustom" v-model="fields.cardWeaponSubtypeCustom"
                             class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6 "
                             placeholder="Enter custom weapon subtype"
                             type="text">
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="isFieldShown('cardTokenSubtype')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardTokenSubtype">Subtype</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardTokenSubtype" v-model="fields.cardTokenSubtype"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>
              <div v-if="isFieldShown('cardWeapon')" class="">
                <label id="cardWeapon" class="block text-sm/6 font-medium text-primary dark:text-white">1H or 2H?</label>
                <fieldset aria-label="1H or 2H?">
                  <RadioGroup v-model="fields.cardWeapon" class="mt-2 grid grid-cols-2 gap-6">
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
                <label class="block text-sm/6 font-medium text-primary dark:text-white mb-2">Rarity</label>
                <div class="flex flex-wrap gap-3 w-full">
                    <button
                        type="button"
                        v-for="rarity in cardRarities"
                        :key="rarity.id"
                        @click="fields.cardRarity = rarity.id"
                        :class="[
                          'h-14 w-14 sm:h-10 sm:w-10 rounded-md border-2 transition-all duration-200 hover:scale-105 focus:outline-none flex items-center justify-center',
                          fields.cardRarity === rarity.id
                            ? 'border-primary bg-primary/10 shadow-lg'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark hover:border-gray-400 dark:hover:border-gray-500'
                        ]"
                        :title="rarity.label"
                        :aria-label="`Select ${rarity.label} rarity`"
                    >
                    <img
                        v-if="rarity.image[0]?.value && rarity.image[1]?.value === 'loaded'"
                        :src="rarity.image[0].value.src"
                        :alt="rarity.label"
                        class="h-8 w-8 sm:h-6 sm:w-6 object-contain"
                    />
                    <span v-else class="text-xs font-medium text-center">
                      {{ rarity.label.charAt(0) }}
                    </span>
                  </button>
                </div>
              </div>
              <div v-if="isFieldShown('cardDefense')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardDefense">Defense</label>
                <div class="mt-2">
                  <div class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardDefense" v-model="fields.cardDefense"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>

              <div v-if="isFieldShown('cardLife')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardLife">Life</label>
                <div class="mt-2">
                  <div class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardLife" v-model="fields.cardLife"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text">
                  </div>
                </div>
              </div>
              <div v-if="fields.cardType !== ''" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="photo-cover">Artwork</label>
                <div v-if="fields.cardUploadedArtwork" class="mt-2 w-full flex justify-center rounded-lg border border-dashed border-primary/25 dark:border-white px-6 py-1">
                  <img :src="fields.cardUploadedArtwork" alt="Uploaded artwork" class="rounded">
                  <button class="inline-flex items-center gap-x-1.5 rounded-r-md bg-primary px-2.5  text-sm font-semibold text-white shadow-xs hover:bg-primary-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" v-on:click="() => fields.cardUploadedArtwork = ''">
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
                <label v-if="['hero', 'demi_hero'].includes(fields.cardType)" id="cardHeroPowerLabel" class="block text-sm/6 font-medium text-primary dark:text-white" for="cardText">Hero power</label>
                <label v-else id="cardTextLabel" class="block text-sm/6 font-medium text-primary dark:text-white" for="cardText">Card text</label>
                <div class="col-span-full">
                  <div class="mt-2">
                    <Editor v-model="fields.cardText"></Editor>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div v-show="fields.cardType" class="flex flex-col items-center">
          <label class="block text-sm/6 font-medium text-primary dark:text-white text-center print:hidden" for="cardBackLabel">Select Card Background</label>
          <div class="toggle-container">
            <div class="button-cover">
              <div class="button r">
                <input
                    :checked="selectedStyle === 'flat'"
                    class="checkbox"
                    name="cardStyle"
                    type="checkbox"
                    @change="handleStyleToggle"
                />
                <div class="knobs"></div>
                <div class="layer"></div>
              </div>
            </div>
          </div>
          <div class="w-full flex justify-between items-center mt-2 mb-4 col-start-2 print:hidden cardback-selector-row">
            <button :disabled="loadingBackground" class="cardback-nav-button" type="button"
                    v-on:click="() => switchBackground('previous')">
              <ArrowLeftIcon aria-hidden="true" class="size-5"/>
            </button>

            <div class="grid grid-cols-1 w-full">
              <select
                  v-model="backgroundIndex"
                  class="col-start-1 row-start-1 appearance-none text-center font-bold bg-white dark:bg-dark py-1.5 pr-8 pl-3 text-base text-primary sm:text-sm/6">
                <option
                    v-for="(cardback, index) in filteredAvailableCardbacks"
                    :key="`background_${cardback.id}`"
                    :value="index"
                >
                  {{ cardback.name }}
                </option>
              </select>
              <ChevronDownIcon
                  aria-hidden="true"
                  class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-primary sm:size-4"/>
            </div>


            <button :disabled="loadingBackground"
                    class="cardback-nav-button" type="button"
                    v-on:click="() => switchBackground('next')">
              <ArrowRightIcon aria-hidden="true" class="size-5"/>
            </button>
          </div>

          <div class="flex flex-col w-full xs:items-center">
            <div class="cardParent">
              <div id="renderedCardText" ref="containerElement" :style="cardTextStyle">
                <div v-if="fields" id="renderedContent" ref="contentElement" v-html="fields.cardText"></div>
              </div>
              <div ref="stageContainerRef" style="width: 100%;height:100%;">
                <v-stage
                    ref="stage"
                    :config="{
                    width: stageWidth,
                    height: stageHeight,
                    scaleX: scale,
                    scaleY: scale
                  }"
                >
                  <v-layer id="artwork" ref="artwork"></v-layer>
                  <v-layer id="background" ref="background"></v-layer>
                  <v-layer>
                    <v-image
                        v-if="fields.cardType === 'block'"
                        :config="{
                       ...getConfig('noResourceImage'),
                       image: noResourceImage,
                     }"
                    />
                    <v-image
                        v-if="fields.cardPower !== ''"
                        :config="{
                       ...getConfig('powerImage'),
                       image: powerImage,
                     }"
                    />
                    <v-image
                        v-if="fields.cardDefense !== ''"
                        :config="{
                       ...getConfig('defenseImage'),
                       image: defenseImage,
                     }"
                    />
                    <v-image
                        v-if="fields.cardLife !== ''"
                        :config="{
                       ...getConfig('lifeImage'),
                       image: lifeImage,
                     }"
                    />
                  </v-layer>
                  <v-layer id="text">
                    <v-text v-show="fields.cardName" v-bind="{
                  ...getConfig('cardName'),
                  ...{
                    text: fields.cardName,
                    fontSize: nameFontSize
                  }
                }"></v-text>
                    <v-text v-if="fields.cardResource !== ''" :text="fields.cardResource" v-bind="getConfig('cardResource')"></v-text>
                    <v-text v-if="fields.cardDefense !== ''" :text="fields.cardDefense" v-bind="getConfig('cardDefense')"></v-text>
                    <v-text v-if="fields.cardPower !== ''" :text="fields.cardPower" v-bind="getConfig('cardPower')"></v-text>
                    <v-text v-if="fields.cardLife !== ''" :text="fields.cardLife" v-bind="getConfig('cardLife')"></v-text>
                    <v-text v-if="fields.cardHeroIntellect !== ''" :text="fields.cardHeroIntellect" v-bind="getConfig('cardHeroIntellect')"></v-text>
                    <v-text
                        :fontSize="typeTextFontSize"
                        :text="cardTypeText"
                        v-bind="getConfig('cardTypeText')"
                    ></v-text>
                  </v-layer>
                  <v-layer id="footer" ref="footer">
                    <v-image v-if="fields.cardRarity" id="cardRarity" :image="cardRarityImage" v-bind="getConfig('cardRarity')"></v-image>
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
          </div>
          <div class="flex justify-center mt-2 print:hidden gap-4">
            <button class="inline-flex items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5" type="button" v-on:click="() => downloadImage()">
              Download Card
              <DocumentArrowDownIcon aria-hidden="true" class="-mr-0.5 size-5"/>
            </button>
            <button class="inline-flex items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5" type="button" v-on:click="() => printPage()">
              Print
              <PrinterIcon aria-hidden="true" class="-mr-0.5 size-5"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
