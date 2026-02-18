import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const tabs = [
  { value: 'planung', label: 'Planung', path: '/admin/montage/planung' },
  { value: 'auftraege', label: 'Aufträge', path: '/admin/montage/auftraege' },
  { value: 'kunden', label: 'Kunden', path: '/admin/montage/kunden' },
  { value: 'termine', label: 'Termine', path: '/admin/montage/termine' },
];

const MontageSubNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const active = tabs.find((t) => location.pathname.startsWith(t.path))?.value || 'auftraege';

  return (
    <div className="border-b bg-card px-6 py-2">
      <Tabs value={active} onValueChange={(v) => {
        const tab = tabs.find((t) => t.value === v);
        if (tab) navigate(tab.path);
      }}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default MontageSubNav;
