/**
 * Version Display Module
 * Handles version information display
 */
export class VersionDisplay {
  constructor(domElements) {
    this.domElements = domElements;
  }

  async displayVersion() {
    const versionDisplay = this.domElements.get('version-display');
    if (!versionDisplay) return;

    try {
      const response = await fetch('version.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.version) {
        versionDisplay.textContent = `v${data.version}`;
      } else {
        versionDisplay.textContent = 'vN/A';
        console.error('Version data is not in the expected format:', data);
      }
    } catch (error) {
      console.error('Could not fetch version:', error);
      versionDisplay.textContent = 'vError';
    }
  }
}