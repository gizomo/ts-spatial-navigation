import {AvailableLanguageLayouts} from '../index';
import AbstractKeyboardLayout, {type KeyboardLayoutParams} from './abstract-layout';

export default class EnglishLayout extends AbstractKeyboardLayout {
  constructor(params: KeyboardLayoutParams) {
    super(params);

    if (params.language) {
      this.language = params.language;
    } else {
      this.language = AvailableLanguageLayouts.EN;
    }
  }

  protected language: string = AvailableLanguageLayouts.EN;
  protected line1: string[] = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  protected line2: string[] = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  protected line3: string[] = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
}