import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import cardCreatorEn from "./apps/card-creator/i18n/en.json";
import fabbleEn from "./apps/fabble/i18n/en.json";
import platformEn from "./platform/i18n/en.json";

const resources = {
	en: {
		platform: platformEn,
		"card-creator": cardCreatorEn,
		fabble: fabbleEn,
	},
};

await i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		defaultNS: "platform",
		interpolation: { escapeValue: false },
	});

export default i18n;
