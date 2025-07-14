export type KebabToSnake<T extends string, A extends string = ""> = T extends `${infer L}-${infer R}`
  ? KebabToSnake<R, `${A}${L}_`>
  : `${A}${T}`;

export type Direction = 'down' | 'left' | 'right' | 'up';

export type Restrict = 'self-only' | 'self-first';

export type ExtendedSelector = string | HTMLElement | HTMLCollectionOf<HTMLElement>;

export type LeaveForType = Partial<Record<Direction, ExtendedSelector | (() => ExtendedSelector)>>;

export type ElementDistanceHandler = (rect: IElementRect) => number;

export type PreviousFocus = {
  target: HTMLElement,
  destination: HTMLElement,
  reverse: Direction,
};

export type GroupPriorityType = {
  group: IElementRect[],
  distanceMeters: ElementDistanceHandler[],
};

export interface IElementRect extends DOMRectReadOnly {
  readonly element: HTMLElement;
  readonly center: DOMRectReadOnly;
  nearPlumbLineIsBetter: ElementDistanceHandler;
  nearHorizonIsBetter: ElementDistanceHandler;
  nearTargetLeftIsBetter: ElementDistanceHandler;
  nearTargetTopIsBetter: ElementDistanceHandler;
  topIsBetter: ElementDistanceHandler;
  bottomIsBetter: ElementDistanceHandler;
  leftIsBetter: ElementDistanceHandler;
  rightIsBetter: ElementDistanceHandler;
}

export interface INavigationConfig {
  selector?: ExtendedSelector;
  straightOnly?: boolean; // Only elements in the straight (vertical or horizontal) direction will be navigated
  straightOverlapThreshold?: number; // This threshold is used to determine whether an element is considered in the straight (vertical or horizontal) directions. Valid number is between 0 and 1.0.
  rememberSource?: boolean; // The previously focused element will have higher priority to be chosen as the next candidate
  priority?: 'last-focused' | 'default-element' | ''; // Define which element in this section should be focused first, if the focus comes from another section
  leaveFor?: LeaveForType; // Next element which should be focused on leaving current section. Each direction can include element selector-string / DOMElement or list
  restrict?: Restrict; // 'self-first' implies that elements within the same section will have higher priority to be chosen as the next candidate. 'self-only' implies that elements in the other sections will never be navigated by arrow keys (only by calling focus() manually).
  tabIndexIgnoreList?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  navigableFilter?: (element: HTMLElement, sectionId?: string) => boolean;
}

export type NavConfig = Partial<INavigationConfig> & {id?: string, previousFocus?: PreviousFocus};

export interface INavSection extends INavigationConfig {
  defaultElementSelector?: string;
  lastFocusedElement: HTMLElement;
  previousFocus?: PreviousFocus;
  getId: () => string;
  isDisabled: () => boolean;
  disable: () => void;
  enable: () => void;
  match: (element: HTMLElement) => boolean;
  makeFocusable: () => void;
  savePreviousFocus: (target: HTMLElement, destination: HTMLElement, reverse: Direction) => void;
  clearSavedElements: () => void;
  isNavigable: (element: HTMLElement, verifySectionSelector?: boolean) => boolean;
  getDefaultElement: () => HTMLElement;
  getLastFocusedElement: () => HTMLElement;
  getPrimaryElement: () => HTMLElement;
  getNavigableElements: () => HTMLElement[];
  selectElements: (selector: string) => HTMLElement[];
  setLastFocused: (element: HTMLElement) => void;
  gotoLeaveFor: (direction: Direction) => boolean | undefined;
  focus: () => boolean;
  blur: () => void;
}