/**
 * UI State Manager Module
 * Manages button states and container interactions
 */
export class UIStateManager {
  constructor() {
    this.selectedStates = {};
  }

  initializeButtonGroup(container, groupName) {
    if (!container) return;

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.selectButton(container, button, groupName);
      });
    });

    // Set initial selection if there's a default selected button
    const selectedButton = container.querySelector('button.bg-primary');
    if (selectedButton) {
      this.selectedStates[groupName] = selectedButton.getAttribute('data-value');
    }
  }

  selectButton(container, selectedButton, groupName) {
    // Remove selection from all buttons in the group
    container.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('bg-primary', 'text-gray-800');
      btn.classList.add('bg-gray-600', 'text-white');
    });

    // Add selection to clicked button
    selectedButton.classList.remove('bg-gray-600', 'text-white');
    selectedButton.classList.add('bg-primary', 'text-gray-800');
    
    // Update container and state
    const value = selectedButton.getAttribute('data-value');
    container.setAttribute('data-selected-value', value);
    this.selectedStates[groupName] = value;
  }

  getSelectedValue(groupName) {
    return this.selectedStates[groupName];
  }

  setSelectedValue(container, groupName, value) {
    const button = container.querySelector(`button[data-value="${value}"]`);
    if (button) {
      this.selectButton(container, button, groupName);
    }
  }

  closeDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) {
      dropdown.style.display = 'none';
    }
  }
}