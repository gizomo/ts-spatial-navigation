import type {KeyboardLayout, Size} from '../index';
import {SystemKeys} from '../index';

export type KeyboardLayoutParams = {
  size?: Size,
  gap?: number,
  language?: string,
};

export type KeyType = 'key' | 'system';

export type Key = Size & {
  key: string,
  type: KeyType,
  top: number,
  left: number,
  row: number,
};

export default abstract class AbstractKeyboardLayout implements KeyboardLayout {
  protected readonly linesCount: number = 4;
  protected readonly defaultKeySize: Size = {width: 72, height: 64};
  protected readonly defaultGap: number = 4;
  protected readonly maxKeysPerLine: number = 14;

  protected shiftMode: boolean = false;
  protected capsLockMode: boolean = false;
  protected specialCharsMode: boolean = false;
  protected numbersMode: boolean = false;
  protected keySize: Size;
  protected layoutSize: Size;
  protected gap: number;

  constructor(params: KeyboardLayoutParams) {
    if (params) {
      this.gap = params.gap ?? this.defaultGap;
      this.keySize = this.calcKeySize(params.size);
      this.layoutSize = this.calcLayoutSize(params.size);
    }
  }

  public isNumbersMode(): boolean {
    return this.numbersMode;
  }

  public isSpecialMode(): boolean {
    return this.specialCharsMode;
  }

  public isShiftMode(): boolean {
    return this.shiftMode;
  }

  public isCapsLockMode(): boolean {
    return this.capsLockMode;
  }

  public toggleSpecialMode(): void {
    this.specialCharsMode = !this.specialCharsMode;
  }

  public toggleNumbersMode(): void {
    this.numbersMode = !this.numbersMode;

    if (!this.numbersMode) {
      this.specialCharsMode = false;
    }
  }

  public toggleShiftMode(): void {
    if (this.capsLockMode) {
      this.disableShiftMode();
    } else if (this.shiftMode) {
      this.capsLockMode = true;
    } else {
      this.shiftMode = true;
    }
  }

  public disableShiftMode(): void {
    this.shiftMode = false;
    this.capsLockMode = false;
  }

  public getLanguage(): string {
    return this.language;
  }

  public getSize(): Size {
    return this.layoutSize;
  }

  public getRowsCount(): number {
    return this.linesCount;
  }

  public getCharSize(): number {
    const height: number = Math.round(this.keySize.height / 2);

    if (height <= 23) {
      return 20;
    }

    if (height <= 26) {
      return 24;
    }

    if (height <= 30) {
      return 28;
    }

    if (height > 30) {
      return 32;
    }
  }

  private calcLayoutSize(size: Partial<Size>): Size {
    const width: number = this.maxKeysPerLine * (this.keySize.width + this.gap) - this.gap;
    const height: number = 5 * (this.keySize.height + this.gap) - this.gap;

    if (size) {
      return {
        height: size.height < height ? height : size.height,
        width: size.width < width ? width : size.width,
      };
    }

    return {height, width};
  }

  protected calcKeySize(size: Partial<Size>): Size {
    if (size) {
      const heightDelta: number = 0;
      let widthDelta: number = 0;

      if (size.width) {
        const totalWidth: number = size.width + this.gap;
        const defaultKeyWidth: number = this.defaultKeySize.width + this.gap;
        const maxDefaultWidth: number = defaultKeyWidth * this.maxKeysPerLine;

        if (maxDefaultWidth > totalWidth) {
          return this.calcKeySizeByWidth(totalWidth);
        } else {
          widthDelta = totalWidth - maxDefaultWidth;
        }
      }

      if (widthDelta || heightDelta) {
        if (widthDelta > heightDelta) {
          return this.calcKeySizeByWidth(size.width + this.gap);
        } else {
          return this.calcKeySizeByHeight(size.height + this.gap);
        }
      }
    }

    return this.defaultKeySize;
  }

  protected calcKeySizeByHeight(total: number): Size {
    const height: number = total / this.linesCount - this.gap;
    const width: number = height * 1.125;

    return {height, width};
  }

  protected calcKeySizeByWidth(total: number): Size {
    const width: number = total / this.maxKeysPerLine - this.gap;
    const height: number = width / 1.125;

    return {height, width};
  }

  protected getKeySize(type: KeyType): Size {
    switch (type) {
      case 'key':
        return this.keySize;
      case 'system':
        return {
          width: this.keySize.width * 2 + this.gap,
          height: this.keySize.height,
        };
    }
  }

