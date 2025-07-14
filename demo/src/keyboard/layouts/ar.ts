import {AvailableLanguageLayouts} from '../index';
import AbstractKeyboardLayout from './abstract-layout';

export default class ArabicLayout extends AbstractKeyboardLayout {
  protected language: string = AvailableLanguageLayouts.AR;
  protected line1: string[] = ['\u0636', '\u0635', '\u062b', '\u0642', '\u0641', '\u063a', '\u0639', '\u0647', '\u062e', '\u062d', '\u062c', '\u062f'];
  protected line2: string[] = ['\u0634', '\u0633', '\u064a', '\u0628', '\u0644', '\u0627', '\u062a', '\u0646', '\u0645', '\u0643', '\u0637', '\u005c'];
  protected line3: string[] = ['\u0626', '\u0621', '\u0624', '\u0631', '\u0644', '\u0649', '\u0629', '\u0648', '\u0632', '\u0638'];
}