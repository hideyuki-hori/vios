# vios

A Chrome extension for Vim-like keyboard navigation and utilities.

## Features

### Keybindings

| Key | Action |
| --- | --- |
| `j` / `k` | Scroll down / up (hold for continuous scrolling) |
| `d` / `u` | Scroll one page down / up |
| `gg` / `G` | Jump to the top / bottom of the page |
| `h` / `l` | Go back / forward in history |
| `r` | Reload the page |
| `f` | Hint mode (labels links and buttons, type to open) |
| `t` | Open a new tab |
| `T` | Open the tab switcher |
| `b` | Open the bookmark palette |
| `x` | Close the current tab |
| `Esc` | Dismiss modals and hints |

Keybindings are disabled while an input, textarea, or contenteditable element is focused, and during IME composition.

### Tab switcher (`T`)

- `j` / `k` / arrow keys to select, `Enter` to switch
- Type a number to jump by index (multi-digit supported)
- `/` for incremental search (`Enter` switches immediately when narrowed to one)
- `x` closes the selected tab

### Bookmark palette (`b`)

- Lists all bookmarks in tree order
- `/` to search (matches title, URL, and folder path)
- `Enter` opens in the current tab, `Shift+Enter` opens in a new tab

### Site blocking

- Click the vios toolbar icon to open the options page and register domains to block (subdomains included)
- When registering, open tabs on that domain are closed after a confirmation
- On a blocked page, type `unlock <domain>` by hand (paste is disabled) to unlock for one hour
- When the hour expires, the domain is blocked again and open tabs are redirected to the blocked page

## Installation

```sh
pnpm install
pnpm build
```

1. Open `chrome://extensions` in Chrome
2. Enable Developer mode
3. Click "Load unpacked" and select `dist`

## Development

```sh
pnpm dev        # watch build with live reload
pnpm test       # run tests
pnpm typecheck  # type check
pnpm check      # lint and format with Biome
```

While `pnpm dev` is running, saving a file automatically reloads the extension and the active tab. A manual reload on `chrome://extensions` is only needed the first time and when manifest.json permissions change.

## Structure

```
src/
  entrypoints/  Wiring only (content / background / options / blocked)
  lib/          Implementation, flat; files grouped by name prefix
```

Pure logic lives in files named `*.core.ts`, which `tsconfig.pure.json` type-checks against the ES2022 lib alone (no DOM or chrome types), and all of it is covered by vitest.

## License

[MIT](LICENSE)
