import React from 'react';
import { useState, useRef, useEffect, cloneElement } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Target, Skull, MapPin, Zap, Ship, Calendar, User } from 'lucide-react';
import { useData } from '@/lib/context/data/dataContext';

import shipDictRaw from '@/assets/Ship-Dictionary.json';
import NPCDictionary from '@/assets/NPC-Dictionary.json';
import WeaponDictionary from '@/assets/Weapon-Dictionary.json';

function AnimatedTabs({ defaultValue, children, ...props }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const tabsListRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({});

  useEffect(() => {
    if (tabsListRef.current) {
      const activeTrigger = tabsListRef.current.querySelector(`[data-state="active"]`);
      if (activeTrigger) {
        const listRect = tabsListRef.current.getBoundingClientRect();
        const triggerRect = activeTrigger.getBoundingClientRect();
        // Add margin to avoid overlapping rounded corners
        const listPadding = 3;
        const margin = 2;
        const relativeX = triggerRect.left - listRect.left - listPadding + margin;
        const indicatorWidth = triggerRect.width - margin * 2;
        setIndicatorStyle({
          '--tab-indicator-x': `${relativeX}px`,
          '--tab-indicator-width': `${indicatorWidth}px`,
        });
      }
    }
  }, [activeTab]);

  // Find the TabsList child and pass the ref and style to it
  const childrenWithProps = React.Children.map(children, (child) => {
    if (child.type === TabsList) {
      return cloneElement(child, {
        ref: tabsListRef,
        style: indicatorStyle,
      });
    }
    return child;
  });

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} {...props}>
      {childrenWithProps}
    </Tabs>
  );
}

