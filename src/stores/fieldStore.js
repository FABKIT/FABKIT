import {defineStore} from "pinia";

export const useFieldsStore = defineStore('fieldsStore', {
  state: () => {
    return {
      cardType: '',
      cardPitch: '',
      cardName: '',
      cardResource: '',
      cardText: '',
      cardPower: '',
      cardHeroIntellect: '',
      cardTalent: '',
      cardClass: '',
      cardSecondaryClass: '',
      cardSubType: '',
      cardMacroGroup: '',
      cardWeapon: '',
      cardRarity: 2,
      cardDefense: '',
      cardLife: '',
      cardUploadedArtwork: '',
      cardFooterText: '',
      cardSetNumber: '',
      cardArtworkCredits: '',
      cardBackgroundIndex: 0,
    }
  }
})
