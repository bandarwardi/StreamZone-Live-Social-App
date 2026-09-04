import React from 'react';
import { View, Text } from 'react-native';

export const AgoraVideoView = () => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff' }}>Agora is not supported on web in this demo</Text>
  </View>
);

export const createAgoraEngine = async () => null;
export const joinChannel = async () => {};
export const leaveChannel = async () => {};

export default AgoraVideoView;
