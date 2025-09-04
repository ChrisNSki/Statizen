import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, InfoIcon, Shield } from 'lucide-react';

function AboutSettings() {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold'>About Statizen</h3>
          <p className='text-sm text-muted-foreground'>Learn about the application and find support resources</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <InfoIcon className='w-5 h-5' />
              Application Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <p className='font-medium'>Statizen</p>
              <p className='text-sm text-muted-foreground'>A comprehensive Star Citizen statistics tracking application that monitors your gameplay, tracks kills, deaths, and progression, and provides detailed analytics.</p>
            </div>

            <div className='space-y-2'>
              <p className='font-medium'>Version</p>
              <p className='text-sm text-muted-foreground'>1.0.0</p>
            </div>

            <div className='space-y-2'>
              <p className='font-medium'>Features</p>
              <ul className='text-sm text-muted-foreground space-y-1 ml-4'>
                <li>• Real-time game log monitoring</li>
                <li>• PVP/PVE kill tracking</li>
                <li>• Level progression system</li>
                <li>• Discord notifications</li>
                <li>• Comprehensive statistics dashboard</li>
                <li>• Faction-based progression</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='w-5 h-5' />
              Privacy & Data
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <p className='font-medium'>Data Collection</p>
              <p className='text-sm text-muted-foreground'>Statizen processes your Star Citizen game logs locally on your machine. No personal data is transmitted without your explicit consent.</p>
            </div>

            <div className='space-y-2'>
              <p className='font-medium'>Dictionary Submissions</p>
              <p className='text-sm text-muted-foreground'>When enabled, unknown NPC and weapon names may be shared to improve the community dictionary. This is completely optional and can be disabled.</p>
            </div>

            <div className='space-y-2'>
              <p className='font-medium'>Discord Integration</p>
              <p className='text-sm text-muted-foreground'>Discord notifications are sent only to webhooks you configure. No data is shared with Statizen servers.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support & Resources</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col gap-2'>
              <Button variant='outline' className='w-fit' onClick={() => window.open('https://github.com/your-repo/statizen', '_blank')}>
                <ExternalLink className='w-4 h-4 mr-2' />
                GitHub Repository
              </Button>

              <Button variant='outline' className='w-fit' onClick={() => window.open('https://robertsspaceindustries.com', '_blank')}>
                <ExternalLink className='w-4 h-4 mr-2' />
                Star Citizen Official
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AboutSettings;
