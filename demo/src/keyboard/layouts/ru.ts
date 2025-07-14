import {AvailableLanguageLayouts} from '../index';
import AbstractKeyboardLayout from './abstract-layout';

export default class RussianLayout extends AbstractKeyboardLayout {
  protected language: string = AvailableLanguageLayouts.RU;
  protected line1: string[] = ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'];
  protected line2: string[] = ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'];
  protected line3: string[] = ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'];
}