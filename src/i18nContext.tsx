import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import type { Country } from "./data/countries";
import {
	createTranslator,
	formatGroupName,
	getTeamName,
	LOCALES,
	type Locale,
	type Translator,
} from "./i18n";

const STORAGE_KEY = "locale";

function getInitialLocale(): Locale {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved && (LOCALES as string[]).includes(saved)) {
		return saved as Locale;
	}
	const nav = (navigator.language || "ko").toLowerCase();
	if (nav.startsWith("en")) return "en";
	if (nav.startsWith("ja")) return "ja";
	if (nav.startsWith("zh")) return "cn";
	if (nav.startsWith("fr")) return "fr";
	return "ko";
}

interface I18nContextValue {
	locale: Locale;
	setLocale: (next: Locale) => void;
	cycleLocale: () => void;
	t: Translator;
	tName: (team: Country) => string;
	tGroup: (storedName: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, locale);
		document.documentElement.setAttribute("lang", locale);
	}, [locale]);

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next);
	}, []);

	const cycleLocale = useCallback(() => {
		setLocaleState((prev) => {
			const idx = LOCALES.indexOf(prev);
			return LOCALES[(idx + 1) % LOCALES.length];
		});
	}, []);

	const value = useMemo<I18nContextValue>(() => {
		const t = createTranslator(locale);
		return {
			locale,
			setLocale,
			cycleLocale,
			t,
			tName: (team) => getTeamName(team, locale),
			tGroup: (storedName) => formatGroupName(storedName, locale, t),
		};
	}, [locale, setLocale, cycleLocale]);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
	const ctx = useContext(I18nContext);
	if (!ctx) throw new Error("useI18n must be used within I18nProvider");
	return ctx;
}
