/**
 * Airport Manager Module
 * Handles airport dropdown creation, styling, and suggestions
 */
import { DROPDOWN_CONFIG, DEFAULT_SEARCH } from '../settings.module.js';

import { DROPDOWN_CONFIG, DEFAULT_SEARCH } from '../settings.module.js';
export class AirportManager {
  constructor(airports, regionStyles) {
    this.airports = airports;
    this.regionStyles = regionStyles;
    this.options = this.createOptions();
  }

  createOptions() {
    return this.airports.map(airport => {
      return {
        value: airport.code,
        label: airport.name,
        sublabel: `${airport.location}`,
        badge: `${airport.code}`,
        disabled: airport.disabled
      };
    });
  }

  updateAirportSelectorStyle(selectorElement, airportCode) {
    const button = selectorElement.querySelector('button');
    if (!button) {
      console.error('updateAirportSelectorStyle: Button element not found in selector:', selectorElement);
      return;
    }

    const allBorderClassesToRemove = Object.values(this.regionStyles)
      .map(s => s.borderColorClass)
      .concat(['border-primary']);
    button.classList.remove(...allBorderClassesToRemove);

    if (!airportCode) {
      button.classList.add('border-primary');
      return;
    }

    const airport = this.airports.find(a => a.code === airportCode);
    if (!airport) {
      console.error(`updateAirportSelectorStyle: Airport with code ${airportCode} not found.`);
      button.classList.add('border-primary');
      return;
    }

    const style = this.regionStyles[airport.region];
    if (!style || !style.borderColorClass) {
      console.error(`updateAirportSelectorStyle: Style or borderColorClass for region ${airport.region} not found.`);
      button.classList.add('border-primary');
      return;
    }

    button.classList.add(style.borderColorClass);
  }

  appendAirportDropdown(element, config) {
    const defaultConfig = {
      options: this.options,
      darkMode: true,
      multiple: false,
      enableSearch: true,
      ...config
    };

    TailwindHeadless.appendDropdown(element, defaultConfig);
    
    if (config.preselected && config.preselected[0]) {
      this.updateAirportSelectorStyle(element, config.preselected[0]);
    }
  }

  generateAirportSuggestions(fromAirportCode, toAirportCode, maxSuggestions = 5) {
    const availableAirports = this.airports.filter(airport => {
      return !airport.disabled &&
            airport.code !== fromAirportCode &&
            airport.code !== toAirportCode;
    });

    const shuffled = availableAirports.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, maxSuggestions);
  }
}