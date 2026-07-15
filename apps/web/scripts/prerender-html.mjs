import { createHash } from 'node:crypto'

const serializeSnapshot = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

export const createSnapshotAsset = (snapshot) => {
  const source = `window.__DM_PUBLIC_SNAPSHOT__=${serializeSnapshot(snapshot)}`
  const fingerprint = createHash('sha256').update(source).digest('hex').slice(0, 12)
  const fileName = `public-data-${fingerprint}.js`

  return {
    fileName,
    source,
    scriptTag: `<script src="/${fileName}"></script>`,
  }
}

export const buildHtml = ({ template, headTags, snapshotScript, appHtml }) =>
  template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace('</head>', `    ${headTags}\n  </head>`)
    // Load the shared snapshot after the server-rendered content has been
    // parsed, but before the following client module hydrates the page.
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>\n  ${snapshotScript}`)
