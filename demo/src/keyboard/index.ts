import ArabicLayout from './layouts/ar';
import ArmenianLayout from './layouts/hy';
import AzerbaijaniLayout from './layouts/az';
import Backspace from './icons/Backspace.svelte';
import CapsLock from './icons/CapsLock.svelte';
import Clear from './icons/Clear.svelte';
import CzechLayout from './layouts/cs';
import EnglishLayout from './layouts/en';
import Enter from './icons/Enter.svelte';
import Keyboard from './Keyboard.svelte';
import Language from './icons/Language.svelte';
import RussianLayout from './layouts/ru';
import SerbianLayout from './layouts/se';
import Shift from './icons/Shift.svelte';
import ShiftActive from './icons/ShiftActive.svelte';
import Space from './icons/Space.svelte';
import type {KeyboardLayoutParams, Key} from './layouts/abstract-layout';
import type {SvelteComponent} from 'svelte';

export interface Class<T, A extends any[] = any[]> extends Function {
  new (...args: A): T;
}

export enum AvailableLanguageLayouts {
  AR = 'ar',
  AZ = 'az',
  EN = 'en',
  HY = 'hy',
  RU = 'ru',
  SE = 'se',
  CS = 'cs',
}

export enum SystemKeys {
  BACKSPACE = 'backspace',
  ENTER = 'enter',
  SHIFT = 'shift',
  SHIFT_ACTIVE = 'shift-active',
  CAPSLOCK = 'capslock',
  CLEAR = 'clear',
  LANGUAGE = 'language',
  SPACE = 'space',
  NUMBERS = 'numbers',
  CHARS = 'chars',
  EXTENDED = 'extended',
}

export type Size = {
  width: number,
  height: number,
};

export interface KeyboardLayout {
  isNumbersMode(): boolean;
  isSpecialMode(): boolean;
  isShiftMode(): boolean;
  isCapsLockMode(): boolean;
  toggleSpecialMode(): void;
  toggleNumbersMode(): void;
  toggleShiftMode(): void;
  disableShiftMode(): void;
  getLanguage(): string;
  getKeys(...arg: any[]): Key[];
  getCharSize(): number;
  getSize(): Size;
  getRowsCount(): number;
}

export function getKeyIcon(key: string): Class<SvelteComponent> {
  switch (key) {
    case SystemKeys.BACKSPACE:
      return Backspace;
    case SystemKeys.CAPSLOCK:
      return CapsLock;
    case SystemKeys.CLEAR:
      return Clear;
    case SystemKeys.ENTER:
      return Enter;
    case SystemKeys.LANGUAGE:
      return Language;
    case SystemKeys.SHIFT:
      return Shift;
    case SystemKeys.SHIFT_ACTIVE:
      return ShiftActive;
    case SystemKeys.SPACE:
      return Space;
    default:
      return;
  }
}

export function getLayout(language: string, params: KeyboardLayoutParams): KeyboardLayout {
  switch (language) {
    case AvailableLanguageLayouts.AR:
      return new ArabicLayout(params);
    case AvailableLanguageLayouts.AZ:
      return new AzerbaijaniLayout(params);
    case AvailableLanguageLayouts.CS:
      return new CzechLayout(params);
    case AvailableLanguageLayouts.EN:
      return new EnglishLayout(params);
    case AvailableLanguageLayouts.HY:
      return new ArmenianLayout(params);
    case AvailableLanguageLayouts.RU:
      return new RussianLayout(params);
    case AvailableLanguageLayouts.SE:
      return new SerbianLayout(params);
    default:
      console.log(`Keyboard layout for ${language.toUpperCase()} is not exist. Using English layout.`);
      return new EnglishLayout({...params, language});
  }
}

export default Keyboard;