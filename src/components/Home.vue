<script setup>
import {PhotoIcon} from '@heroicons/vue/24/solid'
import {ChevronDownIcon} from '@heroicons/vue/16/solid'
import {useCard} from "../helpers/card.js";
import {useCardRarities} from "../helpers/cardRarities.js";
import {useFieldOptions} from '../helpers/fieldOptions.js'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  PrinterIcon,
  TrashIcon
} from "@heroicons/vue/24/solid/index.js";
import {RadioGroup, RadioGroupOption} from "@headlessui/vue";
import {useImage} from "vue-konva";
import ButtonDropdown from "./ButtonDropdown.vue";
import FormCombobox from "./FormCombobox.vue";
import Editor from "./Editor/Editor.vue";
import FeaturedArtist from "./FeaturedArtist.vue";
import {useSubtypeOptions} from "../helpers/subtypeOptions.js";
const { talentOptions, classOptions } = useFieldOptions()

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
  flatFooterText,
  dentedFooterText,
  artworkCreditsText,
  loadingBackground,
  containerElement,
  contentElement,
  stageContainerRef,
  scale,
  downloadImage,
  downloadingImage,
  generateAndOpen,
  sceneWidth,
  sceneHeight,
  nonDentedTypes,
  gridRightColumn,
  generatingAndOpening,
} = useCard();

