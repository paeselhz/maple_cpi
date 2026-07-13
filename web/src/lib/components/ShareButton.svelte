<script lang="ts">
  // Copies the current URL — the page keeps its selections encoded in the query
  // string, so location.href already *is* the shareable link.
  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
    } catch {
      // Older/insecure contexts: select-and-copy fallback.
      const ta = document.createElement('textarea');
      ta.value = location.href;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* give up quietly */
      }
      ta.remove();
    }
    copied = true;
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2000);
  }
</script>

<button class="share" class:copied onclick={share} aria-label="Copy a link to this view">
  {copied ? 'Copied ✓' : 'Share'}
</button>

<style>
  .share {
    border: 1px solid var(--border-strong);
    background: var(--surface-2);
    color: var(--muted);
    border-radius: 7px;
    padding: 6px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .share:hover {
    color: var(--ink);
  }
  .share.copied {
    color: var(--accent);
    border-color: var(--accent);
  }
</style>
