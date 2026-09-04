# Frontend Agent Directives — React Native / Expo (StreamZone Mobile Client)

These rules are specific to the Expo SDK 54+ React Native codebase. They extend the
project-level rules in the root `AGENTS.md` and must all be followed together.

---

## 1. Real IDs and Navigation Wiring

- Every screen that needs a dynamic identifier (conversation ID, user ID, broadcast ID)
  **must receive it through navigation params or component props** — never as a literal.
- Before coding a screen, locate its entry point in the parent navigator or parent
  component and verify the ID is being passed correctly.
- **Wrong:** `<ChatScreen conversationId="c1" />`
- **Right:** `<ChatScreen conversationId={activeConversationId} />` where
  `activeConversationId` was set from a real API response before navigating.

---

## 2. File and Media Uploads on Android

Axios with `FormData` on Android silently drops or corrupts the `multipart/form-data`
boundary, causing the server to reject the request.

**Always use native `XMLHttpRequest` for all file uploads:**

```tsx
const uploadFile = (uri: string, name: string, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const token = /* read from AsyncStorage */;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}/storage/upload`);
    // Only set Authorization — let the OS generate the multipart boundary automatically
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText).url);
      } else {
        reject(new Error(`Upload failed: HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    const form = new FormData();
    form.append('file', { uri, name, type: mimeType } as any);
    xhr.send(form);
  });
};
```

- Never manually set `Content-Type: multipart/form-data` — omitting it is what allows
  the native runtime to attach the correct boundary string.

---

## 3. Audio Mode and OS-Level Side Effects

Calling `Audio.setAudioModeAsync` changes system-level audio routing for ALL apps.
Misuse causes background music from Spotify, YouTube, etc. to lower its volume
(ducking) even when the user is not recording.

**Rules:**
- At app startup (in `_layout.tsx`), set the neutral baseline:
  ```ts
  Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: false,
    staysActiveInBackground: false,
  });
  ```
- Only enable `allowsRecordingIOS: true` immediately before starting a recording.
- Immediately after `stopAndUnloadAsync()` (whether the user sends or cancels),
  reset back to the neutral baseline above.
- Always pass `shouldDuckAndroid: false` — never rely on the default value, which
  is `true` and will duck external audio.

---

## 4. Keyboard and Safe Area Layout

This app wraps all screens in `KeyboardProvider` (from `react-native-keyboard-controller`)
inside `_layout.tsx`. This library already manages keyboard-aware layout on both
platforms. Stacking additional keyboard handling on top creates double compression
and black gaps.

**Rules:**
- On Android, **do not** use `behavior="height"` on `KeyboardAvoidingView` — use
  `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`.
- Never hard-code bottom padding (e.g., `paddingBottom: 30`) in input bars.
  Use `useSafeAreaInsets().bottom` dynamically:
  ```tsx
  paddingBottom: Math.max(insets.bottom, 8)
  ```
- Before adding any keyboard wrapper, check `_layout.tsx` for existing wrappers
  (`SafeAreaProvider`, `KeyboardProvider`). Do not nest competing solutions.

---

## 5. Socket Connection and Chat State

- Always call `socketService.joinConversation(conversationId)` with the real
  conversation ID — the server uses it to form the room name `conv-{id}`.
- Unsubscribe from socket events in the `useEffect` cleanup:
  ```tsx
  return () => {
    socketService.leaveConversation(conversationId);
    socketService.off('newDirectMessage', handler);
  };
  ```
- Never call `setMessages(prev => [...prev, msg])` without first verifying the
  incoming message belongs to the currently open conversation.

---

## 6. Scroll-to-Bottom in Chat

Always use `onContentSizeChange` to scroll to the latest message after the list
renders — `setTimeout` with a fixed delay is not reliable when media items are
present:

```tsx
<ScrollView
  ref={scrollViewRef}
  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
>
```

---

## 7. Deprecated SDK Libraries

Expo SDK 54 has deprecated `expo-av`. New screens should prefer:
- `expo-video` for video playback.
- `expo-audio` for audio playback.

**Current project state:** `expo-video` and `expo-audio` are NOT yet installed.
The codebase still uses `expo-av` (`Video`, `Audio.Sound`, `Audio.Recording`).
When creating **new** components, install and use the modern packages. When
modifying **existing** code that already uses `expo-av`, it is acceptable to
continue using the deprecated APIs if migrating would be out of scope for the
current task.
