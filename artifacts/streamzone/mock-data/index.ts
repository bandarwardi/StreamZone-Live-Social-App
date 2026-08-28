export type LiveRoom = {
  id: string;
  name: string;
  handle: string;
  viewers: string;
  category: string;
  country: string;
  image: string;
  accent: string;
  isPrivate?: boolean;
};

export type MessagePreview = {
  id: string;
  name: string;
  message: string;
  time: string;
  unread?: number;
  image: string;
  country: string;
};

export const avatarImages = [
  'https://i.pravatar.cc/160?img=47',
  'https://i.pravatar.cc/160?img=32',
  'https://i.pravatar.cc/160?img=45',
  'https://i.pravatar.cc/160?img=12',
  'https://i.pravatar.cc/160?img=5',
  'https://i.pravatar.cc/160?img=25',
  'https://i.pravatar.cc/160?img=44',
  'https://i.pravatar.cc/160?img=16',
  'https://i.pravatar.cc/160?img=49',
];

export const liveRooms: LiveRoom[] = [
  {
    id: 'room-1',
    name: 'Saniya lieo',
    handle: '@saniya_lieo23',
    viewers: '12.4K',
    category: 'Chatting',
    country: 'IN',
    image: 'https://i.pravatar.cc/600?img=47',
    accent: '#e91696',
  },
  {
    id: 'room-2',
    name: 'Anaya Khan',
    handle: '@anaya_khan1432',
    viewers: '8.8K',
    category: 'Music',
    country: 'PK',
    image: 'https://i.pravatar.cc/600?img=32',
    accent: '#7a35eb',
  },
  {
    id: 'room-3',
    name: 'Alexa Deo',
    handle: '@alexa_deo',
    viewers: '5.2K',
    category: 'Lifestyle',
    country: 'US',
    image: 'https://i.pravatar.cc/600?img=25',
    accent: '#fa7b41',
  },
  {
    id: 'room-4',
    name: 'Malaika Khan',
    handle: '@malaika_khan',
    viewers: '3.9K',
    category: 'Dance',
    country: 'IN',
    image: 'https://i.pravatar.cc/600?img=5',
    accent: '#36c7e8',
  },
  {
    id: 'room-5',
    name: 'Andrew Filder',
    handle: '@andrew_filder',
    viewers: '2.4K',
    category: 'Acoustic',
    country: 'GB',
    image: 'https://i.pravatar.cc/600?img=11',
    accent: '#ffca57',
  },
  {
    id: 'room-6',
    name: 'Miss Pinky Pandey',
    handle: '@pinky_pandey',
    viewers: '1.8K',
    category: 'Party',
    country: 'IN',
    image: 'https://i.pravatar.cc/600?img=44',
    accent: '#ea398f',
  },
];

export const partyRooms = [
  { ...liveRooms[0], name: 'Saniya lieo Love', viewers: '148', category: 'Public Room' },
  { ...liveRooms[5], name: 'Miss Pinky Pandey', viewers: '240', category: 'Private Room', isPrivate: true },
  { ...liveRooms[3], name: 'Aao Magar Jana Nahi', viewers: '164', category: 'Public Room' },
  { ...liveRooms[4], name: 'Lady Andrew Don', viewers: '148', category: 'Public Room' },
];

export const feedPosts = [
  {
    id: 'post-1',
    name: 'Saniya lieo',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
    caption: 'There are many variations of passages available but the majority have suffered alteration in some form by injected humour.',
    likes: '1,428',
    comments: '60',
  },
  {
    id: 'post-2',
    name: 'Andrew Filder',
    country: 'India',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85',
    caption: 'Late night sessions, soft lights, and a song for anyone still awake.',
    likes: '820',
    comments: '26',
  },
];

export const conversations: MessagePreview[] = [
  { id: 'c1', name: 'Malaika Khan', message: 'Hello, Good Morning dear.', time: 'Just now', unread: 3, image: avatarImages[0], country: 'IN' },
  { id: 'c2', name: 'Saniya lieo', message: 'What are you doing dear?', time: 'Just now', unread: 2, image: avatarImages[1], country: 'GB' },
  { id: 'c3', name: 'Pari Patel', message: 'Congratulation dear for achievement.', time: '1 day ago', unread: 4, image: avatarImages[2], country: 'US' },
  { id: 'c4', name: 'Emma Smith', message: 'Please call me right now.', time: '2 day ago', unread: 1, image: avatarImages[3], country: 'IN' },
  { id: 'c5', name: 'William Saons', message: 'What is your favorites hobby dear?', time: '22 June', image: avatarImages[4], country: 'GB' },
  { id: 'c6', name: 'Malaika Khan', message: 'How much time you are free today?', time: '21 June', image: avatarImages[5], country: 'US' },
  { id: 'c7', name: 'Emma Smith', message: 'Please help me dear.', time: '20 June', image: avatarImages[6], country: 'IN' },
  { id: 'c8', name: 'William Saons', message: 'Hello, Where are you from?', time: '19 June', image: avatarImages[7], country: 'GB' },
];

export const chatMessages = [
  { id: 'm1', text: 'Hello', mine: true, type: 'text' as const },
  { id: 'm2', text: 'Good Morning', mine: false, type: 'text' as const },
  { id: 'm3', text: 'How are you dear?', mine: false, type: 'text' as const },
  { id: 'm4', text: 'Video Call  •  00:56 min', mine: false, type: 'call' as const },
];

export const gifts = [
  { id: 'rose', label: 'Rose', icon: 'heart', price: 10, color: '#ff477e' },
  { id: 'crown', label: 'Crown', icon: 'trophy', price: 120, color: '#ffd35c' },
  { id: 'diamond', label: 'Diamond', icon: 'diamond', price: 500, color: '#58d5f7' },
  { id: 'fire', label: 'Fire', icon: 'flame', price: 800, color: '#ff7546' },
  { id: 'star', label: 'Star', icon: 'star', price: 1000, color: '#fb79dc' },
  { id: 'rocket', label: 'Rocket', icon: 'rocket', price: 2500, color: '#aa72ff' },
];

export const coinPackages = [
  { coins: '100', price: '$1.99', popular: false },
  { coins: '500', price: '$7.99', popular: true },
  { coins: '1,200', price: '$14.99', popular: false },
  { coins: '2,500', price: '$28.99', popular: false },
];

export const historyItems = [
  { label: 'Gift sent to Saniya lieo', detail: 'Today, 10:42 AM', amount: '- 120', type: 'out' },
  { label: 'Daily check-in reward', detail: 'Yesterday, 7:15 PM', amount: '+ 50', type: 'in' },
  { label: 'Recharge package', detail: 'Aug 24, 2:20 PM', amount: '+ 1,200', type: 'in' },
];