// Mock data for BWStory app

export const DISCOVER_POSTS = [
  {
    id: '1',
    uid: 'u1',
    userName: 'Amit Saxena',
    userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    imageUrl: 'https://picsum.photos/seed/post1/400/500',
    videoUrl: null,
    isVideo: true,
    likes: ['u2', 'u3', 'u4'],
    commentCount: 2,
    caption: 'Big breakthrough in renewable tech today! Check it out.',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 540 },
    initialComments: [
      {
        id: 'c1',
        userName: 'Priya Chauhan',
        userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        text: 'We wanted this!!!!',
        likes: 2,
        time: '2m ago',
      },
      {
        id: 'c2',
        userName: 'Rahul Singh',
        userAvatar: 'https://randomuser.me/api/portraits/men/15.jpg',
        text: 'Interesting',
        likes: 0,
        time: '5m ago',
      },
    ],
  },
  {
    id: '2',
    uid: 'u2',
    userName: 'Priya Chauhan',
    userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    imageUrl: 'https://picsum.photos/seed/post2/400/500',
    videoUrl: null,
    isVideo: false,
    likes: ['u1', 'u3'],
    commentCount: 1,
    caption: 'Great moments captured during today’s leadership summit!',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 900 },
    initialComments: [
      {
        id: 'c3',
        userName: 'Amit Saxena',
        userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        text: 'Great shot!',
        likes: 5,
        time: '1m ago',
      },
    ],
  },
  {
    id: '3',
    uid: 'u3',
    userName: 'Neha Sharma',
    userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    imageUrl: 'https://picsum.photos/seed/post3/400/600',
    videoUrl: null,
    isVideo: true,
    likes: ['u1', 'u2', 'u4', 'u5'],
    commentCount: 0,
    caption: 'Weekly industry news roundup — all in 60 seconds.',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 1920 },
    initialComments: [],
  },
];

export const NOTIFICATIONS = [
  {
    id: 'n1',
    section: 'Today',
    items: [
      {
        id: 'ni1',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni2',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni3',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/23.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
    ],
  },
  {
    id: 'n2',
    section: 'This Week',
    items: [
      {
        id: 'ni4',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni5',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni6',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/23.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni7',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/23.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni8',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
      {
        id: 'ni9',
        user: { name: 'Sunny', avatar: 'https://randomuser.me/api/portraits/women/23.jpg' },
        action: 'started following you',
        time: '9 minute ago',
      },
    ],
  },
];

export const CURRENT_USER = {
  id: 'me',
  name: 'Rashmi Desai',
  gender: 'Female',
  location: 'Greater Noida',
  profession: 'Teacher',
  bio: '"Once you have everything set on your bio, you can use this tailn Instagram Schedule',
  avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
  followers: 128,
  following: 94,
  posts: 23,
};