  public getKeys(): Key[] {
    const keySize: Size = {
      width: this.keySize.width + this.gap,
      height: this.keySize.height + this.gap,
    };
    const topOffset: number = (this.layoutSize.height - keySize.height * this.linesCount) / 2;
    const keys: Key[] = [];
    const systemKeys: Key[] = [];

    const lineOffset: number = this.layoutSize.width - (8 * keySize.width - this.gap);
    const top: number = topOffset + 3 * keySize.height;
    systemKeys.push(this.getBottomSystemKey(SystemKeys.LANGUAGE, top, lineOffset));
    systemKeys.push(this.getBottomSystemKey(SystemKeys.SPACE, top, lineOffset + keySize.width * 2));
    systemKeys.push(this.getBottomSystemKey(this.numbersMode ? SystemKeys.CHARS : SystemKeys.NUMBERS, top, lineOffset + keySize.width * 4));
    systemKeys.push(this.getBottomSystemKey(SystemKeys.ENTER, top, lineOffset + keySize.width * 6));

    this.handleLine(this.getLine1(), 0, keySize, keys, systemKeys, topOffset);
    this.handleLine(this.getLine2(), 1, keySize, keys, systemKeys, topOffset);
    this.handleLine(this.getLine3(), 2, keySize, keys, systemKeys, topOffset);

    return systemKeys.concat(keys);
  }

  protected handleLine(line: string[], lineIndex: number, {width, height}: Size, keys: Key[], systemKeys: Key[], topOffset: number = 0): void {
    const lineOffset: number = this.getLineOffset(lineIndex, line.length, width);

    if (line.length) {
      line.forEach((key: string, keyIndex: number) => keys.push({
        key,
        type: 'key',
        top: topOffset + lineIndex * height,
        left: lineOffset + keyIndex * width,
        row: lineIndex,
        ...this.getKeySize('key'),
      }));
    }

    const rightSystemKey: Key = this.getRightSystemKey(lineIndex, line.length, {width, height}, lineOffset, topOffset);

    if (rightSystemKey) {
      systemKeys.push(rightSystemKey);
    }
  }

  protected getLineOffset(_index: number, length: number, keyWidth: number): number {
    return this.layoutSize.width - ((length + 2) * keyWidth - this.gap);
  }

  protected getRightSystemKey(lineIndex: number, keyIndex: number, {width, height}: Size, lineOffset: number, topOffset: number = 0): Key {
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
      } else if (this.specialCharsMode) {
        key = SystemKeys.NUMBERS;
      } else if (this.numbersMode) {
        key = SystemKeys.EXTENDED;
      } else {
        key = SystemKeys.SHIFT;
      }
    }

    const left: number = lineOffset + keyIndex * width;

    return {
      key,
      type: 'system',
      top: topOffset + lineIndex * height,
      left,
      row: lineIndex,
      ...this.getKeySize('system'),
    };
  }

  protected getBottomSystemKey(key: SystemKeys, top: number, left: number): Key {
    return {
      key,
      type: 'system',
      left,
      top,
      row: this.linesCount - 1,
      ...this.getKeySize('system'),
    };
  }

  protected handleChars(chars: string[]): string[] {
    if (this.shiftMode) {
      return chars.map((char: string) => char.toUpperCase());
    }

    return chars;
  }

  protected getNumbers(): string[] {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  }

  protected getCharsLine1(): string[] {
    return ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'];
  }

  protected getCharsLine2(): string[] {
    return ['.', ',', '?', '!', '\''];
  }

  protected getCharsLine1Extended(): string[] {
    return ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='];
  }

  protected getCharsLine2Extended(): string[] {
    return ['_', '\\', '|', '~', '<', '>'];
  }

  protected getLine1(): string[] {
    if (this.numbersMode || this.specialCharsMode) {
      return this.getNumbers();
    }

    return this.handleChars(this.line1);
  }

  protected getLine2(): string[] {
    if (this.specialCharsMode) {
      return this.getCharsLine1Extended();
    }

    if (this.numbersMode) {
      return this.getCharsLine1();
    }

    return this.handleChars(this.line2);
  }

  protected getLine3(): string[] {
    if (this.specialCharsMode) {
      return this.getCharsLine2Extended();
    }

    if (this.numbersMode) {
      return this.getCharsLine2();
    }

    return this.handleChars(this.line3);
  }

  protected abstract language: string;
  protected abstract line1: string[];
  protected abstract line2: string[];
  protected abstract line3: string[];
}
