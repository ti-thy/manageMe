import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CLIENT_ID,
  CLIENT_SECRET,
  API_KEY,
  MAX_EMAIL_ACCOUNTS,
} from "./constants";

WebBrowser.maybeCompleteAuthSession();

export const authenticateWithGoogle = async (existingEmails) => {
  if (existingEmails.length >= MAX_EMAIL_ACCOUNTS) {
    throw new Error(`Maximum of ${MAX_EMAIL_ACCOUNTS} email accounts reached`);
  }
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const authRequest = new AuthSession.AuthRequest({
    clientId: CLIENT_ID,
    redirectUri,
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    responseType: AuthSession.ResponseType.Code,
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke'
  };
  const result = await authRequest.promptAsync(discovery);

  if (result.type !== "success") {
    throw new Error("Authentication failed");
  }

  const tokenResult = await AuthSession.exchangeCodeAsync(
    {
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      code: result.params.code,
      redirectUri,
    },
    discovery
  );

  const accessToken = tokenResult.accessToken;
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileResponse.json();
  if (!profile.email) {
    throw new Error("Failed to retrieve user email");
  }
  await storeEmailToken(profile.email, tokenResult);
  return { email: profile.email, accessToken };
};

export const storeEmailToken = async (email, token) => {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email provided for storage");
  }
  const safeKey = `email_${email.replace(/[^a-zA-Z0-9.-_]/g, "_")}`; // Sanitize key
  await AsyncStorage.setItem(safeKey, JSON.stringify(token));
};

export const getEmailToken = async (email) => {
  const token = await AsyncStorage.getItem(`email_${email}`);
  return token ? JSON.parse(token) : null;
};

export const fetchEmailEvents = async (accessToken) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=invite+from:*.ics&maxResults=5&key=${API_KEY}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Token expired");
      }
      throw new Error("Failed to fetch emails");
    }
    const data = await response.json();
    const messageIds = data.messages?.map((msg) => msg.id) || [];

    const events = [];
    for (const messageId of messageIds) {
      const msgResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?key=${API_KEY}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgResponse.json();
      const event = parseEventFromEmail(msgData);
      if (event) events.push({ ...event, accessToken });
    }
    return events;
  } catch (error) {
    console.error("Error fetching email events:", error);
    throw error;
  }
};

const parseEventFromEmail = (email) => {
  const headers = email.payload?.headers || [];
  const subjectHeader = headers.find((header) => header.name.toLowerCase() === "subject");
  const subject = subjectHeader ? subjectHeader.value : "Untitled Event";
  const snippet = email.snippet || "";
  const match = snippet.match(/(\w+ \d+, \d{4} at \d+:\d+\w+)/);
  const start = match ? new Date(match[1]) : new Date();
  if (isNaN(start)) return null;
  const end = new Date(start.getTime() + 3600000);
  return {
    id: email.id,
    title: subject,
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const syncToCalendar = async (event) => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${event.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.title,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Event Synced",
        body: `Event "${event.title}" added to your calendar.`,
      },
      trigger: null,
    });
    return data;
  } catch (error) {
    console.error("Error syncing to calendar:", error);
    throw error;
  }
};

export const refreshAccessToken = async (email) => {
  const token = await getEmailToken(email);
  if (!token?.refreshToken) throw new Error("No refresh token available");
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: token.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const newTokens = await response.json();
    if (newTokens.error) throw new Error(newTokens.error.message);
    await storeEmailToken(email, { ...token, accessToken: newTokens.access_token });
    return newTokens.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
};