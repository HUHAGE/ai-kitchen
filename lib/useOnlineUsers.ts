import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export const useOnlineUsers = () => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setOnlineCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as online with a unique identifier
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: Math.random().toString(36).substring(7),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return onlineCount;
};
