import ElementRect from './element-rect';
import NavSection from './nav-section';
import {bind} from 'helpful-decorators';
import {exclude, fireEvent, getDirection, isEnter, selectElements} from './utils';
import type {
  Direction,
  ExtendedSelector,
  GroupPriorityType,
  IElementRect,
  INavSection,
  INavigationConfig,
  KebabToSnake,
  NavConfig,
  Restrict,
} from './types';

export const RESTRICT: Readonly<Record<Uppercase<KebabToSnake<Restrict>>, Restrict>> = {
  SELF_ONLY: 'self-only',
  SELF_FIRST: 'self-first',
} as const;

export const DIRECTION: Readonly<Record<Uppercase<Direction>, Direction>> = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

export const REVERSE: Readonly<Record<Direction, Direction>> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
} as const;

const ID_POOL_PREFIX: string = 'section-';

export default class Navigator {
  public static config: Required<INavigationConfig> = {
    selector: '',
    straightOnly: false,
    straightOverlapThreshold: 0.5,
    rememberSource: true,
    priority: '',
    leaveFor: null,
    restrict: RESTRICT.SELF_FIRST,
    tabIndexIgnoreList: 'a, input, select, textarea, button, iframe, [contentEditable=true]',
    onFocus: null,
    onBlur: null,
    navigableFilter: null,
  };

  private ready: boolean = false;
  private paused: boolean = false;
  private duringFocusChange: boolean = false;

  private sections: Record<string, INavSection> = {};
  private sectionCount: number = 0;
  private sectionsIdPool: number = 0;
  private defaultSectionId: string = '';
  private lastSectionId: string = '';

  private generateId(): string {
    let id: string;

    while (true) {
      id = ID_POOL_PREFIX + String(++this.sectionsIdPool);

      if (!this.sections[id]) {
        break;
      }
    }

    return id;
  }

  private getSectionId(element: HTMLElement): string {
    for (const id in this.sections) {
      if (!this.sections[id].isDisabled() && this.sections[id].match(element)) {
        return id;
      }
    }
  }

  public init(): this {
    if (!this.ready) {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('focus', this.onFocus, true);
      window.addEventListener('blur', this.onBlur, true);
      this.ready = true;
    }

    return this;
  }

  public uninit(): this {
    window.removeEventListener('blur', this.onBlur, true);
    window.removeEventListener('focus', this.onFocus, true);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('keydown', this.onKeyDown);
    this.clear();
    this.sectionsIdPool = 0;
    this.ready = false;

    return this;
  }

  public clear(): void {
    this.sections = {};
    this.sectionCount = 0;
    this.defaultSectionId = '';
    this.lastSectionId = '';
    this.duringFocusChange = false;
  }

  public setConfig(config: NavConfig, sectionId?: string): this {
    for (const key in config) {
      if (Navigator.config[key] !== undefined) {
        if (sectionId) {
          this.sections[sectionId][key] = config[key];
        } else if (config[key] !== undefined) {
          Navigator.config[key] = config[key];
        }
      }
    }

    return this;
  }

  public addSection(config: NavConfig, sectionId?: string): INavSection {
    if (!sectionId) {
      sectionId = 'string' === typeof config.id ? config.id : this.generateId();
    }

    if (this.sections[sectionId]) {
      throw new Error('Section "' + sectionId + '" has already existed!');
    }

    this.sections[sectionId] = new NavSection(this, config, sectionId);
    this.sectionCount++;

    return this.sections[sectionId];
  }

  public getSection(sectionId: string): INavSection {
    return this.sections[sectionId];
  }

  public getLastSection(): INavSection {
    return this.getSection(this.lastSectionId);
  }

  public findSection(element: Element): INavSection {
    return this.sections[this.getSectionId(element as HTMLElement)];
  }

  public removeSection(section: INavSection): boolean {
    return this.removeSectionById(section.getId());
  }

