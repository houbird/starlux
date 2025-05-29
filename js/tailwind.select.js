(function(global) {
  const arrowIcon = `
    <svg class="fill-current h-4 w-4 ml-2" viewBox="0 0 20 20">
      <path d="M7 10l5 5 5-5H7z"/>
    </svg>
  `;

  function createBadge(badgeText, darkMode) {
    const badge = document.createElement('span');
    badge.className = `
      ml-2 px-2 py-1 rounded-full text-xs
      ${darkMode ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-800'}
    `;
    badge.textContent = badgeText;
    return badge;
  }

  function createOptionContent(option, darkMode, highlightText = '') {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-start text-left';

    const label = document.createElement('span');
    label.className = 'option-label';
    label.innerHTML = highlightText ? highlightKeywords(option.label, highlightText) : option.label;
    container.appendChild(label);

    if (option.sublabel) {
      const sublabel = document.createElement('span');
      sublabel.className = 'text-sm text-gray-500 option-sublabel';
      sublabel.innerHTML = highlightText ? highlightKeywords(option.sublabel, highlightText) : option.sublabel;
      container.appendChild(sublabel);
    }

    return container;
  }

  function highlightKeywords(text, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="bg-primary text-gray-800">$1</span>');
  }

  function updateButtonContent(button, option, darkMode) {
    button.innerHTML = '';
  
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex flex-col items-start text-left';
    const content = createOptionContent(option, darkMode);
    contentDiv.appendChild(content);
  
    const rightContainer = document.createElement('div');
    rightContainer.className = 'flex items-center';
  
    if (option.badge) {
      const badge = createBadge(option.badge, darkMode);
      rightContainer.appendChild(badge);
    }
    rightContainer.innerHTML += arrowIcon;
  
    button.appendChild(contentDiv);
    button.appendChild(rightContainer);
  }

  function createDropdown({
    options,
    darkMode = false,
    multiple = false,
    preselected = null,
    onChange = null,
    target,
    enableSearch = false,
    dropdownId = null // Add dropdownId to parameters
  }) {
    const container = document.createElement('div');
    container.className = 'relative inline-block w-full';

    const button = document.createElement('button');
    button.className = `
      ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
      w-full border border-gray-700 hover:border-gray-500 px-4 py-2 rounded shadow leading-tight focus:outline-none focus:shadow-outline inline-flex justify-between items-center
    `;
    button.innerHTML = `
      <div class="flex flex-col items-start text-left">
        <span>Select an option</span>
      </div>
      <div>
        ${arrowIcon}
      </div>
    `;

    const dropdown = document.createElement('div');
    dropdown.className = `
      absolute w-full mt-1 rounded shadow-lg z-10 max-h-96 overflow-y-auto border border-gray-700
      ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
    `;
    dropdown.style.display = 'none';
    if (dropdownId) { // Use the passed in dropdownId
      dropdown.id = dropdownId;
    }

    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = `flex flex-col gap-2 px-2`;
    dropdown.appendChild(dropdownContainer);

    const searchInputContainer = document.createElement('div');
    searchInputContainer.className = 'p-2';
    dropdown.insertBefore(searchInputContainer, dropdown.firstChild);
    searchInputContainer.style.display = enableSearch ? 'block' : 'none';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search...';
    searchInput.className = `
      w-full px-4 py-2 border-b border-gray-700 sticky top-0
      ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
    `;
    searchInputContainer.appendChild(searchInput);

    const selectedOptions = [];
    let currentFocus = -1;

    function filterOptions() {
      const filter = searchInput.value.toLowerCase();
      const items = dropdown.getElementsByClassName('dropdown-item');
      Array.from(items).forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? '' : 'none';
        const optionLabel = item.querySelector('.option-label');
        const optionSublabel = item.querySelector('.option-sublabel');
        if (optionLabel) {
          optionLabel.innerHTML = highlightKeywords(optionLabel.textContent, filter);
        }
        if (optionSublabel) {
          optionSublabel.innerHTML = highlightKeywords(optionSublabel.textContent, filter);
        }
      });
      currentFocus = -1; // reset focus
    }

    function addActive(items) {
      if (!items) return false;
      removeActive(items);
      if (currentFocus >= items.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = items.length - 1;
      items[currentFocus].classList.add('bg-gray-700');
      items[currentFocus].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function removeActive(items) {
      Array.from(items).forEach(item => {
        item.classList.remove('bg-gray-700');
      });
    }

    let tempOption
    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = `
        px-4 py-2 flex justify-between items-center dropdown-item rounded
        border-l-4 pl-2 border-primary
        ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}
        ${option.disabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
      `;

      const content = createOptionContent(option, darkMode);
      optionElement.appendChild(content);

      if (option.badge) {
        const badge = createBadge(option.badge, darkMode);
        optionElement.appendChild(badge);
      }

      if (preselected && preselected.includes(option.value)) {
        selectedOptions.push(option.value);
        updateButtonContent(button, option, darkMode);
        target.setAttribute('data-selected-value', option.value);
        optionElement.classList.add('bg-gray-700');
      }

      optionElement.addEventListener('click', () => {
        if (!option.disabled) {
          if (multiple) {
            if (selectedOptions.includes(option.value)) {
              const index = selectedOptions.indexOf(option.value);
              selectedOptions.splice(index, 1);
              optionElement.classList.remove('bg-gray-700');
            } else {
              selectedOptions.push(option.value);
              optionElement.classList.add('bg-gray-700');
            }
            button.innerHTML = `${selectedOptions.join(', ') || 'Select options'}<div>${arrowIcon}</div>`;
          } else {
            selectedOptions.length = 0;
            selectedOptions.push(option.value);
            updateButtonContent(button, option, darkMode);
            dropdown.style.display = 'none';
            target.setAttribute('data-selected-value', option.value);
            if (onChange) onChange(option.value);

            // 清除所有選項的高亮
            Array.from(dropdown.getElementsByClassName('dropdown-item')).forEach(child => {
              child.classList.remove('bg-gray-700');
            });
            optionElement.classList.add('bg-gray-700');
          }
        }
      });
      dropdownContainer.appendChild(optionElement);
    });

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      if (enableSearch) {
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', filterOptions);

    searchInput.addEventListener('keydown', (e) => {
      const items = Array.from(dropdown.getElementsByClassName('dropdown-item')).filter(item => item.style.display !== 'none');
      if (e.key === 'ArrowDown') {
        currentFocus++;
        addActive(items);
      } else if (e.key === 'ArrowUp') {
        currentFocus--;
        addActive(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFocus > -1) {
          if (items[currentFocus]) items[currentFocus].click();
        }
      }
    });

    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });

    container.appendChild(button);
    dropdown.insertBefore(searchInputContainer, dropdown.firstChild);
    container.appendChild(dropdown);

    return { container, selectedOptions };
  }

  function appendDropdown(target, config) {
    // Pass dropdownId from config to createDropdown
    const dropdownConfig = { ...config, target, dropdownId: config.dropdownId }; 
    const dropdown = createDropdown(dropdownConfig);
    if (typeof target === 'string') {
      document.querySelector(target).appendChild(dropdown.container);
    } else if (target instanceof HTMLElement) {
      target.appendChild(dropdown.container);
    } else {
      throw new Error('Target must be a selector string or a DOM element.');
    }
    return {
      getSelectedValues: () => target.getAttribute('data-selected-value'),
    };
  }

  global.TailwindHeadless = {
    appendDropdown,
    updateButtonContent,
  };
})(window);
