<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { strings } from '$lib/strings';
  import { theme } from '$lib/theme.svelte';
  import { onMount } from 'svelte';

  let { children } = $props();
  onMount(() => theme.init());

  const links = [
    { href: '/', label: strings.nav.home },
    { href: '/timeseries', label: strings.nav.timeseries },
    { href: '/basket', label: strings.nav.basket },
    { href: '/rates', label: strings.nav.rates },
    { href: '/about', label: strings.nav.about },
  ];
  const isActive = (href: string, path: string) => (href === '/' ? path === '/' : path.startsWith(href));
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link
    href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
</svelte:head>

<header>
  <div class="container bar">
    <a class="brand" href="/">
      <span class="leaf" aria-hidden="true"></span>
      <span>{strings.appName}</span>
    </a>
    <nav>
      {#each links as l (l.href)}
        <a href={l.href} class:active={isActive(l.href, $page.url.pathname)}>{l.label}</a>
      {/each}
    </nav>
    <button class="theme" onclick={() => theme.toggle()} aria-label="Toggle dark mode">
      {theme.current === 'dark' ? '☀' : '☾'}
    </button>
  </div>
</header>

<main class="container">
  {@render children()}
</main>

<footer>
  <div class="container">
    <span class="muted">{strings.tagline} · Data: Statistics Canada &amp; Bank of Canada · Not investment advice.</span>
  </div>
</footer>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: color-mix(in srgb, var(--paper) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 60px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: 19px;
    letter-spacing: 0.01em;
    color: var(--ink);
  }
  .leaf {
    width: 26px;
    height: 26px;
    flex: none;
    background: var(--accent);
    -webkit-mask: url(/maple-leaf.png) center / contain no-repeat;
    mask: url(/maple-leaf.png) center / contain no-repeat;
  }
  nav {
    display: flex;
    gap: 4px;
    margin-left: auto;
    overflow-x: auto;
  }
  nav a {
    color: var(--muted);
    font-weight: 600;
    font-size: 14px;
    padding: 8px 12px;
    border-radius: 8px;
    white-space: nowrap;
  }
  nav a:hover {
    color: var(--ink);
    text-decoration: none;
  }
  nav a.active {
    color: var(--accent);
    background: var(--surface-2);
  }
  .theme {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink);
    width: 38px;
    height: 38px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 16px;
    flex: none;
  }
  main {
    padding: 28px 20px 56px;
    min-height: 70vh;
  }
  footer {
    border-top: 1px solid var(--border);
    padding: 20px;
    font-size: 13px;
  }
  @media (max-width: 640px) {
    .bar {
      gap: 8px;
    }
    .brand span {
      display: none;
    }
  }
</style>