function ShipList({ selectedShip, setSelectedShip }) {
  const [search, setSearch] = useState('');
  const ships = React.useMemo(() => {
    const dict = shipDictRaw.dictionary || {};
    return Object.entries(dict)
      .filter(([, value]) => value.name)
      .map(([key, value]) => ({ key, name: value.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const filtered = ships.filter((ship) => ship.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className='flex flex-col gap-2 h-full'>
      <input className=' mx-2 mb-2 px-2 py-1 rounded bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary' placeholder='Search ships...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className='flex flex-col gap-1 h-full max-h-[610px] min-h-[610px] overflow-y-auto ship-scrollbar'>
        {filtered.map((ship) => (
          <div
            key={ship.key}
            className={'pl-3 py-2 rounded cursor-pointer transition-colors select-none ' + (selectedShip === ship.key ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground')}
            onClick={() => setSelectedShip(ship.key)}
          >
            {ship.name}
          </div>
        ))}
        {filtered.length === 0 && <div className='text-muted-foreground pl-3 py-2'>No ships found.</div>}
      </div>
    </div>
  );
}

function ShipDetails({ shipName: shipKey }) {
  const { pveLog, pvpLog } = useData();
  const [shipStats, setShipStats] = useState({
    winsWhileFlying: 0,
    lossesWhileFlying: 0,
    winsAgainst: 0,
    lossesAgainst: 0,
  });

  // Calculate ship combat statistics when logs change
  React.useEffect(() => {
    if (!shipKey) return;

    let winsWhileFlying = 0;
    let lossesWhileFlying = 0;
    let winsAgainst = 0;
    let lossesAgainst = 0;

    // Helper to check if usingShipClass matches shipKey
    const isUsingShip = (usingShipClass) => (Array.isArray(usingShipClass) ? usingShipClass.includes(shipKey) : usingShipClass === shipKey);

    // Calculate PVP stats
    pvpLog.forEach((entry) => {
      if (entry.action === 'win') {
        if (isUsingShip(entry.usingShipClass)) {
          winsWhileFlying++;
        }
        if (entry.shipClass === shipKey) {
          winsAgainst++;
        }
      } else if (entry.action === 'loss') {
        if (isUsingShip(entry.usingShipClass)) {
          lossesWhileFlying++;
        }
        if (entry.shipClass === shipKey) {
          lossesAgainst++;
        }
      }
    });

    // Calculate PVE wins while flying this ship
    pveLog.forEach((entry) => {
      if (entry.action === 'win' && isUsingShip(entry.usingShipClass)) {
        winsWhileFlying++;
      }
    });

    setShipStats({ winsWhileFlying, lossesWhileFlying, winsAgainst, lossesAgainst });
  }, [shipKey, pveLog, pvpLog]);

  if (!shipKey) return <div className='text-muted-foreground p-6'>Select a ship to see details.</div>;

  const dict = shipDictRaw.dictionary || {};
  const ship = dict[shipKey];
  if (!ship) return <div className='text-muted-foreground p-6'>Ship not found.</div>;

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row gap-2'>
        {ship.image && <img src={new URL(`../assets/ships/${ship.image}`, import.meta.url).href} alt={ship.name} className='w-[340px] h-auto aspect-[16/9] object-fit' />}
        <div className='flex flex-col gap-2 px-4 w-full'>
          <div className='text-2xl font-bold pt-4'>{ship.name}</div>
          <div className='text-sm text-muted-foreground'>{ship.role}</div>
          <table className='w-full mt-2 mb-4'>
            <tbody>
              <tr>
                <td className='font-semibold text-muted-foreground pr-2'>Wins While Flying</td>
                <td className='pl-2 text-green-600 font-bold'>{shipStats.winsWhileFlying}</td>
              </tr>
              <tr>
                <td className='font-semibold text-muted-foreground pr-2'>Losses While Flying</td>
                <td className='pl-2 text-red-600 font-bold'>{shipStats.lossesWhileFlying}</td>
              </tr>
              <tr>
                <td className='font-semibold text-muted-foreground pr-2'>Wins Against</td>
                <td className='pl-2 text-blue-600 font-bold'>{shipStats.winsAgainst}</td>
              </tr>
              <tr>
                <td className='font-semibold text-muted-foreground pr-2'>Losses Against</td>
                <td className='pl-2 text-orange-600 font-bold'>{shipStats.lossesAgainst}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Separator className='pt-0 mt-0' />
      <div className='flex flex-col mt-0 justify-center items-center'>
        <table className='w-full bg-muted/60 rounded-lg shadow-sm'>
          <tbody>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground w-1/4'>Size</td>
              <td className='px-4 py-2 text-foreground'>{ship.size}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Base DPS</td>
              <td className='px-4 py-2 text-foreground'>{ship['base-dps']}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Hull Body</td>
              <td className='px-4 py-2 text-foreground'>{ship['HullBody']}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Crew</td>
              <td className='px-4 py-2 text-foreground'>{ship.crew}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Cargo</td>
              <td className='px-4 py-2 text-foreground'>{ship.cargo}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Default Shield</td>
              <td className='px-4 py-2 text-foreground'>
                {ship['shield-type']} ({ship['shield-capacity']})
              </td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Pilot Guns</td>
              <td className='px-4 py-2 text-foreground'>{ship['pilot-guns'] || '-'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Turret Guns</td>
              <td className='px-4 py-2 text-foreground'>{ship['turret-guns'] || '-'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Missiles</td>
              <td className='px-4 py-2 text-foreground'>{ship['missles'] || '-'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Manufacturer</td>
              <td className='px-4 py-2 text-foreground'>{ship.manufacturer || '-'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Verified</td>
              <td className='px-4 py-2 text-foreground'>{ship.verified ? 'Yes' : 'No'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NPCList({ selectedNPC, setSelectedNPC }) {
  const [search, setSearch] = useState('');
  const npcs = React.useMemo(() => {
    const dict = NPCDictionary.dictionary || {};
    return Object.entries(dict)
      .map(([npcKey, value]) => ({ key: npcKey, name: value.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const filtered = npcs.filter((npc) => npc.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className='flex flex-col gap-2 h-full'>
      <input className=' mx-2 mb-2 px-2 py-1 rounded bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary' placeholder='Search NPCs...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className='flex flex-col gap-1 max-h-[610px] min-h-[610px] overflow-y-auto ship-scrollbar'>
        {filtered.map((npc) => (
          <div
            key={npc.key}
            className={'pl-3 py-2 rounded cursor-pointer transition-colors select-none ' + (selectedNPC === npc.key ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground')}
            onClick={() => setSelectedNPC(npc.key)}
          >
            {npc.name}
          </div>
        ))}
        {filtered.length === 0 && <div className='text-muted-foreground pl-3 py-2'>No NPCs found.</div>}
      </div>
    </div>
  );
}

function NPCDetails({ npcKey }) {
  const { pveLog } = useData();
  const [npcStats, setNpcStats] = useState({ kills: 0, lastKill: null });

  // Calculate NPC kill statistics when pveLog changes
  React.useEffect(() => {
    if (!npcKey) return;

    let kills = 0;
    let lastKill = null;

    pveLog.forEach((entry) => {
      if (entry.action === 'win' && entry.npcClass === npcKey) {
        kills++;
        if (!lastKill || entry.dateTime > lastKill) {
          lastKill = entry.dateTime;
        }
      }
    });

    setNpcStats({ kills, lastKill });
  }, [npcKey, pveLog]);

  if (!npcKey) return <div className='text-muted-foreground p-6'>Select an NPC to see details.</div>;

  const dict = NPCDictionary.dictionary || {};
  const npc = dict[npcKey];
  if (!npc) return <div className='text-muted-foreground p-6'>NPC not found.</div>;

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-2 px-4 w-full'>
        <div className='text-2xl font-bold pt-4'>{npc.name}</div>
        <div className='text-sm text-muted-foreground'>NPC Class: {npcKey}</div>
        <div className='flex flex-row items-center mt-4 mb-2'>
          <span className='font-semibold text-muted-foreground pr-2'>Total Kills</span>
          <span className='pl-2 text-green-600 font-bold text-lg'>{npcStats.kills}</span>
        </div>
      </div>
      <Separator className='pt-0 mt-0' />
      <div className='flex flex-col mt-2 justify-center items-center'>
        <table className='w-full bg-muted/60 rounded-lg shadow-sm'>
          <tbody>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground w-1/4'>NPC Class</td>
              <td className='px-4 py-2 text-foreground'>{npcKey}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Display Name</td>
              <td className='px-4 py-2 text-foreground'>{npc.name}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeaponList({ selectedWeapon, setSelectedWeapon }) {
  const [search, setSearch] = useState('');
  const weapons = React.useMemo(() => {
    const dict = WeaponDictionary.dictionary || {};
    return Object.entries(dict)
      .filter(([key, value]) => key !== 'template' && value.name)
      .map(([key, value]) => ({ key, name: value.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const filtered = weapons.filter((weapon) => weapon.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className='flex flex-col gap-2 h-full'>
      <input className=' mx-2 mb-2 px-2 py-1 rounded bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary' placeholder='Search weapons...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className='flex flex-col gap-1 max-h-[610px] min-h-[610px] overflow-y-auto ship-scrollbar'>
        {filtered.map((weapon) => (
          <div
            key={weapon.key}
            className={'pl-3 py-2 rounded cursor-pointer transition-colors select-none ' + (selectedWeapon === weapon.key ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground')}
            onClick={() => setSelectedWeapon(weapon.key)}
          >
            {weapon.name}
          </div>
        ))}
        {filtered.length === 0 && <div className='text-muted-foreground pl-3 py-2'>No weapons found.</div>}
      </div>
    </div>
  );
}

function WeaponDetails({ weaponKey }) {
  const { pveLog, pvpLog } = useData();
  const [weaponStats, setWeaponStats] = useState({ kills: 0, deaths: 0, lastKill: null, lastDeath: null });

  // Calculate weapon statistics when logs change
  React.useEffect(() => {
    if (!weaponKey) return;

    let kills = 0;
    let deaths = 0;
    let lastKill = null;
    let lastDeath = null;

    // Check PVE log for kills with this weapon
    pveLog.forEach((entry) => {
      if (entry.action === 'win' && entry.weaponClass === weaponKey) {
        kills++;
        if (!lastKill || entry.dateTime > lastKill) {
          lastKill = entry.dateTime;
        }
      }
    });

    // Check PVP log for kills and deaths with this weapon
    pvpLog.forEach((entry) => {
      if (entry.action === 'win' && entry.weaponClass === weaponKey) {
        kills++;
        if (!lastKill || entry.dateTime > lastKill) {
          lastKill = entry.dateTime;
        }
      } else if (entry.action === 'loss' && entry.killerWeaponClass === weaponKey) {
        deaths++;
        if (!lastDeath || entry.dateTime > lastDeath) {
          lastDeath = entry.dateTime;
        }
      }
    });

    setWeaponStats({ kills, deaths, lastKill, lastDeath });
  }, [weaponKey, pveLog, pvpLog]);

  if (!weaponKey) return <div className='text-muted-foreground p-6'>Select a weapon to see details.</div>;

  const dict = WeaponDictionary.dictionary || {};
  const weapon = dict[weaponKey];
  if (!weapon) return <div className='text-muted-foreground p-6'>Weapon not found.</div>;

  const kdRatio = weaponStats.deaths === 0 ? weaponStats.kills : (weaponStats.kills / weaponStats.deaths).toFixed(2);

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col gap-2 px-4 w-full'>
        <div className='text-2xl font-bold pt-4'>{weapon.name}</div>
        <div className='text-sm text-muted-foreground'>Weapon Class: {weaponKey}</div>
        <div className='flex flex-row items-center gap-6 mt-4 mb-2'>
          <div className='flex flex-row items-center'>
            <span className='font-semibold text-muted-foreground pr-2'>Kills</span>
            <span className='pl-2 text-green-600 font-bold text-lg'>{weaponStats.kills}</span>
          </div>
          <div className='flex flex-row items-center'>
            <span className='font-semibold text-muted-foreground pr-2'>Deaths</span>
            <span className='pl-2 text-red-600 font-bold text-lg'>{weaponStats.deaths}</span>
          </div>
          <div className='flex flex-row items-center'>
            <span className='font-semibold text-muted-foreground pr-2'>K/D</span>
            <span className='pl-2 text-blue-600 font-bold text-lg'>{kdRatio}</span>
          </div>
        </div>
      </div>
      <Separator className='pt-0 mt-0' />
      <div className='flex flex-col mt-2 justify-center items-center'>
        <table className='w-full bg-muted/60 rounded-lg shadow-sm'>
          <tbody>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground w-1/4'>Weapon Class</td>
              <td className='px-4 py-2 text-foreground'>{weaponKey}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Display Name</td>
              <td className='px-4 py-2 text-foreground'>{weapon.name}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Type</td>
              <td className='px-4 py-2 text-foreground'>{weapon.type || 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Manufacturer</td>
              <td className='px-4 py-2 text-foreground'>{weapon.manufacturer || 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Class</td>
              <td className='px-4 py-2 text-foreground'>{weapon.class || 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Weapon Type</td>
              <td className='px-4 py-2 text-foreground'>{weapon.weapon_type || 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Cost</td>
              <td className='px-4 py-2 text-foreground'>{weapon.cost === 'Not purchasable' ? <span className='text-red-500 font-semibold'>Not purchasable</span> : weapon.cost ? `${weapon.cost.toLocaleString()} aUEC` : 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Magazine Size</td>
              <td className='px-4 py-2 text-foreground'>{weapon.magazine_size || 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Rate of Fire</td>
              <td className='px-4 py-2 text-foreground'>{weapon.rate_of_fire || 'Unknown'}</td>
            </tr>
            <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
              <td className='px-4 py-2 font-semibold text-muted-foreground'>Effective Range</td>
              <td className='px-4 py-2 text-foreground'>{weapon.effective_range || 'Unknown'}</td>
            </tr>
            {weapon.description && (
              <tr className='odd:bg-muted/60 even:bg-muted/40 border-b border-border last:border-none'>
                <td className='px-4 py-2 font-semibold text-muted-foreground'>Description</td>
                <td className='px-4 py-2 text-foreground'>{weapon.description}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dictionary() {
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedNPC, setSelectedNPC] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState(null);

  // When a ship is selected, clear other selections
  const handleSelectShip = (shipKey) => {
    setSelectedShip(shipKey);
    setSelectedNPC(null);
    setSelectedWeapon(null);
  };

  // When an NPC is selected, clear other selections
  const handleSelectNPC = (npcKey) => {
    setSelectedNPC(npcKey);
    setSelectedShip(null);
    setSelectedWeapon(null);
  };

  // When a weapon is selected, clear other selections
  const handleSelectWeapon = (weaponKey) => {
    setSelectedWeapon(weaponKey);
    setSelectedShip(null);
    setSelectedNPC(null);
  };

  return (
    <div className='flex flex-row min-h-[654px]'>
      <div className='flex flex-col bg-background w-[200px] min-h-full border-r border-muted-foreground'>
        <AnimatedTabs defaultValue='ship'>
          <TabsList className='flex flex-row gap-2 w-full rounded-t-none'>
            <TabsTrigger value='ship'>Ships</TabsTrigger>
            <TabsTrigger value='npc'>NPCs</TabsTrigger>
            <TabsTrigger value='weapon'>Weapons</TabsTrigger>
          </TabsList>
          <TabsContent value='ship'>
            <div className='flex flex-col bg-background min-h-full border-r'>
              <ShipList selectedShip={selectedShip} setSelectedShip={handleSelectShip} />
            </div>
          </TabsContent>
          <TabsContent value='npc'>
            <div className='flex flex-col bg-background min-h-full border-r'>
              <NPCList selectedNPC={selectedNPC} setSelectedNPC={handleSelectNPC} />
            </div>
          </TabsContent>
          <TabsContent value='weapon'>
            <div className='flex flex-col bg-background min-h-full border-r'>
              <WeaponList selectedWeapon={selectedWeapon} setSelectedWeapon={handleSelectWeapon} />
            </div>
          </TabsContent>
        </AnimatedTabs>
      </div>
      <div id='dictionary-content' className='flex-1 bg-background'>
        {selectedShip && !selectedNPC && !selectedWeapon && <ShipDetails shipName={selectedShip} />}
        {selectedNPC && !selectedShip && !selectedWeapon && <NPCDetails npcKey={selectedNPC} />}
        {selectedWeapon && !selectedShip && !selectedNPC && <WeaponDetails weaponKey={selectedWeapon} />}
      </div>
    </div>
  );
}

export default Dictionary;
