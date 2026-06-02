import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import { storage } from './storage';

export type Locale = 'en' | 'lv';

const LOCALE_STORAGE_KEY = 'eb_locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const lv: Record<string, string> = {
  'Access your relocation portal.': 'Piekļūstiet savam pārcelšanās portālam.',
  'Account record': 'Konta ieraksts',
  'Active Orders': 'Aktīvie pasūtījumi',
  'Active account': 'Aktīvs konts',
  'Active Enquiries': 'Aktīvie pieprasījumi',
  'Active Jobs': 'Aktīvās darba vietas',
  'Add Content': 'Pievienot saturu',
  'Add to Calendar': 'Pievienot kalendāram',
  'Admin Dashboard': 'Administratora panelis',
  'Admin Profile': 'Administratora profils',
  'Admin profile and reference lists.': 'Administratora profils un atsauces saraksti.',
  'Agent Portal': 'Aģenta portāls',
  'Agent Profile': 'Aģenta profils',
  'AI Chat': 'AI čats',
  'AI Feedback': 'AI atsauksmes',
  'AI Knowledge': 'AI zināšanu bāze',
  'Airport Pickup': 'Sagaidīšana lidostā',
  All: 'Visi',
  'All Fields': 'Visi lauki',
  'Any price': 'Jebkura cena',
  Applications: 'Pieteikumi',
  Apply: 'Pieteikties',
  Applied: 'Pieteikts',
  Approve: 'Apstiprināt',
  Arrival: 'Ierašanās',
  'Arrival Planning': 'Ierašanās plānošana',
  'Arrival date': 'Ierašanās datums',
  'Available Transport Providers': 'Pieejamie transporta pakalpojumu sniedzēji',
  Back: 'Atpakaļ',
  'Back to login': 'Atpakaļ uz pieteikšanos',
  Book: 'Rezervēt',
  'Book transport for your first move.': 'Rezervējiet transportu savam pirmajam braucienam.',
  Bookings: 'Rezervācijas',
  Breakfast: 'Brokastis',
  Browse: 'Pārlūkot',
  'Browse Programs': 'Pārlūkot programmas',
  'Browse opportunities and track applications.': 'Pārlūkojiet iespējas un sekojiet pieteikumiem.',
  'Browse schools and track applications.': 'Pārlūkojiet skolas un sekojiet pieteikumiem.',
  Buddies: 'Draugi',
  Cancel: 'Atcelt',
  'Change Password': 'Mainīt paroli',
  'Check your connection and try again.': 'Pārbaudiet savienojumu un mēģiniet vēlreiz.',
  'Choose from Library': 'Izvēlēties no bibliotēkas',
  'Circle name': 'Grupas nosaukums',
  Circles: 'Grupas',
  'City Transfer': 'Pilsētas transfērs',
  'Close ticket': 'Aizvērt pieteikumu',
  Closed: 'Aizvērts',
  Community: 'Kopiena',
  'Community Circles': 'Kopienas grupas',
  'Community updates will appear here.': 'Kopienas jaunumi parādīsies šeit.',
  'Confirm order': 'Apstiprināt pasūtījumu',
  'Confirmed Bookings': 'Apstiprinātās rezervācijas',
  'Content': 'Saturs',
  'Conversation unavailable': 'Saruna nav pieejama',
  'Create account': 'Izveidot kontu',
  'Create and maintain job postings.': 'Izveidojiet un uzturiet darba sludinājumus.',
  'Create and update school program offerings.': 'Izveidojiet un atjauniniet skolu programmu piedāvājumus.',
  'Created:': 'Izveidots:',
  Custom: 'Pielāgots',
  Date: 'Datums',
  Delete: 'Dzēst',
  Delivery: 'Piegāde',
  Destination: 'Galamērķis',
  Dinner: 'Vakariņas',
  Documents: 'Dokumenti',
  'Document Wallet': 'Dokumentu maks',
  'Document name': 'Dokumenta nosaukums',
  'Document wallet is available to student accounts.': 'Dokumentu maks ir pieejams studentu kontiem.',
  Done: 'Pabeigts',
  Edit: 'Rediģēt',
  Email: 'E-pasts',
  Employers: 'Darba devēji',
  Enquire: 'Jautāt',
  Enquiry: 'Pieprasījums',
  Events: 'Notikumi',
  'Find circles, events, and student buddies.': 'Atrodiet grupas, notikumus un studentu draugus.',
  'Find trusted accommodation partners.': 'Atrodiet uzticamus mājokļu partnerus.',
  Finance: 'Finanses',
  Fleet: 'Autoparks',
  Food: 'Ēdināšana',
  'Food Admin': 'Ēdināšanas administrēšana',
  'Food Service': 'Ēdināšanas serviss',
  'Forgot password?': 'Aizmirsāt paroli?',
  'Full platform control center.': 'Pilns platformas vadības centrs.',
  Growth: 'Izaugsme',
  'Growth Metrics': 'Izaugsmes rādītāji',
  Housing: 'Mājokļi',
  'Housing Admin': 'Mājokļu administrēšana',
  'Housing Listings': 'Mājokļu sludinājumi',
  Institutions: 'Iestādes',
  'Institutions and Employers': 'Iestādes un darba devēji',
  Intercity: 'Starp pilsētām',
  'Investor Dashboard': 'Investora panelis',
  Jobs: 'Darbi',
  'Job Partner Portal': 'Darba partnera portāls',
  'Job Partner Profile': 'Darba partnera profils',
  Join: 'Pievienoties',
  Joined: 'Pievienojies',
  Language: 'Valoda',
  Listings: 'Sludinājumi',
  Login: 'Pieteikties',
  Logout: 'Izrakstīties',
  Lunch: 'Pusdienas',
  Menu: 'Izvēlne',
  Message: 'Ziņa',
  Messages: 'Ziņas',
  Missing: 'Trūkst',
  'My Applications': 'Mani pieteikumi',
  'My Requests': 'Mani pieprasījumi',
  'New conversation': 'Jauna saruna',
  'New to EBENESAID?': 'Jauns EBENESAID lietotājs?',
  'Next Steps': 'Nākamie soļi',
  'No active requests': 'Nav aktīvu pieprasījumu',
  'No applications yet': 'Vēl nav pieteikumu',
  'No audit events': 'Nav audita notikumu',
  'No buddy matches yet': 'Vēl nav draugu sakritību',
  'No circle messages': 'Nav grupas ziņu',
  'No circles yet': 'Vēl nav grupu',
  'No content items': 'Nav satura vienumu',
  'No documents yet': 'Vēl nav dokumentu',
  'No events yet': 'Vēl nav notikumu',
  'No growth metrics yet': 'Vēl nav izaugsmes rādītāju',
  'No jobs found': 'Darbi nav atrasti',
  'No listings found': 'Sludinājumi nav atrasti',
  'No matching country.': 'Nav atbilstošas valsts.',
  'No matching university.': 'Nav atbilstošas universitātes.',
  'No menu items': 'Nav izvēlnes vienumu',
  'No messages': 'Nav ziņu',
  'No messages yet': 'Vēl nav ziņu',
  'No messages yet.': 'Vēl nav ziņu.',
  'No pending verifications': 'Nav gaidošu verifikāciju',
  'No program applications': 'Nav programmu pieteikumu',
  'No programs listed': 'Nav norādītu programmu',
  'No providers listed': 'Nav norādītu pakalpojumu sniedzēju',
  'No recent activity': 'Nav nesenu aktivitāšu',
  'No records yet': 'Vēl nav ierakstu',
  'No required documents listed': 'Nav norādītu obligāto dokumentu',
  'No users found': 'Lietotāji nav atrasti',
  'Not started': 'Nav sākts',
  Open: 'Atvērts',
  'Open circle': 'Atvērt grupu',
  Operations: 'Operācijas',
  Order: 'Pasūtīt',
  'Order item': 'Pasūtīt vienumu',
  Orders: 'Pasūtījumi',
  Origin: 'Sākumpunkts',
  Passengers: 'Pasažieri',
  Password: 'Parole',
  Pending: 'Gaida',
  'Pending Applications': 'Gaidošie pieteikumi',
  'Pending Pickups': 'Gaidošās sagaidīšanas',
  'Pending Verifications': 'Gaidošās verifikācijas',
  Pickup: 'Saņemšana',
  Pickups: 'Sagaidīšanas',
  'Plan Your Arrival': 'Plānojiet ierašanos',
  'Platform Content': 'Platformas saturs',
  'Posted jobs, applicants, and hiring outcomes.': 'Publicētie darbi, kandidāti un pieņemšanas rezultāti.',
  'Profile': 'Profils',
  'Profile completion': 'Profila pabeigšana',
  Programs: 'Programmas',
  'Recent Activity': 'Nesenās aktivitātes',
  'Recent Audit Events': 'Nesenie audita notikumi',
  'Recipient user ID': 'Saņēmēja lietotāja ID',
  Refresh: 'Atjaunot',
  Reject: 'Noraidīt',
  Reports: 'Atskaites',
  Required: 'Obligāts',
  'Required Documents': 'Obligātie dokumenti',
  'Request new circle': 'Pieprasīt jaunu grupu',
  Retry: 'Mēģināt vēlreiz',
  Revenue: 'Ieņēmumi',
  Save: 'Saglabāt',
  'Save arrival plan': 'Saglabāt ierašanās plānu',
  'Save profile': 'Saglabāt profilu',
  Schools: 'Skolas',
  Search: 'Meklēt',
  Security: 'Drošība',
  Send: 'Sūtīt',
  'Send request': 'Nosūtīt pieprasījumu',
  Services: 'Pakalpojumi',
  Settings: 'Iestatījumi',
  'Sign in': 'Pieteikties',
  Snacks: 'Uzkodas',
  Staff: 'Darbinieki',
  'Staff Dashboard': 'Darbinieku panelis',
  Status: 'Statuss',
  Students: 'Studenti',
  Submit: 'Iesniegt',
  'Submit Document': 'Iesniegt dokumentu',
  'Submit application': 'Iesniegt pieteikumu',
  Supplier: 'Piegādātājs',
  'Supplier Portal': 'Piegādātāja portāls',
  Support: 'Atbalsts',
  'Support Queue': 'Atbalsta rinda',
  'Support Tickets': 'Atbalsta pieteikumi',
  'Take Photo': 'Uzņemt foto',
  'Task Templates': 'Uzdevumu veidnes',
  'Ticket closed': 'Pieteikums slēgts',
  'Total Applicants': 'Kandidāti kopā',
  'Total Listings': 'Sludinājumi kopā',
  'Total Orders': 'Pasūtījumi kopā',
  'Total Users': 'Lietotāji kopā',
  Transport: 'Transports',
  'Transport Admin': 'Transporta administrēšana',
  'Transport Portal': 'Transporta portāls',
  'Travel date': 'Ceļojuma datums',
  'Travel time': 'Ceļojuma laiks',
  Type: 'Tips',
  'Unable to load admin dashboard': 'Neizdevās ielādēt administratora paneli',
  'Unable to load arrival planning': 'Neizdevās ielādēt ierašanās plānošanu',
  'Unable to load circle': 'Neizdevās ielādēt grupu',
  'Unable to load community': 'Neizdevās ielādēt kopienu',
  'Unable to load conversation': 'Neizdevās ielādēt sarunu',
  'Unable to load dashboard': 'Neizdevās ielādēt paneli',
  'Unable to load documents': 'Neizdevās ielādēt dokumentus',
  'Unable to load finance': 'Neizdevās ielādēt finanses',
  'Unable to load food service': 'Neizdevās ielādēt ēdināšanas servisu',
  'Unable to load housing': 'Neizdevās ielādēt mājokļus',
  'Unable to load jobs': 'Neizdevās ielādēt darbus',
  'Unable to load messages': 'Neizdevās ielādēt ziņas',
  'Unable to load profile': 'Neizdevās ielādēt profilu',
  'Unable to load programs': 'Neizdevās ielādēt programmas',
  'Unable to load support': 'Neizdevās ielādēt atbalstu',
  Upload: 'Augšupielādēt',
  'Upload Section': 'Augšupielādes sadaļa',
  'Upload document': 'Augšupielādēt dokumentu',
  Users: 'Lietotāji',
  'Users by Type': 'Lietotāji pēc veida',
  Verification: 'Verifikācija',
  'Verification Queue': 'Verifikācijas rinda',
  'Verification Status': 'Verifikācijas statuss',
  View: 'Skatīt',
  'View Revenue': 'Skatīt ieņēmumus',
  'Write a message...': 'Rakstiet ziņu...',
  'Write to the circle...': 'Rakstiet grupai...',
  'You:': 'Jūs:',
  'Your account is loading': 'Jūsu konts tiek ielādēts',
  'Your latest relocation updates will appear here.': 'Jūsu jaunākie pārcelšanās atjauninājumi būs redzami šeit.',
  'complete': 'pabeigts',
  'members': 'dalībnieki',
  'participant': 'dalībnieks',
  'tuition': 'mācību maksa',
  'unread': 'nelasītas'
};

