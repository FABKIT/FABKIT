import * as HeroIcons from '@heroicons/vue/24/outline'

export const currentWorkItems = [
    {
        title: "Add Ally as a card type",
        description: "For all the Gravy fans out there, we can",
        status: "in-progress",
        priority: "high",
        icon: HeroIcons.ClipboardDocumentIcon
    },
    {
        title: "Change dropdowns to input fields with suggestions",
        description: "Instead of selecting your classes/talents from the dropdowns, we are thinking of making it an input field with the existing classes/talents as suggestions while you're typing",
        status: "planned",
        priority: "low",
        icon: HeroIcons.TagIcon
    }
]

export const futurePlans = [
    {
        title: "Add compatibility with Evo, Mentor and Meld cards",
        description: "These card types require specific code to work, but we will add them eventually",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.ClipboardDocumentIcon
    },
    {
        title: "Add compatibility half-cardbacks",
        description: "Allow the user to use two halves of two cardbacks as one cardback",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.DocumentDuplicateIcon
    },
    {
        title: "Card Collection Manager",
        description: "Allow users to save and manage collections of created cards. Won",
        status: "idea",
        priority: "low",
        icon: HeroIcons.UserGroupIcon
    },
    {
        title: "Add flavour text functionality",
        description: "You can kind of already add flavour text inside of the editor, but we want to add a seperate custom text area for this. So you can add lore to your custom cards.",
        status: "in-progress",
        priority: "high",
        icon: HeroIcons.ChatBubbleBottomCenterTextIcon
    },
    {
        title: "Quick Keyword insertion into the editor",
        description: "Allowing the user to select a keyword from a grid to add inside of the editor quickly, with or without the official explanation",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.CursorArrowRaysIcon
    },
    {
        title: "Community Gallery",
        description: "Share and browse cards created by the community. We want to highlight the cards that you",
        status: "idea",
        priority: "low",
        icon: HeroIcons.PhotoIcon
    }
]