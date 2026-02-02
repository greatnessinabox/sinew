import type { Pattern } from "../../schema.js";

export const realtime: Pattern = {
  name: "Realtime",
  slug: "realtime",
  description:
    "Real-time pub/sub updates using Pusher. Includes server-side publishing, client hooks, and private channel authentication.",
  category: "infrastructure",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["realtime", "websocket", "pusher", "pubsub", "live"],
  alternatives: [
    {
      name: "Pusher",
      description: "Hosted real-time messaging with presence and channels",
      url: "https://pusher.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 200K messages/day",
      advantages: ["Mature and reliable", "Presence channels", "Global infrastructure"],
      recommended: true,
    },
    {
      name: "Ably",
      description: "Enterprise-grade real-time messaging platform",
      url: "https://ably.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 6M messages/month",
      advantages: ["Higher free tier limits", "Message persistence", "History and rewind"],
    },
    {
      name: "Supabase Realtime",
      description: "Real-time subscriptions for Postgres changes",
      url: "https://supabase.com/realtime",
      pricingTier: "freemium",
      advantages: ["Integrated with Supabase", "Database change streams", "Broadcast and presence"],
    },
    {
      name: "PartyKit",
      description: "Real-time collaboration infrastructure",
      url: "https://partykit.io",
      pricingTier: "freemium",
      advantages: ["Edge-native", "Stateful connections", "Great for collaboration"],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/realtime/pusher-server.ts",
        content: `import Pusher from "pusher";

// Server-side Pusher client for publishing events
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// Channel naming conventions
export const channels = {
  // Public channels (anyone can subscribe)
  public: (name: string) => \`public-\${name}\`,

  // Private channels (require authentication)
  private: (name: string) => \`private-\${name}\`,

  // Presence channels (show who's online)
  presence: (name: string) => \`presence-\${name}\`,

  // User-specific channel
  user: (userId: string) => \`private-user-\${userId}\`,
};

// Event types
export type EventType =
  | "message"
  | "notification"
  | "update"
  | "delete"
  | "typing"
  | "presence";

// Publish to a channel
export async function publish<T>(
  channel: string,
  event: EventType,
  data: T
): Promise<void> {
  await pusher.trigger(channel, event, data);
}

// Publish to multiple channels
export async function publishBatch<T>(
  channels: string[],
  event: EventType,
  data: T
): Promise<void> {
  // Pusher allows up to 10 channels per trigger
  const batchSize = 10;
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize);
    await pusher.trigger(batch, event, data);
  }
}

// Notify a specific user
export async function notifyUser<T>(
  userId: string,
  event: EventType,
  data: T
): Promise<void> {
  await publish(channels.user(userId), event, data);
}

// Broadcast to all users in a room
export async function broadcastToRoom<T>(
  roomId: string,
  event: EventType,
  data: T
): Promise<void> {
  await publish(channels.presence(roomId), event, data);
}
`,
      },
      {
        path: "lib/realtime/pusher-client.ts",
        content: `import PusherClient from "pusher-js";

// Client-side Pusher configuration
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/realtime/auth",
    });
  }
  return pusherClient;
}

// Subscribe to a channel
export function subscribe(channelName: string) {
  const pusher = getPusherClient();
  return pusher.subscribe(channelName);
}

// Unsubscribe from a channel
export function unsubscribe(channelName: string) {
  const pusher = getPusherClient();
  pusher.unsubscribe(channelName);
}

// Get connection state
export function getConnectionState() {
  const pusher = getPusherClient();
  return pusher.connection.state;
}

// Disconnect
export function disconnect() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}
`,
      },
      {
        path: "hooks/use-channel.ts",
        content: `"use client";

import { useEffect, useRef, useCallback } from "react";
import { Channel } from "pusher-js";
import { subscribe, unsubscribe } from "@/lib/realtime/pusher-client";

interface UseChannelOptions {
  onSubscribed?: () => void;
  onError?: (error: Error) => void;
}

export function useChannel(
  channelName: string,
  options: UseChannelOptions = {}
) {
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    const channel = subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      options.onSubscribed?.();
    });

    channel.bind("pusher:subscription_error", (error: Error) => {
      options.onError?.(error);
    });

    return () => {
      unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName, options]);

  const bind = useCallback(
    <T>(event: string, callback: (data: T) => void) => {
      channelRef.current?.bind(event, callback);
      return () => {
        channelRef.current?.unbind(event, callback);
      };
    },
    []
  );

  return { bind, channel: channelRef.current };
}
`,
      },
      {
        path: "hooks/use-presence.ts",
        content: `"use client";

import { useEffect, useState, useRef } from "react";
import { PresenceChannel, Members } from "pusher-js";
import { getPusherClient } from "@/lib/realtime/pusher-client";

interface Member {
  id: string;
  info: Record<string, unknown>;
}

export function usePresence(channelName: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [me, setMe] = useState<Member | null>(null);
  const channelRef = useRef<PresenceChannel | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName) as PresenceChannel;
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", (members: Members) => {
      const memberList: Member[] = [];
      members.each((member: Member) => {
        memberList.push(member);
      });
      setMembers(memberList);
      setMe(channel.members.me as Member);
    });

    channel.bind("pusher:member_added", (member: Member) => {
      setMembers((prev) => [...prev, member]);
    });

    channel.bind("pusher:member_removed", (member: Member) => {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    });

    return () => {
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [channelName]);

  return {
    members,
    me,
    count: members.length,
    channel: channelRef.current,
  };
}
`,
      },
      {
        path: "hooks/use-event.ts",
        content: `"use client";

import { useEffect } from "react";
import { useChannel } from "./use-channel";

// Hook for subscribing to a specific event on a channel
export function useEvent<T>(
  channelName: string,
  eventName: string,
  callback: (data: T) => void
) {
  const { bind } = useChannel(channelName);

  useEffect(() => {
    const unbind = bind<T>(eventName, callback);
    return unbind;
  }, [bind, eventName, callback]);
}

// Example: useEvent('presence-room-123', 'message', (data) => console.log(data))
`,
      },
      {
        path: "app/api/realtime/auth/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { pusher } from "@/lib/realtime/pusher-server";

// Authenticate private and presence channels
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Get user from your auth system
    // const user = await getUser(req);
    const user = {
      id: "user_123",
      name: "John Doe",
    };

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has access to this channel
    // Implement your authorization logic here
    const hasAccess = true; // await checkChannelAccess(user.id, channelName);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // For presence channels, include user data
    if (channelName.startsWith("presence-")) {
      const presenceData = {
        user_id: user.id,
        user_info: {
          name: user.name,
        },
      };
      const auth = pusher.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(auth);
    }

    // For private channels
    const auth = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(auth);
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: ".env.example",
        content: `# Pusher (https://dashboard.pusher.com)
PUSHER_APP_ID="your-app-id"
PUSHER_SECRET="your-secret"

# Public (used on client)
NEXT_PUBLIC_PUSHER_KEY="your-key"
NEXT_PUBLIC_PUSHER_CLUSTER="us2"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "pusher" }, { name: "pusher-js" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
