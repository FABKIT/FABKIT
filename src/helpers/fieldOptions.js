export const fieldOptions = () => {
    const talentOptions = [
        { value: '', label: 'None' },
        { value: 'Chaos', label: 'Chaos' },
        { value: 'Draconic', label: 'Draconic' },
        { value: 'Earth', label: 'Earth' },
        { value: 'Elemental', label: 'Elemental' },
        { value: 'Ice', label: 'Ice' },
        { value: 'Light', label: 'Light' },
        { value: 'Lightning', label: 'Lightning' },
        { value: 'Mystic', label: 'Mystic' },
        { value: 'Pirate', label: 'Pirate' },
        { value: 'Royal', label: 'Royal' },
        { value: 'Shadow', label: 'Shadow' }
    ]

    const classOptions = [
        { value: '', label: 'None' },
        { value: 'Adjudicator', label: 'Adjudicator' },
        { value: 'Assassin', label: 'Assassin' },
        { value: 'Bard', label: 'Bard' },
        { value: 'Brute', label: 'Brute' },
        { value: 'Generic', label: 'Generic' },
        { value: 'Guardian', label: 'Guardian' },
        { value: 'Illusionist', label: 'Illusionist' },
        { value: 'Mechanologist', label: 'Mechanologist' },
        { value: 'Merchant', label: 'Merchant' },
        { value: 'Necromancer', label: 'Necromancer' },
        { value: 'Ninja', label: 'Ninja' },
        { value: 'Ranger', label: 'Ranger' },
        { value: 'Runeblade', label: 'Runeblade' },
        { value: 'Shapeshifter', label: 'Shapeshifter' },
        { value: 'Warrior', label: 'Warrior' },
        { value: 'Wizard', label: 'Wizard' }
    ]

    const weaponSubtypeOptions = [
        { value: '', label: 'None' },
        { value: 'Axe', label: 'Axe' },
        { value: 'Book', label: 'Book' },
        { value: 'Bow', label: 'Bow' },
        { value: 'Brush', label: 'Brush' },
        { value: 'Club', label: 'Club' },
        { value: 'Dagger', label: 'Dagger' },
        { value: 'Fiddle', label: 'Fiddle' },
        { value: 'Flail', label: 'Flail' },
        { value: 'Gun', label: 'Gun' },
        { value: 'Hammer', label: 'Hammer' },
        { value: 'Lute', label: 'Lute' },
        { value: 'Orb', label: 'Orb' },
        { value: 'Pistol', label: 'Pistol' },
        { value: 'Polearm', label: 'Polearm' },
        { value: 'Scepter', label: 'Scepter' },
        { value: 'Scroll', label: 'Scroll' },
        { value: 'Scythe', label: 'Scythe' },
        { value: 'Staff', label: 'Staff' },
        { value: 'Sword', label: 'Sword' },
        { value: 'Wrench', label: 'Wrench' }
    ]

    // Add all your other option arrays here...

    return {
        talentOptions,
        classOptions,
        weaponSubtypeOptions,
    }
}