import { useState } from 'react';
import { FolderKanban, Calendar, ClipboardList } from 'lucide-react';
import SettingsProjektarten from './SettingsProjektarten';
import SettingsAppointmentTypes from './SettingsAppointmentTypes';
import SettingsChecklists from './SettingsChecklists';

const SettingsOrderTypes = () => {
  const [subTab, setSubTab] = useState<'projektarten' | 'terminarten' | 'checklisten'>('projektarten');

  const tabs = [
    { key: 'projektarten' as const, label: 'Projektarten', icon: FolderKanban },
    { key: 'terminarten' as const, label: 'Terminarten', icon: Calendar },
    { key: 'checklisten' as const, label: 'Checklisten', icon: ClipboardList },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b mb-4">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              subTab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {subTab === 'projektarten' && <SettingsProjektarten />}
      {subTab === 'terminarten' && <SettingsAppointmentTypes />}
      {subTab === 'checklisten' && <SettingsChecklists />}
    </div>
  );
};

export default SettingsOrderTypes;
