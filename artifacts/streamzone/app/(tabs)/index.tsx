import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { BottomNav, HomeScreen as DiscoverScreen } from '@/components/StreamZoneApp';
import { useStreamStore } from '@/store/useStreamStore';

export default function HomeRoute() {
  const router = useRouter();
  const activeTab = useStreamStore((state) => state.activeTab);
  const goRoom = (mode: 'room' | 'pk' | 'multi' | 'voice') => router.push({ pathname: '/room/[mode]', params: { mode } });
  return <><DiscoverScreen palette={colors.dark} onNavigate={(screen: string) => router.push(`/${screen}` as never)} onOpenRoom={goRoom} /><BottomNav activeTab={activeTab} palette={colors.dark} onTab={(tab) => router.replace(`/(tabs)/${tab === 'home' ? '' : tab}` as never)} onGoLive={() => router.push('/go-live')} /></>;
}
