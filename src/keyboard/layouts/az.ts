import {AvailableLanguageLayouts} from '../index';
import AbstractKeyboardLayout from './abstract-layout';

export default class AzerbaijaniLayout extends AbstractKeyboardLayout {
  protected language: string = AvailableLanguageLayouts.AZ;
  protected line1: string[] = ['q', 'ü', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'ö', 'ğ'];
  protected line2: string[] = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ı', 'ə'];
  protected line3: string[] = ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ç', 'ş'];
}