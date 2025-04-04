export default function useTinyMCEConfig(cardText) {
    const buttons = [
        {
            text: "\uE000",
            icon: "fab-cost",
        },
        {
            text: "\uE001",
            icon: "fab-defense",
        },
        {
            text: "\uE002",
            icon: "fab-intellect",
        },
        {
            text: "\uE003",
            icon: "fab-life",
        },
        {
            text: "\uE004",
            icon: "fab-power",
        },
    ];
    return {
        selector: 'textarea#cardText',
        license_key: 'gpl',
        pad_empty_with_br: true,
        // x = 53
        // y = 406
        resize: false,
        height: 285,
        width: '100%',
        menubar: false,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'searchreplace',
            'emoticons'
        ],
        toolbar: 'bold italic underline alignleft aligncenter alignright alignjustify bullist ' + buttons.map((b) => 'custom_button_' + b.icon).join(' '),
        promotion: false,
        branding: false,
        skin: (window.matchMedia("(prefers-color-scheme: dark)").matches ? "oxide-dark" : "oxide"),
        content_css: (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : ""),
        content_style: `
    @import url('tinymce/fonts.css');
  `,
        setup: (editor) => {
            buttons.forEach((button) => {
                editor.ui.registry.addButton('custom_button_' + button.icon, {
                    text: button.text,
                    onAction: (_) => editor.insertContent(button.text)
                });
            });

            let editorChangeHandlerId = null;
            editor.on('Paste Change input Undo Redo', function () {
                clearTimeout(editorChangeHandlerId);
                editorChangeHandlerId = setTimeout(function () {
                    cardText.value = editor.getContent();
                }, 250);
            });
        }
    };
}