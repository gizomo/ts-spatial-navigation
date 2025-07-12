import { bind } from 'helpful-decorators';
import type {IElementRect} from './types';

export default class ElementRect implements IElementRect {
	public readonly x: number;
	public readonly y: number;
	public readonly width: number;
	public readonly height: number;
	public readonly top: number;
	public readonly bottom: number;
	public readonly right: number;
	public readonly left: number;
	public readonly center: DOMRectReadOnly;
	public readonly element: HTMLElement;

	constructor(element: HTMLElement) {
		this.element = element;

		const {x, y, width, height, top, bottom, left, right}: DOMRect = element.getBoundingClientRect();

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.top = top;
		this.bottom = bottom;
		this.left = left;
		this.right = right;
		this.center = this.getCenter(this);
	}

	private getCenter({width, height, left, top}: DOMRectReadOnly): DOMRectReadOnly {
		const x: number = left + Math.floor(width / 2);
		const y: number = top + Math.floor(height / 2);

		return { x, y, left: x, right: x, top: y, bottom: y, width: 0, height: 0, toJSON: () => ({ x, y })};
	}

	public toJSON(): Omit<DOMRect, 'toJSON'> & { center: Omit<DOMRect, 'toJSON'> } {
		const {x, y, width, height, top, bottom, left, right, center} = this;
		return {x, y, width, height, top, bottom, left, right, center};
	}

	@bind
	public nearPlumbLineIsBetter({ left, center, right }: IElementRect): number {
		const d: number = center.x < this.center.x ? this.center.x - right : left - this.center.x;
		return d < 0 ? 0 : d;
	}

	@bind
	public nearHorizonIsBetter({ center, bottom, top }: IElementRect): number {
		const d: number = center.y < this.center.y ? this.center.y - bottom : top - this.center.y;
		return d < 0 ? 0 : d;
	}

	@bind
	public nearTargetLeftIsBetter({ center, right, left }: IElementRect): number {
		const d: number = center.x < this.center.x ? this.left - right : left - this.left;
		return d < 0 ? 0 : d;
	}

	@bind
	public nearTargetTopIsBetter({ center, bottom, top }: IElementRect): number {
		const d: number = center.y < this.center.y ? this.top - bottom : top - this.top;
		return d < 0 ? 0 : d;
	}

	@bind
	public topIsBetter({ top }: IElementRect): number {
		return top;
	}

	@bind
	public bottomIsBetter({ bottom }: IElementRect): number {
		return -1 * bottom;
	}

	@bind
	public leftIsBetter({ left }: IElementRect): number {
		return left;
	}

	@bind
	public rightIsBetter({ right }: IElementRect): number {
		return -1 * right;
	}
}
