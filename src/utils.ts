function isCollection(selector: HTMLElement | HTMLCollectionOf<HTMLElement>): selector is HTMLCollectionOf<HTMLElement> {
  return selector.hasOwnProperty('length');
}

function isElement(selector: any | HTMLElement): selector is HTMLElement {
  return selector.hasOwnProperty('nodeType') && 1 === selector.nodeType;
}

export function selectElements(selector?: string | HTMLElement | HTMLCollectionOf<HTMLElement>): HTMLElement[] | undefined {
  try {
    if (selector) {
      if ('string' === typeof selector) {
        return [].slice.call(document.querySelectorAll(selector));
      } else if (isCollection(selector)) {
        return [].slice.call(selector);
      } else if (isElement(selector)) {
        return [selector as HTMLElement];
      }
    }
  } catch (err: any) {
    console.error(err);
  }
}

export function fireEvent(element: HTMLElement, type: string, detail?: any, cancelable: boolean = true, eventPrefix: string = 'sn:'): boolean {
  return element.dispatchEvent(new CustomEvent(eventPrefix + type, {detail, cancelable}));
}

export const KeyMapping: Readonly<Record<number, string>> = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
} as const;

export function getDirection(event: KeyboardEvent): (typeof KeyMapping)[keyof typeof KeyMapping] {
  if (event.keyCode) {
    return KeyMapping[event.keyCode];
  }

  switch (event.code) {
    case 'ArrowUp':
      return KeyMapping[38];
    case 'ArrowDown':
      return KeyMapping[40];
    case 'ArrowLeft':
      return KeyMapping[37];
    case 'ArrowRight':
      return KeyMapping[39];
    default:
      return;
  }
}

export function isEnter(event: KeyboardEvent): boolean {
  if (event.keyCode) {
    return 13 === event.keyCode;
  }

  return 'Enter' === event.code;
}

export function exclude<T>(items: T[], excluded: T | T[]): T[] {
  if (!Array.isArray(excluded)) {
    excluded = [excluded];
  }

  for (let i: number = 0, index: number; i < excluded.length; i++) {
    index = items.indexOf(excluded[i]);

    if (index >= 0) {
      items.splice(index, 1);
    }
  }

  return items;
}
