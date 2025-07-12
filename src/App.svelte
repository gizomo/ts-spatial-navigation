<script lang="ts">
  import Keyboard from './keyboard';
  import Navigator from '../lib';
  import {onDestroy} from 'svelte';

  const nav = new Navigator().init().setConfig({selector: '.focusable'});

  let text: string = '';
  let keyboard: Keyboard;

  function onFocus(): void {
    keyboard.getNavSection().focus();
  }

  function onInput(char: string | undefined): void {
    text = char ? text + char : text.slice(0, -1);
  }

  function onClear(): void {
    text = '';
  }

  function onEnter(): void {
    text += '\r\n';
  }

  onDestroy(() => nav.uninit())
</script>

<div
  tabindex="-1"
  class="block-absolute vh-centered"
  on:focus={onFocus}
>
  <div class="vh-centered" style:width="70%" style:height="50%" style:gap="2rem">
    <div class="text-box">{text}</div>
    <Keyboard bind:this={keyboard} {nav} {onInput} {onClear} {onEnter} />
  </div>
</div>

<style lang="less">
  .text-box {
    width: 100%;
    box-sizing: border-box;
    min-height: 9rem;
    padding: 1rem;
    font-size: 1.5rem;
    white-space: pre-line;
    color: white;
    border: 1px solid dimgrey;
    border-radius: 0.25rem;
    background-color: #242424;

    &:after {
      content: "";
      width: 0.75rem;
      height: 1.5rem;
      transform: translate(2px, 2px);
      background: mediumseagreen;
      display: inline-block;
      animation: cursor-blink 1s steps(2) infinite;
    }
  }

  @keyframes cursor-blink {
    0% {
      opacity: 0;
    }
  }
</style>