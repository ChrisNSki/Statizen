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
    <div className='flex flex-col gap-2'>
      <input className=' mx-2 mb-2 px-2 py-1 rounded bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary' placeholder='Search ships...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className='flex flex-col gap-1 max-h-[560px] overflow-y-auto ship-scrollbar'>
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
    <div className='flex flex-col gap-2'>
      <input className=' mx-2 mb-2 px-2 py-1 rounded bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary' placeholder='Search NPCs...' value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className='flex flex-col gap-1 max-h-[560px] overflow-y-auto ship-scrollbar'>
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

function Dictionary() {
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedNPC, setSelectedNPC] = useState(null);

  // When a ship is selected, clear NPC selection
  const handleSelectShip = (shipKey) => {
    setSelectedShip(shipKey);
    setSelectedNPC(null);
  };

  // When an NPC is selected, clear ship selection
  const handleSelectNPC = (npcKey) => {
    setSelectedNPC(npcKey);
    setSelectedShip(null);
  };

  return (
    <div className='flex flex-row min-h-[654px]'>
      <div className='flex flex-col bg-background w-[200px] min-h-full border-r border-muted-foreground'>
        <AnimatedTabs defaultValue='ship'>
          <TabsList className='flex flex-row gap-2 w-full rounded-t-none'>
            <TabsTrigger value='ship'>Ships</TabsTrigger>
            <TabsTrigger value='npc'>NPCs</TabsTrigger>
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
        </AnimatedTabs>
      </div>
      <div id='dictionary-content' className='flex-1 bg-background'>
        {selectedShip && !selectedNPC && <ShipDetails shipName={selectedShip} />}
        {selectedNPC && !selectedShip && <NPCDetails npcKey={selectedNPC} />}
      </div>
    </div>
  );
}

export default Dictionary;
