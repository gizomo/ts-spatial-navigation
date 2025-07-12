import {AvailableLanguageLayouts, type Size, SystemKeys} from '../index';
import AbstractKeyboardLayout, {type Key} from './abstract-layout';

export default class ArmenianLayout extends AbstractKeyboardLayout {
  protected readonly linesCount: number = 5;

  protected language: string = AvailableLanguageLayouts.HY;
  protected line1: string[] = ['ձ', 'յ', 'օ', 'ռ', 'ժ'];
  protected line2: string[] = ['խ', 'ւ', 'է', 'ր', 'տ', 'ե', 'ը', 'ի', 'ո', 'պ', 'չ', 'ջ'];
  protected line3: string[] = ['ա', 'ս', 'դ', 'ֆ', 'ք', 'հ', 'ճ', 'կ', 'լ', 'թ', 'փ'];
  private line4: string[] = ['զ', 'ց', 'գ', 'վ', 'բ', 'ն', 'մ', 'շ', 'ղ', 'ծ'];

  public getKeys(): Key[] {
    const keySize: Size = {
      width: this.keySize.width + this.gap,
      height: this.keySize.height + this.gap,
    };
    const keys: Key[] = [];
    const systemKeys: Key[] = [];

    const lineOffset: number = this.layoutSize.width - (6 * keySize.width - this.gap);
    const top: number = 4 * keySize.height;
    systemKeys.push(this.getBottomSystemKey(SystemKeys.LANGUAGE, top, lineOffset));
    systemKeys.push(this.getBottomSystemKey(SystemKeys.SPACE, top, lineOffset + keySize.width * 2));
    systemKeys.push(this.getBottomSystemKey(SystemKeys.ENTER, top, lineOffset + keySize.width * 4));

    this.handleLine(this.getLine1(), 0, keySize, keys, systemKeys);
    this.handleLine(this.getLine2(), 1, keySize, keys, systemKeys);
    this.handleLine(this.getLine3(), 2, keySize, keys, systemKeys);
    this.handleLine(this.getLine4(), 3, keySize, keys, systemKeys);

    return systemKeys.concat(keys);
  }

  protected getLineOffset(_index: number, length: number, keyWidth: number): number {
    return this.layoutSize.width - ((length + 2) * keyWidth - this.gap);
  }

  protected getRightSystemKey(lineIndex: number, keyIndex: number, {width, height}: Size, lineOffset: number): Key {
    let key: string;

    if (0 === lineIndex) {
      key = SystemKeys.BACKSPACE;
    }

    if (1 === lineIndex) {
      key = SystemKeys.CLEAR;
    }

    if (2 === lineIndex) {
      if (this.capsLockMode) {
        key = SystemKeys.CAPSLOCK;
      } else if (this.shiftMode) {
        key = SystemKeys.SHIFT_ACTIVE;
      } else {
        key = SystemKeys.SHIFT;
      }
    }

    if (3 === lineIndex) {
      if (this.numbersMode) {
        key = SystemKeys.CHARS;
      } else {
        key = SystemKeys.NUMBERS;
      }
    }

    const left: number = lineOffset + keyIndex * width;

    return {
      key,
      type: 'system',
      top: lineIndex * height,
      left,
      row: lineIndex,
      ...this.getKeySize('system'),
    };
  }

  protected getLine1(): string[] {
    if (this.numbersMode || this.specialCharsMode) {
      return this.getNumbers();
    }

    if (this.shiftMode) {
      return ['Ձ', 'Յ', 'և', 'Օ', 'Ռ', 'Ժ'];
    }

    return this.line1;
  }

  private getLine4(): string[] {
    if (this.specialCharsMode) {
      return this.getCharsLine2Extended();
    }

    if (this.numbersMode) {
      return this.getCharsLine3();
    }

    return this.handleChars(this.line4);
  }

  protected getCharsLine1(): string[] {
    return ['-', '/', ':', ';', '(', ')', '$', '&', '@', '՞'];
  }

  protected getCharsLine2(): string[] {
    return ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='];
  }

  private getCharsLine3(): string[] {
    return ['_', '\\', '|', '~', '<', '>', '.', ',', '?', '!', '\''];
  }
}