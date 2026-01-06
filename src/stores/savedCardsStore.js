import {defineStore} from "pinia";
import {ref} from "vue";
import {useUtil} from "../helpers/util.js";

/**
 * @typedef Card - Representation of a card in this store.
 * @type {object}
 * @property {string} card.id - Unique uid.
 * @property {string} card.name - The name of the card image.
 * @property {string} card.src - The image's base64 string.
 */
export const useSavedCardsStore = defineStore('savedCards', () => {
  /**
   * @type {Ref<UnwrapRef<Card[]>, UnwrapRef<Card[]> | Card[]>}
   */
  const cards = ref([]);

  /**
   * @param {string} uid
   * @param {string} name
   * @param {string} src
   */
  function addCard(uid, name, src) {
    /**
     * @type {Card}
     */
    const card = {
      uid: uid,
      name: useUtil().escapeHTML(name),
      src: src,
    };
    console.log(card);
    cards.value.push(card);
  }

  /**
   * @param uid
   * @returns {Card|boolean}
   */
  function getCard(uid) {
    const card = cards.value.find(elem => elem.uid === uid);
    if (!card) return false;

    return card;
  }

  return {cards, addCard, getCard};
})