  public removeSectionById(id: string): boolean {
    if (!id || typeof id !== 'string') {
      throw new Error('Please assign the "sectionId"!');
    }

    if (this.sections[id]) {
      delete this.sections[id];
      this.sectionCount--;

      if (this.lastSectionId === id) {
        this.lastSectionId = '';
      }

      return true;
    }

    return false;
  }

  public disableSection(id: string): boolean {
    if (this.sections[id]) {
      this.sections[id].disable();
      return true;
    }

    return false;
  }

  public enableSection(id: string): boolean {
    if (this.sections[id]) {
      this.sections[id].enable();
      return true;
    }

    return false;
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  /**
   * focus([silent])
   * focus([sectionId], [silent])
   * focus([extSelector], [silent])
   *
   * @returns boolean
   * @param firstArg string | boolean
   * @param secondArg boolean
   */
  public focus(firstArg?: string | boolean, secondArg?: boolean): boolean {
    let result: boolean = false;

    if (undefined === secondArg && 'boolean' === typeof firstArg) {
      secondArg = firstArg;
      firstArg = undefined;
    }

    const autoPause: boolean = !this.paused && secondArg;

    if (autoPause) {
      this.pause();
    }

    if (!firstArg) {
      result = this.focusSection();
    } else if ('string' === typeof firstArg) {
      if (this.sections[firstArg]) {
        result = this.focusSection(firstArg);
      } else {
        result = this.focusExtendedSelector(firstArg);
      }
    }

    if (autoPause) {
      this.resume();
    }

    return result;
  }

  public move(direction: Direction, selector?: string): boolean {
    if (!REVERSE[direction.toLowerCase()]) {
      return false;
    }

    const element: HTMLElement = selector ? selectElements(selector)[0] : this.getFocusedElement();

    if (!element) {
      return false;
    }

    const sectionId: string = this.getSectionId(element);

    if (!sectionId) {
      return false;
    }

    if (!fireEvent(element, 'will-move', {direction, sectionId, cause: 'api'})) {
      return false;
    }

    return this.focusNext(direction, element, sectionId);
  }

  public makeFocusable(sectionId?: string): void {
    if (sectionId) {
      if (this.sections[sectionId]) {
        this.sections[sectionId].makeFocusable();
      } else {
        throw new Error('Section "' + sectionId + '" doesn\'t exist!');
      }
    } else {
      for (const id in this.sections) {
        this.sections[id].makeFocusable();
      }
    }
  }

  public setDefaultSection(id: string): void {
    if (!id) {
      this.defaultSectionId = '';
    } else if (!this.sections[id]) {
      throw new Error('Section "' + id + '" doesn\'t exist!');
    } else {
      this.defaultSectionId = id;
    }
  }

  /**
   * Given a set of {@link IElementRect} array, divide them into 9 groups with
   * respect to the position of targetRect. Rects centered inside targetRect
   * are grouped as 4th group; straight left as 3rd group; straight right as
   * 5th group; ..... and so on. See below for the corresponding group number:
   *
   * ```
   *  |---|---|---|
   *  | 0 | 1 | 2 |
   *  |---|---|---|
   *  | 3 | 4 | 5 |
   *  |---|---|---|
   *  | 6 | 7 | 8 |
   *  |---|---|---|
   * ```
   *
   * @param {Array.<IElementRect>} rects to be divided.
   * @param {DOMRectReadOnly} targetRect reference position for groups.
   * @param threshold = 0.5
   *
   * @return {Array.Array.<IElementRect>} 9-cells matrix, where rects are grouped into these 9 cells by their position relative to the targetRect position.
   */
  private partition(rects: IElementRect[], { width, height, top, bottom, left, right }: DOMRectReadOnly, threshold: number = 0.5): IElementRect[][] {
    const groups: IElementRect[][] = [[], [], [], [], [], [], [], [], []];
    const rightEdge: number = right - width * threshold;
    const leftEdge: number = left + width * threshold;
    const bottomEdge: number = bottom - height * threshold;
    const topEdge: number = top + height * threshold;

    rects.forEach((rect: IElementRect) => {
      const x: number = rect.center.x < left ? 0 : rect.center.x <= right ? 1 : 2;
      const y: number = rect.center.y < top ? 0 : rect.center.y <= bottom ? 1 : 2;
      const groupId: number = y * 3 + x;

      groups[groupId].push(rect);

      if ([0, 2, 6, 8].indexOf(groupId) !== -1) {
        if (rect.left <= rightEdge) {
          if (2 === groupId) {
            groups[1].push(rect);
          } else if (8 === groupId) {
            groups[7].push(rect);
          }
        }

        if (rect.right >= leftEdge) {
          if (0 === groupId) {
            groups[1].push(rect);
          } else if (6 === groupId) {
            groups[7].push(rect);
          }
        }

        if (rect.top <= bottomEdge) {
          if (6 === groupId) {
            groups[3].push(rect);
          } else if (8 === groupId) {
            groups[5].push(rect);
          }
        }

        if (rect.bottom >= topEdge) {
          if (0 === groupId) {
            groups[3].push(rect);
          } else if (2 === groupId) {
            groups[5].push(rect);
          }
        }
      }
    });

    return groups;
  }

  private definePriorities(
    targetRect: IElementRect,
    direction: Direction,
    groups: IElementRect[][],
    internalGroups: IElementRect[][],
    straightOnly: boolean = false,
  ): (GroupPriorityType | undefined)[] {
    switch (direction) {
      case DIRECTION.LEFT:
        return [
          {
            group: internalGroups[0].concat(internalGroups[3]).concat(internalGroups[6]),
            distanceMeters: [targetRect.nearPlumbLineIsBetter, targetRect.topIsBetter],
          },
          {
            group: groups[3],
            distanceMeters: [targetRect.nearPlumbLineIsBetter, targetRect.topIsBetter],
          },
          straightOnly
            ? undefined
            : {
              group: groups[0].concat(groups[6]),
              distanceMeters: [
                targetRect.nearHorizonIsBetter,
                targetRect.rightIsBetter,
                targetRect.nearTargetTopIsBetter,
              ],
            },
        ];
      case DIRECTION.RIGHT:
        return [
          {
            group: internalGroups[2].concat(internalGroups[5]).concat(internalGroups[8]),
            distanceMeters: [targetRect.nearPlumbLineIsBetter, targetRect.topIsBetter],
          },
          {
            group: groups[5],
            distanceMeters: [targetRect.nearPlumbLineIsBetter, targetRect.topIsBetter],
          },
          straightOnly
            ? undefined
            : {
              group: groups[2].concat(groups[8]),
              distanceMeters: [
                targetRect.nearHorizonIsBetter,
                targetRect.leftIsBetter,
                targetRect.nearTargetTopIsBetter,
              ],
            },
        ];
      case DIRECTION.UP:
        return [
          {
            group: internalGroups[0].concat(internalGroups[1]).concat(internalGroups[2]),
            distanceMeters: [targetRect.nearHorizonIsBetter, targetRect.leftIsBetter],
          },
          {
            group: groups[1],
            distanceMeters: [targetRect.nearHorizonIsBetter, targetRect.leftIsBetter],
          },
          straightOnly
            ? undefined
            : {
              group: groups[0].concat(groups[2]),
              distanceMeters: [
                targetRect.nearPlumbLineIsBetter,
                targetRect.bottomIsBetter,
                targetRect.nearTargetLeftIsBetter,
              ],
            },
        ];
      case DIRECTION.DOWN:
        return [
          {
            group: internalGroups[6].concat(internalGroups[7]).concat(internalGroups[8]),
            distanceMeters: [targetRect.nearHorizonIsBetter, targetRect.leftIsBetter],
          },
          {
            group: groups[7],
            distanceMeters: [targetRect.nearHorizonIsBetter, targetRect.leftIsBetter],
          },
          straightOnly
            ? undefined
            : {
              group: groups[6].concat(groups[8]),
              distanceMeters: [
                targetRect.nearPlumbLineIsBetter,
                targetRect.topIsBetter,
                targetRect.nearTargetLeftIsBetter,
              ],
            },
        ];
      default:
        return [];
    }
  }

  private prioritize(priorities: (GroupPriorityType | undefined)[]): IElementRect[] {
    let destinationPriority: GroupPriorityType;

    for (const priority of priorities) {
      if (priority && priority.group.length) {
        destinationPriority = priority;
        break;
      }
    }

    if (!destinationPriority) {
      return;
    }

    destinationPriority.group.sort((a: IElementRect, b: IElementRect) => {
      for (const distanceTo of destinationPriority.distanceMeters) {
        const delta: number = distanceTo(a) - distanceTo(b);

        if (delta) {
          return delta;
        }
      }

      return 0;
    });

    return destinationPriority.group;
  }

  private navigate(
    target: HTMLElement,
    direction: Direction,
    candidates: HTMLElement[],
    config: NavConfig = Navigator.config,
  ): HTMLElement {
    if (!target || !direction || !candidates || !candidates.length) {
      return;
    }

    const targetRect: IElementRect = new ElementRect(target);
    const candidatesRects: IElementRect[] = candidates.map((candidate: HTMLElement) => new ElementRect(candidate));

    const groups: IElementRect[][] = this.partition(candidatesRects, targetRect, config.straightOverlapThreshold);
    const internalGroups: IElementRect[][] = this.partition(groups[4], targetRect.center, config.straightOverlapThreshold);

    const destinationGroup: IElementRect[] = this.prioritize(
      this.definePriorities(targetRect, direction, groups, internalGroups, config.straightOnly),
    );

    if (!destinationGroup) {
      return;
    }

    let destination: HTMLElement;

    if (
      config.rememberSource &&
      config.previousFocus &&
      config.previousFocus.destination === target &&
      config.previousFocus.reverse === direction
    ) {
      for (const rect of destinationGroup) {
        if (rect.element === config.previousFocus.target) {
          destination = rect.element;
          break;
        }
      }
    }

    return destination ?? destinationGroup[0].element;
  }

  public getFocusedElement(): HTMLElement {
    if (window.document.activeElement && window.document.activeElement !== window.document.body) {
      return window.document.activeElement as HTMLElement;
    }
  }

  public focusElement(element: HTMLElement, sectionId: string, direction?: Direction): boolean {
    if (!element) {
      return false;
    }

    const focusedElement: HTMLElement = this.getFocusedElement();

    const silentFocus = (): void => {
      if (focusedElement) {
        focusedElement.blur();
        this.beforeFocusChanged(focusedElement, sectionId);
      }

      this.smartFocus(element);
      this.focusChanged(element, sectionId);
    };

    if (this.duringFocusChange) {
      silentFocus();
      return true;
    }

    this.duringFocusChange = true;

    if (this.paused) {
      silentFocus();
      this.duringFocusChange = false;
      return true;
    }

    if (focusedElement) {
      const unfocusProperties: Record<string, any> = {
        nextElement: element,
        nextSectionId: sectionId,
        direction,
        native: false,
      };

      if (!fireEvent(focusedElement, 'will-unfocus', unfocusProperties)) {
        this.duringFocusChange = false;
        return false;
      }

      focusedElement.blur();
      this.beforeFocusChanged(focusedElement, sectionId);
      fireEvent(focusedElement, 'unfocused', unfocusProperties, false);
    }

    const focusProperties: Record<string, any> = {
      previousElement: focusedElement,
      sectionId,
      direction,
      native: false,
    };

    if (!fireEvent(element, 'will-focus', focusProperties)) {
      this.duringFocusChange = false;
      return false;
    }

    this.smartFocus(element);
    fireEvent(element, 'focused', focusProperties, false);
    this.duringFocusChange = false;
    this.focusChanged(element, sectionId);

    return true;
  }

  private beforeFocusChanged(focusedElement: HTMLElement, nextSectionId?: string): void {
    if (focusedElement) {
      const sectionId: string = this.getSectionId(focusedElement);

      if (sectionId && sectionId !== nextSectionId) {
        this.sections[sectionId].onBlur?.();
      }
    }
  }

  private focusChanged(element: HTMLElement, sectionId?: string): void {
    if (!sectionId) {
      sectionId = this.getSectionId(element);
    }

    if (sectionId) {
      this.sections[sectionId].lastFocusedElement = element;

      if (this.lastSectionId !== sectionId) {
        this.sections[this.lastSectionId]?.onBlur?.();
        this.sections[sectionId].onFocus?.();
      }

      this.lastSectionId = sectionId;
    }
  }

  public focusExtendedSelector(selector: ExtendedSelector, direction?: Direction): boolean {
    if ('string' === typeof selector && '@' === selector.charAt(0)) {
      return 1 === selector.length ? this.focusSection() : this.focusSection(selector.substring(1));
    } else {
      const element: HTMLElement = selectElements(selector)[0];

      if (element) {
        const sectionId: string = this.getSectionId(element);

        if (sectionId && this.sections[sectionId].isNavigable(element)) {
          return this.focusElement(element, sectionId, direction);
        }
      }
    }

    return false;
  }

  private focusSection(sectionId?: string): boolean {
    const range: string[] = [];
    const addRange: (id: string) => void = (id: string) => {
      if (id && (-1 === range.indexOf(id)) && this.sections[id] && !this.sections[id].isDisabled()) {
        range.push(id);
      }
    };

    if (sectionId) {
      addRange(sectionId);
    } else {
      if (this.defaultSectionId) {
        addRange(this.defaultSectionId);
      }

      if (this.lastSectionId) {
        addRange(this.lastSectionId);
      }

      if (this.sectionCount > 0) {
        Object.keys(this.sections).map(addRange);
      }
    }

    for (const id of range) {
      if (this.sections[id].focus()) {
        return true;
      }
    }

    return false;
  }

  private fireNavigateFailed(element: HTMLElement, direction: Direction): false {
    fireEvent(element, 'navigate-failed', {direction}, false);
    return false;
  }

  public focusNext(direction: Direction, focusedElement: HTMLElement, currentSectionId: string): boolean {
    const extSelector: string = focusedElement.getAttribute('data-sn-' + direction);

    if ('string' === typeof extSelector) {
      if ('' === extSelector || !this.focusExtendedSelector(extSelector, direction)) {
        return this.fireNavigateFailed(focusedElement, direction);
      }

      return true;
    }

    const sectionsNavigableElements: Record<string, HTMLElement[]> = {};
    let allNavigableElements: HTMLElement[] = [];

    for (const id in this.sections) {
      sectionsNavigableElements[id] = this.sections[id].getNavigableElements();

      if (sectionsNavigableElements[id].length) {
        allNavigableElements = allNavigableElements.concat(sectionsNavigableElements[id]);
      }
    }

    let nextElement: HTMLElement;
    const config: NavConfig = Object.assign({}, Navigator.config, this.sections[currentSectionId]);

    if (config.restrict === RESTRICT.SELF_ONLY || config.restrict === RESTRICT.SELF_FIRST) {
      const currentSectionNavigableElements: HTMLElement[] = sectionsNavigableElements[currentSectionId];

      nextElement = this.navigate(
        focusedElement,
        direction,
        exclude(currentSectionNavigableElements, focusedElement),
        config,
      );

      if (!nextElement && config.restrict === RESTRICT.SELF_FIRST) {
        nextElement = this.navigate(
          focusedElement,
          direction,
          exclude(allNavigableElements, currentSectionNavigableElements),
          config,
        );
      }
    } else {
      nextElement = this.navigate(focusedElement, direction, exclude(allNavigableElements, focusedElement), config);
    }

    if (nextElement) {
      this.sections[currentSectionId].savePreviousFocus(focusedElement, nextElement, REVERSE[direction]);

      const nextSectionId: string = this.getSectionId(nextElement);

      if (currentSectionId !== nextSectionId) {
        const result: boolean | undefined = this.sections[currentSectionId].gotoLeaveFor(direction);

        if (result) {
          return true;
        } else if (undefined === result) {
          return this.fireNavigateFailed(focusedElement, direction);
        }

        const enterToElement: HTMLElement = this.sections[nextSectionId].getPrimaryElement();

        if (enterToElement) {
          nextElement = enterToElement;
        }
      }

      return this.focusElement(nextElement, nextSectionId, direction);
    } else if (this.sections[currentSectionId].gotoLeaveFor(direction)) {
      return true;
    }

    return this.fireNavigateFailed(focusedElement, direction);
  }

  @bind
  private onKeyDown(event: KeyboardEvent): boolean {
    if (!this.sectionCount || this.paused || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    let focusedElement: HTMLElement;

    const preventDefault: () => false = () => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    const direction: Direction = getDirection(event) as Direction;

    if (!direction) {
      if (isEnter(event)) {
        focusedElement = this.getFocusedElement();

        if (focusedElement && this.getSectionId(focusedElement)) {
          if (!fireEvent(focusedElement, 'enter-down')) {
            return preventDefault();
          }
        }
      }

      return;
    }

    focusedElement = this.getFocusedElement();

    if (!focusedElement) {
      if (this.lastSectionId) {
        focusedElement = this.sections[this.lastSectionId].getLastFocusedElement();
      }

      if (!focusedElement) {
        this.focusSection();
        return preventDefault();
      }
    }

    const sectionId: string = this.getSectionId(focusedElement);

    if (!sectionId) {
      return;
    }

    if (fireEvent(focusedElement, 'will-move', {direction, sectionId, cause: 'keydown'})) {
      this.focusNext(direction, focusedElement, sectionId);
    }

    return preventDefault();
  }

  @bind
  private onKeyUp(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    if (!this.paused && this.sectionCount && isEnter(event)) {
      const focusedElement: HTMLElement = this.getFocusedElement();

      if (focusedElement && this.getSectionId(focusedElement)) {
        if (!fireEvent(focusedElement, 'enter-up')) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    }
  }

  @bind
  private onFocus({target}: FocusEvent): void {
    if (target === window || target === document) {
      if (this.ready && !this.paused && this.sectionCount) {
        this.focus();
        return;
      }
    }

    if (target !== window && target !== document && this.sectionCount && !this.duringFocusChange) {
      const sectionId: string = this.getSectionId(target as HTMLElement);

      if (sectionId) {
        if (this.paused) {
          this.focusChanged(target as HTMLElement, sectionId);
          return;
        }

        if (!fireEvent(target as HTMLElement, 'will-focus', {sectionId, native: true})) {
          this.duringFocusChange = true;
          (target as HTMLElement).blur();
          this.duringFocusChange = false;
        } else {
          fireEvent(target as HTMLElement, 'focused', {sectionId, native: true}, false);
          this.focusChanged(target as HTMLElement, sectionId);
        }
      }
    }
  }

  @bind
  private onBlur({target}: FocusEvent): void {
    if (target === window || target === document) {
      return;
    }

    const sectionId: string = this.getSectionId(target as HTMLElement);

    if (!this.paused && this.sectionCount && !this.duringFocusChange && sectionId) {
      if (!fireEvent(target as HTMLElement, 'will-unfocus', {native: true})) {
        this.duringFocusChange = true;
        setTimeout(() => {
          this.smartFocus(target as HTMLElement);
          this.duringFocusChange = false;
        });
      } else {
        fireEvent(target as HTMLElement, 'unfocused', {native: true}, false);
      }
    }
  }

  private smartFocus(element: HTMLElement): void {
    if (!element) {
      return;
    }

    if (element.classList.contains('non-scrollable')) {
      /**
       * Hotfix disable scroll on focusing elements out of visible area
       */
      window.requestAnimationFrame(() => element.focus());
    } else {
      element.focus();
    }
  }
}
