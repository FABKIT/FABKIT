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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubtype",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardDefense",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubtype",
            },
            {
                id: "cardLife",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubtype",
            },
            {
                id: "cardWeapon",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardSubType",
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
                id: "cardClass",
            },
            {
                id: "cardSecondaryClass",
            },
            {
                id: "cardSubtype",
            },
            {
                id: "cardLife",
            },
            {
                id: "cardRarity",
            },
            {
                id: "cardSubType",
            },
        ],
    }
]

export default function useTypes() {
    return types;
}