export interface Issue {
  id: number;
  title: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  category: string;
  priority_score: number;
  priority_level: string;
  sentiment: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface CameraResult {
  uri: string;
  width: number;
  height: number;
}
