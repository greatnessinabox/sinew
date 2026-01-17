export default {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs}": ["prettier --write --ignore-unknown"],
  "*.{json,md,mdx,yml,yaml}": ["prettier --write --ignore-unknown"],
};
