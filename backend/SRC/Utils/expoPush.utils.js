/**
 * Send push notifications via Expo Push API.
 * @param {Array<{ to: string; title?: string; body?: string; data?: object; sound?: string }>} messages
 */
export async function sendExpoPushBatch(messages) {
  if (!messages?.length) return { sent: 0 };
  const valid = messages.filter((m) => m?.to && typeof m.to === 'string');
  if (!valid.length) return { sent: 0 };

  for (let i = 0; i < valid.length; i += 99) {
    const chunk = valid.slice(i, i + 99).map((m) => ({
      to: m.to,
      title: m.title || 'FitCore',
      body: m.body || '',
      data: m.data && typeof m.data === 'object' ? m.data : {},
      sound: m.sound || 'default',
      priority: 'high',
      channelId: 'default',
    }));
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      const json = await res.json().catch(() => ({}));
      if (json?.errors?.length) {
        console.warn('[expoPush] API errors:', json.errors);
      }
    } catch (e) {
      console.warn('[expoPush] send failed:', e?.message || e);
    }
  }
  return { sent: valid.length };
}