const {cardRarities} = useCardRarities();

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
    <div v-show="!fields.cardType" class="relative isolate overflow-hidden min-h-[100vh] z-10">
      <div>
        <div class="mx-auto max-w-2xl text-center">
          <h2 class="text-4xl font-semibold tracking-tight text-balance text-primary dark:text-white sm:text-5xl">Start creating!</h2>
          <div class="mt-10 flex items-center justify-center gap-x-6 fade-in-fwd">
            <div class="w-full max-w-xs mx-auto relative z-30">
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
        <div class="p-4 mx-auto fade-in-fwd">
          <FeaturedArtist />
        </div>
      </div>
      <svg aria-hidden="true" class="absolute top-1/2 left-1/2 -z-15 size-256 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)] fade-in-bottom" viewBox="0 0 1024 1024">
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
      <div v-show="fields.cardType" class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3 sm:gap-4 lg:gap-4">
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
              <FormCombobox
                  v-if="isFieldShown('cardTalent')"
                  v-model="fields.cardTalent"
                  label="Talent"
                  input-id="cardTalent"
                  :options="talentOptions"
              />
              <FormCombobox
                  v-if="isFieldShown('cardClass')"
                  v-model="fields.cardClass"
                  label="Class"
                  input-id="cardClass"
                  :options="classOptions"
                  @update:model-value="!$event ? fields.cardSecondaryClass = '' : ''"
              />
              <FormCombobox
                  v-if="isFieldShown('cardSecondaryClass')"
                  v-model="fields.cardSecondaryClass"
                  label="Secondary class (optional)"
                  input-id="cardSecondaryClass"
                  :options="classOptions"
              />
              <FormCombobox
                  v-if="isFieldShown('cardSubType')"
                  v-model="fields.cardSubType"
                  label="Subtype"
                  input-id="cardTalent"
                  :options="useSubtypeOptions(fields.cardType)"
              />
              <div v-if="isFieldShown('cardMacroGroup')" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardMacroGroup">Macro Type</label>
                <div class="mt-2">
                  <div
                      class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardMacroGroup" v-model="fields.cardMacroGroup"
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
                          (fields.cardRarity === rarity.id) || (!fields.cardRarity && rarity.id === 2)  // Add default check
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
              <div v-if="fields.cardType !== ''" class="">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardArtworkCredits">Artwork credits</label>
                <div class="mt-2">
                  <div class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardArtworkCredits" v-model="fields.cardArtworkCredits"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text"
                           :maxlength="selectedStyle === 'flat' ? 36 : 26"
                    />
                  </div>
                </div>
              </div>
              <div v-if="fields.cardType !== ''" class="mt-4">
                <label class="block text-sm/6 font-medium text-primary dark:text-white" for="cardSetNumber">Set Number</label>
                <div class="mt-2">
                  <div class="flex items-center rounded-md bg-white dark:bg-dark pl-3 outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-primary">
                    <input id="cardSetNumber" v-model="fields.cardSetNumber"
                           class="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-primary dark:text-white placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                           type="text"
                           maxlength="6"
                           @input="fields.cardSetNumber = fields.cardSetNumber.toUpperCase()"
                           placeholder="e.g. MON168"
                    />
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
                    :disabled="nonDentedTypes.includes(fields.cardType)"
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

          <div ref="gridRightColumn" class="flex flex-col w-full xs:items-center">
            <div class="cardParent">
              <div role="status" v-show="loadingBackground" class="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-primary" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span class="sr-only">Loading...</span>
              </div>
              <div class="relative">
                <div ref="stageContainerRef" class="overflow-hidden mx-auto w-full">
                    <v-stage
                        ref="stage"
                        :config="{
                          width: sceneWidth * scale,
                          height: sceneHeight * scale,
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
                            :text="cardTypeText"
                            v-bind="{...getConfig('cardTypeText'), fontSize: typeTextFontSize}"
                        ></v-text>
                      </v-layer>
                      <v-layer id="footer">
                        <v-image v-if="fields.cardRarity && cardRarityImage" id="cardRarity" :image="cardRarityImage" v-bind="getConfig('cardRarity')"></v-image>
                        <template v-if="selectedStyle === 'dented'">
                          <v-text
                              v-if="fields.cardArtworkCredits !== '' || fields.cardSetNumber !== ''"
                              :fontSize="footerTextFontSize"
                              :text="artworkCreditsText"
                              v-bind="getConfig('cardArtworkCredits')"
                          />
                          <v-text
                             v-if="fields.cardArtworkCredits !== '' || fields.cardSetNumber !== ''"
                              :fontSize="footerTextFontSize"
                              :text="dentedFooterText"
                              v-bind="getConfig('cardFooterTextCentered')"
                          />
                          <v-text
                              v-if="fields.cardArtworkCredits === '' && fields.cardSetNumber === ''"
                              :fontSize="footerTextFontSize"
                              :text="artworkCreditsText"
                              v-bind="getConfig('cardFooterText')"
                          />
                        </template>
                        <template v-if="selectedStyle === 'flat'">
                          <template v-if="fields.cardArtworkCredits !== '' || fields.cardSetNumber !== ''">
                            <v-text
                                :fontSize="footerTextFontSize"
                                :text="artworkCreditsText"
                                v-bind="getConfig('cardFooterText')"
                            />
                          </template>
                          <template v-else>
                            <v-text
                                :fontSize="footerTextFontSize"
                                text="FABKIT  |  NOT TOURNAMENT LEGAL"
                                v-bind="getConfig('cardFooterText')"
                            />
                          </template>
                          <v-text
                              :fontSize="footerTextFontSize"
                              :text="flatFooterText"
                              v-bind="getConfig('cardFooterTextRight')"
                          />
                        </template>
                      </v-layer>
                    </v-stage>
                    <div id="renderedCardText" ref="containerElement" :style="cardTextStyle">
                      <div v-if="fields" id="renderedContent" ref="contentElement" v-html="fields.cardText"></div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          <div class="flex flex-col gap-3 justify-center mt-2 print:hidden sm:flex-row sm:gap-2">
            <button
                class="inline-flex items-center justify-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5"
                type="button"
                :disabled="generatingAndOpening"
                @click="generateAndOpen"
            >
              Generate and Open
              <ArrowTopRightOnSquareIcon aria-hidden="true" class="-mr-0.5 size-5" v-if="!generatingAndOpening"/>
              <svg v-else aria-hidden="true" class="w-4 h-4 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#ffffff" fill-opacity="0.3"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#ffffff"/>
              </svg>
            </button>

            <button
                class="inline-flex items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5"
                type="button"
                :disabled="downloadingImage"
                @click="downloadImage"
            >
              Generate and Save*
              <DocumentArrowDownIcon aria-hidden="true" class="-mr-0.5 size-5" v-if="!downloadingImage"/>
              <svg v-else aria-hidden="true" class="w-4 h-4 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#ffffff" fill-opacity="0.3"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#ffffff"/>
              </svg>
            </button>

            <button
                class="inline-flex items-center gap-x-1.5 button-primary rounded-md px-3.5 py-2.5"
                type="button"
                @click="printPage"
            >
              Print
              <PrinterIcon aria-hidden="true" class="-mr-0.5 size-5"/>
            </button>
          </div>

          <p class="text-xs text-gray-500 mt-2 text-center print:hidden">
            * Direct download may not work on all mobile devices. Try "Generate and Open" if download fails.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
