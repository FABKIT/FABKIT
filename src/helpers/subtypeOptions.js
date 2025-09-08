export const useSubtypeOptions = (type) => {
    const options = {
        action: [
            {value: '', label: 'None'},
            {value: 'Attack', label: 'Attack'},
            {value: 'Ally', label: 'Ally'},
            {value: 'Arrow Attack', label: 'Arrow Attack'},
            {value: 'Dagger Attack', label: 'Dagger Attack'},
            {value: 'Aura', label: 'Aura'},
            {value: 'Affliction Aura', label: 'Affliction Aura'},
            {value: 'Construct', label: 'Construct'},
            {value: 'Invocation', label: 'Invocation'},
            {value: 'Item', label: 'Item'},
            {value: 'Shuriken Item', label: 'Shuriken Item'},
            {value: 'Landmark', label: 'Landmark'},
            {value: 'Song', label: 'Song'},
        ],
        defense_reaction: [
            {value: '', label: 'None'},
            {value: 'Trap', label: 'Trap'},
        ],
        equipment: [
            {value: '', label: 'None'},
            {value: 'Head', label: 'Head'},
            {value: 'Chest', label: 'Chest'},
            {value: 'Arms', label: 'Arms'},
            {value: 'Legs', label: 'Legs'},
            {value: 'Base', label: 'Base'},
            {value: 'Off-Hand', label: 'Off-Hand'},
            {value: 'Item', label: 'Item'},
        ],
        instant: [
            {value: '', label: 'None'},
            {value: 'Aura', label: 'Aura'},
            {value: 'Figment', label: 'Figment'},
            {value: 'Trap', label: 'Trap'},
        ],
        resource: [
            {value: '', label: 'None'},
            {value: 'Gem', label: 'Gem'},
            {value: 'Chi', label: 'Chi'},
        ],
        hero: [
            {value: '', label: 'None'},
            {value: 'Demon', label: 'Demon'},
            {value: 'Young', label: 'Young'},
        ],
        weapon: [
            {value: '', label: 'None'},
            {value: 'Axe', label: 'Axe'},
            {value: 'Book', label: 'Book'},
            {value: 'Bow', label: 'Bow'},
            {value: 'Brush', label: 'Brush'},
            {value: 'Club', label: 'Club'},
            {value: 'Dagger', label: 'Dagger'},
            {value: 'Fiddle', label: 'Fiddle'},
            {value: 'Flail', label: 'Flail'},
            {value: 'Gun', label: 'Gun'},
            {value: 'Hammer', label: 'Hammer'},
            {value: 'Lute', label: 'Lute'},
            {value: 'Orb', label: 'Orb'},
            {value: 'Pistol', label: 'Pistol'},
            {value: 'Polearm', label: 'Polearm'},
            {value: 'Scepter', label: 'Scepter'},
            {value: 'Scroll', label: 'Scroll'},
            {value: 'Scythe', label: 'Scythe'},
            {value: 'Staff', label: 'Staff'},
            {value: 'Sword', label: 'Sword'},
            {value: 'Wrench', label: 'Wrench'}
        ],
        token: [
            {value: '', label: 'None'},
        ],
    }

    return options[type];
}