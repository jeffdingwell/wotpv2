export interface Lyric {
  id?: string;
  text: string;
  song: string;
  band: string;
  imageUrl: string;
  userId: string;
  userName?: string;
  youtubeUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  createdAt: any;
}

export interface Comment {
  id?: string;
  text: string;
  userId: string;
  userName: string;
  lyricId: string;
  createdAt: any;
}
