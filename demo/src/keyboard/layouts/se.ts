import {AvailableLanguageLayouts} from '../index';
import AbstractKeyboardLayout from './abstract-layout';

export default class SerbianLayout extends AbstractKeyboardLayout {
  protected language: string = AvailableLanguageLayouts.SE;
  protected line1: string[] = ['љ', 'њ', 'е', 'р', 'т', 'з', 'у', 'и', 'о', 'п', 'ш', 'ђ'];
  protected line2: string[] = ['а', 'с', 'д', 'ф', 'г', 'х', 'ј', 'к', 'л', 'ч', 'ћ'];
  protected line3: string[] = ['ѕ', 'џ', 'ц', 'в', 'б', 'н', 'м'];
}