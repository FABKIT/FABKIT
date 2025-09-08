import * as HeroIcons from '@heroicons/vue/24/outline'

export const currentWorkItems = [
    {
        title: "Converting our forms to a grid system",
        description: "There's a lot of white space in the current flex-system. A grid would make it a bit more evenly spaced out",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.AdjustmentsHorizontalIcon
    },
    {
        title: "Quick Keyword insertion",
        description: "FaB has a lot of keywords and you might want to insert them (along with their explanation) into the editor easily.",
        status: "planned",
        priority: "low",
        icon: HeroIcons.Bars3Icon
    },
    {
        title: "Marvel cardbacks",
        description: "For now, we think most, if not all base cardbacks are included into our custom card maker. Marvel cardbacks are a bit trickier code-wise, but we want to include them.",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.PhotoIcon
    }
]

export const futurePlans = [
    {
        title: "Add compatibility with Evo, Mentor and Meld cards",
        description: "These card types require specific code to work, but we will add them eventually.",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.ClipboardDocumentIcon
    },
    {
        title: "Add compatibility half-cardbacks",
        description: "Allow the user to use two halves of two cardbacks as one cardback.",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.DocumentDuplicateIcon
    },
    {
        title: "Card Collection Manager",
        description: "Allow users to save and manage collections of created cards. This is planned for the future, since it would take a lot of work.",
        status: "idea",
        priority: "low",
        icon: HeroIcons.UserGroupIcon
    },
    {
        title: "Community Gallery",
        description: "Share and browse cards created by the community. We want to highlight the cards that you made. This will probably come after we made a collection system",
        status: "idea",
        priority: "low",
        icon: HeroIcons.PhotoIcon
    },
    {
        title: "Booster Simulator",
        description: "When the custom card maker is steady, we want to move on to our second tool where you can simulate opening boosters of FaB. ",
        status: "planned",
        priority: "medium",
        icon: HeroIcons.WrenchScrewdriverIcon
    },
    {
        title: "Quickshare buttons",
        description: "You can now download your custom card, but wouldn't it be fun if you could share it with a click of the button. ",
        status: "planned",
        priority: "high",
        icon: HeroIcons.ShareIcon
    }
]