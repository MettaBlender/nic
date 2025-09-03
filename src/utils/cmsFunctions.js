export function remToPixels(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}