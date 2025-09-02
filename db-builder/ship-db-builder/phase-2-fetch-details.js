import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Phase2DetailFetcher {
  constructor() {
    this.shipsData = {
      version: '1.0.5',
      ships: {},
    };
  }

  /**
   * Main function to fetch detailed ship data
   */
  async fetchDetails() {
    try {
      console.log('🚀 Starting Phase 2: Fetching Ship Details...');

      // Step 1: Load ship links from working directory
      const shipLinks = await this.loadShipLinks();
      console.log(`📋 Found ${shipLinks.length} ships to process`);

      // Step 2: Fetch detailed data for each ship
      await this.fetchShipDetails(shipLinks);

      // Step 3: Write the detailed data to temp-ships.json
      await this.writeTempShips();

      console.log('✅ Phase 2 completed successfully!');
      console.log(`📊 Fetched details for ${Object.keys(this.shipsData.ships).length} ships`);
    } catch (error) {
      console.error('❌ Error in Phase 2:', error);
      throw error;
    }
  }

  /**
   * Load ship links from working directory
   */
  async loadShipLinks() {
    try {
      console.log('📖 Loading ship links from working/ship-links.json...');

      const filePath = path.join(__dirname, '..', 'working', 'ship-links.json');
      const fileContent = await fs.readFile(filePath, 'utf8');
      const linksData = JSON.parse(fileContent);

      console.log(`📊 Loaded ${linksData.ships.length} ship links`);
      return linksData.ships;
    } catch (error) {
      console.error('❌ Error loading ship links:', error);
      throw error;
    }
  }

  /**
   * Fetch detailed data for all ships
   */
  async fetchShipDetails(shipLinks) {
    console.log(`🔄 Fetching detailed data for all ${shipLinks.length} ships...`);

    for (let i = 0; i < shipLinks.length; i++) {
      const ship = shipLinks[i];
      console.log(`🛸 Processing ship ${i + 1}/${shipLinks.length}: ${ship.name}`);

      try {
        // Fetch detailed ship data
        const detailedData = await this.fetchShipDetail(ship.link);

        // Extract and transform the data
        const transformedData = this.transformShipData(detailedData, ship.name);

        // Add to our ships database using class_name as key
        if (detailedData.data && detailedData.data.class_name) {
          this.shipsData.ships[detailedData.data.class_name] = transformedData;
          console.log(`✅ Successfully processed: ${ship.name} (${detailedData.data.class_name})`);
        } else {
          console.log(`⚠️  No class_name found for: ${ship.name}`);
        }
      } catch (error) {
        // Only log 404 errors once to avoid spam
        if (error.message.includes('404')) {
          console.log(`⚠️  Ship not found: ${ship.name} (skipping)`);
        } else {
          console.error(`❌ Error processing ship ${ship.name}:`, error.message);
        }
      }

      // 500ms delay between requests to avoid rate limits
      if (i < shipLinks.length - 1) {
        await this.delay(500);
      }
    }
  }

  /**
   * Fetch detailed ship information from a single link
   */
  async fetchShipDetail(link) {
    try {
      // Convert v2 to v3 API and add locale and include parameters
      const v3Link = link.replace('/api/v2/vehicles/', '/api/v3/vehicles/');
      const enhancedLink = `${v3Link}?locale=en_EN&include=ports,shops`;
      const response = await fetch(enhancedLink);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ Error fetching details from ${link}:`, error);
      throw error;
    }
  }

  /**
   * Transform API data to match our JSON format
   */
  transformShipData(apiResponse, shipName) {
    const apiData = apiResponse.data;
    const meta = apiResponse.meta;

    // Check if ports/hardpoints and shops are available
    const hasPorts = meta.valid_relations && meta.valid_relations.includes('ports');
    const hasHardpoints = meta.valid_relations && meta.valid_relations.includes('hardpoints');
    const hasShops = meta.valid_relations && meta.valid_relations.includes('shops');

    // Extract health data from parts - convert to lowercase keys
    const healthData = {};
    if (apiData.parts && apiData.parts.length > 0) {
      const extractHealthFromParts = (parts) => {
        parts.forEach((part) => {
          if (part.damage_max > 0) {
            const key = part.display_name.toLowerCase();
            healthData[key] = part.damage_max;
          }
          if (part.children && part.children.length > 0) {
            extractHealthFromParts(part.children);
          }
        });
      };
      extractHealthFromParts(apiData.parts);
    }

    // Extract components and weapons from ports if available
    let weapons = [];
    let components = {
      shields: [],
      'power-plants': [],
      coolers: [],
      'quantum-drives': [],
    };
    let missles = [];
    let defensive = [];
    let flightStatus = true;
    let purchasePrice = null;
    let maxSpeed = 0;
    let scmSpeed = 0;
    let maxPitch = 0;
    let maxYaw = 0;
    let maxRoll = 0;
    let shops = [];

    // Use hardpoints if ports are not available
    const portsData = hasPorts ? apiData.ports : hasHardpoints ? apiData.hardpoints : null;

    if (portsData) {
      // Process ports/hardpoints for components and weapons
      portsData.forEach((port) => {
        // Check if this port itself has weapons or missiles in its ports array
        if (port.ports) {
          port.ports.forEach((weaponPort) => {
            if (weaponPort.equipped_item && weaponPort.equipped_item.type === 'WeaponGun') {
              const weapon = weaponPort.equipped_item;

              // Determine weapon type based on the parent port's equipped_item sub_type
              let weaponType = 'Pilot Controlled';
              if (port.equipped_item && port.equipped_item.sub_type === 'PDCTurret') {
                weaponType = 'PDC Auto Turret';
              } else if (port.equipped_item && port.equipped_item.sub_type === 'GunTurret') {
                weaponType = 'Pilot Controlled';
              }

              weapons.push({
                type: weaponType,
                class: weapon.class_name,
              });
            } else if (weaponPort.equipped_item && weaponPort.equipped_item.type === 'Missile') {
              const missile = weaponPort.equipped_item;

              // Check if we already have this missile type
              const existingMissile = missles.find((m) => m['missle-class'] === missile.class_name);
              if (existingMissile) {
                existingMissile.count += 1;
              } else {
                missles.push({
                  size: missile.size,
                  count: 1,
                  'missle-class': missile.class_name,
                });
              }
            }
          });
        }

        // Check if this port itself is a PDC turret (has no equipped weapon but is a PDC turret)
        if (port.equipped_item && port.equipped_item.type === 'Turret' && port.equipped_item.sub_type === 'PDCTurret') {
          weapons.push({
            type: 'PDC Auto Turret',
            class: port.equipped_item.class_name,
          });
        }

        if (port.equipped_item) {
          const item = port.equipped_item;
          const itemType = item.type;
          const itemSubType = item.sub_type;

          // Weapons - get the actual weapon class from nested ports
          if (itemType === 'Turret' && item.ports) {
            item.ports.forEach((weaponPort) => {
              if (weaponPort.equipped_item && weaponPort.equipped_item.type === 'WeaponGun') {
                const weapon = weaponPort.equipped_item;
                weapons.push({
                  type: 'Pilot Controlled',
                  class: weapon.class_name,
                });
              }
            });
          } else if (itemType === 'TurretBase') {
            weapons.push({
              type: 'Player Controlled Turret',
              class: item.class_name,
            });
          } else if (itemType === 'turret' && itemSubType === 'PDCTurret') {
            weapons.push({
              type: 'PDC Auto Turret',
              class: item.class_name,
            });
          }

          // Components - just get the class name
          if (itemType === 'Shield') {
            components.shields.push({
              class: item.class_name,
            });
          } else if (itemType === 'PowerPlant') {
            components['power-plants'].push({
              class: item.class_name,
            });
          } else if (itemType === 'Cooler') {
            components.coolers.push({
              class: item.class_name,
            });
          } else if (itemType === 'QuantumDrive') {
            components['quantum-drives'].push({
              class: item.class_name,
            });
          }

          // Missiles - get size, count, and size-class
          if (itemType === 'MissileLauncher' && item.ports) {
            const missileCount = item.ports.filter((port) => port.equipped_item && port.equipped_item.type === 'Missile').length;
            if (missileCount > 0) {
              const firstMissile = item.ports.find((port) => port.equipped_item && port.equipped_item.type === 'Missile').equipped_item;
              missles.push({
                size: firstMissile.size,
                count: missileCount,
                'size-class': firstMissile.size,
              });
            }
          }

          // Defensive (Decoy/Noise)
          if (itemType === 'WeaponDefensive') {
            if (item.class_name && item.class_name.includes('decoy')) {
              defensive.push({
                type: 'decoy',
                count: item.counter_measure?.capacity || 0,
                name: item.name,
              });
            } else if (item.class_name && item.class_name.includes('noise')) {
              defensive.push({
                type: 'noise',
                count: item.counter_measure?.capacity || 0,
                name: item.name,
              });
            }
          }

          // Flight controller data
          if (itemType === 'FlightController' && item.flight_controller) {
            maxSpeed = item.flight_controller.max_speed || 0;
            scmSpeed = item.flight_controller.scm_speed || 0;
            maxPitch = item.flight_controller.pitch || 0;
            maxYaw = item.flight_controller.yaw || 0;
            maxRoll = item.flight_controller.roll || 0;
          }
        }
      });
    }

    // Extract shop data if available
    if (hasShops && apiData.shops && apiData.shops.length > 0) {
      purchasePrice = apiData.shops[0].items?.[0]?.base_price || null;
      shops = apiData.shops.map((shop) => shop.name_raw);
    }

    // Check flight status
    if (apiData.production_status && apiData.production_status.en_EN !== 'flight-ready') {
      flightStatus = false;
    }

    return {
      name: shipName,
      stats: {
        'ship-size': apiData.size?.en_EN || apiData.size || '',
        'purchase-price': purchasePrice,
        crew: apiData.crew?.min || 1,
        cargo: apiData.cargo_capacity || 0,
        stowage: Math.round((apiData.vehicle_inventory || 0) * 1000000),
        speed: {
          max: maxSpeed,
          scm: scmSpeed,
          roll: maxRoll,
          pitch: maxPitch,
          yaw: maxYaw,
        },
        emission: {
          ir: apiData.emission?.ir || 0,
          em_idle: apiData.emission?.em_idle || 0,
          em_max: apiData.emission?.em_max || 0,
        },
        fuel: {
          quantum: apiData.quantum?.quantum_fuel_capacity || 0,
          hydro: apiData.fuel?.capacity || 0,
        },
      },
      weapons,
      missles,
      defensive,
      health: healthData,
      components,
      'flight-ready': flightStatus,
      shops,
    };
  }

  /**
   * Write the detailed data to temp-ships.json
   */
  async writeTempShips() {
    try {
      console.log('💾 Writing detailed ship data to working/temp-ships.json...');

      const filePath = path.join(__dirname, '..', 'working', 'temp-ships.json');
      const jsonData = JSON.stringify(this.shipsData, null, 2);

      await fs.writeFile(filePath, jsonData, 'utf8');

      console.log(`✅ Detailed ship data written successfully! ${Object.keys(this.shipsData.ships).length} ships processed.`);
    } catch (error) {
      console.error('❌ Error writing temp ships data:', error);
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
  const fetcher = new Phase2DetailFetcher();
  await fetcher.fetchDetails();
}

// Run the script
main().catch(console.error);

export default Phase2DetailFetcher;
