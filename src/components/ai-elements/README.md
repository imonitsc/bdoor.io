# AI Elements (bdoor build)

Only the seven components the Ask bdoor AI surface needs — `conversation`,
`message`, `prompt-input`, `suggestion`, `sources`, `loader` and `actions` —
mirroring the AI Elements component API and customised to bdoor's design
tokens. Nothing else from the collection is included.

Written by hand rather than installed with `npx ai-elements@latest add …`
because the component registry (`elements.ai-sdk.dev`) is blocked by the
build environment's egress policy; the CLI itself was attempted first and the
registry fetch is what failed. The public API of each component follows the
AI Elements documentation so a future registry install can replace these
files without touching call sites; the styling is bdoor's, which the brief
required regardless of how the files got here.

No purple gradients, no glassmorphism, no robots, no orbs — the streaming
conversation is the product.
