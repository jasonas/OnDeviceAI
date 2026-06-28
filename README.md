# OnDevice.AI

[OnDevice.AI](https://ondevice.ai) is a compact, versioned guide to open and
open-weight AI models that can run locally on modern mobile devices with 8 GB
of RAM.

The first complete shortlist covers:

- Text generation
- Coding
- Reasoning
- Image generation
- Speech-to-text
- Text-to-speech
- Photo analysis
- Best overall

## Stack

The site uses plain HTML, CSS, and vanilla JavaScript. It has no build step or
runtime dependencies. Recommendations are loaded from a static JSON document.

## Local Preview

From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## JSON API

The production endpoint is:

```text
https://ondevice.ai/api
```

The source payload is stored at [`api/index.json`](api/index.json). Apache
rewrites `/api` to that file and serves it as `application/json`.

## Releases

Each meaningful recommendation release should update:

1. `api/index.json` with the current version, timestamp, evidence, and history.
2. `archive/YYYY-MM-DD/` with frozen HTML and JSON copies.
3. `blog/` with a short post explaining what changed and why.
4. Asset revision query strings when shared CSS or JavaScript changes.

## Apache Hosting

Upload the repository contents to the site's document root, including
`.htaccess`. The visible `upload.htaccess` file is an identical helper copy for
FTP clients that hide dotfiles; Apache requires the deployed file to be named
`.htaccess`.
