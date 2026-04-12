import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "./assets/i18n/en.json";

const resources = {
	en: {
		translation: en,
	},
};

await i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		interpolation: { escapeValue: false },
	});

export default i18n;
