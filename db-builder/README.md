# Star Citizen Ship Database Builder

This tool builds a comprehensive ship database for Star Citizen by fetching data from the Star Citizen Wiki API using a two-phase approach.

## Two-Phase System

### Phase 1: Collect Ship Links

- Fetches all ships from the Star Citizen Wiki API
- Collects ship names, UUIDs, and API links
- Handles pagination to get all 241+ ships
- Outputs to `working/ship-links.json`

### Phase 2: Fetch Detailed Data

- Reads ship links from Phase 1 output
- Fetches detailed ship data with components, weapons, and stats
- Transforms API data to match custom JSON format
- Outputs complete database to `working/temp-ships.json`

## Usage

Run these commands from the root directory:

### Run Phase 1 Only (Collect Links)

```bash
npm run phase1
```

### Run Phase 2 Only (Fetch Details)

```bash
npm run phase2
```

### Run Both Phases (Complete Build)

```bash
npm run build-ships
```

## Output Files

- **`working/ship-links.json`** - Phase 1 output with all ship links
- **`working/temp-ships.json`** - Phase 2 output with complete ship database
- **`Ships.json`** - Final database (copy from temp-ships.json when ready)

## Data Structure

Each ship contains comprehensive data:

### Stats

- **ship-size**: small, medium, large, capital, snub, vehicle
- **purchase-price**: In-game purchase price (null if not purchasable)
- **crew**: Minimum crew requirement
- **cargo**: Cargo capacity in SCU
- **stowage**: Vehicle inventory capacity
- **speed**: max, scm, roll, pitch, yaw
- **emission**: ir, em_idle, em_max
- **fuel**: quantum, hydro

### Weapons

- **Pilot Controlled**: Direct weapon mounts
- **Player Controlled Turret**: Manual turrets
- **PDC Auto Turret**: Point defense turrets

### Missiles

- **size**: Missile size
- **count**: Number of missiles
- **missle-class**: Missile class name

### Defensive

- **decoy**: Decoy launchers with count
- **noise**: Noise launchers with count

### Components

- **shields**: Shield generator classes
- **power-plants**: Power plant classes
- **coolers**: Cooler classes
- **quantum-drives**: Quantum drive classes

### Additional Data

- **health**: Part-by-part health values (lowercase keys)
- **flight-ready**: Boolean flight status
- **shops**: Purchase locations

## API Endpoints Used

- **Ship List**: `https://api.star-citizen.wiki/api/v3/vehicles?page={page}`
- **Ship Details**: `https://api.star-citizen.wiki/api/v3/vehicles/{uuid}?locale=en_EN&include=ports,shops`

## Features

- **Rate Limiting**: 500ms delay between API requests
- **Error Handling**: Graceful handling of 404 errors and missing data
- **Data Validation**: Checks for valid relations before processing
- **Comprehensive Coverage**: Processes 190+ ships with detailed data
- **Modular Design**: Separate phases for better maintainability

## Project Structure

```
├── ship-db-builder/
│   ├── phase-1-build-structure.js    # Phase 1: Collect links
│   └── phase-2-fetch-details.js      # Phase 2: Fetch details
├── working/
│   ├── ship-links.json               # Phase 1 output
│   └── temp-ships.json               # Phase 2 output
├── Ships.json                        # Final database
├── SampleData.json                   # Reference structure
└── package.json                      # Scripts and dependencies
```

## Next Steps

The database is ready for Firestore integration to upload to your cloud database.
