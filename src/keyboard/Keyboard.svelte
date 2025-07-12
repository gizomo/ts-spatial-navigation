<script lang="ts">
  import {
    AvailableLanguageLayouts,
    getKeyIcon,
    getLayout,
    type KeyboardLayout,
    type Size, SystemKeys,
  } from './index';
  import ElementRect from '../../lib/element-rect';
  import type Navigator from '../../lib';
  import type {IElementRect, INavSection} from '../../lib/types';
  import {onDestroy, tick} from 'svelte';

  export let nav: Navigator;
  export let preferred: AvailableLanguageLayouts = undefined;
  export let onFocus: () => void = undefined;
  export let onBlur: () => void = undefined;
  export let onInput: (char: string | undefined) => void = undefined;
  export let onClear: () => void = undefined;
  export let onEnter: () => void = undefined;

  enum KeyboardKey {
    ENTER = 'Enter',
    UP = 'ArrowUp',
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight',
  }

  const key: string = `keyboard-${new Date().getTime()}`;
  const navSection: INavSection = nav.addSection({selector: `.${key}`, rememberSource: false, straightOverlapThreshold: 0.4, onFocus, onBlur}, key);
  const languages: AvailableLanguageLayouts[] = Object.values(AvailableLanguageLayouts);

  let container: HTMLDivElement;
  let layout: KeyboardLayout;
  let size: Size;
  let shift: boolean = false;
  let capsLock: boolean = false;
  let numbers: boolean = false;
  let special: boolean = false;
  let enterPressed: boolean = false;

  window.addEventListener('resize', updateSize);

  $: if (container) {
    size = {width: container.offsetWidth, height: container.offsetHeight};
    setLanguage(initLanguage(preferred));
  }

  $: if (layout) {
    tick().then(() => window.requestAnimationFrame(() => {
      const enterKey: HTMLElement = window.document.getElementById(SystemKeys.ENTER);

      if (enterKey) {
        navSection.setLastFocused(enterKey);
      }
    }));
  }

  function updateSize(): void {
    size = {width: container.offsetWidth, height: container.offsetHeight};
    setLanguage(layout.getLanguage());
  }

  function initLanguage(preferred: AvailableLanguageLayouts): string {
    if (layout) {
      if (preferred) {
        return preferred;
      }

      if (isEnglish(layout.getLanguage()) && isEnglish(getSystemLanguage())) {
        return layout.getLanguage();
      }

      return getSystemLanguage();
    }

    if (preferred) {
      return preferred;
    }

    return getDefaultLanguage();
  }

  function getSystemLanguage(): string {
    return window.navigator.language.split('-')[0];
  }

  function isEnglish(language: string): boolean {
    return AvailableLanguageLayouts.EN === language;
  }

  function getDefaultLanguage(): string {
    return languages.find((lang: AvailableLanguageLayouts) => lang === this, getSystemLanguage()) ?? AvailableLanguageLayouts.EN;
  }

  function setLanguage(language: string): void {
    layout = -1 !== languages.indexOf(AvailableLanguageLayouts.EN)
      ? getLayout(language, {size})
      : getLayout(AvailableLanguageLayouts.EN, {size});
    shift = false;
    capsLock = false;
    numbers = false;
    special = false;
    size = layout.getSize();

    if (enterPressed) {
      tick().then(() => {
        focusEnter();
        enterPressed = false;
      });
    }
  }

  function selectNextLanguage(): boolean {
    if (2 > languages.length) {
      return false;
    }

    const index: number = languages.findIndex((lang: string) => layout.getLanguage() === lang);

    if (languages.length > index + 1) {
      setLanguage(languages[index + 1]);
    } else {
      setLanguage(languages[0]);
    }

    return true;
  }

  function getOppositeKey(row: number): HTMLElement {
    let target: HTMLElement;
    let delta: number;
    const focusedRect: IElementRect = new ElementRect(nav.getFocusedElement());

    navSection.selectElements(`.row-${row}`)
      .map((element: HTMLElement) => element.hasAttribute('disabled') ? undefined : new ElementRect(element))
      .forEach((rect: IElementRect) => {
        if (rect) {
          const current: number = Math.abs(focusedRect.center.x - rect.center.x);

          if (undefined === delta || delta > current) {
            delta = current;
            target = rect.element;
          }
        }
      });

    return target;
  }

  function onKeyDown(event: KeyboardEvent, key: string, row: number): void {
    switch (event.key) {
      case KeyboardKey.ENTER:
        onKeyPress(key);
        event.preventDefault();
        event.stopPropagation();
        return;
      case KeyboardKey.UP:
        if (0 === row) {
          onImperativeNav(event, getOppositeKey(layout.getRowsCount() - 1));
        }

        return;
      case KeyboardKey.DOWN:
        if (layout.getRowsCount() - 1 === row) {
          onImperativeNav(event, getOppositeKey(0));
        }

        return;
      default:
        return;
    }
  }

  function onImperativeNav(event: KeyboardEvent, target: HTMLElement): void {
    if (target) {
      nav.focusElement(target, navSection.getId());
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onKeyPress(key: string): void {
    enterPressed = SystemKeys.ENTER === key;

    switch (key) {
      case SystemKeys.LANGUAGE:
        if ((Boolean(preferred) && SystemKeys.LANGUAGE === key)) {
          return;
        }

        if (selectNextLanguage()) {
          shift = layout.isShiftMode();
          capsLock = layout.isCapsLockMode();
          numbers = layout.isNumbersMode();
          special = layout.isSpecialMode();
        }
        break;
      case SystemKeys.SHIFT:
      case SystemKeys.SHIFT_ACTIVE:
      case SystemKeys.CAPSLOCK:
        layout.toggleShiftMode();
        shift = layout.isShiftMode();
        capsLock = layout.isCapsLockMode();
        break;
      case SystemKeys.NUMBERS:
        if (capsLock || shift) {
          layout.disableShiftMode();
          shift = layout.isShiftMode();
          capsLock = layout.isCapsLockMode();
        }

        if (special) {
          layout.toggleSpecialMode();
        } else {
          layout.toggleNumbersMode();
        }

        numbers = layout.isNumbersMode();
        special = layout.isSpecialMode();
        break;
      case SystemKeys.EXTENDED:
        layout.toggleSpecialMode();
        numbers = layout.isNumbersMode();
        special = layout.isSpecialMode();
        break;
      case SystemKeys.CHARS:
        layout.toggleNumbersMode();
        numbers = layout.isNumbersMode();
        special = layout.isSpecialMode();
        break;
      case SystemKeys.ENTER:
        if (onEnter) {
          onEnter();
        }

        break;
      case SystemKeys.CLEAR:
        if (onClear) {
          onClear();
        }

        break;
      case SystemKeys.BACKSPACE:
        if (onInput) {
          onInput(undefined);
        }

        break;
      default:
        if (!capsLock && shift) {
          layout.disableShiftMode();
          shift = layout.isShiftMode();
          capsLock = layout.isCapsLockMode();
        }

        if (onInput) {
          onInput(SystemKeys.SPACE === key ? ' ' : key);
        }

        break;
    }
  }

  export function focusEnter(): void {
    const enterKey: HTMLElement = window.document.getElementById(SystemKeys.ENTER);

    if (enterKey) {
      nav.focusElement(enterKey, navSection.getId());
    }
  }

  export function getNavSection(): INavSection {
    return navSection;
  }

  onDestroy(() => {
    nav.removeSection(navSection);
    window.removeEventListener('resize', updateSize);
  });
</script>

<div
  bind:this={container}
  class="keyboard {key}"
  lang={layout?.getLanguage()}
>
  {#if layout}
    {@const charSize = layout.getCharSize()}
    {#each layout.getKeys(shift, capsLock, numbers, special) as {key, width, height, top, left, type, row}}
      <div
        tabindex={(Boolean(preferred) && SystemKeys.LANGUAGE === key) ? undefined : -1}
        role="button"
        aria-roledescription="fake button"

        id={SystemKeys.ENTER === key ? SystemKeys.ENTER : undefined}

        on:keydown={(e) => onKeyDown(e, key, row)}
        on:click={() => onKeyPress(key)}

        class="key {(Boolean(preferred) && SystemKeys.LANGUAGE === key) ? '' : 'focusable'} vh-centered text-{charSize}-normal {type} row-{row}"
        class:default-focus={SystemKeys.ENTER === key}
        disabled={(Boolean(preferred) && SystemKeys.LANGUAGE === key) || undefined}
        style:top="{top}px"
        style:left="{left}px"
        style:width="{width}px"
        style:height="{height}px"
      >
        {#if 'system' === type}
          {#if SystemKeys.NUMBERS === key}
            {'123'}
          {:else if SystemKeys.CHARS === key}
            {'ABC'}
          {:else if SystemKeys.EXTENDED === key}
            {'#+='}
          {:else}
            <svelte:component this={getKeyIcon(key)} width="{SystemKeys.SPACE ? charSize * 1.5 : charSize}px" height="{charSize}px"/>
          {/if}
        {:else}
          {key}
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style lang="less">
  .keyboard {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .key {
    position: absolute;
    user-select: none;
    &:focus:not([disabled]),
    &:hover:not([disabled]) {
      border-radius: 2px;
      background-color: mediumseagreen;
    }
    &[disabled] {
      color: dimgrey;
    }
  }
  .system {
    color: mediumseagreen;
    fill: mediumseagreen;
    &:focus:not([disabled]),
    &:hover:not([disabled]) {
      color: white;
      fill: white;
    }
    &[disabled] {
      color: dimgrey;
      fill: dimgrey;
    }
  }
</style>