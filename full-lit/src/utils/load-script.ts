/**
 * Load a script from a URL asynchronously
 * and insert the script into the document head.
 */
export function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    document.head.appendChild(script);
    script.onload = resolve;
    script.onerror = reject;
    script.async = true;
    script.src = url;
  });
}
