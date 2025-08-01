import axios from 'axios';
import Constants from 'expo-constants';

// Get API key from environment variables
const IMGBB_API_KEY = Constants.expoConfig?.extra?.IMGBB_API_KEY || process.env.IMGBB_API_KEY;
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL;

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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
  photo_url?: string;
}

export interface CreateIssueData {
  title: string;
  description: string;
  location: string;
  photo_url?: string;
}

class ApiService {
  // Check if API key is available
  private checkApiKey(): boolean {
    if (!IMGBB_API_KEY) {
      console.error('❌ ImgBB API key not found. Please add IMGBB_API_KEY to your .env file');
      return false;
    }
    return true;
  }

  // Upload photo to ImgBB (100% free)
  // async uploadPhoto(photoUri: string): Promise<string | null> {
  //   if (!this.checkApiKey()) {
  //     console.log('⚠️ Photo upload skipped - no API key');
  //     return null;
  //   }

  //   try {
  //     console.log('📸 Starting photo upload to ImgBB...');
      
  //     // Convert photo to base64
  //     const response = await fetch(photoUri);
  //     const blob = await response.blob();
      
  //     const formData = new FormData();
  //     formData.append('key', IMGBB_API_KEY);
  //     formData.append('image', blob as any, 'urbansage-issue.jpg');

  //     const uploadResponse = await fetch(IMGBB_UPLOAD_URL, {
  //       method: 'POST',
  //       body: formData,
  //     });

  //     const result = await uploadResponse.json();
      
  //     if (result.success) {
  //       console.log('✅ Photo uploaded successfully to ImgBB');
  //       return result.data.url; // Direct image URL
  //     } else {
  //       console.error('❌ ImgBB upload failed:', result);
  //       return null;
  //     }
  //   } catch (error) {
  //     console.error('❌ Error uploading photo to ImgBB:', error);
  //     return null;
  //   }
  // }
  // Upload photo to ImgBB (100% free) - FIXED VERSION
async uploadPhoto(photoUri: string): Promise<string | null> {
  if (!this.checkApiKey()) {
    console.log('⚠️ Photo upload skipped - no API key');
    return null;
  }

  try {
    console.log('📸 Starting photo upload to ImgBB...');
    
    const formData = new FormData();
    
    // ✅ FIX 1: Use 'image' field name (ImgBB requirement)
    formData.append('image', {
      uri: photoUri,
      type: 'image/jpeg', // ✅ FIX 2: Specify exact type
      name: 'urbansage-issue.jpg',
    } as any);
    
    // ✅ FIX 3: Add API key to FormData (not URL)
    formData.append('key', IMGBB_API_KEY);

    const uploadResponse = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      // ✅ FIX 4: Remove Content-Type header (let fetch set it automatically)
      body: formData,
    });

    const result = await uploadResponse.json();
    
    if (result.success) {
      console.log('✅ Photo uploaded successfully to ImgBB');
      return result.data.url;
    } else {
      console.error('❌ ImgBB upload failed:', result);
      return null;
    }
  } catch (error) {
    console.error('❌ Error uploading photo to ImgBB:', error);
    return null;
  }
}


  // Get all issues
  async getIssues(): Promise<Issue[]> {
    try {
      const response = await api.get('/issues');
      return response.data;
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  // Create new issue with optional photo
  async createIssue(issueData: CreateIssueData) {
    try {
      const response = await api.post('/issues', issueData);
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  // Get statistics
  async getStats() {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

export default new ApiService();
