import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Phase1LinkCollector {
  constructor() {
    this.apiBaseUrl = 'https://api.star-citizen.wiki/api/v3/vehicles';
  }

  /**
   * Main function to collect ship links
   */
  async buildStructure() {
    try {
      console.log('🚀 Starting Phase 1: Collecting Ship Links...');

      // Step 1: Get list of all ships from the API
      const shipList = await this.fetchShipList();
      console.log(`📋 Found ${shipList.length} ships to process`);

      // Step 2: Write the ship links to a temporary JSON file
      await this.writeShipLinks(shipList);

      console.log('✅ Phase 1 completed successfully!');
      console.log(`📊 Collected links for ${shipList.length} ships`);
    } catch (error) {
      console.error('❌ Error in Phase 1:', error);
      throw error;
    }
  }

  /**
   * Fetch the list of all ships from Star Citizen wiki API
   */
  async fetchShipList() {
    try {
      console.log('🔍 Fetching ship list from Star Citizen wiki...');

      let allShips = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`📄 Fetching page ${currentPage}...`);

        const response = await fetch(`${this.apiBaseUrl}?page=${currentPage}`);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        // Extract ships from current page
        const pageShips =
          data.data?.map((ship) => ({
            name: ship.name,
            uuid: ship.uuid,
            link: ship.link,
          })) || [];

        allShips = allShips.concat(pageShips);

        // Check if there are more pages
        hasMorePages = data.links?.next !== null;
        currentPage++;

        // Small delay to be respectful to the API
        await this.delay(500);
      }

      console.log(`📊 Retrieved ${allShips.length} ships from API across ${currentPage - 1} pages`);
      return allShips;
    } catch (error) {
      console.error('❌ Error fetching ship list:', error);
      throw error;
    }
  }

  /**
   * Write ship links to temporary JSON file
   */
  async writeShipLinks(shipList) {
    try {
      console.log('💾 Writing ship links to working/ship-links.json...');

      const linksData = {
        version: '1.0.5',
        totalShips: shipList.length,
        ships: shipList,
      };

      const filePath = path.join(__dirname, '..', 'working', 'ship-links.json');
      const jsonData = JSON.stringify(linksData, null, 2);

      await fs.writeFile(filePath, jsonData, 'utf8');

      console.log(`✅ Ship links written successfully! ${shipList.length} ship links saved.`);
    } catch (error) {
      console.error('❌ Error writing ship links:', error);
      throw error;
    }
  }

  /**
   * Utility function to add delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const collector = new Phase1LinkCollector();
  await collector.buildStructure();
}

// Run the script
main().catch(console.error);

export default Phase1LinkCollector;
