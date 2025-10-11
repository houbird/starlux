# Starlux

This project is a simple web application that allows users to select a year and month, specify departure and destination airports, and search for Starlux flight prices. It leverages Tailwind CSS for styling and provides a user-friendly interface.

## Technologies Used

- HTML
- CSS
- JavaScript
- [Tailwind CSS](https://tailwindcss.com/)

## Project Structure

The project follows a modular architecture adhering to SOLID and DRY principles:

### Main Files
- [index.html](./index.html): The main HTML file that contains the structure of the webpage.
- [js/main.js](./js/main.js): Main application entry point that orchestrates all modules.

### CSS Files
- [css/global.css](./css/global.css): Global CSS styles.
- [css/custom.css](./css/custom.css): Custom CSS styles for specific components.

### JavaScript Modules
- [js/modules/airport-data-service.js](./js/modules/airport-data-service.js): **NEW** - Fetches airport data from external API and transforms it to application format.
- [js/modules/airport-manager.js](./js/modules/airport-manager.js): Manages airport dropdown creation, styling, and suggestions.
- [js/modules/app-controller.js](./js/modules/app-controller.js): Main application controller coordinating all modules.
- [js/modules/date-utils.js](./js/modules/date-utils.js): Date formatting and manipulation utilities.
- [js/modules/dom-elements.js](./js/modules/dom-elements.js): DOM element reference management.
- [js/modules/flight-renderer.js](./js/modules/flight-renderer.js): Renders flight information and statistics.
- [js/modules/flight-search.js](./js/modules/flight-search.js): Handles flight search API calls.
- [js/modules/holiday-service.js](./js/modules/holiday-service.js): Fetches holiday data for calendar display.
- [js/modules/ui-state-manager.js](./js/modules/ui-state-manager.js): Manages UI state and interactions.
- [js/modules/url-params-handler.js](./js/modules/url-params-handler.js): Handles URL parameter parsing and state restoration.
- [js/modules/version-display.js](./js/modules/version-display.js): Displays application version information.

### Tailwind Components
- [js/tailwind.custom.js](./js/tailwind.custom.js): Custom Tailwind CSS color definitions for regions.
- [js/tailwind.alert.js](./js/tailwind.alert.js): Alert component utilities.
- [js/tailwind.select.js](./js/tailwind.select.js): Custom select dropdown component.

## Setup and Usage

1. **Clone the repository:**

   ```bash
   git clone https://github.com/houbird/starlux.git
   cd starlux
   ```

2. **Open `index.html` in your browser to view the application:**

   ```bash
   open index.html
   ```

3. **To make changes:**

   - Edit `./index.html` for HTML structure changes.
   - Edit `./css/style.css` for styling changes.
   - Edit `./js/main.js` for JavaScript functionality.

## Features

- **Date Selection:** Users can select a specific year and month.
- **Airport Selection:** Dropdown menus for selecting departure and destination airports.
- **Dynamic Airport Data:** Airport information is loaded from external API (Google Sheets via OpenSheet).
- **Price Search:** A button to search for flight prices for the selected month.
- **Navigation:** Buttons to navigate between months.
- **Price Display:** A calendar view displaying flight prices for each day of the selected month.
- **Statistics Display:** A section to show statistical information about the prices for the selected month.
- **Region-based Styling:** Airports are color-coded by region without emoji flags.

## Architecture

The application follows **SOLID** principles and **DRY** (Don't Repeat Yourself) methodology:

- **Single Responsibility Principle (SRP)**: Each module has a single, well-defined responsibility.
- **Open/Closed Principle**: Modules are open for extension but closed for modification.
- **Liskov Substitution Principle**: Modules can be replaced with alternative implementations.
- **Interface Segregation**: Each module exposes only necessary methods.
- **Dependency Inversion**: Modules depend on abstractions, not concrete implementations.

### Data Sources

1. **Airport Data API**: `https://opensheet.elk.sh/1ezR0gCNjmVRRUBKtnP1LfMhGDPPyzLMbH8UsJEMBnrw/routes`
   - Provides comprehensive airport information including IATA codes, timezones, and geographic data.
   - Data is fetched on application initialization and cached for performance.

2. **Flight Search API**: Starlux Airlines API via CORS proxy
   - Provides real-time flight pricing and availability.

3. **Holiday API**: Taiwan holiday calendar via Google Sheets
   - Highlights holidays in the calendar view.

## Example

Below is an example of how to use the application:

1. Select the desired year and month.
2. Choose the departure and destination airports from the dropdown menus.
3. Click the "Search" button to view the flight prices for the selected month.
4. Use the "Prev" and "Next" buttons to navigate between months.
5. View the flight prices displayed in the calendar and the statistical information below.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

All information and rights belong to Starlux Airlines. This project is for educational purposes only and is not an official Starlux Airlines product.