const replacements: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^Unable to load (.+)$/i, (match) => `Neizdevās ielādēt ${translateText(match[1] ?? '', 'lv').toLowerCase()}`],
  [/^No (.+) yet\.?$/i, (match) => `Vēl nav: ${translateText(match[1] ?? '', 'lv').toLowerCase()}`],
  [/^No (.+) found\.?$/i, (match) => `Nav atrasts: ${translateText(match[1] ?? '', 'lv').toLowerCase()}`],
  [/^(.+) Portal$/i, (match) => `${translateText(match[1] ?? '', 'lv')} portāls`],
  [/^(.+)% complete$/i, (match) => `${match[1]}% pabeigts`],
  [/^(.+) members$/i, (match) => `${match[1]} dalībnieki`],
  [/^Created: (.+)$/i, (match) => `Izveidots: ${match[1]}`],
  [/^Last login: (.+)$/i, (match) => `Pēdējā pieteikšanās: ${match[1]}`],
  [/^Starts (.+)$/i, (match) => `Sākas ${match[1]}`],
  [/^Applied (.+)$/i, (match) => `Pieteikts ${match[1]}`],
  [/^(.+) tuition$/i, (match) => `${match[1]} mācību maksa`],
  [/^(.+) unread$/i, (match) => `${match[1]} nelasītas`],
  [/^(.+) passenger\(s\)$/i, (match) => `${match[1]} pasažieris/i`]
];

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'lv';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    let isMounted = true;

    void storage.getString(LOCALE_STORAGE_KEY).then((savedLocale) => {
      if (isMounted && isLocale(savedLocale)) {
        setLocaleState(savedLocale);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    void storage.set(LOCALE_STORAGE_KEY, nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => {
      const nextLocale = current === 'en' ? 'lv' : 'en';
      void storage.set(LOCALE_STORAGE_KEY, nextLocale);
      return nextLocale;
    });
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale
    }),
    [locale, setLocale, toggleLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale() {
  const context = useContext(I18nContext);

  if (!context) {
    return {
      locale: 'en' as Locale,
      setLocale: () => undefined,
      toggleLocale: () => undefined
    };
  }

  return context;
}

export function translateText(value: string, locale: Locale): string {
  if (locale === 'en') {
    return value;
  }

  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  const exact = lv[trimmed];

  if (exact) {
    return `${leading}${exact}${trailing}`;
  }

  for (const [pattern, resolve] of replacements) {
    const match = trimmed.match(pattern);

    if (match) {
      return `${leading}${resolve(match)}${trailing}`;
    }
  }

  return value;
}
