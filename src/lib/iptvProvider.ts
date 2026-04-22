import { LiveChannel, XtreamCategory } from '../types';
import { LIVE_CHANNELS as STATIC_CHANNELS } from './liveChannels';
import { XtreamService } from './xtream';

export interface FetchChannelsResult {
  channels: LiveChannel[];
  error: string | null;
  providerChannelCount: number;
}

export async function fetchLiveChannels(): Promise<FetchChannelsResult> {
  const server = localStorage.getItem('iptv_server') || 'https://tv.m3uts.xyz';
  const user = localStorage.getItem('iptv_user') || 'm';
  const pass = localStorage.getItem('iptv_pass') || 'm';

  console.log(`[IPTV] Conectando a ${server} (user: ${user})...`);
  const xtream = new XtreamService(server, user, pass);
  
  try {
    const [categories, streams] = await Promise.all([
      xtream.getCategories(),
      xtream.getStreams()
    ]);

    if (!streams || streams.length === 0) {
      console.warn('[IPTV] El proveedor no devolvió canales. ¿Credenciales incorrectas o servidor caído?');
      return {
        channels: STATIC_CHANNELS,
        error: `El servidor IPTV (${server}) no devolvió canales. Verificá las credenciales en Configuración.`,
        providerChannelCount: 0
      };
    }

    const categoryMap = new Map<string, string>();
    categories.forEach((cat: XtreamCategory) => {
      categoryMap.set(cat.category_id, cat.category_name);
    });

    const providerChannels: LiveChannel[] = streams.map(s => ({
      name: s.name,
      embed: xtream.getStreamUrl(s.stream_id),
      category: categoryMap.get(s.category_id) || 'IPTV',
      channelNumber: s.num,
      image: s.stream_icon
    }));

    console.log(`[IPTV] ✅ ${providerChannels.length} canales dinámicos + ${STATIC_CHANNELS.length} estáticos.`);
    return {
      channels: [...STATIC_CHANNELS, ...providerChannels],
      error: null,
      providerChannelCount: providerChannels.length
    };

  } catch (e: any) {
    const msg = e?.message || 'Error desconocido';
    console.error('[IPTV] ❌ Error al conectar con el proveedor:', msg);
    return {
      channels: STATIC_CHANNELS,
      error: `No se pudo conectar a ${server}. ${msg.includes('fetch') || msg.includes('Failed') ? 'Servidor caído o sin conexión.' : msg}`,
      providerChannelCount: 0
    };
  }
}
