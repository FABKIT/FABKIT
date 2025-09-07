const types = [
    {
        type: 'action',
        label: 'Action',
        fields: [
            {
                id: "cardPitch",
            },
            {
                id: "cardName",
            },
            {
                id: "cardResource",
            },
            {
                id: "cardText",
            },
            {
                id: "cardPower",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardActionSubtype",
            },
            {
                id: "cardActionSubtypeCustom",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
            {
                id: "cardLife",
            },
        ],
    },
    {
        type: 'attack_reaction',
        label: 'Attack Reaction',
        fields: [
            {
                id: "cardPitch",
            },
            {
                id: "cardName",
            },
            {
                id: "cardResource",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
        ],
    },
    {
        type: 'block',
        label: 'Block',
        fields: [
            {
                id: "cardPitch",
            },
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
        ],
    },
    {
        type: 'defense_reaction',
        label: 'Defense Reaction',
        fields: [
            {
                id: "cardPitch",
            },
            {
                id: "cardName",
            },
            {
                id: "cardResource",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardDefenseReactionSubtype",
            },
            {
                id: "cardDefenseReactionSubtypeCustom",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
        ],
    },
    {
        type: 'demi_hero',
        label: 'Demi-Hero',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardHeroIntellect",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardHeroSubtype",
            },
            {
                id: "cardLife",
            },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'equipment',
        label: 'Equipment',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardEquipmentSubtype",
            },
            {
                id: "cardEquipmentSubtypeCustom",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
        ],
    },
    {
        type: 'hero',
        label: 'Hero',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardHeroIntellect",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardHeroSubtype",
            },
            {
                id: "cardLife",
            },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'instant',
        label: 'Instant',
        fields: [
            {
                id: "cardPitch",
            },
            {
                id: "cardName",
            },
            {
                id: "cardResource",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardInstantSubtype",
            },
            {
                id: "cardInstantSubtypeCustom",
            },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'macro',
        label: 'Macro',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            // {
            //     id: "cardMacroGroup",
            // },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'mentor',
        label: 'Mentor',
        disabled: true,
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
        ],
    },
    {
        type: 'resource',
        label: 'Resource',
        fields: [
            {
                id: "cardPitch",
            },
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardResourceSubtype",
            },
            {
                id: "cardResourceSubtypeCustom",
            },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'token',
        label: 'Token',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardPower",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardTokenSubtype",
            },
            {
                id: "cardTokenSubtypeCustom",
            },
            {
                id: "cardLife",
            },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'weapon',
        label: 'Weapon',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardPower",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardWeaponSubtype",
            },
            {
                id: "cardWeaponSubtypeCustom",
            },
            {
                id: "cardWeapon",
            },
            {
                id: "cardRarity",
            },
        ],
    },
    {
        type: 'ally',
        label: 'Ally (non-action)',
        fields: [
            {
                id: "cardName",
            },
            {
                id: "cardText",
            },
            {
                id: "cardPower",
            },
            {
                id: "cardTalent",
            },
            {
                id: "cardTalentCustom",
            },
            {
                id: "cardClass",
            },
            {
                id: "cardClassCustom",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSecondaryClassCustom",
            },
            {
                id: "cardAllySubtype",
            },
            {
                id: "cardLife",
            },
            {
                id: "cardRarity",
            },
        ],
    }
]

export default function useTypes() {
    return types;
}