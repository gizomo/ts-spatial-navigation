import type {
	DirectionType,
	ExtendedSelectorType,
	INavSection,
	LeaveForType,
	NavConfigType,
	PreviousFocusType,
} from './index';
import Navigator, {Restrict} from './index';
import {selectElements} from './utils';

export default class NavSection implements INavSection {
	private readonly id: string;
	private disabled: boolean = false;
	private navigator: Navigator;

	public defaultElementSelector?: string = '.default-focus';
	public lastFocusedElement: HTMLElement = undefined;
	public previousFocus?: PreviousFocusType = undefined;
	public selector?: string = '';
	public straightOnly?: boolean = false;
	public straightOverlapThreshold?: number = undefined;
	public rememberSource?: boolean = true;
	public priority?: '' | 'last-focused' | 'default-element' = '';
	public leaveFor?: LeaveForType = null;
	public restrict?: Restrict = Restrict.SELF_FIRST;
	public tabIndexIgnoreList: string = 'a, input, select, textarea, button, iframe, [contentEditable=true]';
	public onFocus?: () => void = undefined;
	public onBlur?: () => void = undefined;
	public navigableFilter: (element: HTMLElement, sectionId?: string) => boolean = null;

	constructor(
		navigator: Navigator,
		config: Omit<NavConfigType, 'lastFocusedElement' | 'previousFocus'>,
		id?: string,
	) {
		if (navigator) {
			this.navigator = navigator;
		} else {
			throw new Error(`Navigator is not set for section "${id ?? config?.id}"`);
		}

		this.setConfig(config);

		if (id) {
			this.id = id;
		} else if (config.id) {
			this.id = config.id;
		}
	}

	public setConfig(config: NavConfigType): void {
		for (const key in Navigator.config) {
			if ('selector' === key) {
				this.selector = (config.selector ?? '').toString() + ' ' + Navigator.config.selector;
			} else {
				this[key] = config[key] ?? Navigator.config[key] ?? this[key];
			}
		}
	}

	public getId(): string {
		return this.id;
	}

	public disable(): void {
		const elements: HTMLElement[] = this.getNavigableElements();

		if (elements.length) {
			elements.forEach((element: HTMLElement) => element.setAttribute('disabled', 'true'));
		}

		this.disabled = true;

		if (this.onBlur) {
			this.onBlur();
		}
	}

	public enable(): void {
		const elements: HTMLElement[] = selectElements(this.selector);

		if (elements) {
			elements.forEach((element: HTMLElement) => element.removeAttribute('disabled'));
		}

		this.disabled = false;
	}

	public isDisabled(): boolean {
		return this.disabled;
	}

	public savePreviousFocus(target: HTMLElement, destination: HTMLElement, reverse: DirectionType): void {
		this.previousFocus = {target, destination, reverse};
	}

	public clearSavedElements(): void {
		this.lastFocusedElement = undefined;
		this.previousFocus = undefined;
	}

	public setLastFocused(element: HTMLElement): void {
		if (element) {
			this.lastFocusedElement = element;
			this.previousFocus = undefined;
		}
	}

	public makeFocusable(): void {
		const ignoredTabsList: string = this.getIgnoredTabsList();
		selectElements(this.selector).forEach((element: HTMLElement) => {
			if (!this.matchSelector(element, ignoredTabsList) && !element.getAttribute('tabindex')) {
				element.setAttribute('tabindex', '-1');
			}
		});
	}

	public match(element: HTMLElement): boolean {
		return this.matchSelector(element, this.selector);
	}

	private matchSelector(element: HTMLElement, selectors: any): boolean {
		if (element) {
			if ('string' === typeof selectors) {
				return element.matches(selectors);
			} else if ('object' === typeof selectors && selectors.length) {
				return selectors.indexOf(element) >= 0;
			} else if ('object' === typeof selectors && 1 === selectors.nodeType) {
				return element === selectors;
			}
		}

		return false;
	}

	private getIgnoredTabsList(): string {
		return this.tabIndexIgnoreList !== undefined ? this.tabIndexIgnoreList : Navigator.config.tabIndexIgnoreList;
	}

	/**************/
	/* NavMethods */
	/**************/
	public isNavigable(element: HTMLElement, verifySectionSelector?: boolean): boolean {
		if (!element || this.isDisabled()) {
			return false;
		}

		if ((element.offsetWidth <= 0 && element.offsetHeight <= 0) || element.hasAttribute('disabled')) {
			return false;
		}

		if (verifySectionSelector && !this.match(element)) {
			return false;
		}

		if ('function' === typeof this.navigableFilter) {
			if (this.navigableFilter(element) === false) {
				return false;
			}
		} else if ('function' === typeof Navigator.config.navigableFilter) {
			if (Navigator.config.navigableFilter(element) === false) {
				return false;
			}
		}

		return true;
	}

	public getDefaultElement(): HTMLElement {
		if (this.defaultElementSelector) {
			return selectElements(this.defaultElementSelector)
				?.find((element: HTMLElement) => this.isNavigable(element, true));
		}
	}

	public getNavigableElements(): HTMLElement[] {
		if (this.isDisabled() || !this.selector) {
			return [];
		}

		return selectElements(this.selector)?.filter((element: HTMLElement) => this.isNavigable(element));
	}

	public selectElements(selector: string): HTMLElement[] {
		return selectElements(this.selector ? this.selector + selector : selector);
	}

	public getLastFocusedElement(): HTMLElement {
		if (this.isNavigable(this.lastFocusedElement, true)) {
			return this.lastFocusedElement;
		}
	}

	public getPrimaryElement(): HTMLElement {
		switch (this.priority) {
			case 'last-focused':
				return this.getLastFocusedElement() || this.getDefaultElement();
			case 'default-element':
				return this.getDefaultElement();
			default:
				return;
		}
	}

	public focus(): boolean {
		if (this.isDisabled()) {
			return false;
		}

		let element: HTMLElement;

		if ('last-focused' === this.priority) {
			element = this.getLastFocusedElement() || this.getDefaultElement() || this.getNavigableElements()[0];
		} else {
			element = this.getDefaultElement() || this.getLastFocusedElement() || this.getNavigableElements()[0];
		}

		if (element) {
			return this.navigator.focusElement(element, this.navigator.findSection(element)?.getId() ?? this.id);
		}
	}

	public blur(): void {
		const focusedElement: HTMLElement = this.navigator.getFocusedElement();
		const currentSection: INavSection = this.navigator.findSection(focusedElement);

		if (currentSection === this) {
			this.navigator.getFocusedElement().blur();
		}
	}

	private isCallback(leaveFor: ExtendedSelectorType | (() => ExtendedSelectorType)): leaveFor is (() => ExtendedSelectorType) {
		return leaveFor instanceof Function;
	}

	private getLeaveForAt(direction: DirectionType): ExtendedSelectorType {
		if (this.leaveFor && this.leaveFor[direction] !== undefined) {
			const selector: ExtendedSelectorType | (() => ExtendedSelectorType) = this.leaveFor[direction];

			if (this.isCallback(selector)) {
				return selector();
			}

			return selector;
		}
	}

	public gotoLeaveFor(direction: DirectionType): boolean | undefined {
		const selector: ExtendedSelectorType = this.getLeaveForAt(direction);

		if ('string' === typeof selector) {
			if ('' === selector) {
				return;
			}

			const result: boolean = this.navigator.focusExtendedSelector(selector, direction);

			if (result) {
				if (this.onBlur) {
					this.onBlur();
				}

				return result;
			}
		}

		return false;
	}
}
